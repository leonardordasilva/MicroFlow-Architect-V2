
# PRD-09 — Plano de Execução
## Segurança, Performance e Qualidade de Código

27 itens organizados em 5 categorias. Ordem de execução respeita dependências descritas no PRD.

---

## Fase 1: Segurança (Crítico)

### 1.1 SEC-01 — Proteção da API Key do Gemini
- Mover chamadas ao Gemini para Edge Functions (`generate-diagram`, `analyze-architecture`)
- Cliente passa a usar `supabase.functions.invoke()` em vez de chamar API diretamente
- Remover qualquer referência a `API_KEY`/`GEMINI_API_KEY`/`process.env` do código cliente
- **Dependência**: Deve ser feito PRIMEIRO (as Edge Functions serão reutilizadas por SEC-02 e SEC-05)

### 1.2 SEC-02 — Autorização na função saveSharedDiagram
- Criar/validar política RLS UPDATE na tabela `diagrams` restrita a `auth.uid() = owner_id`
- Validar que colaboradores autorizados (via `diagram_shares`) mantêm acesso de escrita
- Testar que usuário não-autorizado recebe erro ao tentar UPDATE

### 1.3 SEC-03 — Validação de JSON importado com Zod
- Já existe `ImportDiagramSchema` em `src/schemas/diagramSchema.ts`
- Verificar se `DiagramCanvas.tsx` usa o schema na importação
- Adicionar limite de 100 chars no campo `label`
- Garantir mensagens de erro descritivas ao usuário

### 1.4 SEC-04 — Content Security Policy no index.html
- Adicionar meta tag CSP com diretivas `default-src`, `script-src`, `connect-src`, `img-src`, `style-src`
- Domínios permitidos: Supabase, domínio da app
- Validar que a aplicação funciona sem erros de violação CSP

### 1.5 SEC-05 — Row Level Security na função loadDiagramById
- Criar/validar política RLS SELECT na tabela `diagrams`
- Permitir leitura onde `owner_id = auth.uid()` OU existe `share_token` válido
- O código cliente não precisa mudar — proteção na camada de banco

---

## Fase 2: Performance (Alto)

### 2.1 PERF-01 — Substituir useMemo instável de storeActions
- Substituir `useMemo(() => useDiagramStore.getState(), [])` por seletores com `useShallow`
- Mover `getTemporalActions` para dentro de `useCallback` (elimina chamada no escopo de módulo)
- **Nota**: Relacionado com QUA-03

### 2.2 PERF-02 — Otimizar broadcastChanges com comparação de conteúdo
- Adicionar `useRef` para armazenar último estado serializado enviado
- Comparar antes de disparar broadcast
- Reduzir broadcasts durante drag de nós

### 2.3 PERF-03 — Substituir JSON.stringify por updated_at no realtime
- Em `useRealtimeCollab.ts`, comparar `updated_at` do payload antes de processar
- Remover comparação por `JSON.stringify` de arrays inteiros
- Fallback: comparação por contagem de elementos

### 2.4 PERF-04 — Lazy load do elkjs
- Converter import estático para `await import('elkjs/lib/elk.bundled.js')` em `layoutService.ts`
- **Dependência**: Fazer antes de PERF-06

### 2.5 PERF-05 — Corrigir closure stale em handleKeyDown
- Usar `useRef` para armazenar referência atualizada de `handleSaveToCloud`
- Eliminar closure stale sem criar dependências circulares

### 2.6 PERF-06 — Compressão do localStorage no useAutoSave
- Comprimir JSON com `CompressionStream` antes de salvar
- Descomprimir com `DecompressionStream` na leitura
- Toast informativo quando localStorage próximo do limite
- **Dependência**: Após PERF-04

---

## Fase 3: Qualidade de Código (Médio)

### 3.1 QUA-01 — Remover campos deprecated de types.ts
- Remover `hasDatabase` e `databaseCount` se existirem
- Verificar que nenhum componente os referencia

