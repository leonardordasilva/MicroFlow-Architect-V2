# PRD-11 — Refinamentos Pós-Auditoria Ciclo 3

**Projeto:** MicroFlow Architect  
**Documento:** PRD-11  
**Data:** 01/03/2026  
**Status:** Aprovado  
**Prioridade:** Média  
**Autor:** Auditoria Técnica Automatizada  
**Versão:** 1.0  

---

## 1. Contexto e Objetivo

Este documento registra os apontamentos identificados na terceira
rodada de auditoria técnica do repositório MicroFlow-Architect, 
realizada em 01/03/2026. As auditorias anteriores (PRD-09 e PRD-10)
resolveram 43 itens críticos e de alta prioridade relacionados à
segurança da API Key, validação de entradas, Row Level Security,
Content-Security-Policy, auto-save com compressão, rate limiting
e cobertura de testes. Os 9 pontos remanescentes são de criticidade
média a alta, sem risco crítico imediato para produção, mas com
impacto direto em estabilidade, manutenibilidade e performance.

O objetivo deste PRD é detalhar cada apontamento com contexto,
critério de aceite mensurável e ordem de execução recomendada,
de forma que o desenvolvedor (ou agente Lovable) possa implementar
as correções de modo incremental e rastreável.

---

## 2. Resumo dos Apontamentos

| ID      | Título resumido                                    | Criticidade | Categoria       |
|---------|----------------------------------------------------|-------------|-----------------|
| A01     | loadUserDiagrams sem tratamento de erro por item   | Alta        | Segurança/Bug   |
| A02     | Tabela ai_requests sem política de limpeza         | Alta        | Segurança/Infra |
| A03     | any residual em layoutService (find callback)      | Média       | Qualidade       |
| A04     | Casts as DiagramNode[]/DiagramEdge[] pós safeParse | Média       | Qualidade       |
| A05     | Double cast as unknown as DiagramNodeData          | Média       | Qualidade       |
| A06     | Concatenação O(n²) em compressString               | Média       | Performance     |
| A07     | Teste happy-path ausente em loadDiagramById        | Média       | Testes          |
| A08     | Bloco if vazio morto em useRealtimeCollab          | Baixa       | Qualidade       |
| A09     | Constante TRACKED_KEYS não utilizada               | Baixa       | Qualidade       |

---

## 3. Detalhamento dos Apontamentos

### 3.1 A01 — loadUserDiagrams sem tratamento de erro por item

**Arquivo afetado:** `src/services/diagramService.ts`  
**Função afetada:** `loadUserDiagrams`

**Situação atual:**
A função `loadUserDiagrams` busca a lista de diagramas do usuário
autenticado e, para cada linha retornada pelo Supabase, chama
`toDiagramRecord(row)`. A função `toDiagramRecord` realiza validação
Zod e lança um erro em português caso os dados estejam corrompidos.
Se qualquer diagrama do usuário tiver dados inválidos, o erro
propagado vai estourar o `Promise.all` implícito do mapeamento,
resultando em tela em branco ou crash na página `/my-diagrams`, sem
capacidade de recuperação para os outros diagramas válidos.

**Impacto:** Qualquer diagrama persistido com schema antigo ou com
dados parcialmente corrompidos derruba toda a listagem do usuário.

**Correção esperada:**
Envolver a chamada a `toDiagramRecord` em um `try/catch` por item,
descartando silenciosamente (ou logando) os diagramas que falharem
na validação e retornando apenas os válidos. Alternativamente,
usar `flatMap` com lógica de recuperação.

Exemplo de implementação:

```typescript
const diagrams = (data ?? []).flatMap((row) => {
  try {
    return [toDiagramRecord(row)];
  } catch (err) {
    console.warn(`Diagrama ${row.id} ignorado por dados corrompidos:`, err);
    return [];
  }
});
