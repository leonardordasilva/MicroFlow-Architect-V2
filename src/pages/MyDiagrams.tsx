import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  loadUserDiagrams,
  deleteDiagram,
  renameDiagram,
  type DiagramRecord,
} from '@/services/diagramService';
import { useDiagramStore } from '@/store/diagramStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function MyDiagrams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<DiagramRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchDiagrams = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await loadUserDiagrams(user.id);
    setDiagrams(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDiagram(deleteId);
      setDiagrams((prev) => prev.filter((d) => d.id !== deleteId));
      toast({ title: 'Diagrama excluído' });
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await renameDiagram(id, editTitle.trim());
      setDiagrams((prev) =>
        prev.map((d) => (d.id === id ? { ...d, title: editTitle.trim() } : d))
      );
      toast({ title: 'Diagrama renomeado' });
    } catch {
      toast({ title: 'Erro ao renomear', variant: 'destructive' });
    }
    setEditingId(null);
  };

  const handleLoad = (diagram: DiagramRecord) => {
    const store = useDiagramStore.getState();
    store.loadDiagram(diagram.nodes, diagram.edges);
    store.setDiagramName(diagram.title);
    navigate('/');
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Meus Diagramas</h1>
          </div>
          <Button onClick={() => navigate('/')}>
            <Plus className="mr-2 h-4 w-4" /> Novo Diagrama
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-muted-foreground">Carregando...</div>
        ) : diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="mb-4 h-12 w-12 opacity-40" />
            <p>Nenhum diagrama salvo ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {diagrams.map((d) => (
              <div
                key={d.id}
                className="group relative flex cursor-pointer flex-col rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                onClick={() => handleLoad(d)}
              >
                <div className="mb-2 flex items-center justify-between">
                  {editingId === d.id ? (
                    <Input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(d.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleRename(d.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <h3 className="truncate font-semibold text-foreground">{d.title}</h3>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.nodes.length} nós · {d.edges.length} conexões
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atualizado em {format(new Date(d.updated_at), 'dd/MM/yyyy HH:mm')}
                </p>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(d.id);
                      setEditTitle(d.title);
                    }}
                    aria-label="Renomear"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(d.id);
                    }}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir diagrama</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
