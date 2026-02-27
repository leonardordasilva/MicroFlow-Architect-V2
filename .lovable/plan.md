
## Seletor de Tipo de Banco ao Adicionar Banco Interno

### Objetivo
Ao adicionar um banco de dados interno no painel de propriedades de um microservico, o usuario podera escolher o tipo do banco (Oracle, Redis, etc.) antes de adicionar. Cada banco interno tera sua cor correspondente no node.

### Mudanca no Modelo de Dados

Atualmente `internalDatabases` e `string[]`. Sera alterado para um array de objetos:

```text
interface InternalDatabase {
  label: string;
  dbType: string;  // "Oracle" | "Redis" | etc.
}
```

Compatibilidade com dados existentes: strings puras serao tratadas como `{ label: string, dbType: "Oracle" }` (padrao atual).

### Arquivos a Modificar

#### 1. `src/types/diagram.ts`
- Criar interface `InternalDatabase` com `label` e `dbType`
- Alterar `internalDatabases` de `string[]` para `InternalDatabase[]`
- Exportar a lista de tipos de banco disponiveis (`DATABASE_TYPES`)

#### 2. `src/constants/databaseColors.ts`
- Adicionar array `DATABASE_TYPES` com os tipos disponiveis: `['Oracle', 'Redis']`
- Manter o mapa de cores existente

#### 3. `src/components/NodePropertiesPanel.tsx`
- Alterar o estado `internalDbs` para usar `InternalDatabase[]`
- No botao "+" de adicionar banco, abrir um Select inline para o usuario escolher o tipo (Oracle/Redis) e entao criar o item com o tipo selecionado
- Cada linha de banco interno exibira: um Select de tipo + Input de nome + botao remover
- Ao mudar o tipo, atualizar o `dbType` do banco correspondente

#### 4. `src/components/nodes/ServiceNode.tsx`
- Adaptar a renderizacao para ler `db.label` e `db.dbType` em vez de string pura
- Usar `getDbColor(db.dbType)` para cor do icone (em vez de hardcoded 'Oracle')
- Manter compatibilidade: se o item for string, tratar como `{ label: str, dbType: 'Oracle' }`

#### 5. `src/schemas/diagramSchema.ts`
- Atualizar `InternalItemSchema` para aceitar o novo formato `{ label, dbType }` alem dos formatos existentes

### Detalhes da UI no Painel de Propriedades

Cada banco interno tera uma linha com 3 elementos:
```text
[Select tipo: Oracle/Redis] [Input nome] [X remover]
```

O botao "+" adicionara um novo banco com tipo Oracle por padrao e nome auto-gerado.

### Compatibilidade com Dados Existentes
- Uma funcao helper `normalizeInternalDb(item)` convertera strings para objetos `{ label, dbType: 'Oracle' }`
- Aplicada na leitura dos dados tanto no painel quanto no node
