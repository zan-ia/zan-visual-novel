# Task-Browser Test Scripts — Zan Visual Novel

**Formato:** Instruções executáveis para o agente `task-browser`  
**Pré-requisito:** `npm run dev` rodando (client :5173, dashboard :5174, api :3001, db seedado)  
**Ambiente:** VS Code Built-in Browser  

---

## ⚠️ Instruções para o task-browser

Para cada fluxo abaixo:
1. Abra a URL indicada
2. Siga os passos na ordem
3. Capture screenshot após cada ação crítica
4. Reporte: ✅ Passou / ❌ Falhou + evidência
5. Se um passo falhar, registre o erro e pule para o próximo fluxo independente

---

## Fluxo 1: Jogador Completo

### F1.1 — Registro de novo jogador

```
ABRIR: http://localhost:5173/login

PASSO 1: Verificar que a página mostra:
  - Título "Zan Visual Novel"
  - Campo Email
  - Campo Senha
  - Botão "Entrar"
  - Link "Não tem conta? Criar"

PASSO 2: Clicar em "Não tem conta? Criar"

PASSO 3: Verificar que agora mostra:
  - Campo adicional "Nome"
  - Botão "Criar Conta"
  - Link "Já tem conta? Entrar"

PASSO 4: Preencher:
  - Nome: "Jogador Teste"
  - Email: "jogador@teste.com"
  - Senha: "Teste123!"

PASSO 5: Clicar em "Criar Conta"

PASSO 6: Verificar que:
  - Foi redirecionado para /library
  - URL contém "/library"
  - AppBar no topo mostra:
    - Logo "Zan VN" à esquerda
    - Saldo de créditos (ex: "0 créditos")
    - Nome "Jogador Teste" clicável
    - Botão "Sair"

CAPTURAR SCREENSHOT
```

### F1.2 — Explorar a Biblioteca

```
ABRIR (se necessário): http://localhost:5173/library

PASSO 1: Verificar que a página mostra:
  - Título "Biblioteca"
  - Subtítulo "Descubra visual novels interativas com narrativa gerada por IA"
  - Campo de busca com ícone de lupa e placeholder "Buscar visual novels..."
  - Grid de cards de VN (se houver VNs publicadas)

PASSO 2: Se houver VNs, verificar cada card:
  - Imagem de capa visível
  - Título da VN visível
  - Sinopse (ou preview) visível

PASSO 3: Testar busca:
  - Digitar um termo no campo de busca
  - Verificar que os cards são filtrados em tempo real
  - Limpar o campo e verificar que todos voltam

PASSO 4: Se não houver VNs, verificar mensagem:
  - "Nenhuma visual novel encontrada." centralizada

CAPTURAR SCREENSHOT
```

### F1.3 — Jogar uma VN

```
PRÉ-CONDIÇÃO: Existe pelo menos 1 VN publicada na biblioteca

PASSO 1: Na biblioteca, clicar no primeiro card de VN

PASSO 2: Verificar que:
  - Navegou para URL contendo "/play/"
  - Spinner de carregamento aparece brevemente

PASSO 3: Após carregar, verificar a tela do player:
  - Barra superior (top bar) com:
    - Botão de voltar (seta ←)
    - Título da VN (fonte Playfair Display)
    - Botão de save rápido (ícone de disquete)
    - Botão de saves (ícone de pasta)
  - Área de conteúdo da cena (texto visível)
  - Se for cena IA, chip "IA" visível na top bar

PASSO 4: Verificar conteúdo da cena:
  - Texto renderizado legível
  - Se houver diálogo, nome do speaker em destaque
  - Se houver narração, texto em estilo normal

PASSO 5: Se houver escolhas visíveis:
  - Painel de escolhas (ChoicePanel) com botões
  - Clicar em uma escolha
  - Verificar que a cena muda (conteúdo atualizado)

CAPTURAR SCREENSHOT
```

### F1.4 — Sistema de Saves

