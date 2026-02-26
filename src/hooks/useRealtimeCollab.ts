import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDiagramStore } from '@/store/diagramStore';
import type { DiagramNode, DiagramEdge } from '@/types/diagram';

const DEBOUNCE_MS = 300;

export interface Collaborator {
  userId: string;
  email: string;
  color: string;
}

const AVATAR_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(319, 80%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 72%, 51%)',
];

export function useRealtimeCollab(shareToken: string | null) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdate = useRef(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const broadcastChanges = useCallback(
    (nodes: DiagramNode[], edges: DiagramEdge[]) => {
      if (!channelRef.current || isRemoteUpdate.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'diagram_updated',
          payload: { nodes, edges },
        });
      }, DEBOUNCE_MS);
    },
    [],
  );

  useEffect(() => {
    if (!shareToken) return;

    const channel = supabase.channel(`diagram:${shareToken}`, {
      config: { presence: { key: 'user' } },
    });

    channel
      .on('broadcast', { event: 'diagram_updated' }, (payload) => {
        const { nodes, edges } = payload.payload as { nodes: DiagramNode[]; edges: DiagramEdge[] };
        isRemoteUpdate.current = true;
        const store = useDiagramStore.getState();
        store.setNodes(nodes);
        store.setEdges(edges);
        setTimeout(() => {
          isRemoteUpdate.current = false;
        }, 50);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Collaborator[] = [];
        const seen = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            if (p.userId && !seen.has(p.userId)) {
              seen.add(p.userId);
              users.push({
                userId: p.userId,
                email: p.email || '',
                color: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
              });
            }
          });
        });
        setCollaborators(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            await channel.track({
              userId: data.user.id,
              email: data.user.email || '',
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [shareToken]);

  return { broadcastChanges, isRemoteUpdate, collaborators };
}
