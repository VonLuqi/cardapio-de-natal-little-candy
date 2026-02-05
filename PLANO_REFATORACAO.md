# Plano de Refatoração - Remover Tailwind e CSS Puro

## Fase 1: Preparação e Estrutura Base

### 1.1 Criar novo arquivo CSS base
- `css/base.css` - Reset, variáveis CSS, tipografia, componentes globais
  - Reset CSS/normalizção
  - Variáveis CSS (cores, espaçamentos, tipografia)
  - Classes utilitárias básicas (.container, .button, .card, etc)
  - Responsive design com media queries puras

### 1.2 Reorganizar arquivos CSS
- Manter `css/default.css` (variáveis)
- Criar `css/base.css` (reset e componentes globais)
- Refatorar `css/global.css` (estilos compartilhados)
- Atualizar `css/index.css` (página inicial)
- Criar novos CSS para cada cardápio:
  - `css/cardapio-classico.css`
  - `css/cardapio-docinhos.css`
  - `css/cardapio-bolos.css`
  - `css/cardapio-zero-acucar.css`
  - `css/cardapio-kit-festa.css`

## Fase 2: Refatoração do HTML

### 2.1 Index.html
- Remover CDN Tailwind
- Remover classes Tailwind
- Manter estrutura semântica
- Adicionar data-attributes para estilização

### 2.2 Cardápios (5 arquivos)
- Remover classes Tailwind
- Implementar estrutura HTML semântica
- Adicionar elementos para styling puro

## Fase 3: Design Visual (baseado nas imagens)

### 3.1 Estilos Globais
- Tipografia: Serif (Playfair Display) para títulos, Sans-serif (Lato) para corpo
- Cores temáticas por cardápio
- Layouts responsivos
- Efeitos hover suaves

### 3.2 Padrões por Cardápio

#### Cardápio Clássico (vermelho/ouro)
```
Layout: Grid 2 colunas (desktop) / 1 coluna (mobile)
Fundo: Padrão ou cor sólida
Cards: Produtos com descrição simples
Tema: Vermelho #8b0000 + Ouro #c9a227
```

#### Docinhos Clássicos (ouro)
```
Layout: Grid estilo vitrine
Fundo: Padrão decorativo
Cards: Pequenos, com ícones
Tema: Ouro #c9a227
```

#### Bolos (chocolate)
```
Layout: Duas colunas (imagem + descrição)
Fundo: Rosa/Vermelho claro
Cards: Grande, com foto destaque
Tema: Chocolate #5d4037
Seções por tipo: bolo de pote, brownie, cozinha
```

#### Zero Açúcar (verde)
```
Layout: Simples, clean
Fundo: Verde claro
Cards: Minimalistas
Tema: Verde #1a472a
```

#### Kit Festa (ouro)
```
Layout: Personalizado
Fundo: Degradê suave
Cards: Destaque para kits
Tema: Ouro/Dourado
```

## Fase 4: Implementação

### 4.1 Estrutura de Classes CSS Puro
```css
/* Componentes */
.container {}
.card {}
.button {}
.section {}
.grid {}
.header {}
.footer {}

/* Utilitários */
.text-center {}
.text-left {}
.text-right {}
.mt-{value} {}
.mb-{value} {}
.p-{value} {}
.flex {}
.grid-cols-{n} {}
```

### 4.2 Media Queries
```css
/* Mobile-first approach */
/* 480px - Tablets pequenos */
@media (min-width: 480px) {}

/* 768px - Tablets */
@media (min-width: 768px) {}

/* 1024px - Desktop */
@media (min-width: 1024px) {}

/* 1280px - Desktop Grande */
@media (min-width: 1280px) {}
```

## Fase 5: Testes e Validação

- Verificar responsividade em todos os breakpoints
- Testar em navegadores diferentes
- Validar acessibilidade (contraste, semântica)
- Performance (sem Tailwind, CSS mais leve)
- SEO (estrutura semântica)

## Ordem de Implementação

1. Criar `css/base.css` com reset e variáveis
2. Refatorar `index.html` (remover Tailwind)
3. Refatorar `css/index.css`
4. Refatorar primeira página de cardápio (ex: bolos - mais visual)
5. Refatorar demais cardápios
6. Testar responsividade
7. Otimizar e validar

## Benefícios

- ✅ Arquivo CSS menor (sem Tailwind)
- ✅ Controle total do styling
- ✅ Sem dependências externas
- ✅ Melhor performance
- ✅ Código mais leve
- ✅ Aprendizado de CSS puro

## Arquivos a Modificar

Arquivos HTML (6):
- index.html
- cardapio-bolos.html
- cardapio-classico.html
- cardapio-docinhos-classicos.html
- cardapio-kit-festa.html
- cardapio-sem-açucar.html

Arquivos CSS (5+):
- Criar: css/base.css
- Manter: css/default.css
- Refatorar: css/global.css, css/index.css
- Criar/Refatorar: css/cardapio-*.css

Scripts (1):
- Atualizar: script/index-interactions.js (se necessário)
