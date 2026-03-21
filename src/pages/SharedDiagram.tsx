import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DiagramCanvas from '@/components/DiagramCanvas';
import { loadDiagramByToken } from '@/services/diagramService';
import { useDiagramStore } from '@/store/diagramStore';

export default function SharedDiagram() {
  const { t } = useTranslation();
  const { shareToken } = useParams<{ shareToken: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    loadDiagramByToken(shareToken).then((diagram) => {
      if (diagram) {
        const store = useDiagramStore.getState();
        store.loadDiagram(diagram.nodes, diagram.edges);
        store.setDiagramName(diagram.title);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [shareToken]);

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

  return <DiagramCanvas shareToken={shareToken} />;
}