### 3.2 QUA-02 — Tipagem explícita em diagramService.ts
- Substituir `as any` e `as unknown` por tipos do Supabase gerados
- Criar interfaces intermediárias onde necessário
- **Dependência**: Fazer antes de QUA-04

### 3.3 QUA-03 — Remover antipadrão getTemporalActions
- Mover obtenção de ações temporais para dentro de `useCallback` ou custom hook `useDiagramHistory()`
- **Nota**: Pode ser feito junto com PERF-01

### 3.4 QUA-04 — Extrair lógica de save para useSaveDiagram
- Criar `src/hooks/useSaveDiagram.ts`
- Encapsular lógica de decisão de persistência
- Expor `{ save, saving }` 
- **Dependência**: Após QUA-02

### 3.5 QUA-05 — Atualizar package.json
- `"name": "microflow-architect"`
- `"version": "1.0.0"`

### 3.6 QUA-06 — Limpeza do index.html
- Remover comentários TODO
- Atualizar author para "MicroFlow Architect"
- Corrigir meta tags OG e Twitter Card

---

## Fase 4: UX e Acessibilidade (Baixo)

### 4.1 UX-01 — Loading state com Loader2 animado
- Substituir texto "Carregando..." por `Loader2` com `animate-spin` + texto
- Centralizar verticalmente

### 4.2 UX-02 — revokeObjectURL consistente nos exports
- Padronizar handlers de exportação (PNG, SVG, JSON)
- Adicionar comentários onde revogação não se aplica

### 4.3 UX-03 — Fechar context menu em Escape/scroll/blur
- Adicionar listeners para Escape, scroll do canvas e `window.blur`

### 4.4 UX-04 — Persistir Dark Mode no localStorage
- Chave: `microflow_theme`
- Inicializar: localStorage → preferência do SO → light
- Salvar a cada toggle

### 4.5 UX-05 — Try/catch no autoLayoutELK
- Envolver chamada em try/catch
- Toast destructive em caso de erro
- Não deixar UI em estado de loading

### 4.6 A11Y-01 — role="application" no canvas
- Adicionar `role="application"` e `aria-label="Editor de diagramas de arquitetura"` ao div raiz

### 4.7 A11Y-02 — aria-label em todos os botões de ícone
- Auditar Toolbar e header
- Garantir 100% dos botões icon-only com aria-label em PT-BR

---

## Fase 5: Infraestrutura (Baixo)

### 5.1 INF-01 — Criar .env.example
- Listar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- Comentários explicativos por variável

### 5.2 INF-03 — Testes unitários para módulos críticos
- `connectionRules.test.ts` — todos os casos de `canConnect`
- `geminiService.test.ts` — `extractJSON` com JSON válido, embutido e inválido
- `diagramStore.test.ts` — `addNode`, `deleteSelected`, undo/redo
- `diagramService.test.ts` — mocks do Supabase client
- Meta: ≥80% cobertura nos arquivos listados

### 5.3 INF-04 — Avaliar lovable-tagger
- Se não essencial: remover de devDependencies e vite.config.ts
- Se mantido: documentar com comentário explicativo
- **Nota**: Como este é um projeto Lovable, o tagger é necessário — adicionar comentário

---

## Ordem de Execução Recomendada

```
SEC-01 → SEC-02 + SEC-05 (paralelo) → SEC-03 + SEC-04 (paralelo)
PERF-01/QUA-03 (juntos) → PERF-02 + PERF-03 + PERF-05 (paralelo) → PERF-04 → PERF-06
QUA-02 → QUA-04 → QUA-01 + QUA-05 + QUA-06 (paralelo)
UX-01..UX-05 + A11Y-01 + A11Y-02 (independentes, paralelo)
INF-01 + INF-03 + INF-04 (independentes, paralelo)
```

## Itens Excluídos (conforme PRD)
- QUA-07 — Atualização da lista de modelos de fallback do Gemini
- INF-02 — Configuração de pipeline de CI/CD
