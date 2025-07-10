// Feedback page functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('📝 Feedback page loaded');
  
  // Configurar el botón de cerrar
  setupCloseButton();
});

// Configurar el botón de cerrar
function setupCloseButton() {
  const closeButton = document.querySelector('.close-button');
  
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      console.log('🚪 Cerrando ventana de feedback...');
      closeWindow();
    });
  }
}

// Función mejorada para cerrar la ventana
function closeWindow() {
  console.log('🚪 Intentando cerrar ventana...');
  
  try {
    // Método 1: Chrome Extension API (más confiable)
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.getCurrent((tab) => {
        if (tab && tab.id) {
          chrome.tabs.remove(tab.id);
          console.log('✅ Ventana cerrada con Chrome API');
          return;
        }
      });
    }
    
    // Método 2: window.close() estándar
    window.close();
    console.log('✅ Intentando cerrar con window.close()');
    
    // Método 3: Fallback con delay
    setTimeout(() => {
      window.close();
      console.log('✅ Segundo intento con window.close()');
    }, 100);
    
    // Método 4: Fallback con history
    setTimeout(() => {
      if (window.history.length > 1) {
        window.history.back();
        console.log('✅ Navegando hacia atrás');
      } else {
        window.close();
        console.log('✅ Tercer intento con window.close()');
      }
    }, 200);
    
  } catch (error) {
    console.error('❌ Error al cerrar ventana:', error);
    
    // Último recurso: mostrar mensaje
    setTimeout(() => {
      alert('Please close this tab manually / Por favor, cierra esta pestaña manualmente');
    }, 500);
  }
}

// Hacer la función disponible globalmente
window.closeWindow = closeWindow; 