

# PRD-12 — Plano de Implementacao

## Fase 1 — Consolidacao de tipos (R4-QUA-01 + A04-residual)

### 1.1 Adicionar tipos de persistencia em `src/types/diagram.ts`
Adicionar imports de `z`, `NodeSchema` e `EdgeSchema`, e declarar `PersistedNode` e `PersistedEdge` como tipos inferidos do Zod, logo apos os imports existentes.

### 1.2 Substituir double casts em `src/services/diagramService.ts`
Na funcao `toDiagramRecord` (linhas 37-38), trocar `as unknown as DiagramNode[]` e `as unknown as DiagramEdge[]` por casts simples `as DiagramNode[]` e `as DiagramEdge[]` com comentario explicativo sobre a fronteira persistencia-runtime.

### 1.3 Verificacao
Busca global para confirmar que nao resta nenhum `as unknown as DiagramNode[]` ou `as unknown as DiagramEdge[]`.

---

## Fase 2 — Documentacao de seguranca (R4-SEC-01)

### 2.1 JSDoc em `saveSharedDiagram`
Adicionar o bloco de comentario JSDoc de contrato de seguranca imediatamente antes da declaracao de `saveSharedDiagram` em `src/services/diagramService.ts` (antes da linha 135).

### 2.2 Teste de contrato de seguranca
Em `src/services/diagramService.test.ts`:
- Adicionar `saveSharedDiagram` aos imports (linha 48).
- Adicionar o bloco `describe('saveSharedDiagram')` apos os testes de `saveDiagram`, verificando que `eq` nunca e chamado com `'owner_id'`.

---

## Fase 3 — Qualidade e performance (R4-QUA-02 + R4-PERF-01)

### 3.1 Tipo `UndoSlice` em `src/store/diagramStore.ts`
Adicionar a declaracao `type UndoSlice = Pick<DiagramStore, 'nodes' | 'edges' | 'diagramName'>` antes da chamada `create`, e adicionar comentario de justificativa no cast `as unknown as DiagramStore` dentro de `partialize`.

### 3.2 Conversao base64 em chunks no `useAutoSave.ts`
Substituir o loop char-a-char (linhas 39-42) pela versao com `subarray` em blocos de 8192 bytes, usando `String.fromCharCode.apply`.

---

## Fase 4 — Infraestrutura (R4-INF-01)

O indice `idx_ai_requests_user_created` ja foi criado na migration do PRD-11 (`20260301164728`). A migration do PRD-12 precisa apenas ajustar o indice para usar `created_at DESC` (conforme especificado) e adicionar o comentario de retencao completo. Sera criada uma nova migration via ferramenta de banco de dados.

---

## Verificacao final

Executar `npm run build`, `npm run lint` e `npm test` para confirmar que tudo passa sem erros.

### Resumo de arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/types/diagram.ts` | Adicionar `PersistedNode` e `PersistedEdge` |
| `src/services/diagramService.ts` | Remover double casts, adicionar JSDoc |
| `src/services/diagramService.test.ts` | Adicionar teste `saveSharedDiagram` |
| `src/store/diagramStore.ts` | Adicionar `UndoSlice`, comentario no cast |
| `src/hooks/useAutoSave.ts` | Base64 em chunks de 8192 |
| Nova migration SQL | Indice DESC + comentario de retencao |

