import { PROTOCOL_CONFIGS, type EdgeProtocol } from '@/types/diagram';

const syncProtocols = (Object.entries(PROTOCOL_CONFIGS) as [EdgeProtocol, typeof PROTOCOL_CONFIGS[EdgeProtocol]][])
  .filter(([, c]) => !c.async);
const asyncProtocols = (Object.entries(PROTOCOL_CONFIGS) as [EdgeProtocol, typeof PROTOCOL_CONFIGS[EdgeProtocol]][])
  .filter(([, c]) => c.async);

export default function DiagramLegend() {
  return (
    <div className="absolute bottom-14 left-3 z-10 rounded-lg border bg-card/90 p-3 shadow-md backdrop-blur-sm text-xs">
      <div className="font-semibold text-foreground mb-2">Protocolos</div>
      <div className="flex gap-6">
        <div>
          <div className="text-muted-foreground mb-1">Síncrono</div>
          {syncProtocols.map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 py-0.5">
              <span className="inline-block h-0.5 w-5 rounded" style={{ backgroundColor: config.color }} />
              <span className="text-foreground">{config.label}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Assíncrono</div>
          {asyncProtocols.map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 py-0.5">
              <span
                className="inline-block h-0.5 w-5 rounded"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, ${config.color} 0px, ${config.color} 3px, transparent 3px, transparent 6px)`,
                }}
              />
              <span className="text-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
