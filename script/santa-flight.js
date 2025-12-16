/* ===================================
   Santa Flight Event
   Little Candy Dream - Natal 2025
   =================================== */

(function() {
  // Probabilidade de aparecer: 15% (mais raro que o cupom)
  const APPEARANCE_CHANCE = 0.15;
  
  // Tempo mínimo entre aparições (em milissegundos) - 2 minutos
  const MIN_TIME_BETWEEN_FLIGHTS = 120000;
  
  // Chave para localStorage
  const LAST_FLIGHT_KEY = 'littlecandy_last_santa_flight';
  
  function initSantaFlight() {
    // Verifica quando foi a última aparição
    const lastFlight = localStorage.getItem(LAST_FLIGHT_KEY);
    const now = Date.now();
    
    // Se teve aparição recente, não mostra
    if (lastFlight && (now - parseInt(lastFlight)) < MIN_TIME_BETWEEN_FLIGHTS) {
      return;
    }

    // Gera número aleatório
    const randomChance = Math.random();
    
    // Se não passou no teste de probabilidade, não mostra
    if (randomChance > APPEARANCE_CHANCE) {
      return;
    }

    // Aguarda um tempo aleatório antes de aparecer (entre 5 e 15 segundos)
    const delay = Math.random() * 10000 + 5000;
    
    setTimeout(() => {
      createSantaFlight();
      localStorage.setItem(LAST_FLIGHT_KEY, now.toString());
    }, delay);
  }

  function createSantaFlight() {
    // Container principal
    const santaContainer = document.createElement('div');
    santaContainer.className = 'santa-flight-container';
    
    santaContainer.innerHTML = `
      <div class="santa-stars">
        <i class="fas fa-star santa-star"></i>
        <i class="fas fa-star santa-star"></i>
        <i class="fas fa-star santa-star"></i>
      </div>
      <div class="santa-sleigh">
        <i class="fas fa-horse reindeer"></i>
        <i class="fas fa-horse reindeer"></i>
        <i class="fas fa-horse reindeer"></i>
        <div style="position: relative; margin-left: 5px;">
          <i class="fas fa-sleigh santa"></i>
          <span style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 2.2rem;">🎅</span>
        </div>
      </div>
      <div class="snow-trail">
        <div class="snow-particle"></div>
        <div class="snow-particle"></div>
        <div class="snow-particle"></div>
        <div class="snow-particle"></div>
        <div class="snow-particle"></div>
      </div>
    `;

    // Adiciona ao body
    document.body.appendChild(santaContainer);

    // Inicia animação após pequeno delay
    setTimeout(() => {
      santaContainer.classList.add('active');
    }, 100);

    // Remove elemento após animação completa
    setTimeout(() => {
      santaContainer.remove();
    }, 8500);
  }

  // Inicializa quando o DOM está pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSantaFlight);
  } else {
    initSantaFlight();
  }
})();
