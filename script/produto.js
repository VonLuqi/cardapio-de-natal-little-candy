/**
 * produto.js — Carrega e renderiza a página de detalhe do produto
 * Little Candy Dream
 *
 * Uso: produto.html?id=morango-do-amor
 */
(function () {
  'use strict';

  const WHATSAPP_URL = 'https://wa.link/nc5ren';

  /** Mapeamento de categoria → configuração visual */
  const CATEGORIAS = {
    classico: {
      nome: 'Cardápio Clássico',
      pagina: 'cardapio-classico.html',
      cor: '#8b0000',
      corLight: '#fef2f2',
      icone: 'fas fa-star',
    },
    docinhos: {
      nome: 'Docinhos Clássicos',
      pagina: 'cardapio-docinhos-classicos.html',
      cor: '#c9a227',
      corLight: '#fffbf0',
      icone: 'fas fa-cookie-bite',
    },
    bolos: {
      nome: 'Bolos Artesanais',
      pagina: 'cardapio-bolos.html',
      cor: '#5d4037',
      corLight: '#efebe9',
      icone: 'fas fa-cake-candles',
    },
    'zero-acucar': {
      nome: 'Linha Zero Açúcar',
      pagina: 'cardapio-sem-açucar.html',
      cor: '#1a472a',
      corLight: '#f0f7f2',
      icone: 'fas fa-leaf',
    },
    'kit-festa': {
      nome: 'Kit Festa',
      pagina: 'cardapio-kit-festa.html',
      cor: '#c9a227',
      corLight: '#fffbf0',
      icone: 'fas fa-gift',
    },
  };

  /* ── Helpers ── */

  function $id(id) {
    return document.getElementById(id);
  }

  function mostrarLoading() {
    $id('estado-loading').classList.remove('hidden');
    $id('estado-erro').classList.add('hidden');
    $id('produto-conteudo').classList.add('hidden');
  }

  function mostrarErro() {
    $id('estado-loading').classList.add('hidden');
    $id('estado-erro').classList.remove('hidden');
    $id('produto-conteudo').classList.add('hidden');
  }

  function mostrarConteudo() {
    $id('estado-loading').classList.add('hidden');
    $id('estado-erro').classList.add('hidden');
    $id('produto-conteudo').classList.remove('hidden');
  }

  function aplicarCorCategoria(cor, corLight) {
    const root = document.documentElement;
    root.style.setProperty('--cat-cor', cor);
    root.style.setProperty('--cat-cor-light', corLight);
  }

  /* ── Carregamento dos dados ── */

  async function carregarProdutos() {
    const res = await fetch('data/produtos.json');
    if (!res.ok) throw new Error('Falha ao buscar produtos.json');
    return res.json();
  }

  /* ── Renderização ── */

  function renderizar(produto, dados) {
    const cat = CATEGORIAS[produto.categoria] || {
      nome: produto.categoria,
      pagina: 'index.html',
      cor: '#c9a227',
      corLight: '#fffbf0',
      icone: 'fas fa-cookie-bite',
    };

    /* Cores CSS */
    aplicarCorCategoria(cat.cor, cat.corLight);

    /* <head> */
    document.title = `${produto.nome} — Little Candy Dream`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = produto.descricaoCurta || produto.nome;

    /* Botão voltar */
    $id('btn-voltar').href = cat.pagina;
    $id('label-voltar').textContent = `Voltar — ${cat.nome}`;

    /* Badge destaque */
    if (produto.destaque) {
      $id('badge-destaque').classList.remove('hidden');
    }

    /* Imagem ou placeholder */
    if (produto.imagem) {
      const img = $id('produto-img');
      img.src = produto.imagem;
      img.alt = produto.nome;
      img.classList.remove('hidden');
      $id('produto-placeholder').classList.add('hidden');
    } else {
      $id('placeholder-icone').className = cat.icone;
    }

    /* Badge de categoria */
    const badge = $id('produto-categoria-badge');
    badge.textContent = cat.nome;
    badge.style.backgroundColor = cat.corLight;
    badge.style.color = cat.cor;

    /* Nome e descrição curta */
    $id('produto-nome').textContent = produto.nome;
    if (produto.descricaoCurta) {
      $id('produto-descricao-curta').textContent = produto.descricaoCurta;
    }

    /* Preço */
    if (produto.precoMinimo) {
      $id('preco-prefixo').classList.remove('hidden');
    }
    $id('preco-valor').textContent = produto.precoLabel || '—';
    if (produto.precoPor) {
      $id('preco-por').textContent = '/ ' + produto.precoPor;
    }

    /* Preço por unidade (quando precoPor === 'cento') */
    if (produto.precoUnidade) {
      const porDiv = document.createElement('div');
      porDiv.className = 'produto-preco-unidade';
      porDiv.textContent = `${produto.precoUnidade} / unidade`;
      $id('preco-bloco').appendChild(porDiv);
    }

    /* Pedido mínimo */
    if (produto.pedidoMinimo) {
      $id('pedido-min-wrap').classList.remove('hidden');
      $id('pedido-min-texto').textContent =
        `Pedido mínimo: ${produto.pedidoMinimo} unidades`;
    }

    /* Descrição longa */
    if (produto.descricao) {
      $id('texto-descricao').textContent = produto.descricao;
      $id('bloco-descricao').classList.remove('hidden');
    }

    /* Sabores */
    if (produto.sabores && produto.sabores.length > 0) {
      if (produto.saboresTitulo) {
        $id('titulo-sabores').textContent = produto.saboresTitulo;
      }
      $id('lista-sabores').innerHTML = produto.sabores
        .map((s) => `<li>${s}</li>`)
        .join('');
      $id('bloco-sabores').classList.remove('hidden');
    }

    /* Tamanhos */
    if (produto.tamanhos && produto.tamanhos.length > 0) {
      $id('lista-tamanhos').innerHTML = produto.tamanhos
        .map(
          (t) => `
          <div class="tamanho-linha">
            <span class="tamanho-nome">${t.nome}</span>
            <span class="tamanho-fatias">${t.fatias || ''}</span>
            <span class="tamanho-preco">${t.precoLabel}</span>
          </div>`
        )
        .join('');
      $id('bloco-tamanhos').classList.remove('hidden');
    }

    /* Features / detalhes */
    if (produto.detalhes && produto.detalhes.length > 0) {
      if (produto.detalhesTitulo) {
        $id('titulo-features').textContent = produto.detalhesTitulo;
      }
      $id('lista-features').innerHTML = produto.detalhes
        .map((d) => `<li>${d}</li>`)
        .join('');
      $id('bloco-features').classList.remove('hidden');
    }

    /* Observação */
    if (produto.obs) {
      $id('texto-obs').textContent = produto.obs;
      $id('bloco-obs').classList.remove('hidden');
    }

    /* Relacionados — mesmo categoria, diferente produto, disponível */
    const relacionados = dados.produtos
      .filter(
        (p) =>
          p.categoria === produto.categoria &&
          p.id !== produto.id &&
          p.disponivel !== false
      )
      .slice(0, 4);

    if (relacionados.length > 0) {
      $id('grid-relacionados').innerHTML = relacionados
        .map(
          (r) => `
          <a href="produto.html?id=${encodeURIComponent(r.id)}" class="relacionado-card">
            <span class="relacionado-card-icone">
              <i class="${cat.icone}" aria-hidden="true"></i>
            </span>
            <h4>${r.nome}</h4>
            <span class="rel-preco">${r.precoLabel}${r.precoPor ? ' / ' + r.precoPor : ''}</span>
          </a>`
        )
        .join('');
      $id('secao-relacionados').classList.remove('hidden');
    }

    adicionarBotaoCarrinho(produto);
    mostrarConteudo();
  }

  /* ── Botão de carrinho na página de produto ── */

  function adicionarBotaoCarrinho(produto) {
    if (typeof window.Carrinho === 'undefined') return;

    const ctaWrap = document.querySelector('.produto-cta-wrap');
    if (!ctaWrap) return;

    const minimo = produto.pedidoMinimo || 1;

    /* Helper: cria stepper de quantidade */
    function criarStepper(minimoEfetivo, passoEfetivo) {
      if (minimoEfetivo === undefined) minimoEfetivo = minimo;
      if (!passoEfetivo) passoEfetivo = 1;
      let qtd = minimoEfetivo;

      const wrap = document.createElement('div');
      wrap.className = 'produto-qty-wrap';
      wrap.innerHTML = `
        <span class="produto-qty-label">
          Quantidade
          ${minimoEfetivo > 1 ? `<small class="produto-qty-min">(mín. ${minimoEfetivo})</small>` : ''}
        </span>
        <div class="produto-qty-controles">
          <button class="produto-qty-btn" type="button" aria-label="Diminuir quantidade" ${qtd <= minimoEfetivo ? 'disabled' : ''}>
            <i class="fas fa-minus" aria-hidden="true"></i>
          </button>
          <span class="produto-qty-valor">${qtd}</span>
          <button class="produto-qty-btn" type="button" aria-label="Aumentar quantidade">
            <i class="fas fa-plus" aria-hidden="true"></i>
          </button>
        </div>
      `;

      const [btnDim, btnAum] = wrap.querySelectorAll('.produto-qty-btn');
      const valEl = wrap.querySelector('.produto-qty-valor');

      btnDim.addEventListener('click', () => {
        if (qtd > minimoEfetivo) {
          qtd = Math.max(minimoEfetivo, qtd - passoEfetivo);
          valEl.textContent = qtd;
          btnDim.disabled   = qtd <= minimoEfetivo;
        }
      });
      btnAum.addEventListener('click', () => {
        qtd += passoEfetivo;
        valEl.textContent = qtd;
        btnDim.disabled   = false;
      });

      wrap.getQtd = () => qtd;
      return wrap;
    }

    if (produto.tamanhos && produto.tamanhos.length > 0) {
      /* Produto com tamanhos: select + stepper + botão */
      const selectWrap = document.createElement('div');
      selectWrap.className = 'tamanho-select-wrap';
      selectWrap.innerHTML = `
        <label for="select-tamanho" class="tamanho-select-label">Escolha o tamanho</label>
        <select id="select-tamanho" class="tamanho-select">
          ${produto.tamanhos
            .map((t) => `<option value="${t.nome}" data-preco-label="${t.precoLabel}">${t.nome}${t.fatias ? ' — ' + t.fatias : ''} — ${t.precoLabel}</option>`)
            .join('')}
        </select>
      `;

      const stepper = criarStepper();

      const btn = document.createElement('button');
      btn.className = 'btn-adicionar-carrinho';
      btn.type      = 'button';
      btn.innerHTML = '<i class="fas fa-shopping-bag" aria-hidden="true"></i> Adicionar ao Pedido';
      btn.addEventListener('click', () => {
        const sel = document.getElementById('select-tamanho');
        const opt = sel.options[sel.selectedIndex];
        window.Carrinho.adicionar({
          id:           produto.id,
          variante:     opt.value,
          nome:         produto.nome,
          preco:        window.Carrinho.parsePrecoBRL(opt.dataset.precoLabel),
          precoLabel:   opt.dataset.precoLabel,
          unidade:      'unidade',
          pedidoMinimo: minimo,
          quantidade:   stepper.getQtd(),
        });
      });

      ctaWrap.insertBefore(btn, ctaWrap.firstChild);
      ctaWrap.insertBefore(stepper, btn);
      ctaWrap.insertBefore(selectWrap, stepper);
    } else {
      /* Produto simples: stepper + botão (+ toggle UN/CENTO quando aplicável) */
      const temModoCento = produto.precoPor === 'cento' && !!produto.precoUnidade;
      const temSabores   = !!(produto.sabores && produto.sabores.length);

      /* Estado mutável do modo — lido no click do botão */
      let modoPreco    = 'un';
      let minimoAtivo  = minimo;
      let passoAtivo   = temSabores ? 20 : 1;

      /* Valores por modo */
      const precos = temModoCento
        ? {
            un:    { preco: window.Carrinho.parsePrecoBRL(produto.precoUnidade), precoLabel: produto.precoUnidade, unidade: 'unidade', minimo, passo: temSabores ? 20 : 1 },
            cento: { preco: window.Carrinho.parsePrecoBRL(produto.precoLabel),   precoLabel: produto.precoLabel,   unidade: 'cento',   minimo: 1, passo: 1 },
          }
        : null;

      /* Stepper inicial */
      let stepper = criarStepper(minimoAtivo, passoAtivo);

      /* Botão Adicionar */
      const btn = document.createElement('button');
      btn.className = 'btn-adicionar-carrinho';
      btn.type      = 'button';
      btn.setAttribute('aria-label', `Adicionar ${produto.nome} ao pedido`);
      btn.innerHTML = '<i class="fas fa-shopping-bag" aria-hidden="true"></i> Adicionar ao Pedido';
      btn.addEventListener('click', () => {
        const cfg = temModoCento ? precos[modoPreco] : {
          preco:      produto.precoUnidade
            ? window.Carrinho.parsePrecoBRL(produto.precoUnidade)
            : window.Carrinho.parsePrecoBRL(produto.precoLabel),
          precoLabel: produto.precoUnidade || produto.precoLabel,
          unidade:    produto.precoUnidade ? 'unidade' : (produto.precoPor || 'unidade'),
          minimo,
        };
        const item = {
          id:           produto.id,
          variante:     '',
          nome:         produto.nome,
          preco:        cfg.preco,
          precoLabel:   cfg.precoLabel,
          unidade:      cfg.unidade,
          pedidoMinimo: minimoAtivo,
          quantidade:   stepper.getQtd(),
        };
        if (temSabores) {
          const totalUn = item.unidade === 'cento' ? item.quantidade * 100 : item.quantidade;
          window.Carrinho.abrirDistribuicao(item, produto.sabores, totalUn);
        } else {
          window.Carrinho.adicionar(item);
        }
      });

      ctaWrap.insertBefore(btn, ctaWrap.firstChild);
      ctaWrap.insertBefore(stepper, btn);

      /* Toggle UN / CENTO — só exibido quando aplicável */
      if (temModoCento) {
        const toggleWrap = document.createElement('div');
        toggleWrap.className = 'produto-modo-preco-wrap';
        toggleWrap.innerHTML = `
          <span class="produto-modo-preco-label">Calcular por</span>
          <div class="produto-modo-preco-opcoes">
            <button class="produto-modo-preco-btn ativo" data-modo="un" type="button">
              Unidade <small>${produto.precoUnidade}</small>
            </button>
            <button class="produto-modo-preco-btn" data-modo="cento" type="button">
              Cento <small>${produto.precoLabel}</small>
            </button>
          </div>
        `;

        toggleWrap.querySelectorAll('.produto-modo-preco-btn').forEach((b) => {
          b.addEventListener('click', () => {
            toggleWrap.querySelectorAll('.produto-modo-preco-btn').forEach((x) => x.classList.remove('ativo'));
            b.classList.add('ativo');
            modoPreco   = b.dataset.modo;
            minimoAtivo = precos[modoPreco].minimo;
            passoAtivo  = precos[modoPreco].passo;

            /* Substitui o stepper pelo novo mínimo/passo */
            const novoStepper = criarStepper(minimoAtivo, passoAtivo);
            stepper.replaceWith(novoStepper);
            stepper = novoStepper;
          });
        });

        ctaWrap.insertBefore(toggleWrap, stepper);
      }
    }
  }

  /* ── Bootstrap ── */

  async function init() {
    mostrarLoading();

    const params = new URLSearchParams(window.location.search);
    const produtoId = params.get('id');

    if (!produtoId) {
      mostrarErro();
      return;
    }

    try {
      const dados = await carregarProdutos();
      const produto = dados.produtos.find(
        (p) => p.id === produtoId && p.disponivel !== false
      );

      if (!produto) {
        mostrarErro();
        return;
      }

      renderizar(produto, dados);
    } catch (err) {
      console.error('[produto.js]', err);
      mostrarErro();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