```
PRÉ-CONDIÇÃO: Dentro do player com uma VN carregada

PASSO 1: Quick Save:
  - Clicar no ícone de save (disquete) na top bar
  - Verificar toast: "Progresso salvo!" aparece e some

PASSO 2: Abrir drawer de saves:
  - Clicar no ícone de saves (pasta)
  - Verificar drawer abre do lado direito
  - Lista de slots visível (slot 1 deve mostrar "Auto Save")

PASSO 3: Salvar em outro slot:
  - Clicar em um slot vazio (ex: slot 2)
  - Verificar toast: "Salvo no slot 2!"
  - Drawer fecha

PASSO 4: Carregar um save:
  - Abrir drawer novamente
  - Clicar no slot 1 ("Auto Save")
  - Verificar toast: "Save carregado!"
  - Cena é restaurada, drawer fecha

CAPTURAR SCREENSHOT
```

### F1.5 — Perfil e Logout

```
PASSO 1: Navegar para o perfil:
  - Clicar no nome do usuário na AppBar
  - OU acessar http://localhost:5173/profile

PASSO 2: Verificar página de perfil:
  - Título "Meu Perfil"
  - Display name visível
  - Email visível
  - Saldo de créditos em destaque
  - Botão "Comprar Créditos"

PASSO 3: Logout:
  - Clicar em "Sair" na AppBar
  - Verificar que AppBar agora mostra "Entrar"
  - Dados do usuário não estão mais visíveis

CAPTURAR SCREENSHOT
```

---

## Fluxo 2: Criador Completo

### F2.1 — Login no Creator Studio

```
ABRIR: http://localhost:5174/login

PASSO 1: Verificar que a página mostra:
  - Título "Creator Studio"
  - Subtítulo "Acesse seu painel de criação"
  - Campo Email
  - Campo Senha
  - Botão "Entrar"
  - NOTA: NÃO deve ter opção de registro (apenas login)

PASSO 2: Fazer login:
  - Email: "criador@teste.com"
  - Senha: "Teste123!"
  - Clicar "Entrar"

PASSO 3: Verificar redirecionamento:
  - URL: http://localhost:5174/studio
  - Drawer lateral fixo à esquerda com:
    - Ícone e texto "Minhas VNs"
    - Ícone e texto "Analytics"
  - AppBar superior com "Creator Studio"
  - Nome do criador visível na AppBar

CAPTURAR SCREENSHOT
```

### F2.2 — Lista de Minhas VNs

```
PASSO 1: Verificar página /studio:
  - Título "Minhas Visual Novels"
  - Botão "Nova VN" (com ícone +) no canto superior direito

PASSO 2: Verificar cards de VN (se houver):
  - Cada card mostra:
    - Título da VN
    - Número de capítulos
    - Chip de status: "Publicado" (verde) ou "Rascunho" (cinza)
    - Botão "Editar"

PASSO 3: Se não houver VNs, verificar:
  - Mensagem: "Você ainda não criou nenhuma visual novel."

CAPTURAR SCREENSHOT
```

### F2.3 — Criar Nova VN

```
PASSO 1: Clicar no botão "Nova VN"
PASSO 2: Verificar navegação para /studio/new

PASSO 3: Verificar editor aberto com:
  - Tabs: Detalhes | Capítulos | Cenas | Preview
  - Tab "Detalhes" ativa por padrão
  - Campo "Título" vazio
  - Campo "Sinopse" vazio
  - Botão "Salvar"

PASSO 4: Preencher metadados:
  - Título: "Aventura de Teste"
  - Sinopse: "Uma história de teste para validação do sistema."

PASSO 5: Clicar em "Salvar"

PASSO 6: Verificar:
  - URL mudou de /studio/new para /studio/{uuid}
  - Toast "Visual Novel salva!" apareceu

CAPTURAR SCREENSHOT
```

### F2.4 — Gerenciar Capítulos

