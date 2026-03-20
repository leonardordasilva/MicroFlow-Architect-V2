import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  type Connection,
} from '@xyflow/react';
import { useSnapGuides } from '@/hooks/useSnapGuides';
import SnapGuideLines from '@/components/SnapGuideLines';
import { toast } from '@/hooks/use-toast';
import { useDiagramStore } from '@/store/diagramStore';

import ServiceNode from '@/components/nodes/ServiceNode';
import DatabaseNode from '@/components/nodes/DatabaseNode';
import QueueNode from '@/components/nodes/QueueNode';
import ExternalNode from '@/components/nodes/ExternalNode';
import EditableEdge from '@/components/edges/EditableEdge';
import Toolbar from '@/components/Toolbar';
import type { DiagramNodeData, DiagramNode, DiagramEdge, NodeType } from '@/types/diagram';
import { DiagramModals, type DiagramModalsHandle } from '@/components/DiagramModals';
import { CanvasOverlays, type CanvasOverlaysHandle } from '@/components/CanvasOverlays';

import { useAuth } from '@/hooks/useAuth';
import { loadDiagramById } from '@/services/diagramService';
import { useSaveDiagram } from '@/hooks/useSaveDiagram';
import { useRealtimeCollab } from '@/hooks/useRealtimeCollab';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useExportHandlers } from '@/hooks/useExportHandlers';
import RecoveryBanner from '@/components/RecoveryBanner';
import DiagramHeader from '@/components/DiagramHeader';

import { canConnect, connectionErrorMessage } from '@/utils/connectionRules';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import StatusBar from '@/components/StatusBar';

const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  queue: QueueNode,
  external: ExternalNode,
};

const edgeTypes = { editable: EditableEdge };

// R5-PERF-02: Static minimap color map (outside component)
const MINIMAP_NODE_COLORS: Record<string, string> = {
  service: 'hsl(217, 91%, 60%)',
  database: 'hsl(142, 71%, 45%)',
  queue: 'hsl(45, 93%, 47%)',
  external: 'hsl(220, 9%, 46%)',
};

interface DiagramCanvasProps {
  shareToken?: string;
}

