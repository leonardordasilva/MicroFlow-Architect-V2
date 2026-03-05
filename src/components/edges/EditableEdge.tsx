import { useCallback, useRef } from 'react';
import {
  BaseEdge,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { PROTOCOL_CONFIGS, type EdgeProtocol, type NodeType } from '@/types/diagram';
import { getDbColor } from '@/constants/databaseColors';

interface Point {
  x: number;
  y: number;
}

function getSourceNodeColor(sourceNodeType?: NodeType, sourceNodeSubType?: string): string | undefined {
  switch (sourceNodeType) {
    case 'service':
      return 'hsl(217, 91%, 60%)';
    case 'database':
      return getDbColor(sourceNodeSubType);
    case 'queue':
      return 'hsl(157, 52%, 49%)';
    case 'external':
      return 'hsl(220, 9%, 46%)';
    default:
      return undefined;
  }
}

interface EditableEdgeData {
  midOffset?: number; // horizontal offset for the middle vertical segment
  protocol?: EdgeProtocol;
  sourceNodeType?: NodeType;
  sourceNodeSubType?: string;
  isQueueConnection?: boolean;
  [key: string]: unknown;
}

function buildOrthogonalPath(points: Point[]): string {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  markerStart,
  label,
  labelStyle,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const draggingRef = useRef<{
    startSvg: Point;
    initialOffset: number;
  } | null>(null);

  const edgeData = data as EditableEdgeData | undefined;

  const protocol = edgeData?.protocol;
  const protocolConfig = protocol ? PROTOCOL_CONFIGS[protocol] : undefined;
  const isQueueConn = edgeData?.isQueueConnection ?? edgeData?.sourceNodeType === 'queue';
  const sourceColor = isQueueConn ? 'hsl(157, 52%, 49%)' : getSourceNodeColor(edgeData?.sourceNodeType, edgeData?.sourceNodeSubType);

  // midOffset shifts the vertical connector from the default midpoint
  const midOffset = edgeData?.midOffset ?? 0;
  const defaultMx = (sourceX + targetX) / 2;
  const mx = defaultMx + midOffset;

  const source: Point = { x: sourceX, y: sourceY };
  const target: Point = { x: targetX, y: targetY };

  const rawPoints: Point[] = [
    source,
    { x: mx, y: sourceY },
    { x: mx, y: targetY },
    target,
  ];

  // Deduplicate consecutive points
  const allPoints: Point[] = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    const prev = allPoints[allPoints.length - 1];
    if (Math.abs(rawPoints[i].x - prev.x) > 0.5 || Math.abs(rawPoints[i].y - prev.y) > 0.5) {
      allPoints.push(rawPoints[i]);
    }
  }
  if (allPoints.length < 2) {
    allPoints.length = 0;
    allPoints.push(source, target);
  }

  // Ensure final segment has enough length for arrow orientation
  const MIN_ARROW_SEG = 8;
  if (allPoints.length >= 2) {
    const last = allPoints[allPoints.length - 1];
    const prev = allPoints[allPoints.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy);
    if (len < MIN_ARROW_SEG && len > 0) {
      const scale = MIN_ARROW_SEG / len;
      allPoints[allPoints.length - 2] = {
        x: last.x - dx * scale,
        y: last.y - dy * scale,
      };
    }
  }

  const edgePath = buildOrthogonalPath(allPoints);

  const midIdx = Math.floor(allPoints.length / 2);
  const labelX = (allPoints[midIdx - 1].x + allPoints[midIdx].x) / 2;
  const labelY = (allPoints[midIdx - 1].y + allPoints[midIdx].y) / 2;

  // Hit area covers the entire path for whole-edge dragging
  const handlePointerDown = useCallback(
    (evt: React.PointerEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      const svg = (evt.target as Element).closest('svg') as SVGSVGElement;
      if (!svg) return;

      const ctm = svg.getScreenCTM()?.inverse();
      if (!ctm) return;

      const startPt = svg.createSVGPoint();
      startPt.x = evt.clientX;
      startPt.y = evt.clientY;
      const startSvg = startPt.matrixTransform(ctm);

      draggingRef.current = {
        startSvg: { x: startSvg.x, y: startSvg.y },
        initialOffset: midOffset,
      };

      const onMove = (e: PointerEvent) => {
        if (!draggingRef.current) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const currentCtm = svg.getScreenCTM()?.inverse();
        if (!currentCtm) return;
        const svgPt = pt.matrixTransform(currentCtm);

        const dx = svgPt.x - draggingRef.current.startSvg.x;
        const newOffset = draggingRef.current.initialOffset + dx;

        setEdges((edges) =>
          edges.map((edge) =>
            edge.id === id ? { ...edge, data: { ...edge.data, midOffset: newOffset } } : edge
          )
        );
      };

      const onUp = () => {
        draggingRef.current = null;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [id, midOffset, setEdges]
  );

  // Build a single transparent hit-area path covering the whole edge
  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          ...style,
          pointerEvents: 'none',
          ...(sourceColor ? { stroke: sourceColor } : {}),
          ...(isQueueConn ? { strokeDasharray: '8 4' } : {}),
          ...(protocolConfig ? {
            stroke: protocolConfig.color,
            strokeDasharray: protocolConfig.dashArray || undefined,
          } : {}),
        }}
        labelX={labelX}
        labelY={labelY}
        label={label}
        labelStyle={labelStyle}
      />
      {/* Single invisible hit area for the whole edge — drag to move */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'ew-resize' }}
        onPointerDown={handlePointerDown}
      />
    </>
  );
}
