// Listener para el botón de volver
document.addEventListener('DOMContentLoaded', function() {
  // Configurar el botón de volver
  setupBackButton();
});

// Configurar el botón de volver
function setupBackButton() {
  const backButton = document.getElementById('back-button');
  
  if (backButton) {
    backButton.addEventListener('click', function() {
      // Cerrar la pestaña actual
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
      });
    });
  }
} 