function DiagramCanvasInner({ shareToken }: DiagramCanvasProps) {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const diagramName = useDiagramStore((s) => s.diagramName);
  const diagramId = useDiagramStore((s) => s.currentDiagramId);
  const isCollaborator = useDiagramStore((s) => s.isCollaborator);
  const setDiagramName = useDiagramStore((s) => s.setDiagramName);
  const onNodesChange = useDiagramStore((s) => s.onNodesChange);
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange);
  const onConnectAction = useDiagramStore((s) => s.onConnect);
  const onNodeDragHandler = useDiagramStore((s) => s.onNodeDragHandler);
  const addNode = useDiagramStore((s) => s.addNode);
  const addNodesFromSource = useDiagramStore((s) => s.addNodesFromSource);
  const deleteSelected = useDiagramStore((s) => s.deleteSelected);
  const autoLayout = useDiagramStore((s) => s.autoLayout);
  const autoLayoutELK = useDiagramStore((s) => s.autoLayoutELK);
  const clearCanvas = useDiagramStore((s) => s.clearCanvas);
  const loadDiagram = useDiagramStore((s) => s.loadDiagram);

  const undo = useCallback(() => useDiagramStore.temporal.getState().undo(), []);
  const redo = useCallback(() => useDiagramStore.temporal.getState().redo(), []);

  const { user, signOut } = useAuth();
  const { save: handleSaveToCloud, saving, saveRef: handleSaveToCloudRef } = useSaveDiagram({ shareToken });

  // UX-04: Initialize dark mode from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('microflow_theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>(
    () => localStorage.getItem('microflow_interaction_mode') === 'select' ? 'select' : 'pan',
  );

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const lastLoadedUpdatedAtRef = useRef<string | null>(null);
  const modalsRef = useRef<DiagramModalsHandle>(null);
  const overlaysRef = useRef<CanvasOverlaysHandle>(null);

  const { guides, onNodeDrag, onNodeDragStop } = useSnapGuides(nodes);
  const { broadcastChanges, collaborators } = useRealtimeCollab(shareToken || null);
  const { saveStatus } = useAutoSave();
  const { screenToFlowPosition } = useReactFlow();
  const { handleExportPNG, handleExportSVG, handleExportMermaid, handleExportJSON } = useExportHandlers(darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  useEffect(() => {
    if (shareToken) broadcastChanges(nodes, edges);
  }, [nodes, edges, shareToken, broadcastChanges]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('microflow_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const handleSetInteractionMode = useCallback((mode: 'pan' | 'select') => {
    setInteractionMode(mode);
    localStorage.setItem('microflow_interaction_mode', mode);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete') { deleteSelected(); overlaysRef.current?.clearSelectedNode(); }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSaveToCloudRef.current(); }
    if (e.key === '?') modalsRef.current?.openShortcuts();
    if (e.key === 'Escape') { overlaysRef.current?.clearSelectedNode(); overlaysRef.current?.clearContextMenu(); }
  }, [deleteSelected, undo, redo]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: DiagramNode) => {
    event.preventDefault();
    if (node.type === 'database' || node.type === 'external') return;
    const nodeData = node.data as DiagramNodeData;
    overlaysRef.current?.setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, nodeLabel: nodeData.label });
  }, []);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: DiagramNode) => {
    overlaysRef.current?.setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    overlaysRef.current?.clearContextMenu();
    overlaysRef.current?.clearSelectedNode();
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    const srcType = (sourceNode?.type ?? 'service') as NodeType;
    const tgtType = (targetNode?.type ?? 'service') as NodeType;
    if (!canConnect(srcType, tgtType)) {
      toast({ title: connectionErrorMessage(srcType, tgtType), variant: 'destructive' });
      return;
    }
    onConnectAction(connection);
  }, [onConnectAction, nodes]);

  const handleRefreshDiagram = useCallback(async () => {
    if (!diagramId) { toast({ title: 'Salve o diagrama primeiro para poder atualizar.' }); return; }
    setRefreshing(true);
    try {
      const record = await loadDiagramById(diagramId);
      if (!record) { toast({ title: 'Diagrama não encontrado', variant: 'destructive' }); return; }
      if (record.updated_at === lastLoadedUpdatedAtRef.current) {
        toast({ title: 'Diagrama já está atualizado.' });
      } else {
        const temporal = useDiagramStore.temporal.getState();
        temporal.pause();
        loadDiagram(record.nodes, record.edges);
        if (record.title && record.title !== diagramName) setDiagramName(record.title);
        temporal.resume();
        lastLoadedUpdatedAtRef.current = record.updated_at;
        toast({ title: 'Diagrama atualizado com sucesso!' });
      }
    } catch { toast({ title: 'Erro ao atualizar diagrama', variant: 'destructive' }); }
    finally { setRefreshing(false); }
  }, [diagramId, loadDiagram, diagramName, setDiagramName]);

  const handleAddNode = useCallback((type: NodeType, subType?: string) => {
    const wrapper = reactFlowWrapper.current;
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const pos = screenToFlowPosition({
        x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 80,
        y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 80,
      });
      addNode(type, subType, pos);
    } else {
      addNode(type, subType);
    }
  }, [screenToFlowPosition, addNode]);

  return (
    <div className="flex h-screen w-screen flex-col bg-background" onKeyDown={handleKeyDown} tabIndex={0} role="application" aria-label="Editor de diagramas de arquitetura">
      <header className="flex items-center justify-center gap-3 border-b bg-card/80 px-4 py-2 backdrop-blur-sm">
        <Toolbar
          onAddNode={handleAddNode}
          onDelete={deleteSelected}
          onClearCanvas={() => modalsRef.current?.openClearConfirm()}
          onUndo={undo}
          onRedo={redo}
          onAutoLayout={(engine, direction) => {
            if (engine === 'elk') {
              autoLayoutELK(direction as any).catch(() => toast({ title: 'Erro ao aplicar layout automático. Tente novamente.', variant: 'destructive' }));
            } else {
              autoLayout(direction as any);
            }
          }}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportMermaid={() => modalsRef.current?.openMermaid()}
          onExportJSON={handleExportJSON}
          onImportJSON={() => modalsRef.current?.openImportJSON()}
          diagramName={diagramName}
          onDiagramNameChange={setDiagramName}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        <DiagramHeader
          shareToken={shareToken}
          diagramId={diagramId}
          isCollaborator={isCollaborator}
          user={user}
          collaborators={collaborators}
          saving={saving}
          refreshing={refreshing}
          onSave={handleSaveToCloud}
          onRefresh={handleRefreshDiagram}
          onSignOut={signOut}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => modalsRef.current?.openShortcuts()} aria-label="Atalhos de teclado">
              <Keyboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Atalhos (?)</TooltipContent>
        </Tooltip>
      </header>

      <div className="relative flex-1" ref={reactFlowWrapper}>
        <RecoveryBanner />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeDrag={(event, node) => { onNodeDrag(event, node); onNodeDragHandler(event, node as any); }}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[10, 10]}
          selectionOnDrag={interactionMode === 'select'}
          panOnDrag={interactionMode === 'select' ? [1, 2] : [0, 1, 2]}
          selectionMode={SelectionMode.Partial}
          defaultEdgeOptions={{ type: 'editable', animated: true, style: { strokeWidth: 2 }, data: { waypoints: undefined } }}
          proOptions={{ hideAttribution: true }}
        >
          <SnapGuideLines guides={guides} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
          <MiniMap className="!bg-card !border-border" nodeColor={(node) => MINIMAP_NODE_COLORS[node.type || ''] || '#888'} />
        </ReactFlow>

        <CanvasOverlays
          ref={overlaysRef}
          nodes={nodes}
          interactionMode={interactionMode}
          onInteractionModeChange={handleSetInteractionMode}
          onSpawn={(source) => modalsRef.current?.openSpawn(source)}
        />
      </div>

      <StatusBar nodes={nodes} edges={edges} saveStatus={saveStatus} />

      <DiagramModals
        ref={modalsRef}
        addNodesFromSource={addNodesFromSource}
        loadDiagram={loadDiagram}
        setDiagramName={setDiagramName}
        clearCanvas={clearCanvas}
        handleExportMermaid={handleExportMermaid}
        onAfterImport={() => { lastLoadedUpdatedAtRef.current = null; }}
      />
    </div>
  );
}

export default function DiagramCanvas({ shareToken }: DiagramCanvasProps = {}) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner shareToken={shareToken} />
    </ReactFlowProvider>
  );
}
