
# Plano de Execucao — PRD v4.0 (MicroFlow Architect)

## Resumo

O PRD v4.0 contem **8 epicos** focados em robustez de dados, precisao semantica, performance e UX. Nenhuma funcionalidade existente sera removida. Toda UI permanece em PT-BR.

---

## Epicos e Ordem de Implementacao

### 1. Epico 1 — Validacao Zod no ImportJSONModal (CRITICA)

**Problema:** `ImportJSONModal.tsx` faz apenas `JSON.parse` e verifica presenca superficial de `nodes`/`edges`. JSON malformado pode corromper o estado.

**Acoes:**
- Criar `src/schemas/diagramSchema.ts` com schemas Zod para Node, Edge, Protocol e `ImportDiagramSchema`
- Atualizar `ImportJSONModal.tsx` para usar `ImportDiagramSchema.parse()` com erros Zod formatados em toast
- Criar `src/schemas/diagramSchema.test.ts` com casos: JSON valido, no sem id, type invalido, aresta sem source, nodes vazio, protocol desconhecido

---

### 2. Epico 2 — Inferencia database->service = TCP (CRITICA)

**Problema:** `protocolInference.ts` nao cobre pares como `database->service`, `external->database`, `queue->external`, caindo no fallback REST generico.

**Acoes:**
- Reescrever `protocolInference.ts` usando mapa completo 4x4 (16 pares) com lookup `PROTOCOL_MAP[source][target]`
- Atualizar `protocolInference.test.ts` com 6+ novos casos cobrindo todos os pares ausentes

---

### 3. Epico 8 — Seguranca: shareDiagram verifica propriedade (ALTA)

**Problema:** `shareDiagram` faz update apenas com `.eq('id', diagramId)` sem verificar `owner_id`, permitindo que qualquer usuario autenticado compartilhe diagramas alheios.

**Acoes:**
- Atualizar `shareDiagram` para receber `ownerId` como parametro e adicionar `.eq('owner_id', ownerId)` no select e update
- Atualizar chamadas em `MyDiagrams.tsx` e `DiagramCanvas.tsx` para passar `user.id`

---

### 4. Epico 3 — Paginacao em loadUserDiagrams (ALTA)

**Problema:** `loadUserDiagrams` faz `select('*')` sem limite, retornando todos os diagramas em uma requisicao.

**Acoes:**
- Atualizar `loadUserDiagrams` para aceitar `page` com `PAGE_SIZE = 12` e retornar `{ diagrams, hasMore }`
- Migrar `MyDiagrams.tsx` de `useQuery` para `useInfiniteQuery` com botao "Carregar mais"

---

### 5. Epico 4 — Refatoracao semantica de ExternalNode (ALTA)

**Problema:** `ExternalNode.tsx` usa `subType` para protocolo e tecnologia simultaneamente. O protocolo pertence a aresta, nao ao no.

**Acoes:**
- Adicionar campo `externalCategory` a `DiagramNodeData` em `types/diagram.ts`
- Atualizar `ExternalNode.tsx` para usar icones baseados em categoria (API, CDN, Auth, Payment, Storage, Analytics, Other) com fallback para `subType`
- Adicionar dropdown de `externalCategory` ao `NodePropertiesPanel.tsx` quando o no for `external`
- Atualizar prompt da Edge Function `generate-diagram` para incluir `externalCategory`

---

### 6. Epico 5 — DiagramLegend dinamica (MEDIA)

**Problema:** `DiagramLegend.tsx` renderiza sempre os 10 protocolos, independente de quais estao em uso.

**Acoes:**
- Atualizar `DiagramLegend` para receber `edges` como prop e filtrar protocolos em uso
- Ocultar legenda quando nenhum protocolo esta em uso; ocultar secao "Assincrono" se nao houver protocolos async
- Atualizar chamada em `DiagramCanvas.tsx` para passar `edges`

---

### 7. Epico 6 — ImportJSONModal com drag-and-drop (MEDIA)

**Problema:** O `<input type="file">` e rudimentar, sem feedback visual de drag-and-drop.

**Acoes:**
- Adicionar zona de drag-and-drop estilizada com estados visuais (idle, dragging)
- Validar extensao `.json` no drop com toast de erro para outros tipos
- Manter input oculto com click na zona para abrir seletor de arquivo

---

### 8. Epico 7 — Testes das novas funcionalidades (MEDIA)

**Problema:** Os epicos 1, 2 e 5 introduzem codigo testavel novo.

**Acoes:**
- Testes Zod em `diagramSchema.test.ts` (coberto no Epico 1)
- Testes de inferencia expandidos em `protocolInference.test.ts` (coberto no Epico 2)
- Garantir que `npm run test` passa com todos os novos testes

---

## Arquivos Afetados

| Arquivo | Acao |
|---|---|
| `src/schemas/diagramSchema.ts` | Criar |
| `src/schemas/diagramSchema.test.ts` | Criar |
| `src/components/ImportJSONModal.tsx` | Editar (Zod + drag-drop) |
| `src/utils/protocolInference.ts` | Editar (mapa 4x4) |
| `src/utils/protocolInference.test.ts` | Editar (novos casos) |
| `src/services/diagramService.ts` | Editar (paginacao + shareDiagram seguro) |
| `src/pages/MyDiagrams.tsx` | Editar (infiniteQuery + share com ownerId) |
| `src/components/DiagramCanvas.tsx` | Editar (legend prop + share com ownerId) |
| `src/types/diagram.ts` | Editar (externalCategory) |
| `src/components/nodes/ExternalNode.tsx` | Editar (category icons) |
| `src/components/NodePropertiesPanel.tsx` | Editar (category dropdown) |
| `src/components/DiagramLegend.tsx` | Editar (filtro dinamico) |
| `supabase/functions/generate-diagram/index.ts` | Editar (externalCategory no prompt) |

## Estimativa

8 epicos, ~13 arquivos afetados. Implementacao sequencial na ordem listada acima.
