import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Database, Mail, Globe, Trash2, Undo2, Redo2, LayoutGrid,
  Download, Upload, Image, Sparkles, Brain, Moon, Sun, ChevronDown, XCircle,
  FileCode, FileImage, FileJson,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NodeType } from '@/types/diagram';

interface ToolbarProps {
  onAddNode: (type: NodeType, subType?: string) => void;
  onDelete: () => void;
  onClearCanvas: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: (engine: string, direction: string) => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportMermaid: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  diagramName: string;
  onDiagramNameChange: (name: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'outline' | 'default';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon" className="h-9 w-9" onClick={onClick} aria-label={label}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

function DatabaseDropdown({ onSelect }: { onSelect: (subType: string) => void }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t('toolbar.database')}>
              <Database className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-[-2px]" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{t('toolbar.database')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="z-50">
        <DropdownMenuItem onClick={() => onSelect('Oracle')}>Oracle</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('Redis')}>Redis</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Toolbar({
  onAddNode, onDelete, onClearCanvas, onUndo, onRedo, onAutoLayout,
  onExportPNG, onExportSVG, onExportMermaid, onExportJSON, onImportJSON,
  diagramName, onDiagramNameChange,
  darkMode, onToggleDarkMode,
}: ToolbarProps) {
  const { t } = useTranslation();
  const [localName, setLocalName] = useState(diagramName);

  // Sync when store changes externally (e.g. loadDiagram, RecoveryBanner)
  useEffect(() => {
    setLocalName(diagramName);
  }, [diagramName]);

  const commitName = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== diagramName) {
      onDiagramNameChange(trimmed);
    } else {
      setLocalName(diagramName);
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1.5 shadow-sm">
      <div className="relative">
        <Input
          className="h-8 w-40 text-sm font-semibold bg-transparent border-transparent focus-visible:border-border focus-visible:ring-1 px-2"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitName();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === 'Escape') {
              setLocalName(diagramName);
              (e.target as HTMLInputElement).blur();
            }
          }}
          maxLength={100}
          placeholder={t('toolbar.diagramName')}
          aria-label={t('toolbar.diagramName')}
        />
        <div aria-live="polite" aria-atomic="true" className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground">
          {localName.length > 80 ? `${localName.length}/100` : ''}
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <ToolbarButton icon={Box} label={t('toolbar.service')} onClick={() => onAddNode('service')} />
      <DatabaseDropdown onSelect={(subType) => onAddNode('database', subType)} />
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t('toolbar.queue')}>
                <Mail className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-[-2px]" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{t('toolbar.queue')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="z-50">
          <DropdownMenuItem onClick={() => onAddNode('queue', 'IBM MQ')}>IBM MQ</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('queue', 'Kafka')}>Kafka</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('queue', 'RabbitMQ')}>RabbitMQ</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t('toolbar.api')}>
                <Globe className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-[-2px]" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{t('toolbar.api')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="z-50">
          <DropdownMenuItem onClick={() => onAddNode('external', 'REST')}>REST</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('external', 'gRPC')}>gRPC</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('external', 'GraphQL')}>GraphQL</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('external', 'WebSocket')}>WebSocket</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNode('external', 'HTTPS')}>HTTPS</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      <ToolbarButton icon={Trash2} label={t('toolbar.deleteSelected')} onClick={onDelete} />
      <ToolbarButton icon={XCircle} label={t('toolbar.clearDiagram')} onClick={onClearCanvas} />
      <ToolbarButton icon={Undo2} label={t('toolbar.undo')} onClick={onUndo} />
      <ToolbarButton icon={Redo2} label={t('toolbar.redo')} onClick={onRedo} />
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t('toolbar.autoLayout')}>
                <LayoutGrid className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-[-2px]" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{t('toolbar.autoLayout')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="z-50">
          <DropdownMenuItem onClick={() => onAutoLayout('elk', 'LR')}>{t('toolbar.elkLR')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAutoLayout('elk', 'TB')}>{t('toolbar.elkTB')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAutoLayout('dagre', 'LR')}>{t('toolbar.dagreH')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAutoLayout('dagre', 'TB')}>{t('toolbar.dagreV')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t('toolbar.export')}>
                <Download className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-[-2px]" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{t('toolbar.export')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="z-50">
          <DropdownMenuItem onClick={onExportPNG} className="gap-2">
            <Image className="h-4 w-4" /> PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportSVG} className="gap-2">
            <FileImage className="h-4 w-4" /> SVG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportMermaid} className="gap-2">
            <FileCode className="h-4 w-4" /> Mermaid.js
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJSON} className="gap-2">
            <FileJson className="h-4 w-4" /> JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarButton icon={Upload} label={t('toolbar.importJSON')} onClick={onImportJSON} />

      <Separator orientation="vertical" className="h-6" />

      <ToolbarButton
        icon={darkMode ? Sun : Moon}
        label={darkMode ? t('toolbar.lightMode') : t('toolbar.darkMode')}
        onClick={onToggleDarkMode}
      />
    </div>
  );
}

export default React.memo(Toolbar);
