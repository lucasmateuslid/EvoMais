# EvoMais - Design GUI Catalog

## 1. Objetivo
Este documento cataloga o Design GUI atual do frontend do EvoMais, com foco em:
- fontes e tipografia
- tokens visuais e tema (light/dark)
- padroes de componentes
- estrutura visual e responsividade
- melhorias de UI/UX priorizadas

## 2. Fontes e Tipografia

### Stack atual
- Fonte principal: Geist Variable
- Fallbacks: Inter, system-ui, sans-serif

### Decisao adotada
- Padronizacao do sistema para Geist Variable como primeira opcao na pilha de `font-sans`.

### Escala tipografica observada
- Titulos de pagina: `text-xl` + `font-semibold`
- Titulo de secao: `text-sm` + `font-semibold`
- Corpo padrao: `text-sm`
- Apoio/metadados: `text-xs` e `text-[11px]`
- Badges: `text-[10px]`

### Diretriz
- Evitar `text-[10px]` para conteudo informativo essencial.
- Preferir minimo `text-xs` para metadados e `text-sm` para informacoes operacionais.

## 3. Tokens de Tema e Cores

### Tokens centrais
Definidos em `frontend/src/index.css` e consumidos via `tailwind.config.js`:
- Superficies: `surface-deep`, `surface`, `surface-card`, `surface-input`
- Texto: `primary`, `secondary`, `muted`
- Borda: `divider-subtle`, `divider-soft`
- Semantica: `brand`, `success`, `warning`, `danger`, `info`

### Ajustes aplicados nesta revisao
- `--color-text-muted` (light): `#94a3b8` -> `#64748b`
- `--color-text-muted` (dark): `#667781` -> `#9aa9b5`

Motivo: aumentar legibilidade de labels e textos de apoio que estavam com contraste insuficiente em light/dark.

## 4. Biblioteca de Componentes (catalogo)

### 4.1 Layout e navegacao
- Topbar desktop com barra secundaria de atalhos
- Bottom navigation mobile
- Container maximo de conteudo: 1400px
- Padding responsivo padrao: `px-4 sm:px-6 lg:px-8`

Arquivos-chave:
- `frontend/src/components/layout/AppLayout.tsx`

### 4.2 Cards
- `card`, `card-deep`, `kpi-card`, `bottleneck-card`, `mini-card`
- Variacao de borda/raio e profundidade por contexto

Arquivos-chave:
- `frontend/src/index.css`
- paginas de Dashboard, CRM, Metrics e Reports

### 4.3 Botoes
- Primario (`btn-primary`)
- Ghost (`btn-ghost`)
- Danger (`btn-danger`)
- Periodo (`btn-period`)
- Acao de geracao (`btn-generate`)

Diretriz:
- manter altura visual consistente entre variacoes
- manter estados `hover`, `focus` e `disabled` em todas as variantes

### 4.4 Inputs e Selects
- Inputs padrao com fundo de superficie, borda sutil e foco semantico
- Select com comportamento visual equivalente ao input

Arquivo-chave:
- `frontend/src/index.css`

### 4.5 Badges e Chips
- familias: `badge-hot`, `badge-warm`, `badge-cold`, `badge-info`, `badge-success`, `badge-impact-*`

Diretriz:
- manter contraste suficiente entre texto e fundo
- diferenciar estados sem depender apenas da cor

### 4.6 CRM/Kanban
- Board com colunas por etapa
- Deal card com status, checklist e metadados
- alerta de follow-up no topo

Arquivos-chave:
- `frontend/src/pages/CRMPage.tsx`
- `frontend/src/components/crm/KanbanBoard.tsx`
- `frontend/src/components/crm/KanbanColumn.tsx`
- `frontend/src/components/crm/DealCard.tsx`
- `frontend/src/components/crm/FollowupAlert.tsx`

## 5. Estrutura Visual e UX

### Padrões de estrutura
- uso predominante de Flex e Grid utilitario
- leitura em blocos curtos e orientacao por cards
- area de trabalho principal com scroll vertical
- elementos criticos de navegacao fixos em desktop/mobile

### Padrões de interacao
- feedback de hover/focus em botoes e navegacao
- drag and drop no Kanban
- estados de carregamento/erro basicos

## 6. Correcoes Aplicadas Agora

### 6.1 Contraste global de textos auxiliares
Arquivo:
- `frontend/src/index.css`

Acao:
- fortalecimento do token `muted` para light e dark.

### 6.2 Legibilidade da pagina de CRM
Arquivo:
- `frontend/src/pages/CRMPage.tsx`

Acoes:
- resumo de pipeline mudou de `text-muted` para `text-secondary` com peso maior
- estado inativo do toggle `kanban/lista` ficou mais legivel
- mensagem da lista em desenvolvimento com melhor contraste
- bloco de erro com contraste adequado em light/dark

### 6.3 Contraste das colunas Kanban
Arquivo:
- `frontend/src/components/crm/KanbanColumn.tsx`

Acoes:
- reforco das cores de header das etapas no dark
- botao `+ Adicionar negocio` com texto mais forte e fundo de apoio

### 6.4 Contraste nos Deal Cards
Arquivo:
- `frontend/src/components/crm/DealCard.tsx`

Acoes:
- metadados de checklist e rodape migrados para `text-secondary`
- fonte de apoio ajustada para `text-[11px]`

### 6.5 Contraste no alerta de follow-up
Arquivo:
- `frontend/src/components/crm/FollowupAlert.tsx`

Acao:
- separadores visuais `|` alterados para cor mais legivel.

### 6.6 Padronizacao de fonte no Tailwind
Arquivo:
- `frontend/tailwind.config.js`

Acao:
- `font-sans` prioriza Geist Variable.

## 7. Backlog de Melhorias UI/UX Priorizado

1. Acessibilidade de interacoes:
Adicionar `aria-label`, `aria-expanded`, `aria-controls` e rotulos de contexto em botoes iconicos e menus.

2. Estado de foco global:
Unificar `focus:ring` para todos os componentes interativos e garantir navegacao por teclado.

3. Contraste de badges:
Revisar pares texto/fundo de badges em light/dark para garantir leitura em texto pequeno.

4. Consistencia de espaco e raio:
Definir uma escala oficial de `padding`, `gap` e `border-radius` por tipo de componente.

5. Tamanho minimo de texto funcional:
Evitar uso de texto abaixo de `text-xs` em informacoes operacionais.

6. Governanca de tokens:
Reduzir uso de cores inline (`gray-*`, `red-*`, etc.) em componentes para privilegiar tokens do sistema.

7. Estados vazios e mensagens:
Padronizar empty states com orientacao de proxima acao para usuario.

8. Modal/dialog:
Padronizar estrutura acessivel (`role`, foco inicial, escape, lock scroll) para todos os modais.

## 8. Checklist para Novas Telas

- Usar `font-sans` padrao (Geist Variable)
- Usar somente tokens de tema para texto/fundo/borda
- Garantir contraste minimo em textos de apoio
- Definir estados `hover`, `focus`, `disabled`, `loading`
- Confirmar responsividade em mobile e desktop
- Garantir navegacao por teclado e rotulacao acessivel
