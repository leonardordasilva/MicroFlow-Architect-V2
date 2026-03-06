

## Plano de Execução — PRD 15

Este PRD contém 4 melhorias técnicas (sem mudanças visuais) para elevar o score de saúde do projeto. Também há **5 erros de build pré-existentes** nas Edge Functions que precisam ser corrigidos.

---

### Correção Prévia: Erros de Build nas Edge Functions

Os erros de TypeScript nas Edge Functions (`analyze-diagram`, `generate-diagram`, `diagram-crypto`) são causados por incompatibilidades de tipo do Supabase client no Deno. Correções:

- **`analyze-diagram/index.ts` e `generate-diagram/index.ts`**: Tipar o `checkRateLimit` com `supabaseClient: any` em vez de `ReturnType<typeof createClient>` para resolver os erros TS2345/TS2769.
- **`diagram-crypto/index.ts`**: Fazer cast do `keyBytes` para `BufferSource` via `.buffer` na chamada `importKey`.

---

### Melhoria 1 — ELK Web Worker (+3 pts)

**Arquivos:** criar `src/workers/elkWorker.ts`, modificar `src/services/layoutService.ts`, modificar `vite.config.ts`

1. **Criar `src/workers/elkWorker.ts`**: Worker que importa `elkjs/lib/elk.bundled.js`, instancia singleton ELK, escuta mensagens `{ id, graph }`, executa `elk.layout(graph)` e posta resultado/erro de volta.

2. **Modificar `src/services/layoutService.ts`**: Substituir o `elkInstance` e dynamic import por um Worker singleton. Usar `new Worker(new URL('../workers/elkWorker.ts', import.meta.url), { type: 'module' })`. Manter a mesma assinatura `getELKLayoutedElements()`. Correlacionar request/response por `id`. Fallback silencioso em caso de erro.

3. **Modificar `vite.config.ts`**: Adicionar `worker: { format: 'es' }`.

---

### Melhoria 2 — Validação Zod nas Edge Functions (+2 pts)

**Arquivos:** `supabase/functions/generate-diagram/index.ts`, `supabase/functions/analyze-diagram/index.ts`

1. **`generate-diagram`**: Adicionar `import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"`, definir schemas `AiNodeSchema`, `AiEdgeSchema`, `AiDiagramOutputSchema`. Após `JSON.parse(content)`, validar com `safeParse`. Retornar 422 se inválido.

2. **`analyze-diagram`**: Adicionar import Zod, validar que o output da IA é string não-vazia antes de retornar. Retornar 422 se inválido.

---

### Melhoria 3 — React.memo nos Painéis (+2 pts)

**Arquivos:** 5 componentes

Para cada um, converter de `export default function X(...)` para `function X(...) { ... }` + `export default React.memo(X)`:

1. `src/components/NodePropertiesPanel.tsx`
2. `src/components/Toolbar.tsx`
3. `src/components/DiagramLegend.tsx`
4. `src/components/CollaboratorAvatars.tsx`
5. `src/components/StatusBar.tsx`

---

### Melhoria 4 — QueryClient + AutoSave Cleanup (+2 pts)

**Arquivos:** `src/App.tsx`, `src/hooks/useSaveDiagram.ts`

1. **`App.tsx`**: Substituir `new QueryClient()` por instância com `staleTime: 30_000`, `gcTime: 300_000`, `retry: 2`, `refetchOnWindowFocus: false`, mutations `retry: 0`.

2. **`useSaveDiagram.ts`**: Importar `clearAutoSave` de `useAutoSave` e chamá-lo após save bem-sucedido (dentro do `try`, após toast de sucesso).

