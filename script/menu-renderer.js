/**
 * menu-renderer.js — Auto-popula páginas de cardápio a partir de data/produtos.json
 * Little Candy Dream
 *
 * Uso: incluir no HTML da página com data-categoria="docinhos" no <body>
 * O conteúdo é renderizado dentro de #menu-content
 */
(function () {
  'use strict';

  /** Configuração por categoria */
  const CATEGORIAS = {
    classico: {
      cor: '#8b0000',
      corLight: '#fef2f2',
      corBorder: '#fecaca',
      icone: 'fas fa-star',
      sufixoCor: 'red',
      headerClass: 'cardapio-header-dark',
      headerBg: '#8b0000',
      descricao: '"Doces especiais que transformam qualquer ocasião em uma celebração memorável."',
    },
    docinhos: {
      cor: '#c9a227',
      corLight: '#fffbf0',
      corBorder: '#e6dccf',
      icone: 'fas fa-cookie-bite',
      sufixoCor: 'gold',
      headerClass: 'cardapio-header-light',
      headerBg: null,
      descricao: '"Clássicos feitos com carinho, para adoçar cada momento especial da sua vida."',
    },
    bolos: {
      cor: '#5d4037',
      corLight: '#efebe9',
      corBorder: '#d7ccc8',
      icone: 'fas fa-cake-candles',
      sufixoCor: 'brown',
      headerClass: 'cardapio-header-light',
      headerBg: null,
      descricao: '"Do simples café da tarde às grandes comemorações. Feitos com ingredientes selecionados."',
    },
    'zero-acucar': {
      cor: '#1a472a',
      corLight: '#f0f7f2',
      corBorder: '#a3b18a',
      icone: 'fas fa-leaf',
      sufixoCor: 'green',
      headerClass: 'cardapio-header-dark',
      headerBg: '#1a472a',
      descricao: '"O sabor dos nossos doces, sem culpa e com muito amor. Adoçantes de alta qualidade."',
    },
    'kit-festa': {
      cor: '#c9a227',
      corLight: '#fffbf0',
      corBorder: '#e6dccf',
      icone: 'fas fa-gift',
      sufixoCor: 'gold',
      headerClass: 'cardapio-header-light',
      headerBg: null,
      descricao: '"Kits festa totalmente personalizados. Cada item escolhido por você, com muito carinho."',
    },
  };

  /* ── Helpers ── */

  function $id(id) {
    return document.getElementById(id);
  }

  function escaparHTML(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function parsePrecoBRL(label) {
    if (!label) return 0;
    return (
      parseFloat(
        label.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.')
      ) || 0
    );
  }

  /* ── Renderização do header ── */

  function renderHeader(cat, config, categoriaData) {
    const wrapper = document.createElement('header');
    wrapper.className = `cardapio-header ${config.headerClass}`;
    if (config.headerBg) {
      wrapper.style.backgroundColor = config.headerBg;
    }

    wrapper.innerHTML = `
      <span class="cardapio-header-icon" style="color: ${config.headerBg ? '#c9a227' : config.cor}">
        <i class="${config.icone}" aria-hidden="true"></i>
      </span>
      <h1 style="color: ${config.headerBg ? '#fff' : '#2a2a2a'}">${escaparHTML(categoriaData.nome)}</h1>
      <p class="cardapio-header-sub" style="color: ${config.headerBg ? 'rgba(255,255,255,0.8)' : '#8c7b50'}">
        ${escaparHTML(categoriaData.descricao)}
      </p>
    `;

    return wrapper;
  }

  /* ── Renderização de uma seção (subcategoria) ── */

  function renderSecao(subcategoria, produtos, config) {
    const secao = document.createElement('section');
    secao.className = 'secao-cardapio';

    /* Verifica se todos os produtos da seção têm o mesmo preço (ex: Tradicionais R$180/cento) */
    const precoUnico =
      produtos.length > 1 &&
      produtos.every(
        (p) => p.precoLabel === produtos[0].precoLabel && p.precoPor === produtos[0].precoPor
      )
        ? produtos[0]
        : null;

    /* Título de seção com estilo da imagem de referência */
    const headerHTML = `
      <div class="secao-preco-header">
        <div>
          <h2 class="secao-titulo secao-titulo-${config.sufixoCor}">${escaparHTML(subcategoria)}</h2>
          ${
            precoUnico
              ? `<p class="secao-subtitulo">${escaparHTML(precoUnico.descricaoCurta || '')}</p>`
              : ''
          }
        </div>
        ${
          precoUnico
            ? `<span class="secao-preco-badge">
                ${escaparHTML(precoUnico.precoLabel)}
                <span style="font-weight:400; font-size:0.8em; opacity:0.75">/ ${escaparHTML(precoUnico.precoPor || '')}</span>
                ${precoUnico.precoUnidade ? `<span class="secao-preco-unidade">= ${escaparHTML(precoUnico.precoUnidade)} / un</span>` : ''}
               </span>`
            : ''
        }
      </div>
      <hr class="secao-divider secao-divider-${config.sufixoCor}" />
    `;

    /* Lista de produtos */
    const listaHTML = produtos
      .map((produto) => {
        const temDetalhes =
          produto.sabores ||
          produto.tamanhos ||
          produto.detalhes ||
          produto.descricao;

        const precoItem = precoUnico ? '' : `
          <span class="produto-item-preco produto-item-preco-${config.sufixoCor}">
            ${escaparHTML(produto.precoLabel || '')}${produto.precoPor ? ` <small style="font-weight:400;color:#aaa">/ ${produto.precoPor}</small>` : ''}
          </span>
        `;

        /* Botão "+" para adicionar ao carrinho.
           Produtos com tamanhos exigem escolha na página de detalhe. */
        const temTamanhos = produto.tamanhos && produto.tamanhos.length > 0;
        let cartPreco, cartPrecoLabel, cartUnidade;
        if (produto.precoUnidade) {
          cartPreco      = parsePrecoBRL(produto.precoUnidade);
          cartPrecoLabel = produto.precoUnidade;
          cartUnidade    = 'unidade';
        } else {
          cartPreco      = parsePrecoBRL(produto.precoLabel);
          cartPrecoLabel = produto.precoLabel || '';
          cartUnidade    = produto.precoPor || 'unidade';
        }

        /* Atributos extras para produtos com precoPor === 'cento':
           permite ao QtyPicker oferecer toggle UN / CENTO */
        const temModoCento = produto.precoPor === 'cento' && !!produto.precoUnidade;
        const extraCentoAttrs = temModoCento
          ? ` data-preco-un="${parsePrecoBRL(produto.precoUnidade)}"` +
            ` data-preco-un-label="${escaparHTML(produto.precoUnidade)}"` +
            ` data-preco-cento="${parsePrecoBRL(produto.precoLabel)}"` +
            ` data-preco-cento-label="${escaparHTML(produto.precoLabel)}"` +
            ` data-min-cento="1"` +
            ` data-pedido-minimo-un="${produto.pedidoMinimo || 1}"`
          : '';

        const saboresAttr = produto.sabores && produto.sabores.length
          ? ` data-sabores='${JSON.stringify(produto.sabores)}'`
          : '';
        const btnAdicionar =
          !temTamanhos && produto.precoLabel
            ? `<button
                class="btn-adicionar-item"
                data-id="${produto.id}"
                data-nome="${escaparHTML(produto.nome)}"
                data-preco="${cartPreco}"
                data-preco-label="${escaparHTML(cartPrecoLabel)}"
                data-unidade="${escaparHTML(cartUnidade)}"
                data-variante=""
                data-pedido-minimo="${produto.pedidoMinimo || 1}"
                ${extraCentoAttrs}${saboresAttr}
                aria-label="Adicionar ${escaparHTML(produto.nome)} ao pedido"
                title="Adicionar ao pedido"
              ><i class="fas fa-plus" aria-hidden="true"></i></button>`
            : '';

        /* Para produtos cento, o precoItem mostra o preço do modo ativo (inicia em unidade).
           O toggle fica fora do <a> para evitar navegação acidental. */
        const precoItemHTML = temModoCento
          ? `<span class="produto-item-preco produto-item-preco-${config.sufixoCor} produto-item-preco-dinamico">
               ${escaparHTML(produto.precoUnidade)} <small style="font-weight:400;color:#aaa">/ un</small>
             </span>`
          : precoItem;

        const toggleModoHTML = temModoCento
          ? `<div class="produto-modo-toggle" role="group" aria-label="Modo de preço">
               <button class="produto-modo-toggle-btn ativo" data-modo="un" type="button">Unidade</button>
               <button class="produto-modo-toggle-btn" data-modo="cento" type="button">Cento</button>
             </div>`
          : '';

        return `
          <li class="produto-item${temModoCento ? ' produto-item-com-modo' : ''}">
            <a
              href="produto.html?id=${encodeURIComponent(produto.id)}"
              class="produto-item-link"
              aria-label="Ver detalhes de ${escaparHTML(produto.nome)}"
            >
              <div class="produto-item-left">
                <span class="produto-item-dot produto-item-dot-${config.sufixoCor}" aria-hidden="true"></span>
                <span class="produto-item-nome">${escaparHTML(produto.nome)}</span>
              </div>
              <div class="produto-item-right">
                ${precoItemHTML}
                ${temDetalhes ? `<i class="fas fa-chevron-right produto-item-arrow" aria-hidden="true"></i>` : ''}
              </div>
            </a>
            ${toggleModoHTML}
            ${btnAdicionar}
          </li>
        `;
      })
      .join('');

    /* Pedido mínimo (da primeira ocorrência) */
    const pedidoMin = produtos[0]?.pedidoMinimo;
    const pedidoMinHTML = pedidoMin
      ? `<div class="info-box info-box-gold mt-md aviso-pedido-un" role="note">
           <i class="fas fa-info-circle info-box-icon" aria-hidden="true"></i>
           <div>
             <p class="info-box-texto">Pedido mínimo de <strong>${pedidoMin} unidades</strong> de cada sabor.</p>
           </div>
         </div>`
      : '';

    secao.innerHTML = `
      ${headerHTML}
      <ul class="produtos-lista" role="list">
        ${listaHTML}
      </ul>
      ${pedidoMinHTML}
    `;

    return secao;
  }

  /* ── Renderização do botão de encomenda ── */

  function renderCTA(config) {
    const div = document.createElement('div');
    div.style.cssText =
      'background: linear-gradient(135deg, var(--color-bolos-primary,#5d4037) 0%, #3e2723 100%); border-radius: 1rem; padding: 2rem 1.5rem; text-align: center; margin-top: 2.5rem;';

    div.innerHTML = `
      <p style="font-family: var(--font-serif); font-size: 1.4rem; color: #f3e5d8; font-style: italic; margin-bottom: 0.5rem;">
        Quer personalizar seu pedido?
      </p>
      <p style="color: rgba(255,255,255,0.7); font-size: 0.875rem; margin-bottom: 1.25rem;">
        Entre em contato pelo WhatsApp e criamos algo especial para você!
      </p>
      <a
        href="https://wa.link/nc5ren"
        target="_blank"
        rel="noopener noreferrer"
        class="cta-whatsapp"
        aria-label="Entrar em contato pelo WhatsApp"
      >
        <i class="fab fa-whatsapp" aria-hidden="true"></i>
        Solicitar Orçamento
      </a>
    `;

    return div;
  }

  /* ── Renderização do footer ── */

  function renderFooter(config) {
    const footer = document.createElement('footer');
    footer.className = 'cardapio-footer';
    footer.style.backgroundColor = config.headerBg || '#5d4037';
    footer.style.color = config.headerBg ? '#f3e5d8' : '#f3e5d8';

    footer.innerHTML = `
      <p class="footer-brand">Little Candy Dream</p>
      <p>Transformando sonhos em doces momentos.</p>
      <p style="font-size:0.8rem; opacity:0.65;">Os produtos podem conter glúten, lactose e oleaginosas.</p>
      <div class="footer-icons">
        <a href="https://wa.link/nc5ren" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <i class="fab fa-whatsapp" aria-hidden="true"></i>
        </a>
        <a href="https://www.instagram.com/nessaconfeitariaartistica/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <i class="fab fa-instagram" aria-hidden="true"></i>
        </a>
      </div>
    `;

    return footer;
  }

  /* ── Renderização completa ── */

  function renderizar(dados, categoriaId) {
    const categoriaData = dados.categorias.find((c) => c.id === categoriaId);
    const config = CATEGORIAS[categoriaId];

    if (!categoriaData || !config) {
      console.error('[menu-renderer] Categoria não encontrada:', categoriaId);
      return;
    }

    /* Filtra e ordena produtos da categoria */
    const produtos = dados.produtos
      .filter((p) => p.categoria === categoriaId && p.disponivel !== false)
      .sort((a, b) => (a.ordem || 99) - (b.ordem || 99));

    if (produtos.length === 0) {
      console.warn('[menu-renderer] Nenhum produto encontrado para:', categoriaId);
      return;
    }

    /* Agrupa por subcategoria */
    const grupos = produtos.reduce((acc, p) => {
      const sub = p.subcategoria || 'Produtos';
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(p);
      return acc;
    }, {});

    /* Monta o DOM */
    const wrapper = $id('menu-wrapper');
    if (!wrapper) {
      console.error('[menu-renderer] Elemento #menu-wrapper não encontrado.');
      return;
    }

    /* Remove loading */
    const loading = $id('menu-loading');
    if (loading) loading.remove();

    /* Header */
    wrapper.appendChild(renderHeader(categoriaId, config, categoriaData));

    /* Aviso de informações importantes (se houver) */
    const aviso = document.createElement('div');
    aviso.style.padding = '1.25rem 1.25rem 0';
    aviso.innerHTML = '';

    /* Main */
    const main = document.createElement('main');
    main.className = 'cardapio-main';
    main.id = 'menu-content';

    /* Intro */
    if (categoriaData.descricao && !config.headerBg) {
      const intro = document.createElement('div');
      intro.className = 'cardapio-intro';
      intro.innerHTML = `<p>${escaparHTML(config.descricao)}</p>`;
      main.appendChild(intro);
    }

    /* Seções por subcategoria */
    Object.entries(grupos).forEach(([sub, prods]) => {
      main.appendChild(renderSecao(sub, prods, config));
    });

    /* Delegação: toggle UN / CENTO nas linhas de produto */
    main.addEventListener('click', (e) => {
      const btn = e.target.closest('.produto-modo-toggle-btn');
      if (!btn) return;
      e.preventDefault();

      const li    = btn.closest('.produto-item');
      const modo  = btn.dataset.modo;
      const addBtn = li && li.querySelector('.btn-adicionar-item');
      if (!li || !addBtn) return;

      /* Atualiza estado ativo */
      li.querySelectorAll('.produto-modo-toggle-btn').forEach((b) => b.classList.remove('ativo'));
      btn.classList.add('ativo');

      /* Atualiza data do botão "+" */
      if (modo === 'un') {
        addBtn.dataset.preco       = addBtn.dataset.precoUn;
        addBtn.dataset.precoLabel  = addBtn.dataset.precoUnLabel;
        addBtn.dataset.unidade     = 'unidade';
        addBtn.dataset.pedidoMinimo = addBtn.dataset.pedidoMinimoUn || addBtn.dataset.pedidoMinimo;
      } else {
        addBtn.dataset.preco       = addBtn.dataset.precoCento;
        addBtn.dataset.precoLabel  = addBtn.dataset.precoCentoLabel;
        addBtn.dataset.unidade     = 'cento';
        addBtn.dataset.pedidoMinimo = addBtn.dataset.minCento || '1';
      }

      /* Atualiza exibição do preço na linha */
      const precoEl = li.querySelector('.produto-item-preco-dinamico');
      if (precoEl) {
        precoEl.innerHTML = modo === 'un'
          ? `${escaparHTML(addBtn.dataset.precoUnLabel)} <small style="font-weight:400;color:#aaa">/ un</small>`
          : `${escaparHTML(addBtn.dataset.precoCentoLabel)} <small style="font-weight:400;color:#aaa">/ cento</small>`;
      }
    });

    /* CTA */
    main.appendChild(renderCTA(config));

    wrapper.appendChild(aviso);
    wrapper.appendChild(main);

    /* Footer */
    wrapper.appendChild(renderFooter(config));
  }

  /* ── Bootstrap ── */

  async function init() {
    const categoriaId = document.body.dataset.categoria;

    if (!categoriaId) {
      console.error('[menu-renderer] Adicione data-categoria="XXX" ao <body>.');
      return;
    }

    try {
      const res = await fetch('data/produtos.json');
      if (!res.ok) throw new Error('Falha ao carregar produtos.json');
      const dados = await res.json();
      renderizar(dados, categoriaId);
    } catch (err) {
      console.error('[menu-renderer]', err);
      const loading = $id('menu-loading');
      if (loading) {
        loading.innerHTML = `
          <p style="color:#c0392b; font-size:0.875rem;">
            <i class="fas fa-exclamation-circle"></i>
            Erro ao carregar o cardápio. Tente novamente.
          </p>
        `;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
