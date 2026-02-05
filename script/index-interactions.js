/* ===================================
   Interações da Página Index
   Little Candy Dream - Versão 2025
   =================================== */

(function() {
  // Ripple effect ao clicar em cards ativos
  function addRippleEffect() {
    const cards = document.querySelectorAll('a .menu-card');
    
    cards.forEach(card => {
      card.addEventListener('click', function(e) {
        // Não aplica ripple em cards desativados
        if (card.closest('a')?.classList.contains('opacity-70')) {
          return;
        }

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = card.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        card.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addRippleEffect);
  } else {
    addRippleEffect();
  }
})();
