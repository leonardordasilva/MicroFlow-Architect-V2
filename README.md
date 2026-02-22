### 🔷 MicroFlow Architect

> **Gerador de Diagramas de Comunicação de Microserviços, Filas e Banco de Dados**

🔗 **Repositório:** [github.com/leonardordasilva/MicroFlow-Architect](https://github.com/leonardordasilva/MicroFlow-Architect)

#### 📖 Descrição

O **MicroFlow Architect** é um editor visual interativo para criar diagramas de arquitetura de microserviços diretamente no navegador. Ele permite modelar serviços, filas de mensageria (IBM MQ), bancos de dados e sistemas externos, representando visualmente as conexões REST, SQL e MQ entre eles. Conta com geração automática de diagramas via **Inteligência Artificial (Google Gemini)**, onde o usuário descreve a arquitetura em linguagem natural e a IA gera o diagrama completo.

#### ✨ Funcionalidades Principais

- **Editor visual drag-and-drop** de nós e conexões usando React Flow
- **Geração de diagramas via IA (Gemini):** descreva sua arquitetura em texto e o diagrama é criado automaticamente
- **4 tipos de nós:** Microserviço, Fila (Queue/MQ), Banco de Dados e Sistema Externo
- **Conexões inteligentes** com estilização automática por tipo (REST em azul, SQL em laranja, MQ em verde animado)
- **Bancos de dados e serviços internos (nested):** possibilidade de adicionar DBs e serviços dentro de um nó de microserviço
- **Auto-layout (Dagre):** organização automática do diagrama em 4 direções (Horizontal, Vertical e invertidos)
- **Undo/Redo completo** com histórico de até 50 estados (Ctrl+Z / Ctrl+Y)
- **Exportação para PNG** (via html-to-image) e **JSON** (backup/restore completo)
- **Importação de JSON** para restaurar diagramas salvos
- **Nomeação de diagramas** com título exibido como overlay no canvas
- **Dark Mode** nativo com Tailwind CSS
- **Fallback inteligente de modelos Gemini** (tenta múltiplos modelos em cascata)
#### 🛠️ Stack Técnica

| Tecnologia | Uso |
|---|---|
| **React 18** | Framework de UI |
| **TypeScript** | Tipagem estática |
| **React Flow 11** | Motor de diagramas (nós, arestas, canvas interativo) |
| **Google Gemini AI** (`@google/genai`) | Geração e análise de diagramas via IA |
| **Dagre** | Algoritmo de layout automático de grafos |
| **Tailwind CSS** | Estilização (Dark Mode, responsivo) |
| **html-to-image** | Exportação do diagrama para PNG |
| **react-markdown** | Renderização de markdown (análise de arquitetura) |
| **Lucide React** | Ícones |
| **Vite 5** | Build tool e dev server |

#### 🏗️ Arquitetura do Código

    MicroFlow-Architect/
    ├── index.html
    ├── index.tsx
    ├── App.tsx
    ├── types.ts
    ├── constants.ts
    ├── components/
    │   ├── CustomNode.tsx
    │   ├── CustomEdge.tsx
    │   ├── QuantityModal.tsx
    │   ├── ConfirmationModal.tsx
    │   ├── NameModal.tsx
    │   ├── TextToDiagramModal.tsx
    │   └── ImportModal.tsx
    ├── services/
    │   ├── geminiService.ts
    │   └── layoutService.ts
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
#### 🧠 Destaques Técnicos

- **Sistema de fallback multi-modelo**: caso o modelo primário do Gemini esteja com rate limit (429) ou indisponível (503/404), o sistema tenta automaticamente o próximo modelo da lista, com delay inteligente entre tentativas.
- **Prompt Engineering avançado**: o prompt enviado à IA contém regras estritas para internalização de bancos de dados, duplicação de nós para clareza visual e posicionamento automático (esquerda para direita).
- **Extração robusta de JSON**: parser customizado que usa contagem de chaves/colchetes com awareness de strings para extrair JSON de respostas mistas da IA.
- **Gerenciamento de estado com histórico**: sistema de undo/redo baseado em snapshots imutáveis do estado de nós e arestas, com limite de memória.

---
