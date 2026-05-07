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
      // Itens com distribuição de sabores são sempre entradas separadas
      if (item.distribuicao || item.saboresSelecionados) {
        item = { ...item, variante: '__dist_' + _uid() };
      }
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

  function _uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function gerarMensagem(obs) {
    const itens = Store.getItens();
    if (!itens.length) return null;

    const linhas = itens.map((i) => {
      const sub      = formatBRL(i.preco * i.quantidade);
      const variante = (i.variante && !i.variante.startsWith('__dist_')) ? ` (${i.variante})` : '';
      const unLabel  = i.unidade && i.unidade !== 'unidade' ? ` [${i.unidade}]` : '';
      let distStr = '';
      if (i.distribuicao) {
        distStr = '\n  _' +
          Object.entries(i.distribuicao)
            .filter(([, q]) => q > 0)
            .map(([s, q]) => `${s}: ${q}`)
            .join(' · ') +
          '_';
      } else if (i.saboresSelecionados && i.saboresSelecionados.length) {
        if (i.unidade === 'kit') {
          distStr = '\n  _Itens: ' + i.saboresSelecionados.join(', ') + '_';
        } else {
          /* grupos usam "Titulo: valor" já embutido em cada string */
          distStr = '\n  _' + i.saboresSelecionados.join(' · ') + '_';
        }
      }
      return `• ${i.nome}${variante}${unLabel} — ${i.quantidade}x — ${sub}${distStr}`;
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

  function _abrirQtyPicker(btnOrigem, minimoPadrao, passo) {
    passo = passo || 1;
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
        qtd = Math.max(minimo, qtd - passo);
        valEl.textContent = qtd;
        btnDim.disabled   = qtd <= minimo;
      }
    });

    btnAum.addEventListener('click', (e) => {
      e.stopPropagation();
      qtd += passo;
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
        saborUnico:   btnOrigem.dataset.saborUnico === 'true',
      };
      _fecharQtyPicker();
      const gruposRaw = btnOrigem.dataset.grupos;
      if (gruposRaw) {
        try {
          const grupos = JSON.parse(gruposRaw);
          _abrirSelecaoGrupos(item, grupos);
          return;
        } catch (_) {}
      }
      const saboresRaw = btnOrigem.dataset.sabores;
      if (saboresRaw) {
        try {
          const sabores = JSON.parse(saboresRaw);
          const totalUn = item.unidade === 'cento' ? qtd * 100 : qtd;
          // Passa o pedidoMinimo original do produto para determinar o passo da distribuição
          const distribPasso = parseInt(btnOrigem.dataset.pedidoMinimoUn, 10) || undefined;
          _abrirDistribuicao(item, sabores, totalUn, distribPasso);
          return;
        } catch (_) {}
      }
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

  /* ══════════════════════════════════════════════════════════════════════
     SELEÇÃO POR GRUPOS — Modal com opção única por grupo (radio visual)
  ══════════════════════════════════════════════════════════════════════ */

  function _abrirSelecaoGrupos(item, grupos) {
    const existente = document.getElementById('dist-root');
    if (existente) existente.remove();

    /* selecionados[i] = índice da opção escolhida no grupo i, ou -1 */
    const selecionados = grupos.map(() => -1);

    const root = document.createElement('div');
    root.id = 'dist-root';
    root.innerHTML = `
      <div class="dist-overlay" id="dist-overlay"></div>
      <div class="dist-panel" role="dialog" aria-modal="true" aria-label="Personalizar ${esc(item.nome)}">
        <header class="dist-header">
          <div class="dist-header-info">
            <h3 class="dist-titulo">${esc(item.nome)}</h3>
            <p class="dist-subtitulo">${item.variante ? esc(item.variante) + ' · ' : ''}Personalize sua escolha</p>
          </div>
          <button class="dist-fechar" id="dist-fechar" aria-label="Fechar">&times;</button>
        </header>
        <div class="dist-grupos-lista">
          ${grupos.map((g, gi) => `
            <div class="dist-grupo" data-gi="${gi}">
              <p class="dist-grupo-titulo">${esc(g.titulo)}</p>
              <ul class="dist-grupo-opcoes">
                ${g.opcoes.map((op, oi) => `
                  <li>
                    <button class="dist-grupo-btn${op === 'Outro' ? ' dist-grupo-btn-outro' : ''}"
                      data-gi="${gi}" data-oi="${oi}" data-custom="${op === 'Outro'}"
                      aria-pressed="false" type="button">
                      ${esc(op)}
                    </button>
                  </li>
                `).join('')}
              </ul>
              <div class="dist-grupo-custom-wrap" data-gi="${gi}" hidden>
                <input class="dist-grupo-custom-input" type="text"
                  placeholder="Descreva o recheio desejado..."
                  aria-label="Recheio personalizado" data-gi="${gi}" maxlength="80">
              </div>
            </div>
          `).join('')}
        </div>
        <button class="dist-btn-confirmar" id="dist-confirmar" disabled>
          <i class="fas fa-check" aria-hidden="true"></i> Adicionar ao Pedido
        </button>
      </div>
    `;
    document.body.appendChild(root);
    requestAnimationFrame(() => root.querySelector('.dist-panel').classList.add('visivel'));

    function getCustomInput(gi) {
      return root.querySelector(`.dist-grupo-custom-input[data-gi="${gi}"]`);
    }
    function todosSelecionados() {
      return selecionados.every((v, gi) => {
        if (v === -1) return false;
        if (grupos[gi].opcoes[v] === 'Outro') {
          const inp = getCustomInput(gi);
          return inp && inp.value.trim().length > 0;
        }
        return true;
      });
    }
    function atualizarConfirmar() {
      root.querySelector('#dist-confirmar').disabled = !todosSelecionados();
    }
    function fechar() {
      const panel = root.querySelector('.dist-panel');
      panel.classList.remove('visivel');
      setTimeout(() => { if (root.parentNode) root.remove(); }, 250);
    }

    /* Input de texto "Outro" */
    root.querySelectorAll('.dist-grupo-custom-input').forEach((inp) => {
      inp.addEventListener('input', atualizarConfirmar);
    });

    root.addEventListener('click', (e) => {
      if (e.target.id === 'dist-overlay' || e.target.closest('#dist-fechar')) { fechar(); return; }

      if (e.target.closest('#dist-confirmar')) {
        if (!todosSelecionados()) return;
        const escolhas = grupos.map((g, gi) => {
          const op = g.opcoes[selecionados[gi]];
          if (op === 'Outro') {
            const texto = (getCustomInput(gi).value || '').trim();
            return `${g.titulo}: ${texto}`;
          }
          return `${g.titulo}: ${op}`;
        });
        fechar();
        Store.adicionar({ ...item, saboresSelecionados: escolhas });
        showToast(item.nome);
        const floatBtn = document.getElementById('btn-carrinho-toggle');
        if (floatBtn) { floatBtn.classList.add('pulse'); setTimeout(() => floatBtn.classList.remove('pulse'), 600); }
        return;
      }

      const btn = e.target.closest('.dist-grupo-btn');
      if (!btn) return;
      const gi = +btn.dataset.gi;
      const oi = +btn.dataset.oi;
      const isCustom = btn.dataset.custom === 'true';

      /* Radio: desseleciona os outros do mesmo grupo */
      root.querySelectorAll(`.dist-grupo-btn[data-gi="${gi}"]`).forEach((b) => {
        b.classList.remove('ativo');
        b.setAttribute('aria-pressed', 'false');
      });
      selecionados[gi] = oi;
      btn.classList.add('ativo');
      btn.setAttribute('aria-pressed', 'true');

      /* Mostrar/esconder campo "Outro" */
      const wrap = root.querySelector(`.dist-grupo-custom-wrap[data-gi="${gi}"]`);
      if (wrap) {
        if (isCustom) {
          wrap.hidden = false;
          setTimeout(() => getCustomInput(gi).focus(), 50);
        } else {
          wrap.hidden = true;
          const inp = getCustomInput(gi);
          if (inp) inp.value = '';
        }
      }

      atualizarConfirmar();
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     DISTRIBUIÇÃO DE SABORES — Modal para alocar quantidades por sabor
  ══════════════════════════════════════════════════════════════════════ */

  function _abrirDistribuicao(item, sabores, totalUnidades, distribPasso) {
    const PASSO = distribPasso || ((item.pedidoMinimo || 1) >= 20 ? 20 : 1);

    const existente = document.getElementById('dist-root');
    if (existente) existente.remove();

    const root = document.createElement('div');
    root.id = 'dist-root';

    /* ── Modo seleção (toggle) — sem quantidade, só escolhe sabores ── */
    if (PASSO === 1) {
      const selecionados = new Set();
      root.innerHTML = `
        <div class="dist-overlay" id="dist-overlay"></div>
        <div class="dist-panel" role="dialog" aria-modal="true" aria-label="Escolher sabores">
          <header class="dist-header">
            <div class="dist-header-info">
              <h3 class="dist-titulo">${esc(item.nome)}</h3>
              <p class="dist-subtitulo">${item.saborUnico ? 'Escolha 1 sabor' : 'Escolha os sabores desejados'}</p>
            </div>
            <button class="dist-fechar" id="dist-fechar" aria-label="Fechar">&times;</button>
          </header>
          <ul class="dist-lista">
            ${sabores.map((s) => `
              <li class="dist-item dist-item-toggle">
                <span class="dist-sabor-nome">${esc(s)}</span>
                <button class="dist-btn dist-btn-toggle" data-sabor="${esc(s)}" aria-pressed="false" type="button">
                  <i class="fas fa-check" aria-hidden="true"></i>
                </button>
              </li>
            `).join('')}
          </ul>
          <button class="dist-btn-confirmar" id="dist-confirmar" disabled>
            <i class="fas fa-check" aria-hidden="true"></i> Adicionar ao Pedido
          </button>
        </div>
      `;
      document.body.appendChild(root);
      requestAnimationFrame(() => root.querySelector('.dist-panel').classList.add('visivel'));

      function fecharToggle() {
        const panel = root.querySelector('.dist-panel');
        panel.classList.remove('visivel');
        setTimeout(() => { if (root.parentNode) root.remove(); }, 250);
      }
      root.addEventListener('click', (e) => {
        if (e.target.id === 'dist-overlay' || e.target.closest('#dist-fechar')) { fecharToggle(); return; }
        if (e.target.closest('#dist-confirmar')) {
          if (selecionados.size === 0) return;
          fecharToggle();
          Store.adicionar({ ...item, saboresSelecionados: [...selecionados] });
          showToast(item.nome);
          const floatBtn = document.getElementById('btn-carrinho-toggle');
          if (floatBtn) { floatBtn.classList.add('pulse'); setTimeout(() => floatBtn.classList.remove('pulse'), 600); }
          return;
        }
        const btnToggle = e.target.closest('.dist-btn-toggle');
        if (btnToggle) {
          const sabor = btnToggle.dataset.sabor;
          if (item.saborUnico) {
            // Radio: limpa seleção anterior e seleciona o novo
            const estaAtivo = selecionados.has(sabor);
            selecionados.clear();
            root.querySelectorAll('.dist-btn-toggle').forEach((b) => {
              b.classList.remove('ativo');
              b.setAttribute('aria-pressed', 'false');
            });
            if (!estaAtivo) {
              selecionados.add(sabor);
              btnToggle.classList.add('ativo');
              btnToggle.setAttribute('aria-pressed', 'true');
            }
          } else {
            if (selecionados.has(sabor)) {
              selecionados.delete(sabor);
              btnToggle.classList.remove('ativo');
              btnToggle.setAttribute('aria-pressed', 'false');
            } else {
              selecionados.add(sabor);
              btnToggle.classList.add('ativo');
              btnToggle.setAttribute('aria-pressed', 'true');
            }
          }
          document.getElementById('dist-confirmar').disabled = selecionados.size === 0;
        }
      });
      return;
    }

    /* ── Modo distribuição (quantidade por sabor — ex: docinhos mín 20) ── */
    const qtds  = sabores.map(() => 0);
    const unStr = item.unidade === 'cento'
      ? `${item.quantidade} cento${item.quantidade > 1 ? 's' : ''} · ${totalUnidades} un`
      : `${totalUnidades} unidade${totalUnidades > 1 ? 's' : ''}`;

    root.innerHTML = `
      <div class="dist-overlay" id="dist-overlay"></div>
      <div class="dist-panel" role="dialog" aria-modal="true" aria-label="Distribuir sabores">
        <header class="dist-header">
          <div class="dist-header-info">
            <h3 class="dist-titulo">${esc(item.nome)}</h3>
            <p class="dist-subtitulo">${unStr} — de ${PASSO} em ${PASSO}</p>
          </div>
          <button class="dist-fechar" id="dist-fechar" aria-label="Fechar">&times;</button>
        </header>
        <div class="dist-barra-restam" id="dist-barra">
          Restam: <strong id="dist-restam-val">${totalUnidades}</strong>
        </div>
        <ul class="dist-lista">
          ${sabores.map((s, i) => `
            <li class="dist-item">
              <span class="dist-sabor-nome">${esc(s)}</span>
              <div class="dist-controles">
                <button class="dist-btn dist-btn-dim" data-idx="${i}" disabled aria-label="Diminuir ${esc(s)}">
                  <i class="fas fa-minus" aria-hidden="true"></i>
                </button>
                <span class="dist-qty-val" data-idx="${i}">0</span>
                <button class="dist-btn dist-btn-aum" data-idx="${i}" aria-label="Aumentar ${esc(s)}">
                  <i class="fas fa-plus" aria-hidden="true"></i>
                </button>
              </div>
            </li>
          `).join('')}
        </ul>
        <button class="dist-btn-confirmar" id="dist-confirmar" disabled>
          <i class="fas fa-check" aria-hidden="true"></i> Adicionar ao Pedido
        </button>
      </div>
    `;
    document.body.appendChild(root);
    requestAnimationFrame(() => root.querySelector('.dist-panel').classList.add('visivel'));

    function getRestam() { return totalUnidades - qtds.reduce((a, b) => a + b, 0); }
    function sync() {
      const restam = getRestam();
      document.getElementById('dist-restam-val').textContent = restam;
      document.getElementById('dist-confirmar').disabled = restam !== 0;
      document.getElementById('dist-barra').classList.toggle('dist-barra-ok', restam === 0);
      root.querySelectorAll('.dist-btn-dim').forEach((b) => { b.disabled = qtds[+b.dataset.idx] <= 0; });
      root.querySelectorAll('.dist-btn-aum').forEach((b) => { b.disabled = getRestam() < PASSO; });
      root.querySelectorAll('.dist-qty-val').forEach((el) => { el.textContent = qtds[+el.dataset.idx]; });
    }
    function fechar() {
      const panel = root.querySelector('.dist-panel');
      panel.classList.remove('visivel');
      setTimeout(() => { if (root.parentNode) root.remove(); }, 250);
    }
    root.addEventListener('click', (e) => {
      if (e.target.id === 'dist-overlay' || e.target.closest('#dist-fechar')) { fechar(); return; }
      if (e.target.closest('#dist-confirmar')) {
        if (getRestam() !== 0) return;
        const distribuicao = {};
        sabores.forEach((s, i) => { if (qtds[i] > 0) distribuicao[s] = qtds[i]; });
        fechar();
        Store.adicionar({ ...item, distribuicao });
        showToast(item.nome);
        const floatBtn = document.getElementById('btn-carrinho-toggle');
        if (floatBtn) { floatBtn.classList.add('pulse'); setTimeout(() => floatBtn.classList.remove('pulse'), 600); }
        return;
      }
      const btnDim = e.target.closest('.dist-btn-dim');
      if (btnDim) { const i = +btnDim.dataset.idx; if (qtds[i] >= PASSO) { qtds[i] -= PASSO; sync(); } return; }
      const btnAum = e.target.closest('.dist-btn-aum');
      if (btnAum) { const i = +btnAum.dataset.idx; if (getRestam() >= PASSO) { qtds[i] += PASSO; sync(); } }
    });
    sync();
  }

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
              Esvaziar Carrinho
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

          /* Passo=20 apenas para produtos com pedidoMinimo >= 20 (ex: docinhos) */
          const temSabores = !!btn.dataset.sabores;
          const modoFinal  = btn.dataset.unidade || 'unidade';
          const passo      = (temSabores && modoFinal !== 'cento' && minimo >= 20) ? 20 : 1;
          _abrirQtyPicker(btn, minimo, passo);
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
          // Itens com distribuição (docinhos em cento) ficam fixos; itens com apenas saboresSelecionados permitem ajuste de qty
          const isDist       = !!item.distribuicao;
          const varianteStr  = (!isDist && item.variante && !item.variante.startsWith('__dist_'))
            ? `<small class="item-variante">${item.variante}</small>`
            : '';
          const unStr        =
            item.unidade && item.unidade !== 'unidade'
              ? `<span class="item-unidade-tag">${item.unidade}</span>`
              : '';
          const vEscapado    = (item.variante || '').replace(/"/g, '&quot;');
          const minimo       = item.pedidoMinimo || 1;
          const noMinimo     = item.quantidade <= minimo;
          const avisoMin     = (!isDist && minimo > 1)
            ? `<span class="item-aviso-min">Minimo: ${minimo} un</span>`
            : '';
          const labelDecr    = noMinimo ? 'Remover item' : 'Diminuir quantidade';

          const distHTML = item.distribuicao
            ? `<div class="item-distribuicao">` +
              Object.entries(item.distribuicao)
                .filter(([, q]) => q > 0)
                .map(([s, q]) => `<span>${s}: ${q}</span>`)
                .join('') +
              `</div>`
            : item.saboresSelecionados && item.saboresSelecionados.length
              ? `<div class="item-distribuicao">` +
                item.saboresSelecionados.map((s) => `<span>${s}</span>`).join('') +
                `</div>`
              : '';

          const controlesHTML = isDist
            ? `<span class="item-qtd item-qtd-fixed">${item.quantidade}x</span>`
            : `<button class="item-btn-qtd${noMinimo ? ' item-btn-remover-min' : ''}"
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
                  ><i class="fas fa-plus" aria-hidden="true"></i></button>`;

          return `
            <div class="carrinho-item" role="listitem">
              <div class="item-linha-topo">
                <div class="item-info-left">
                  <span class="item-nome">${item.nome}${varianteStr}</span>
                  ${unStr}
                </div>
                <div class="item-controles">
                  ${controlesHTML}
                </div>
              </div>
              ${distHTML}
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
    abrirDistribuicao:   _abrirDistribuicao,
    abrirSelecaoGrupos:  _abrirSelecaoGrupos,
    abrir:         () => UI.abrir(),
    fechar:        () => UI.fechar(),
    parsePrecoBRL,
  };

  /* ── Init ── */
  Store.carregar();
  document.addEventListener('DOMContentLoaded', () => UI.init());
})();