```
PRÉ-CONDIÇÃO: Editor aberto em /studio/{vnId}

PASSO 1: Clicar na tab "Capítulos"

PASSO 2: Verificar estado inicial:
  - Lista de capítulos (provavelmente vazia)
  - Botão/ícone para adicionar capítulo

PASSO 3: Adicionar capítulo:
  - Clicar no ícone "+" ou "Adicionar Capítulo"
  - Diálogo abre com campo "Título do Capítulo"
  - Digitar: "Capítulo 1 — O Início"
  - Confirmar

PASSO 4: Verificar:
  - Capítulo aparece na lista
  - Toast "Capítulo adicionado!"
  - Capítulo fica selecionado

PASSO 5: Adicionar segundo capítulo:
  - Repetir passo 3 com "Capítulo 2 — A Jornada"
  - Verificar ambos na lista

PASSO 6: Deletar capítulo:
  - Clicar no ícone de lixeira no segundo capítulo
  - Verificar que foi removido da lista

CAPTURAR SCREENSHOT
```

### F2.5 — Gerenciar Cenas

```
PRÉ-CONDIÇÃO: Capítulo 1 selecionado, tab "Cenas" ativa

PASSO 1: Verificar estado inicial:
  - Lista de cenas (provavelmente vazia)
  - Botão para adicionar cena

PASSO 2: Adicionar cena:
  - Clicar para adicionar cena
  - Verificar nova cena "Cena 1" na lista
  - Cena fica selecionada

PASSO 3: Editar conteúdo da cena:
  - Selecionar tipo de bloco: "Narração"
  - Digitar texto: "Era uma vez em um reino distante..."
  - Adicionar bloco à cena
  - Verificar bloco aparece na lista de conteúdo

PASSO 4: Adicionar bloco de diálogo:
  - Selecionar tipo: "Diálogo"
  - Preencher speaker: "Herói"
  - Digitar texto: "Preciso encontrar o artefato perdido!"
  - Adicionar bloco
  - Verificar ambos os blocos na cena

PASSO 5: Adicionar escolha:
  - Na seção de escolhas, digitar texto: "Entrar na caverna escura"
  - Definir cena alvo: "sc-000002" (ou ID da próxima cena)
  - Adicionar escolha
  - Verificar escolha na lista

CAPTURAR SCREENSHOT
```

### F2.6 — Preview e Publicação

```
PASSO 1: Clicar na tab "Preview"
PASSO 2: Verificar preview da VN (pode ser preview simples ou embed do player)

PASSO 3: Voltar para tab "Detalhes"

PASSO 4: Publicar VN:
  - Clicar no botão "Publicar"
  - Verificar toast: "Visual Novel publicada! 🎉"

PASSO 5: Verificar status:
  - Voltar para /studio
  - Card da VN agora mostra chip verde "Publicado"

CAPTURAR SCREENSHOT
```

### F2.7 — Analytics

```
PASSO 1: No drawer lateral, clicar em "Analytics"
PASSO 2: Verificar navegação para /analytics

PASSO 3: Verificar página:
  - Título "Analytics"
  - Card "Resumo" com placeholder:
    "Métricas de consumo e créditos serão exibidas aqui."

PASSO 4: Voltar para Minhas VNs clicando no drawer

CAPTURAR SCREENSHOT
```

---

## Fluxo 3: Créditos

### F3.1 — Verificar e comprar créditos (Client)

```
PRÉ-CONDIÇÃO: Jogador autenticado no client (:5173)

PASSO 1: Navegar para /profile
PASSO 2: Anotar saldo atual de créditos

PASSO 3: Clicar em "Comprar Créditos"
  - NOTA: Este botão pode redirecionar para página de pacotes
  - Verificar se página de pacotes é exibida

PASSO 4: Se página de pacotes disponível:
  - Verificar lista de pacotes (ex: "Pacote Inicial — 100 créditos")
  - Clicar em comprar

CAPTURAR SCREENSHOT
```

---

## Fluxo 4: API Health e Validação

### F4.1 — Health Check da API

```
ABRIR: http://localhost:3001/api/health

VERIFICAR:
  - Resposta JSON: {"status":"ok","timestamp":"..."}
  - Status code: 200
  - Content-Type: application/json

CAPTURAR SCREENSHOT
```

