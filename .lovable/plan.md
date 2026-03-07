

## Corrigir Layout: Título Completo + Ícones Sem Sobreposição

### Problema
O título está com `truncate` (corta com "...") e `pr-28` reserva espaço fixo para os ícones, mas o título continua truncado. O usuário quer o título sempre completo.

### Solução
Mudar o layout do card para que o título ocupe toda a largura sem truncamento, e os ícones de ação fiquem em uma linha separada abaixo do conteúdo do card (ou no canto inferior direito).

**Arquivo: `src/pages/MyDiagrams.tsx`**

1. **Título**: Remover `truncate` e `pr-28` do container do título — deixar o título quebrar linha naturalmente
2. **Ícones**: Mover de `absolute right-2 top-2` para uma linha própria no final do card, alinhada à direita, visível apenas no hover. Usar `flex justify-end` em vez de posicionamento absoluto.

Layout resultante do card:
```text
┌─────────────────────────────┐
│ Novo Selic - Eventos        │
│ Temporários                 │
│ 7 nós · 6 conexões          │
│ Atualizado em 07/03/2026    │
│          🔗 📋 ✏️ 🗑️       │  ← linha de ações (hover only)
└─────────────────────────────┘
```

