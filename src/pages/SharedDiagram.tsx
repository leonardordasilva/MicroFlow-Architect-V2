import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DiagramCanvas from '@/components/DiagramCanvas';
import { loadDiagramByToken } from '@/services/diagramService';
import { useDiagramStore } from '@/store/diagramStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function SharedDiagram() {
  const { t } = useTranslation();
  const { shareToken } = useParams<{ shareToken: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [diagramId, setDiagramId] = useState<string | undefined>();
  /** true = visitor has no edit rights → read-only canvas */
  const [readOnly, setReadOnly] = useState(true);

  useEffect(() => {
    if (!shareToken) return;
    let cancelled = false;

    async function load() {
      const diagram = await loadDiagramByToken(shareToken!);
      if (cancelled) return;

      if (diagram) {
        const store = useDiagramStore.getState();
        store.loadDiagram(diagram.nodes, diagram.edges);
        store.setDiagramName(diagram.title);
        setDiagramId(diagram.id);

        // saas0001: determine read-only mode
        if (user) {
          // Check if user is owner or collaborator via RPC
          const { data: isCollab } = await supabase.rpc('is_diagram_collaborator', {
            p_diagram_id: diagram.id,
            p_user_id: user.id,
          });
          if (!cancelled) setReadOnly(!isCollab);
        } else {
          // Unauthenticated — always read-only
          setReadOnly(true);
        }
      } else {
        setNotFound(true);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [shareToken, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('sharedDiagram.loading')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('sharedDiagram.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      {readOnly && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-lg border bg-card/90 backdrop-blur px-4 py-2 shadow text-sm">
          <span className="text-muted-foreground">{t('sharedDiagram.readOnlyBadge')}</span>
          {!user && (
            <Link to="/" className="text-primary font-medium hover:underline text-xs">
              {t('sharedDiagram.signUpToEdit')}
            </Link>
          )}
        </div>
      )}
      <DiagramCanvas shareToken={shareToken} readOnly={readOnly} />
    </div>
  );
}
