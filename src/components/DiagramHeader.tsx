import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, LogOut, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CollaboratorAvatars from '@/components/CollaboratorAvatars';
import type { Collaborator } from '@/hooks/useRealtimeCollab';

interface DiagramHeaderProps {
  shareToken?: string;
  diagramId: string | null;
  isCollaborator: boolean;
  user: { id: string } | null;
  collaborators: Collaborator[];
  saving: boolean;
  refreshing: boolean;
  onSave: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
}

function DiagramHeader({
  shareToken,
  diagramId,
  isCollaborator,
  user,
  collaborators,
  saving,
  refreshing,
  onSave,
  onRefresh,
  onSignOut,
}: DiagramHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      {shareToken && !diagramId && (
        <Badge variant="outline" className="text-xs">
          Visualizando diagrama compartilhado
        </Badge>
      )}
      {shareToken && diagramId && (
        <Badge variant="secondary" className="text-xs">
          ✓ Cópia salva em Meus Diagramas
        </Badge>
      )}
      {isCollaborator && (
        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-600 dark:text-blue-400">
          Editando diagrama compartilhado
        </Badge>
      )}

      {user && (
        <div className="flex items-center gap-2 ml-auto">
          <CollaboratorAvatars collaborators={collaborators} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/my-diagrams')} aria-label="Meus Diagramas">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Meus Diagramas</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh} disabled={refreshing} aria-label="Atualizar diagrama">
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Atualizar diagrama</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSave} disabled={saving} aria-label="Salvar na nuvem">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Salvar na nuvem</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSignOut} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Sair</TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  );
}

export default React.memo(DiagramHeader);
