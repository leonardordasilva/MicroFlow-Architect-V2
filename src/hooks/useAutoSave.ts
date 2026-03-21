import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useDiagramStore } from '@/store/diagramStore';
import { toast } from '@/hooks/use-toast';
import i18n from '@/i18n';

const STORAGE_KEY = 'microflow_autosave_v2';
const LEGACY_STORAGE_KEY = 'microflow_autosave_v1';
const DEBOUNCE_MS = 1500;

// R15: IndexedDB constants
const IDB_NAME = 'microflow_autosave';
const IDB_STORE = 'diagrams';
const IDB_KEY = 'current';

import type { DiagramNode, DiagramEdge } from '@/types/diagram';

// R5-SEC-03: Schema for legacy autosave validation
const LegacyAutoSaveSchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
  title: z.string().optional(),
  savedAt: z.string().optional(),
});

export interface AutoSaveData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  title: string;
  savedAt: string;
  version: '2';
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

// R5-FUNC-02: Check CompressionStream availability
const SUPPORTS_COMPRESSION = typeof CompressionStream !== 'undefined';

// PERF-06: Compress string using CompressionStream
async function compressString(input: string): Promise<string> {
  if (!SUPPORTS_COMPRESSION) {
    return btoa(unescape(encodeURIComponent(input)));
  }
  const blob = new Blob([input]);
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < merged.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(merged.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

// PERF-06: Decompress base64-encoded gzip string
async function decompressString(base64: string): Promise<string> {
  if (!SUPPORTS_COMPRESSION) {
    return decodeURIComponent(escape(atob(base64)));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes]);
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

// R15: IndexedDB helpers
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(data: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadFromIDB(): Promise<string | null> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function clearIDB(): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useAutoSave() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const diagramName = useDiagramStore((s) => s.diagramName);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (nodes.length === 0) return;

    setSaveStatus('saving');

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const data: AutoSaveData = {
        nodes,
        edges,
        title: diagramName,
        savedAt: new Date().toISOString(),
        version: '2',
      };
      try {
        const json = JSON.stringify(data);
        const compressed = await compressString(json);

        // R15: Try IndexedDB first; fall back to localStorage on error
        try {
          await saveToIDB(compressed);
        } catch {
          localStorage.setItem(STORAGE_KEY, compressed);
        }

        setSaveStatus('saved');
      } catch (e: any) {
        // PERF-06: Handle storage quota exceeded
        if (e?.name === 'QuotaExceededError' || e?.code === 22) {
          toast({
            title: i18n.t('autoSave.storageFull'),
            description: i18n.t('autoSave.storageFullDesc'),
            variant: 'destructive',
          });
        }
        setSaveStatus('idle');
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges, diagramName]);

  return { saveStatus };
}

export async function getAutoSave(): Promise<AutoSaveData | null> {
  try {
    // R15: Check IndexedDB first
    try {
      const idbData = await loadFromIDB();
      if (idbData) {
        const json = await decompressString(idbData);
        const data = JSON.parse(json) as AutoSaveData;
        if (data.nodes && data.edges) return data;
      }
    } catch {
      // IDB unavailable — fall through to localStorage
    }

    // Fallback: compressed localStorage format (v2)
    const compressed = localStorage.getItem(STORAGE_KEY);
    if (compressed) {
      const json = await decompressString(compressed);
      const data = JSON.parse(json) as AutoSaveData;
      if (!data.nodes || !data.edges) return null;
      return data;
    }

    // Fallback: legacy uncompressed format (v1)
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const rawData = JSON.parse(raw);
      const parsed = LegacyAutoSaveSchema.safeParse(rawData);
      if (!parsed.success) return null;
      const data: AutoSaveData = {
        nodes: parsed.data.nodes as DiagramNode[],
        edges: parsed.data.edges as DiagramEdge[],
        title: parsed.data.title ?? i18n.t('autoSave.untitled'),
        savedAt: parsed.data.savedAt ?? new Date().toISOString(),
        version: '2',
      };
      if (!data.nodes.length && !data.edges.length) return null;
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

export function clearAutoSave() {
  // R15: Clear both IndexedDB and localStorage
  clearIDB().catch(() => {});
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
