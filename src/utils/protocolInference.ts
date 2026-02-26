import type { NodeType, EdgeProtocol } from '@/types/diagram';

export function inferProtocol(sourceType: NodeType, targetType: NodeType): EdgeProtocol {
  if (sourceType === 'service' && targetType === 'service') return 'REST';
  if (sourceType === 'service' && targetType === 'database') return 'TCP';
  if (sourceType === 'service' && targetType === 'queue') return 'AMQP';
  if (sourceType === 'queue' && targetType === 'service') return 'Kafka';
  if (sourceType === 'service' && targetType === 'external') return 'HTTPS';
  if (sourceType === 'external' && targetType === 'service') return 'REST';
  if (sourceType === 'queue' && targetType === 'queue') return 'AMQP';
  return 'REST'; // fallback
}
