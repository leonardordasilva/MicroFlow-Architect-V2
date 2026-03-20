import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ImportJSONModal from '@/components/ImportJSONModal';
import SpawnFromNodeModal from '@/components/SpawnFromNodeModal';
import MermaidExportModal from '@/components/MermaidExportModal';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal';
import { toast } from '@/hooks/use-toast';
import type { DiagramNode, DiagramEdge, NodeType } from '@/types/diagram';
import type { ImportDiagramInput } from '@/schemas/diagramSchema';

interface SpawnSource {
  id: string;
  label: string;
  nodeType: string;
}

interface DiagramModalsProps {
  addNodesFromSource: (sourceNodeId: string, type: NodeType, count: number, subType?: string) => void;
  loadDiagram: (nodes: DiagramNode[], edges: DiagramEdge[]) => void;
  setDiagramName: (name: string) => void;
  clearCanvas: () => void;
  handleExportMermaid: () => string;
  onAfterImport?: () => void;
}

export interface DiagramModalsHandle {
  openImportJSON: () => void;
  openClearConfirm: () => void;
  openShortcuts: () => void;
  openMermaid: () => void;
  openSpawn: (source: SpawnSource) => void;
}

export const DiagramModals = forwardRef<DiagramModalsHandle, DiagramModalsProps>(
  ({ addNodesFromSource, loadDiagram, setDiagramName, clearCanvas, handleExportMermaid, onAfterImport }, ref) => {
    const [showImportJSON, setShowImportJSON] = useState(false);
    const [spawnSource, setSpawnSource] = useState<SpawnSource | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [mermaidCode, setMermaidCode] = useState<string | null>(null);
    const [showShortcuts, setShowShortcuts] = useState(false);

    useImperativeHandle(ref, () => ({
      openImportJSON: () => setShowImportJSON(true),
      openClearConfirm: () => setShowClearConfirm(true),
      openShortcuts: () => setShowShortcuts(true),
      openMermaid: () => setMermaidCode(handleExportMermaid()),
      openSpawn: (source) => setSpawnSource(source),
    }), [handleExportMermaid]);

    const handleImport = useCallback((data: ImportDiagramInput) => {
      loadDiagram(data.nodes as DiagramNode[], data.edges as DiagramEdge[]);
      if (data.name) setDiagramName(data.name);
      onAfterImport?.();
      toast({ title: 'Diagrama importado com sucesso!' });
    }, [loadDiagram, setDiagramName, onAfterImport]);

    return (
      <>
        <ImportJSONModal open={showImportJSON} onOpenChange={setShowImportJSON} onImport={handleImport} />

        <SpawnFromNodeModal
          open={!!spawnSource}
          onOpenChange={(open) => { if (!open) setSpawnSource(null); }}
          sourceNodeLabel={spawnSource?.label || ''}
          sourceNodeType={spawnSource?.nodeType || ''}
          onConfirm={(type, count, subType) => {
            if (spawnSource) addNodesFromSource(spawnSource.id, type, count, subType);
          }}
        />

        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar diagrama</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja limpar todo o diagrama? Esta ação pode ser desfeita com Ctrl+Z.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={clearCanvas}>Limpar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <MermaidExportModal
          open={!!mermaidCode}
          onOpenChange={(open) => { if (!open) setMermaidCode(null); }}
          code={mermaidCode || ''}
        />

        <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
      </>
    );
  },
);
DiagramModals.displayName = 'DiagramModals';
