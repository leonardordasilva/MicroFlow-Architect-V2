import { useCallback } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { toast } from '@/hooks/use-toast';
import { useDiagramStore } from '@/store/diagramStore';
import { exportToMermaid } from '@/services/exportService';

/** Filter out UI controls from image export */
const exportFilter = (domNode: HTMLElement) => {
  if (!domNode.classList) return true;
  const excludeClasses = [
    'react-flow__panel',
    'react-flow__controls',
    'react-flow__minimap',
    'react-flow__attribution',
    'export-exclude',
  ];
  for (const cls of excludeClasses) {
    if (domNode.classList.contains(cls)) return false;
  }
  return true;
};

export function useExportHandlers(darkMode: boolean) {
  const { getNodes: getFlowNodes } = useReactFlow();
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const diagramName = useDiagramStore((s) => s.diagramName);
  const exportJSON = useDiagramStore((s) => s.exportJSON);

  const handleExportPNG = useCallback(async () => {
    const flowNodes = getFlowNodes();
    if (flowNodes.length === 0) return;
    const bounds = getNodesBounds(flowNodes);
    const padding = 20;
    const imageWidth = Math.ceil(bounds.width + padding * 2);
    const imageHeight = Math.ceil(bounds.height + padding * 2);
    const translateX = -bounds.x + padding;
    const translateY = -bounds.y + padding;

    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: darkMode ? '#0f1520' : '#f5f7fa',
        filter: exportFilter,
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${translateX}px, ${translateY}px) scale(1)`,
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${diagramName || 'diagram'}.png`;
      a.click();
      toast({ title: 'PNG exportado com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar PNG', variant: 'destructive' });
    }
  }, [darkMode, diagramName, getFlowNodes]);

  const handleExportSVG = useCallback(async () => {
    const flowNodes = getFlowNodes();
    if (flowNodes.length === 0) return;
    const bounds = getNodesBounds(flowNodes);
    const padding = 20;
    const imageWidth = Math.ceil(bounds.width + padding * 2);
    const imageHeight = Math.ceil(bounds.height + padding * 2);
    const translateX = -bounds.x + padding;
    const translateY = -bounds.y + padding;

    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toSvg(el, {
        backgroundColor: darkMode ? '#0f1520' : '#f5f7fa',
        filter: exportFilter,
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${translateX}px, ${translateY}px) scale(1)`,
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${diagramName || 'diagram'}.svg`;
      a.click();
      toast({ title: 'SVG exportado com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar SVG', variant: 'destructive' });
    }
  }, [darkMode, diagramName, getFlowNodes]);

  const handleExportMermaid = useCallback(() => {
    return exportToMermaid(nodes, edges);
  }, [nodes, edges]);

  const handleExportJSON = useCallback(() => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramName || 'diagram'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'JSON exportado com sucesso!' });
  }, [exportJSON, diagramName]);

  return { handleExportPNG, handleExportSVG, handleExportMermaid, handleExportJSON };
}
