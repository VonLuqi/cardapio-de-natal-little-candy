/**
 * carrinho.js — Carrinho de pedidos com envio via WhatsApp
 * Little Candy Dream
 */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  //  CONFIGURAÇÃO
  //  Altere o número abaixo: código do país (55) + DDD + número, sem espaços.
  //  Exemplo: '5534999998888'
  // ═══════════════════════════════════════════════════════════════════════
  const WHATSAPP_NUMERO = '5534984043941'; // ← ALTERE AQUI
  // ═══════════════════════════════════════════════════════════════════════

  const STORAGE_KEY = 'lcd_carrinho_v1';

  /* ── Formatação de moeda ── */

  function parsePrecoBRL(label) {
    if (!label) return 0;
    return (
      parseFloat(
        label.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.')
      ) || 0
    );
  }

  function formatBRL(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /* ══════════════════════════════════════════════════════════════════════
     STORE — Estado e persistência em localStorage
  ══════════════════════════════════════════════════════════════════════ */

  const Store = {
    _itens: [],

    carregar() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        // Garante campo unidade em itens salvos antes da migração da chave
        this._itens = parsed.map((i) => ({ unidade: 'unidade', ...i }));
      } catch {
        this._itens = [];
      }
    },

    salvar() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._itens));
      } catch {}
      document.dispatchEvent(new CustomEvent('carrinho:atualizado'));
    },

    getItens() {
      return [...this._itens];
    },

    getTotal() {
      return this._itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    },

    getTotalItens() {
      return this._itens.reduce((s, i) => s + i.quantidade, 0);
    },

    _chave(id, variante, unidade) {
      return `${id}::${variante || ''}::${unidade || 'unidade'}`;
    },

    adicionar(item) {
      const chave = this._chave(item.id, item.variante, item.unidade);
      const existente = this._itens.find(
        (i) => this._chave(i.id, i.variante, i.unidade) === chave
      );
      if (existente) {
        existente.quantidade += item.quantidade || 1;
      } else {
        const minimo = item.pedidoMinimo || 1;
        const qtd = Math.max(item.quantidade || minimo, minimo);
        this._itens.push({
          ...item,
          quantidade: qtd,
          variante: item.variante || '',
          pedidoMinimo: minimo,
        });
      }
      this.salvar();
    },

    incrementar(id, variante, unidade) {
      const chave = this._chave(id, variante, unidade);
      const item = this._itens.find((i) => this._chave(i.id, i.variante, i.unidade) === chave);
      if (item) { item.quantidade++; this.salvar(); }
    },

    decrementar(id, variante, unidade) {
      const chave = this._chave(id, variante, unidade);
      const idx = this._itens.findIndex((i) => this._chave(i.id, i.variante, i.unidade) === chave);
      if (idx === -1) return;
      const minimo = this._itens[idx].pedidoMinimo || 1;
      if (this._itens[idx].quantidade <= minimo) {
        // Remove o item se já está no mínimo
        this._itens.splice(idx, 1);
      } else {
        this._itens[idx].quantidade--;
      }
      this.salvar();
    },

    remover(id, variante, unidade) {
      const chave = this._chave(id, variante, unidade);
      this._itens = this._itens.filter(
        (i) => this._chave(i.id, i.variante, i.unidade) !== chave
      );
      this.salvar();
    },

    limpar() {
      this._itens = [];
      this.salvar();
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     WHATSAPP — Geração de mensagem e redirecionamento
  ══════════════════════════════════════════════════════════════════════ */

  function gerarMensagem(obs) {
    const itens = Store.getItens();
    if (!itens.length) return null;

    const linhas = itens.map((i) => {
      const sub = formatBRL(i.preco * i.quantidade);
      const variante = i.variante ? ` (${i.variante})` : '';
      const unLabel =
        i.unidade && i.unidade !== 'unidade' ? ` [${i.unidade}]` : '';
      return `• ${i.nome}${variante}${unLabel} — ${i.quantidade}x — ${sub}`;
    });

    const total = formatBRL(Store.getTotal());
    const obsStr =
      obs && obs.trim() ? `\n\n_Observações: ${obs.trim()}_` : '';

    return (
      `Olá! Gostaria de fazer o seguinte pedido na *Little Candy Dream*\n\n` +
      linhas.join('\n') +
      `\n\n*Total: ${total}*` +
      obsStr +
      `\n\nAguardo confirmação!`
    );
  }

  function abrirWhatsApp() {
    const obs = document.getElementById('carrinho-obs')?.value || '';
    const msg = gerarMensagem(obs);
    if (!msg) return;
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ══════════════════════════════════════════════════════════════════════
     TOAST — Feedback visual ao adicionar item
  ══════════════════════════════════════════════════════════════════════ */

  function showToast(nome) {
    let el = document.getElementById('carrinho-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'carrinho-toast';
      el.className = 'carrinho-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = `<i class="fas fa-check-circle" aria-hidden="true"></i> <strong>${nome}</strong> adicionado ao pedido!`;
    el.classList.remove('saindo');
    el.classList.add('visivel');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.add('saindo');
      setTimeout(() => el.classList.remove('visivel', 'saindo'), 300);
    }, 2200);
  }

  /* ══════════════════════════════════════════════════════════════════════
     QTY PICKER — Seletor de quantidade para botões "+" nas listas
  ══════════════════════════════════════════════════════════════════════ */

  function _fecharQtyPicker() {
    const el = document.getElementById('qty-picker-ativo');
    if (el) {
      if (el._btnOrigem) {
        el._btnOrigem.style.visibility = '';
        delete el._btnOrigem.dataset.pickerOpen;
      }
      el.remove();
    }
  }

  function _abrirQtyPicker(btnOrigem, minimoPadrao) {
    const existente = document.getElementById('qty-picker-ativo');
    if (existente && existente._btnOrigem === btnOrigem) {
      _fecharQtyPicker();
      return;
    }
    _fecharQtyPicker();

    let qtd    = minimoPadrao;
    const minimo = minimoPadrao;

    const picker = document.createElement('div');
    picker.id        = 'qty-picker-ativo';
    picker.className = 'qty-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Selecionar quantidade');
    picker.innerHTML = `
      <button class="qty-picker-btn" data-acao="diminuir" aria-label="Diminuir" ${qtd <= minimo ? 'disabled' : ''}>
        <i class="fas fa-minus" aria-hidden="true"></i>
      </button>
      <span class="qty-picker-valor">${qtd}</span>
      <button class="qty-picker-btn" data-acao="aumentar" aria-label="Aumentar">
        <i class="fas fa-plus" aria-hidden="true"></i>
      </button>
      <button class="qty-picker-confirmar" aria-label="Adicionar ao pedido" title="Adicionar ao pedido">
        <i class="fas fa-check" aria-hidden="true"></i>
      </button>
    `;

    const btnDim  = picker.querySelector('[data-acao="diminuir"]');
    const btnAum  = picker.querySelector('[data-acao="aumentar"]');
    const valEl   = picker.querySelector('.qty-picker-valor');
    const btnConf = picker.querySelector('.qty-picker-confirmar');

    btnDim.addEventListener('click', (e) => {
      e.stopPropagation();
      if (qtd > minimo) {
        qtd--;
        valEl.textContent    = qtd;
        btnDim.disabled      = qtd <= minimo;
      }
    });

    btnAum.addEventListener('click', (e) => {
      e.stopPropagation();
      qtd++;
      valEl.textContent = qtd;
      btnDim.disabled   = false;
    });

    btnConf.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = {
        id:           btnOrigem.dataset.id,
        variante:     btnOrigem.dataset.variante || '',
        nome:         btnOrigem.dataset.nome,
        preco:        parseFloat(btnOrigem.dataset.preco) || 0,
        precoLabel:   btnOrigem.dataset.precoLabel,
        unidade:      btnOrigem.dataset.unidade || 'unidade',
        pedidoMinimo: minimo,
        quantidade:   qtd,
      };
      Store.adicionar(item);
      const label = qtd > 1 ? `${qtd}x ${item.nome}` : item.nome;
      showToast(label);
      btnOrigem.classList.add('adicionado');
      setTimeout(() => btnOrigem.classList.remove('adicionado'), 600);
      const floatBtn = document.getElementById('btn-carrinho-toggle');
      if (floatBtn) {
        floatBtn.classList.add('pulse');
        setTimeout(() => floatBtn.classList.remove('pulse'), 600);
      }
      _fecharQtyPicker();
    });

    picker._btnOrigem           = btnOrigem;
    btnOrigem.style.visibility  = 'hidden';
    btnOrigem.dataset.pickerOpen = 'true';
    document.body.appendChild(picker);

    requestAnimationFrame(() => {
      const rect = btnOrigem.getBoundingClientRect();
      const pw   = picker.offsetWidth;
      const ph   = picker.offsetHeight;
      let top    = rect.top - ph - 8;
      let left   = rect.left + rect.width / 2 - pw / 2;
      if (top < 8) top = rect.bottom + 8;
      if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
      if (left < 8) left = 8;
      picker.style.top  = top + 'px';
      picker.style.left = left + 'px';
      picker.classList.add('visivel');
      btnConf.focus();
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     UI — Sidebar, botão flutuante, badge
  ══════════════════════════════════════════════════════════════════════ */

  const UI = {
    sidebar: null,
    overlay: null,
    badge: null,
    floatBtn: null,

    init() {
      this._injetarSidebar();
      this._injetarBotaoFlutante();
      this._bindEventos();
      this.atualizar();
    },

    _injetarSidebar() {
      const root = document.createElement('div');
      root.id = 'carrinho-root';
      root.innerHTML = `
        <div id="carrinho-overlay" class="carrinho-overlay" aria-hidden="true"></div>
        <aside
          id="carrinho-sidebar"
          class="carrinho-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de pedidos"
          aria-hidden="true"
        >
          <header class="carrinho-header">
            <h2 class="carrinho-titulo">
              <i class="fas fa-shopping-bag" aria-hidden="true"></i>
              Meu Pedido
            </h2>
            <button id="carrinho-fechar" class="carrinho-fechar-btn" aria-label="Fechar carrinho">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </header>

          <div id="carrinho-itens" class="carrinho-itens" role="list"></div>

          <footer class="carrinho-rodape" id="carrinho-rodape">
            <div class="carrinho-total-wrap">
              <span class="carrinho-total-label">Total do pedido</span>
              <span class="carrinho-total-valor" id="carrinho-total-valor">R$ 0,00</span>
            </div>
            <div class="carrinho-obs-wrap">
              <label for="carrinho-obs" class="carrinho-obs-label">
                <i class="fas fa-pencil-alt" aria-hidden="true"></i>
                Observações (opcional)
              </label>
              <textarea
                id="carrinho-obs"
                class="carrinho-obs-textarea"
                placeholder="Ex: sem amendoim, embrulho especial, endereço de entrega…"
                rows="3"
              ></textarea>
            </div>
            <button id="btn-finalizar-whatsapp" class="btn-finalizar-whatsapp">
              <i class="fab fa-whatsapp" aria-hidden="true"></i>
              Finalizar Pedido pelo WhatsApp
            </button>
            <button id="carrinho-limpar" class="carrinho-limpar-btn" type="button">
              <i class="fas fa-trash-alt" aria-hidden="true"></i>
              Limpar pedido
            </button>
          </footer>
        </aside>
      `;
      document.body.appendChild(root);
      this.sidebar = document.getElementById('carrinho-sidebar');
      this.overlay = document.getElementById('carrinho-overlay');
    },

    _injetarBotaoFlutante() {
      const btn = document.createElement('button');
      btn.id = 'btn-carrinho-toggle';
      btn.className = 'btn-carrinho-toggle';
      btn.setAttribute('aria-label', 'Abrir carrinho de pedidos');
      btn.innerHTML = `
        <i class="fas fa-shopping-bag" aria-hidden="true"></i>
        <span id="carrinho-badge" class="carrinho-badge hidden" aria-live="polite"></span>
      `;
      document.body.appendChild(btn);
      this.floatBtn = btn;
      this.badge = document.getElementById('carrinho-badge');
    },

    _bindEventos() {
      // Abrir
      this.floatBtn.addEventListener('click', () => this.abrir());

      // Fechar
      document.getElementById('carrinho-fechar').addEventListener('click', () => this.fechar());
      this.overlay.addEventListener('click', () => this.fechar());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.sidebar.classList.contains('aberto')) {
            this.fechar();
          } else {
            _fecharQtyPicker();
          }
        }
      });

      // Finalizar via WhatsApp
      document.getElementById('btn-finalizar-whatsapp').addEventListener('click', () => {
        if (Store.getItens().length === 0) return;
        abrirWhatsApp();
      });

      // Limpar carrinho
      document.getElementById('carrinho-limpar').addEventListener('click', () => {
        if (Store.getItens().length === 0) return;
        if (confirm('Deseja remover todos os itens do pedido?')) {
          Store.limpar();
        }
      });

      // Atualizar UI quando o store muda
      document.addEventListener('carrinho:atualizado', () => this.atualizar());

      // Delegação nos botões de quantidade/remover dentro do sidebar
      document.getElementById('carrinho-itens').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-acao]');
        if (!btn) return;
        const { id, variante = '', unidade = 'unidade', acao } = btn.dataset;
        if (acao === 'incrementar') Store.incrementar(id, variante, unidade);
        if (acao === 'decrementar') Store.decrementar(id, variante, unidade);
        if (acao === 'remover')     Store.remover(id, variante, unidade);
      });

      // Delegação global — abre qty picker para .btn-adicionar-item; fecha ao clicar fora
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-adicionar-item');
        if (btn) {
          e.preventDefault();

          /* Sync do modo UN / CENTO: lê qual pill está ativa no DOM agora */
          const li = btn.closest('.produto-item');
          let minimo;
          if (li) {
            const modoAtivo = li.querySelector('.produto-modo-toggle-btn.ativo')?.dataset.modo;
            if (modoAtivo === 'cento' && btn.dataset.precoCento) {
              btn.dataset.preco        = btn.dataset.precoCento;
              btn.dataset.precoLabel   = btn.dataset.precoCentoLabel;
              btn.dataset.unidade      = 'cento';
              minimo = parseInt(btn.dataset.minCento, 10) || 1;
            } else if (btn.dataset.precoUn) {
              /* modo 'un' — usa precoUn e pedidoMinimoUn (atributo imutável) */
              btn.dataset.preco        = btn.dataset.precoUn;
              btn.dataset.precoLabel   = btn.dataset.precoUnLabel;
              btn.dataset.unidade      = 'unidade';
              minimo = parseInt(btn.dataset.pedidoMinimoUn, 10) || parseInt(btn.dataset.pedidoMinimo, 10) || 1;
            }
          }
          if (!minimo) minimo = parseInt(btn.dataset.pedidoMinimo, 10) || 1;

          _abrirQtyPicker(btn, minimo);
          return;
        }
        if (!e.target.closest('#qty-picker-ativo')) {
          _fecharQtyPicker();
        }
      });
    },

    abrir() {
      this.sidebar.classList.add('aberto');
      this.overlay.classList.add('visivel');
      document.body.classList.add('carrinho-open');
      this.sidebar.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        const primeiroFoco = this.sidebar.querySelector(
          'button:not([disabled]), textarea'
        );
        if (primeiroFoco) primeiroFoco.focus();
      }, 100);
    },

    fechar() {
      this.sidebar.classList.remove('aberto');
      this.overlay.classList.remove('visivel');
      document.body.classList.remove('carrinho-open');
      this.sidebar.setAttribute('aria-hidden', 'true');
      this.floatBtn.focus();
    },

    atualizar() {
      this._renderItens();
      this._atualizarBadge();
      this._atualizarTotal();
      this._atualizarBotaoFinalizar();
    },

    _renderItens() {
      const container = document.getElementById('carrinho-itens');
      if (!container) return;
      const itens = Store.getItens();

      if (itens.length === 0) {
        container.innerHTML = `
          <div class="carrinho-vazio">
            <i class="fas fa-cookie-bite" aria-hidden="true"></i>
            <p>Seu pedido está vazio</p>
            <span>Adicione produtos do cardápio!</span>
          </div>
        `;
        return;
      }

      container.innerHTML = itens
        .map((item) => {
          const sub          = formatBRL(item.preco * item.quantidade);
          const varianteStr  = item.variante
            ? `<small class="item-variante">${item.variante}</small>`
            : '';
          const unStr        =
            item.unidade && item.unidade !== 'unidade'
              ? `<span class="item-unidade-tag">${item.unidade}</span>`
              : '';
          const vEscapado    = (item.variante || '').replace(/"/g, '&quot;');
          const minimo       = item.pedidoMinimo || 1;
          const noMinimo     = item.quantidade <= minimo;
          const avisoMin     = minimo > 1
            ? `<span class="item-aviso-min">Minimo: ${minimo} un</span>`
            : '';
          // Botao - quando no mínimo: remove o item (comportamento do Store)
          const labelDecr    = noMinimo ? 'Remover item' : 'Diminuir quantidade';

          return `
            <div class="carrinho-item" role="listitem">
              <div class="item-linha-topo">
                <div class="item-info-left">
                  <span class="item-nome">${item.nome}${varianteStr}</span>
                  ${unStr}
                </div>
                <div class="item-controles">
                  <button class="item-btn-qtd${noMinimo ? ' item-btn-remover-min' : ''}"
                    data-acao="decrementar"
                    data-id="${item.id}"
                    data-variante="${vEscapado}"
                    data-unidade="${item.unidade || 'unidade'}"
                    aria-label="${labelDecr}"
                    title="${labelDecr}"
                  ><i class="fas fa-${noMinimo ? 'trash-alt' : 'minus'}" aria-hidden="true"></i></button>
                  <span class="item-qtd">${item.quantidade}</span>
                  <button class="item-btn-qtd"
                    data-acao="incrementar"
                    data-id="${item.id}"
                    data-variante="${vEscapado}"
                    data-unidade="${item.unidade || 'unidade'}"
                    aria-label="Aumentar quantidade"
                  ><i class="fas fa-plus" aria-hidden="true"></i></button>
                </div>
              </div>
              <div class="item-linha-sub">
                <span class="item-preco-unit">${item.precoLabel} / un${avisoMin}</span>
                <div class="item-sub-direita">
                  <span class="item-subtotal">${sub}</span>
                  <button class="item-btn-remover"
                    data-acao="remover"
                    data-id="${item.id}"
                    data-variante="${vEscapado}"
                    data-unidade="${item.unidade || 'unidade'}"
                    aria-label="Remover ${item.nome}"
                    title="Remover item"
                  ><i class="fas fa-trash-alt" aria-hidden="true"></i></button>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    },

    _atualizarBadge() {
      const total = Store.getTotalItens();
      if (!this.badge) return;
      if (total > 0) {
        this.badge.textContent = total > 99 ? '99+' : String(total);
        this.badge.setAttribute('aria-label', `${total} itens no pedido`);
        this.badge.classList.remove('hidden');
      } else {
        this.badge.classList.add('hidden');
      }
    },

    _atualizarTotal() {
      const el = document.getElementById('carrinho-total-valor');
      if (el) el.textContent = formatBRL(Store.getTotal());
    },

    _atualizarBotaoFinalizar() {
      const btn    = document.getElementById('btn-finalizar-whatsapp');
      const limpar = document.getElementById('carrinho-limpar');
      if (!btn) return;
      const vazio = Store.getItens().length === 0;
      btn.disabled = vazio;
      btn.classList.toggle('disabled', vazio);
      if (limpar) limpar.style.display = vazio ? 'none' : '';
    },
  };

  /* ══════════════════════════════════════════════════════════════════════
     API PÚBLICA — usada por menu-renderer.js e produto.js
  ══════════════════════════════════════════════════════════════════════ */

  window.Carrinho = {
    adicionar(item) {
      Store.adicionar(item);
      const qtd   = item.quantidade || 1;
      const label = qtd > 1 ? `${qtd}x ${item.nome}` : item.nome;
      showToast(label);
      const btn = document.getElementById('btn-carrinho-toggle');
      if (btn) {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 600);
      }
    },
    abrir:         () => UI.abrir(),
    fechar:        () => UI.fechar(),
    parsePrecoBRL,
  };

  /* ── Init ── */
  Store.carregar();
  document.addEventListener('DOMContentLoaded', () => UI.init());
})();
