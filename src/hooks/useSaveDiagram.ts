import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuth } from '@/hooks/useAuth';
import { saveDiagram, saveSharedDiagram } from '@/services/diagramService';
import { clearAutoSave } from '@/hooks/useAutoSave';

/** R12 — Minimum interval between successive saves (ms) */
const SAVE_COOLDOWN_MS = 1500;
import { toast } from '@/hooks/use-toast';

interface UseSaveDiagramOptions {
  shareToken?: string;
}

interface UseSaveDiagramReturn {
  save: () => Promise<void>;
  saving: boolean;
  /** Stable ref that always points to latest save — use in event handlers to avoid stale closures */
  saveRef: React.RefObject<() => void>;
}

export function useSaveDiagram({ shareToken }: UseSaveDiagramOptions = {}): UseSaveDiagramReturn {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const lastSaveTimestampRef = useRef<number>(0);

  // PERF-05: Read store state at call time instead of subscribing — avoids unnecessary callback recreation
  const save = useCallback(async () => {
    if (!user) return;
    if (saving) return; // R12: guard against concurrent saves

    // R5: Throttle temporal — impede saves consecutivos dentro do cooldown
    const now = Date.now();
    if (now - lastSaveTimestampRef.current < SAVE_COOLDOWN_MS) {
      toast({ title: t('save.recentlySaved') });
      return;
    }

    // Snapshot current store state at the moment of save
    const { nodes, edges, diagramName, currentDiagramId: diagramId, isCollaborator } = useDiagramStore.getState();
    const setDiagramId = useDiagramStore.getState().setCurrentDiagramId;

    setSaving(true);
    try {
      lastSaveTimestampRef.current = Date.now();
      if (isCollaborator && diagramId) {
        await saveSharedDiagram(diagramId, nodes, edges);
        clearAutoSave();
        toast({ title: t('save.sharedSaved') });
      } else {
        const isSharedContext = !!shareToken && !diagramId;
        const record = await saveDiagram(diagramName, nodes, edges, user.id, diagramId);
        setDiagramId(record.id);
        clearAutoSave();
        if (isSharedContext) {
          toast({
            title: t('save.savedAsCopy'),
            description: t('save.savedAsCopyDesc'),
            duration: 6000,
          });
        } else {
          toast({ title: t('save.savedToCloud') });
        }
      }
    } catch (err: any) {
      console.error('[useSaveDiagram] Save error:', err);
      toast({ title: t('save.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [user, shareToken, saving]); // saving included so ref stays current when guard state changes

  // PERF-05: Stable ref always pointing to latest save
  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  return { save, saving, saveRef };
}
