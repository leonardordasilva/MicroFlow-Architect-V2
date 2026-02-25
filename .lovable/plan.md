

## Arestas Manipulaveis com Pontos de Controle Arrastáveis

### Objetivo
Permitir que o usuario arraste segmentos das linhas de conexao para reposiciona-los horizontal e verticalmente, adicionando pontos de controle intermediarios nas arestas.

### Abordagem
Criar um componente de aresta customizado (`EditableEdge`) que renderiza uma linha com pontos de controle (control points) arrastaveis. Os pontos de controle sao armazenados no `data` de cada aresta, e o usuario pode arrastar esses pontos para alterar o caminho da linha.

### Arquivos a criar/modificar

**1. Criar `src/components/edges/EditableEdge.tsx`**
- Componente de aresta customizado que recebe `EdgeProps`
- Renderiza um path SVG passando pelos pontos de controle armazenados em `edge.data.controlPoints`
- Renderiza circulos SVG nos pontos de controle que podem ser arrastados (onMouseDown + onMouseMove + onMouseUp)
- Ao mover um ponto de controle, atualiza `edge.data.controlPoints` via `setEdges`
- Adiciona um ponto de controle ao clicar duplo no segmento da aresta
- Remove um ponto de controle ao clicar duplo nele
- Usa `getSmoothStepPath` entre pontos consecutivos ou constroi um path linear segmentado
- Preserva label, animacao e markers existentes usando `BaseEdge`

**2. Modificar `src/components/DiagramCanvas.tsx`**
- Importar e registrar `EditableEdge` no objeto `edgeTypes`
- Passar `edgeTypes` ao componente `ReactFlow`

**3. Modificar `src/hooks/useDiagram.ts`**
- Alterar `defaultEdgeOptions` e as criações de arestas para usar `type: 'editable'` ao inves de `'smoothstep'`
- Inicializar `data: { controlPoints: [] }` em cada aresta criada

**4. Atualizar `src/types/diagram.ts`**
- Adicionar tipo `ControlPoint` (`{ x: number; y: number }`)
- Estender `DiagramEdge` para incluir `data?: { controlPoints?: ControlPoint[] }`

### Detalhes tecnicos do componente EditableEdge

O componente:
1. Recebe as props padrao de `EdgeProps` (`sourceX`, `sourceY`, `targetX`, `targetY`, etc.)
2. Constroi uma lista de pontos: `[source, ...controlPoints, target]`
3. Gera um path SVG com segmentos retos ou curvos entre cada par de pontos
4. Para cada control point, renderiza um circulo (`<circle>`) com `cursor: grab` que responde a drag events
5. O drag usa `onPointerDown` no circulo, seguido de `onPointerMove`/`onPointerUp` no `document` para capturar o movimento global
6. Ao soltar, chama `setEdges` (acessado via `useReactFlow().setEdges`) para persistir a nova posicao do control point
7. Duplo clique em um segmento da aresta adiciona um novo control point no ponto medio desse segmento
8. Duplo clique em um control point existente o remove

### Comportamento esperado
- Arestas novas iniciam sem control points (linha reta smooth step)
- O usuario pode dar duplo clique na aresta para adicionar pontos de controle
- Arrastar os pontos reposiciona os segmentos horizontal/verticalmente
- Duplo clique em um ponto de controle o remove
- Undo/redo funciona normalmente pois os control points ficam no state das edges

