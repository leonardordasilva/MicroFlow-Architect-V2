import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {shareToken && !diagramId && (
        <Badge variant="outline" className="text-xs">
          {t('header.viewingShared')}
        </Badge>
      )}
      {shareToken && diagramId && (
        <Badge variant="secondary" className="text-xs">
          {t('header.savedCopy')}
        </Badge>
      )}
      {isCollaborator && (
        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-600 dark:text-blue-400">
          {t('header.editingShared')}
        </Badge>
      )}

      {user && (
        <div className="flex items-center gap-2 ml-auto">
          <CollaboratorAvatars collaborators={collaborators} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/my-diagrams')} aria-label={t('header.myDiagrams')}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t('header.myDiagrams')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh} disabled={refreshing} aria-label={t('header.update')}>
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t('header.update')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSave} disabled={saving} aria-label={t('header.saveToCloud')}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t('header.saveToCloud')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSignOut} aria-label={t('header.logout')}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{t('header.logout')}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  );
}

export default React.memo(DiagramHeader);
