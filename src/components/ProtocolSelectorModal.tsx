import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PROTOCOL_CONFIGS, type EdgeProtocol } from '@/types/diagram';

interface ProtocolSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProtocol?: EdgeProtocol;
  onSelect: (protocol: EdgeProtocol) => void;
}

const protocols = Object.keys(PROTOCOL_CONFIGS) as EdgeProtocol[];

export default function ProtocolSelectorModal({
  open,
  onOpenChange,
  currentProtocol,
  onSelect,
}: ProtocolSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Protocolo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {protocols.map((proto) => {
            const config = PROTOCOL_CONFIGS[proto];
            const isSelected = currentProtocol === proto;
            return (
              <button
                key={proto}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-accent ${
                  isSelected ? 'border-primary bg-accent' : 'border-border'
                }`}
                onClick={() => {
                  onSelect(proto);
                  onOpenChange(false);
                }}
              >
                <span
                  className="inline-block h-3 w-6 rounded-sm"
                  style={{
                    backgroundColor: config.color,
                    opacity: config.dashArray ? 0.7 : 1,
                  }}
                />
                <span className="font-medium">{config.label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {config.async ? 'async' : 'sync'}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
