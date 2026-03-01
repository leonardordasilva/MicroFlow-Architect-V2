### 🔷 MicroFlow Architect

> **Editor visual de diagramas de arquitetura de microsserviços**

🔗 **Repositório:** [github.com/leonardordasilva/MicroFlow-Architect](https://github.com/leonardordasilva/MicroFlow-Architect)

#### 📖 Descrição

O **MicroFlow Architect** é um editor visual interativo para criar diagramas de arquitetura de microsserviços diretamente no navegador. Ele permite modelar serviços, filas de mensageria (IBM MQ, Kafka, RabbitMQ), bancos de dados e sistemas externos, representando visualmente as conexões REST, SQL, gRPC e demais protocolos entre eles. Conta com geração automática de diagramas via **Inteligência Artificial**, onde o usuário descreve a arquitetura em linguagem natural e a IA gera o diagrama completo.

#### ✨ Funcionalidades Principais

- **Editor visual drag-and-drop** de nós e conexões usando React Flow
- **Geração de diagramas via IA:** descreva sua arquitetura em texto e o diagrama é criado automaticamente
- **Análise de arquitetura via IA:** revisão automática com pontos fortes, riscos e sugestões
- **4 tipos de nós:** Microserviço, Fila (Queue/MQ), Banco de Dados e Sistema Externo
- **Conexões inteligentes** com validação de regras e inferência de protocolo
- **Layout automático (Dagre + ELK):** organização automática em 4 direções
- **Undo/Redo completo** com histórico de até 50 estados (Ctrl+Z / Ctrl+Y)
- **Exportação para PNG, SVG, Mermaid e JSON**
- **Importação de JSON** com validação via Zod
- **Autenticação e persistência na nuvem**
- **Compartilhamento com colaboradores** via link ou e-mail
- **Colaboração em tempo real** via WebSocket
- **Dark/Light Mode** com persistência
- **Auto-save comprimido** com recuperação automática

#### 🛠️ Stack Técnica

| Tecnologia | Uso |
|---|---|
| **React 18** | Framework de UI |
| **TypeScript** | Tipagem estática |
| **@xyflow/react** | Motor de diagramas (nós, arestas, canvas interativo) |
| **Zustand + Zundo** | Gerenciamento de estado com undo/redo |
| **Dagre + ELK** | Algoritmos de layout automático de grafos |
| **Tailwind CSS** | Estilização (Dark Mode, responsivo) |
| **Zod** | Validação de schemas |
| **Lovable Cloud** | Backend (autenticação, banco de dados, Edge Functions) |
| **html-to-image** | Exportação para PNG/SVG |
| **Vite 5** | Build tool e dev server |
| **Vitest** | Testes unitários |

## Variáveis de Ambiente

### Cliente (Frontend)

Copie `.env.example` para `.env` e preencha os valores:

```
VITE_SUPABASE_URL="https://<project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_PROJECT_ID="<project-id>"
```

### Edge Functions (Backend)

As variáveis de ambiente das Edge Functions devem ser configuradas como **secrets** no painel do projeto (Lovable Cloud → Backend → Secrets). Consulte `supabase/functions/.env.example` para a lista completa:

- `LOVABLE_API_KEY` — Chave da API do gateway Lovable
- `ALLOWED_ORIGINS` — Origens permitidas para CORS
- `SUPABASE_URL` — URL do backend
- `SUPABASE_ANON_KEY` — Chave pública do backend
- `AI_RATE_LIMIT_PER_MINUTE` — Limite de requisições de IA por usuário por minuto (padrão: 10)

---
