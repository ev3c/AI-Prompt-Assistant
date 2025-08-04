// Content script ligero para monitorear selección de texto en todas las páginas
// Solo se encarga de detectar cambios en la selección y notificar al background

let lastSelectedText = '';
let updateTimeout = null;

// Función para obtener el texto seleccionado actual
function getSelectedText() {
  try {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.toString().trim();
    }
    return '';
  } catch (error) {
    return '';
  }
}

// Función para notificar cambios al background script
function notifySelectionChange() {
  const selectedText = getSelectedText();
  
  // SIEMPRE notificar cambios de selección para actualizar summaryClipboard
  if (selectedText !== lastSelectedText) {
    console.log('📝 Cambio de selección detectado para summaryClipboard:', selectedText || '[ninguno]');
    lastSelectedText = selectedText;
    
    // Usar throttling mínimo para evitar spam pero mantener responsividad
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    updateTimeout = setTimeout(() => {
      try {
        // Enviar actualización inmediata para menu contextual
        chrome.runtime.sendMessage({
          action: 'updateContextMenus',
          selectedText: selectedText,
          selectionChange: true // Flag para indicar cambio de selección
        });
        
        // Envío adicional específico para summaryClipboard
        chrome.runtime.sendMessage({
          action: 'updateSummaryClipboardOnly',
          selectedText: selectedText,
          timestamp: Date.now()
        });
      } catch (error) {
        // Ignorar errores si la extensión se está recargando
        console.log('Error notificando cambio de selección:', error);
      }
    }, 25); // Reducido a 25ms para máxima responsividad
  }
}

// Escuchar eventos de selección con múltiples listeners para máxima cobertura
document.addEventListener('selectionchange', notifySelectionChange);

// Capturar cuando empieza una nueva selección
document.addEventListener('selectstart', () => {
  setTimeout(() => {
    notifySelectionChange();
  }, 50);
});

// Capturar cuando termina la selección
document.addEventListener('selectend', () => {
  setTimeout(() => {
    notifySelectionChange();
  }, 10);
});

// También escuchar clicks que puedan cambiar la selección
document.addEventListener('mouseup', () => {
  setTimeout(notifySelectionChange, 10);
});

// Escuchar teclas que puedan cambiar la selección
document.addEventListener('keyup', (e) => {
  // Solo para teclas relevantes para selección
  if (e.key.includes('Arrow') || e.key === 'Shift' || e.ctrlKey || e.key === 'a') {
    setTimeout(notifySelectionChange, 10);
  }
});

// CRUCIAL: Actualizar cuando se hace clic derecho (contextmenu)
// SOLO usa texto seleccionado de la página - NUNCA clipboard
document.addEventListener('contextmenu', (event) => {
  // INMEDIATAMENTE capturar SOLO el texto seleccionado EN ESTE MOMENTO EXACTO
  const selectedText = getSelectedText();
  lastSelectedText = selectedText;
  
  // Log para debug - enfatizar que es SOLO texto seleccionado
  console.log('🖱️ Clic derecho - Capturando SOLO texto seleccionado de página:', selectedText || '[ninguno]');
  
  // Enviar INMEDIATAMENTE SOLO el texto seleccionado al background
  try {
    chrome.runtime.sendMessage({
      action: 'updateContextMenus',
      selectedText: selectedText,
      rightClick: true, // Flag para indicar que es por clic derecho
      selectionOnly: true, // Flag para enfatizar que es SOLO selección
      timestamp: Date.now()
    });
    
    // Envío específico para forzar actualización SOLO con texto seleccionado
    chrome.runtime.sendMessage({
      action: 'forceUpdateSummaryClipboard',
      selectedText: selectedText,
      selectionOnly: true, // Flag para enfatizar que es SOLO selección
      timestamp: Date.now()
    });
  } catch (error) {
    console.log('Error enviando actualización de menú contextual:', error);
  }
}, { passive: true, capture: true }); // Usar capture para ejecutar antes que otros listeners

// Responder a solicitudes del background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    sendResponse({ selectedText: getSelectedText() });
  }
  return true;
});

// Notificar selección inicial al cargar la página
setTimeout(notifySelectionChange, 100);

// Verificación periódica para casos donde los eventos no se capturen (menos frecuente)
let periodicCheckInterval = setInterval(() => {
  const currentSelection = getSelectedText();
  if (currentSelection !== lastSelectedText) {
    console.log('🔄 Verificación periódica detectó cambio de selección');
    notifySelectionChange();
  }
}, 2000); // Cada 2 segundos (el clic derecho ya captura inmediatamente)

// Limpiar el intervalo cuando sea necesario
window.addEventListener('beforeunload', () => {
  if (periodicCheckInterval) {
    clearInterval(periodicCheckInterval);
  }
});