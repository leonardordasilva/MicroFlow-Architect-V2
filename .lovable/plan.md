## Plano — Teste E2E Completo com Browser Automation

### Passo 1: Ativar auto-confirm de email

Usar a ferramenta `configure_auth` para ativar auto-confirm em signups, permitindo criar uma conta de teste sem verificação de email. Ao final de todos os testes desativar o auto-confirm

### Passo 2: Teste E2E via browser automation

Sequência completa cobrindo todas as funcionalidades:

1. **Signup** — Navegar à app, criar conta com email/senha de teste
2. **Login** — Fazer login com as credenciais criadas
3. **Adicionar nós** — Adicionar Service, Database (Oracle), Queue (Kafka), External (REST) via toolbar
4. **Renomear diagrama** — Alterar nome no campo de input da toolbar
5. **Conectar nós** — Criar edges entre os nós arrastando conexões
6. **Auto Layout** — Aplicar layout ELK (LR) e verificar que os nós foram reposicionados
7. **Dark Mode** — Alternar tema escuro/claro
8. **Salvar na nuvem** — Clicar no botão Save e verificar toast de sucesso
9. **Navegar a Meus Diagramas** — Verificar que o diagrama salvo aparece na lista
10. **Carregar diagrama salvo** — Clicar no diagrama e verificar que volta ao canvas com os nós
11. **Exportar JSON** — Verificar que o botão de export funciona
12. **Node Properties Panel** — Clicar num nó e verificar que o painel de propriedades abre
13. **Undo/Redo** — Testar desfazer/refazer após uma ação
14. **Limpar canvas** — Usar "Limpar Diagrama" e confirmar no dialog
15. **Logout** — Clicar em Sair e verificar que volta à tela de login

### Restrição

- Funcionalidades que dependem de IA (Gerar com IA, Analisar Arquitetura) serão testadas apenas até a abertura do modal, sem submeter (para evitar consumo de créditos)
- Export PNG/SVG serão verificados apenas pela abertura do dropdown (dependem de DOM canvas)
- Context menu (spawn from node) será testado com right-click em Service node