// script.js
document.addEventListener('DOMContentLoaded', () => {
  const buttonContainers = document.querySelectorAll('.button-container');
  const hoverDelay = 500; // Atraso em milissegundos antes de mostrar (0.5 segundos)
  
  // Usaremos um Map para rastrear os timeouts de cada contêiner individualmente
  // Chave: elemento do contêiner, Valor: { enterTimeoutId: null, leaveTimeoutId: null }
  const containerTimeouts = new Map();

  buttonContainers.forEach(container => {
    const button = container.querySelector('.hover-button');
    const content = container.querySelector('.hover-content');

    // Inicializa o rastreamento de timeouts para este contêiner
    containerTimeouts.set(container, { enterTimeoutId: null, leaveTimeoutId: null });

    // Evento quando o mouse entra no BOTÃO ou no próprio CONTEÚDO (para persistência)
    const handleMouseEnter = () => {
      const timeouts = containerTimeouts.get(container);

      // Se houver um timeout para esconder pendente (mouse saiu e voltou rápido), cancele-o.
      if (timeouts.leaveTimeoutId) {
        clearTimeout(timeouts.leaveTimeoutId);
        timeouts.leaveTimeoutId = null;
      }

      // Se já houver um timeout para mostrar ou se o conteúdo já estiver visível, não faça nada
      if (timeouts.enterTimeoutId || content.classList.contains('visible')) {
        return;
      }

      // Configura um timeout para mostrar o conteúdo após o atraso
      timeouts.enterTimeoutId = setTimeout(() => {
        content.classList.add('visible');
        timeouts.enterTimeoutId = null; // Limpa o ID após a execução
      }, hoverDelay);
    };

    // Evento quando o mouse sai do CONTÊINER (botão OU conteúdo)
    const handleMouseLeave = () => {
      const timeouts = containerTimeouts.get(container);

      // Cancela o timeout de mostrar se o mouse sair ANTES do atraso terminar
      if (timeouts.enterTimeoutId) {
        clearTimeout(timeouts.enterTimeoutId);
        timeouts.enterTimeoutId = null;
      }

      // Se o conteúdo estiver visível, inicia o processo de fade-out
      // Não é necessário um timeout aqui para esconder, pois o CSS cuida do fade-out.
      // A verificação de 'visible' é importante para não tentar remover a classe desnecessariamente.
      if (content.classList.contains('visible')) {
        // O CSS já cuida do fade-out com a transição na remoção da classe.
        content.classList.remove('visible');
      }
    };

    // Adiciona os event listeners
    // Usamos o 'container' para mouseleave para que o menu não feche ao mover do botão para o conteúdo.
    // Usamos o 'container' para mouseenter também para cobrir o caso de mover o mouse diretamente para o conteúdo se ele já estiver aberto e o mouse saiu e voltou rapidamente.
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Adicional: Se o conteúdo tiver elementos interativos (como links),
    // pode ser bom garantir que o mouse sobre eles também mantenha o conteúdo aberto.
    // A lógica atual com mouseenter/mouseleave no 'container' já deve cobrir isso bem,
    // pois o 'content' está dentro do 'container'.
  });
});