---

## Fluxo 5: Testes de Layout e Visual

### F5.1 — Análise de Layout — Client

```
ABRIR: http://localhost:5173/library

USAR SKILL: browser-layout-analysis

VERIFICAR:
  - AppBar com position="sticky" e backdrop-filter
  - Container principal com max-width
  - Grid system responsivo
  - Tipografia consistente (Playfair Display nos títulos)

CAPTURAR SCREENSHOT
```

### F5.2 — Análise de Layout — Dashboard

```
ABRIR: http://localhost:5174/studio

USAR SKILL: browser-layout-analysis

VERIFICAR:
  - Drawer fixo com 240px de largura
  - AppBar com z-index correto (sobre drawer)
  - Tabs do editor com 4 opções
  - Estrutura de cards consistente

CAPTURAR SCREENSHOT
```

### F5.3 — Responsividade Básica

```
ABRIR: http://localhost:5173/library

TESTAR:
  - Redimensionar viewport para ~375px (mobile)
  - Verificar cards em coluna única (xs=12)
  - Redimensionar para ~768px (tablet)
  - Verificar cards em 2 colunas (sm=6)
  - Redimensionar para ~1024px (desktop)
  - Verificar cards em 3-4 colunas

CAPTURAR SCREENSHOT de cada breakpoint
```

---

## Fluxo 6: Estados de Erro e Borda

### F6.1 — VN inexistente no Player

```
ABRIR: http://localhost:5173/play/uuid-que-nao-existe

VERIFICAR:
  - Alert de erro visível: "Não foi possível carregar esta visual novel."
  - Botão "Voltar à Biblioteca" funcional

CAPTURAR SCREENSHOT
```

### F6.2 — Login com credenciais inválidas (Client)

```
ABRIR: http://localhost:5173/login

PASSO 1: Preencher:
  - Email: "invalido@nuncavai.existir"
  - Senha: "errada"

PASSO 2: Clicar "Entrar"

VERIFICAR:
  - Mensagem de erro em vermelho visível
  - Permanece na página /login
  - Campos ainda preenchidos (ou limpos)

CAPTURAR SCREENSHOT
```

### F6.3 — Login com credenciais inválidas (Dashboard)

```
ABRIR: http://localhost:5174/login

PASSO 1: Preencher credenciais inválidas
PASSO 2: Clicar "Entrar"

VERIFICAR:
  - Mensagem de erro em vermelho
  - Permanece na página /login

CAPTURAR SCREENSHOT
```

---

## Resumo de Execução

| Fluxo | Descrição | Casos | Status |
|-------|-----------|-------|--------|
| F1 | Jogador Completo | TC-AUTH-001..004, TC-CL-001..013 | ⬜ |
| F2 | Criador Completo | TC-DS-001..013 | ⬜ |
| F3 | Créditos | TC-API-004 | ⬜ |
| F4 | API Health | TC-API-001 | ⬜ |
| F5 | Layout e Visual | TC-LAY-001..010 | ⬜ |
| F6 | Erros e Borda | TC-AUTH-003, TC-CL-011, TC-DS-001 | ⬜ |

---

## Observações para o task-browser

1. **CORS e Autenticação:** Os apps se comunicam com a API em `localhost:3001`. Se houver erros de CORS, verificar se a API está rodando.
2. **Dados Dinâmicos:** Se a biblioteca estiver vazia, execute primeiro o Fluxo 2 (Criador) para publicar uma VN.
3. **Timing:** Aguarde APIs responderem antes de prosseguir (spinners desaparecem, toasts aparecem).
4. **LocalStorage:** Tokens JWT são persistidos em localStorage. Se testes falharem por auth, limpe localStorage e refaça o login.
5. **Ordem de Execução Recomendada:** F4 → F2 → F1 → F3 → F6 → F5
   - F4 primeiro para validar API
   - F2 antes de F1 para garantir VNs publicadas
   - F6 e F5 por último (testes de borda e visuais)
