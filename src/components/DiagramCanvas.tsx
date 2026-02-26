import { useState, useCallback, useRef } from 'react';
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
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import { useSnapGuides } from '@/hooks/useSnapGuides';
import SnapGuideLines from '@/components/SnapGuideLines';
import { toPng } from 'html-to-image';
import { toast } from '@/hooks/use-toast';
import { useDiagramStore } from '@/store/diagramStore';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import ServiceNode from '@/components/nodes/ServiceNode';
import DatabaseNode from '@/components/nodes/DatabaseNode';
import QueueNode from '@/components/nodes/QueueNode';
import ExternalNode from '@/components/nodes/ExternalNode';
import EditableEdge from '@/components/edges/EditableEdge';
import Toolbar from '@/components/Toolbar';
import AIGenerateModal from '@/components/AIGenerateModal';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import ImportJSONModal from '@/components/ImportJSONModal';
import SpawnFromNodeModal from '@/components/SpawnFromNodeModal';
import type { DiagramNodeData } from '@/types/diagram';

const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  queue: QueueNode,
  external: ExternalNode,
};

const edgeTypes = {
  editable: EditableEdge,
};

export default function DiagramCanvas() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const diagramName = useDiagramStore((s) => s.diagramName);
  const actions = useDiagramStore(useShallow((s) => ({
    setDiagramName: s.setDiagramName,
    onNodesChange: s.onNodesChange,
    onEdgesChange: s.onEdgesChange,
    onConnect: s.onConnect,
    onNodeDragHandler: s.onNodeDragHandler,
    addNode: s.addNode,
    addNodesFromSource: s.addNodesFromSource,
    deleteSelected: s.deleteSelected,
    autoLayout: s.autoLayout,
    clearCanvas: s.clearCanvas,
    loadDiagram: s.loadDiagram,
    exportJSON: s.exportJSON,
  })));

  const { undo, redo } = useStore(useDiagramStore.temporal, (state) => ({ undo: state.undo, redo: state.redo }));

  const [darkMode, setDarkMode] = useState(true);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showImportJSON, setShowImportJSON] = useState(false);
  const [spawnSource, setSpawnSource] = useState<{ id: string; label: string; nodeType: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; nodeLabel: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { guides, onNodeDrag, onNodeDragStop } = useSnapGuides(nodes);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  // Initialize dark mode
  useState(() => {
    document.documentElement.classList.add('dark');
  });

  const handleExportPNG = useCallback(async () => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { backgroundColor: darkMode ? '#0f1520' : '#f5f7fa' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${diagramName || 'diagram'}.png`;
      a.click();
      toast({ title: 'PNG exportado com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar PNG', variant: 'destructive' });
    }
  }, [darkMode, diagramName]);

  const handleExportJSON = useCallback(() => {
    const json = actions.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramName || 'diagram'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'JSON exportado com sucesso!' });
  }, [actions, diagramName]);

  const handleImport = useCallback(
    (data: { nodes: any[]; edges: any[]; name?: string }) => {
      actions.loadDiagram(data.nodes, data.edges);
      if (data.name) actions.setDiagramName(data.name);
      toast({ title: 'Diagrama importado com sucesso!' });
    },
    [actions]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete') actions.deleteSelected();
      if (e.ctrlKey && e.key === 'z') undo();
      if (e.ctrlKey && e.key === 'y') redo();
    },
    [actions, undo, redo]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      if (node.type === 'database' || node.type === 'external') return;
      const nodeData = node.data as DiagramNodeData;
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeLabel: nodeData.label,
      });
    },
    []
  );

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="flex items-center justify-center border-b bg-card/80 px-4 py-2 backdrop-blur-sm">
        <Toolbar
          onAddNode={actions.addNode}
          onDelete={actions.deleteSelected}
          onClearCanvas={() => setShowClearConfirm(true)}
          onUndo={undo}
          onRedo={redo}
          onAutoLayout={() => actions.autoLayout('LR')}
          onExportPNG={handleExportPNG}
          onExportJSON={handleExportJSON}
          onImportJSON={() => setShowImportJSON(true)}
          onOpenAIGenerate={() => setShowAIGenerate(true)}
          onOpenAIAnalyze={() => setShowAIAnalysis(true)}
          diagramName={diagramName}
          onDiagramNameChange={actions.setDiagramName}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </header>

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={actions.onNodesChange}
          onEdgesChange={actions.onEdgesChange}
          onConnect={actions.onConnect}
          onNodeDrag={(event, node) => {
            onNodeDrag(event, node);
            actions.onNodeDragHandler(event, node as any);
          }}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[10, 10]}
          defaultEdgeOptions={{
            type: 'editable',
            animated: true,
            style: { strokeWidth: 2 },
            data: { waypoints: undefined },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <SnapGuideLines guides={guides} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor={(node) => {
              const colorMap: Record<string, string> = {
                service: 'hsl(217, 91%, 60%)',
                database: 'hsl(142, 71%, 45%)',
                queue: 'hsl(45, 93%, 47%)',
                external: 'hsl(220, 9%, 46%)',
              };
              return colorMap[node.type || ''] || '#888';
            }}
          />
        </ReactFlow>

        {contextMenu && (
          <div
            className="fixed z-50 rounded-md border bg-popover p-1 shadow-md min-w-[180px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                const nd = nodes.find((n) => n.id === contextMenu.nodeId);
                setSpawnSource({ id: contextMenu.nodeId, label: contextMenu.nodeLabel, nodeType: nd?.type || '' });
                setContextMenu(null);
              }}
            >
              Criar objetos a partir deste
            </button>
          </div>
        )}
      </div>

      <AIGenerateModal
        open={showAIGenerate}
        onOpenChange={setShowAIGenerate}
        onGenerate={(newNodes, newEdges) => {
          actions.loadDiagram(newNodes, newEdges);
          actions.autoLayout('LR');
        }}
      />

      <AIAnalysisPanel
        open={showAIAnalysis}
        onOpenChange={setShowAIAnalysis}
        nodes={nodes}
        edges={edges}
      />

      <ImportJSONModal
        open={showImportJSON}
        onOpenChange={setShowImportJSON}
        onImport={handleImport}
      />

      <SpawnFromNodeModal
        open={!!spawnSource}
        onOpenChange={(open) => { if (!open) setSpawnSource(null); }}
        sourceNodeLabel={spawnSource?.label || ''}
        sourceNodeType={spawnSource?.nodeType || ''}
        onConfirm={(type, count, subType) => {
          if (spawnSource) {
            actions.addNodesFromSource(spawnSource.id, type, count, subType);
          }
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
            <AlertDialogAction onClick={actions.clearCanvas}>Limpar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
