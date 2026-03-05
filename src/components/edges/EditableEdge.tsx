import {
  BaseEdge,
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
  waypoints?: Point[];
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
  const edgeData = data as EditableEdgeData | undefined;

  const protocol = edgeData?.protocol;
  const protocolConfig = protocol ? PROTOCOL_CONFIGS[protocol] : undefined;
  const isQueueConn = edgeData?.isQueueConnection ?? edgeData?.sourceNodeType === 'queue';
  const sourceColor = isQueueConn ? 'hsl(157, 52%, 49%)' : getSourceNodeColor(edgeData?.sourceNodeType, edgeData?.sourceNodeSubType);

  const source: Point = { x: sourceX, y: sourceY };
  const target: Point = { x: targetX, y: targetY };

  // Simple orthogonal path via midpoint
  const mx = (sourceX + targetX) / 2;
  const allPoints: Point[] = [
    source,
    { x: mx, y: sourceY },
    { x: mx, y: targetY },
    target,
  ];

  // Deduplicate consecutive points
  const deduped: Point[] = [allPoints[0]];
  for (let i = 1; i < allPoints.length; i++) {
    const prev = deduped[deduped.length - 1];
    if (Math.abs(allPoints[i].x - prev.x) > 0.5 || Math.abs(allPoints[i].y - prev.y) > 0.5) {
      deduped.push(allPoints[i]);
    }
  }
  if (deduped.length < 2) {
    deduped.length = 0;
    deduped.push(source, target);
  }

  // Ensure final segment has enough length for arrow orientation
  const MIN_ARROW_SEG = 8;
  if (deduped.length >= 2) {
    const last = deduped[deduped.length - 1];
    const prev = deduped[deduped.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.hypot(dx, dy);
    if (len < MIN_ARROW_SEG && len > 0) {
      const scale = MIN_ARROW_SEG / len;
      deduped[deduped.length - 2] = {
        x: last.x - dx * scale,
        y: last.y - dy * scale,
      };
    }
  }

  const edgePath = buildOrthogonalPath(deduped);

  const midIdx = Math.floor(deduped.length / 2);
  const labelX = (deduped[midIdx - 1].x + deduped[midIdx].x) / 2;
  const labelY = (deduped[midIdx - 1].y + deduped[midIdx].y) / 2;

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={{
        ...style,
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
  );
}
