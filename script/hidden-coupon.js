/* ===================================
   Hidden Coupon Easter Egg
   Little Candy Dream
   =================================== */

(function() {
  // Probabilidade de aparecer: 1% (1 em 100 visitantes)
  const APPEARANCE_CHANCE = 0.01;
  
  // Verifica se o cupom já foi coletado nesta sessão
  const SESSION_KEY = 'littlecandy_coupon_collected';
  
  function initHiddenCoupon() {
    // Se já foi coletado nesta sessão, não mostra novamente
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    // Gera número aleatório
    const randomChance = Math.random();
    
    // Se não passou no teste de probabilidade, não mostra
    if (randomChance > APPEARANCE_CHANCE) {
      return;
    }

    // Cria o elemento do cupom
    createCouponElement();
  }

  function createCouponElement() {
    // Container principal do cupom
    const couponContainer = document.createElement('div');
    couponContainer.id = 'hidden-coupon-popup';
    couponContainer.className = 'hidden-coupon-popup';
    
    couponContainer.innerHTML = `
      <div class="coupon-content">
        <div class="coupon-header">
          <i class="fas fa-gift coupon-icon"></i>
          <span class="coupon-text">Parabéns! Você encontrou um cupom especial!</span>
        </div>
        <div class="coupon-card">
          <div class="coupon-discount">10% OFF</div>
          <div class="coupon-details">
            <p class="coupon-title">Desconto Especial Little Candy Dream</p>
            <p class="coupon-code">Clique para gerar seu cupom</p>
          </div>
        </div>
        <button id="coupon-btn" class="coupon-btn">
          <i class="fas fa-download"></i> Baixar Cupom
        </button>
        <button id="coupon-close" class="coupon-close" aria-label="Fechar">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Adiciona ao body
    document.body.appendChild(couponContainer);

    // Aguarda um pouco para garantir que o elemento foi adicionado ao DOM
    setTimeout(() => {
      couponContainer.classList.add('show');
    }, 100);

    // Event listeners
    document.getElementById('coupon-btn').addEventListener('click', generateAndDownloadPDF);
    document.getElementById('coupon-close').addEventListener('click', closeCoupon);

    // Fecha ao clicar fora do popup
    couponContainer.addEventListener('click', (e) => {
      if (e.target.id === 'hidden-coupon-popup') {
        closeCoupon();
      }
    });
  }

  function closeCoupon() {
    const couponElement = document.getElementById('hidden-coupon-popup');
    if (couponElement) {
      couponElement.classList.remove('show');
      setTimeout(() => {
        couponElement.remove();
      }, 300);
    }
  }

  function generateAndDownloadPDF() {
    // Marca como coletado nesta sessão
    sessionStorage.setItem(SESSION_KEY, 'true');

    // Aguarda e tenta acessar jsPDF de diferentes formas
    const getjsPDF = () => {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      if (window.jsPDF) return window.jsPDF;
      return null;
    };

    const jsPDFLib = getjsPDF();
    
    if (!jsPDFLib) {
      alert('Cupom: LITTLECANDY10\n\nDesconto de 10% na sua compra!\nValidade: 31 de dezembro de 2025');
      closeCoupon();
      return;
    }

    try {
      const doc = new jsPDFLib({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
      });

      // Configuração de cores
      const primaryColor = [139, 0, 0]; // Vermelho Natal
      const secondaryColor = [201, 162, 39]; // Ouro

      // Background
      doc.setFillColor(253, 251, 247);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

      // Border vermelho
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1.5);
      doc.rect(2, 2, doc.internal.pageSize.getWidth() - 4, doc.internal.pageSize.getHeight() - 4);

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');

      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('CUPOM ESPECIAL', doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });

      // Logo text
      doc.setTextColor(...primaryColor);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('10% OFF', doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

      // Descrição
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(74, 74, 74);
      doc.text('Desconto exclusivo para você!', doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });

      // Código do cupom
      doc.setFillColor(...secondaryColor);
      doc.rect(8, 52, doc.internal.pageSize.getWidth() - 16, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      const couponCode = 'LITTLECANDY10';
      doc.text(couponCode, doc.internal.pageSize.getWidth() / 2, 62, { align: 'center' });

      // Informações adicionais
      doc.setTextColor(74, 74, 74);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Válido até: 31 de Dezembro de 2025', doc.internal.pageSize.getWidth() / 2, 72, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Little Candy Dream - Natal 2025', doc.internal.pageSize.getWidth() / 2, 88, { align: 'center' });
      doc.text('Use para ganhar 10% de desconto!', doc.internal.pageSize.getWidth() / 2, 92, { align: 'center' });

      // Salva o PDF
      doc.save('cupom-littlecandy-10off.pdf');
      
      // Mostra mensagem de sucesso
      alert('Cupom baixado com sucesso!\nCódigo: LITTLECANDY10\nDesconto: 10% OFF');
      closeCoupon();

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Cupom: LITTLECANDY10\n\nDesconto de 10% na sua compra!\nValidade: 31 de dezembro de 2025');
      closeCoupon();
    }
  }

  // Inicializa quando o DOM está pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHiddenCoupon);
  } else {
    initHiddenCoupon();
  }
})();
