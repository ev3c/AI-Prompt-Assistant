// utils.js
import { getTranslation } from '/src/content-script/translations.js';

// Cache para el último texto seleccionado conocido
let lastKnownSelectedText = '';
let lastUpdateTime = 0;

// Función para actualizar el cache del texto seleccionado
export function updateSelectedTextCache(selectedText) {
  lastKnownSelectedText = selectedText || '';
  lastUpdateTime = Date.now();
  console.log('📝 Cache actualizado con texto:', selectedText || '[vacío]');
}

// Función para obtener el último texto seleccionado del cache
export function getLastSelectedText() {
  return lastKnownSelectedText;
}

export async function getContextMenuTextForDisplay(isSelection = false, langOverride = null) {
  return new Promise((resolve) => {
    const handleSelectionText = async (baseText) => {
      try {
        // SOLO obtener texto seleccionado ACTUAL de la página web - SIN FALLBACKS
        console.log('🔍 Obteniendo ÚNICAMENTE texto seleccionado de la página web actual...');
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
          if (tabs && tabs.length > 0) {
            const tab = tabs[0];
            
            // Verificar si la página permite scripting
            if (tab.url.startsWith('chrome://') || 
                tab.url.startsWith('chrome-extension://') || 
                tab.url.startsWith('edge://') || 
                tab.url.startsWith('about:') ||
                tab.url.startsWith('moz-extension://')) {
              
              console.log('📝 Página restringida - no se puede acceder a la selección');
              resolve(baseText + '[página no accesible]');
              return;
            }

            try {
              // Usar executeScript para obtener SOLAMENTE texto seleccionado EN ESTE MOMENTO
              const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                  try {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                      const selectedText = selection.toString().trim();
                      return selectedText;
                    }
                    return '';
                  } catch (error) {
                    return '';
                  }
                }
              });

              const selectedText = results[0]?.result || '';
              console.log('✅ Texto seleccionado ÚNICAMENTE de página web:', selectedText || '[ninguno]');
              
              if (selectedText) {
                // Mostrar texto seleccionado (truncado si es muy largo)
                const truncatedText = selectedText.length > 30 
                  ? selectedText.substring(0, 30) + '...' 
                  : selectedText;
                resolve(baseText + truncatedText);
              } else {
                // NO HAY TEXTO SELECCIONADO - Mostrar mensaje directo sin fallbacks
                console.log('📝 No hay texto seleccionado en la página web actual');
                resolve(baseText + '[selecciona texto]');
              }
            } catch (scriptError) {
              console.log('❌ Error al acceder a la selección:', scriptError);
              resolve(baseText + '[error de acceso]');
            }
          } else {
            console.log('❌ No hay pestaña activa');
            resolve(baseText + '[sin pestaña]');
          }
        });
      } catch (error) {
        console.log('❌ Error general en handleSelectionText:', error);
        resolve(baseText + '[error]');
      }
    };

    if (langOverride) {
      const texts = getTranslation(langOverride);
      const baseText = isSelection ? texts.contextMenu.summaryClipboard : texts.contextMenu.summaryUrl;
      
      if (isSelection) {
        handleSelectionText(baseText);
      } else {
        // Para URL, obtener la URL de la pestaña activa
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs && tabs.length > 0) {
            const url = tabs[0].url;
            const truncatedUrl = url.length > 40 ? url.substring(0, 40) + '...' : url;
            resolve(baseText + truncatedUrl);
          } else {
            resolve(baseText + '[no disponible]');
          }
        });
      }
    } else {
      chrome.storage.local.get(['language'], function(result) {
        const currentLanguage = result.language || 'es';
        const texts = getTranslation(currentLanguage);
        const baseText = isSelection ? texts.contextMenu.summaryClipboard : texts.contextMenu.summaryUrl;
        
        if (isSelection) {
          handleSelectionText(baseText);
        } else {
          // Para URL, obtener la URL de la pestaña activa
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs && tabs.length > 0) {
              const url = tabs[0].url;
              const truncatedUrl = url.length > 40 ? url.substring(0, 40) + '...' : url;
              resolve(baseText + truncatedUrl);
            } else {
              resolve(baseText + '[no disponible]');
            }
          });
        }
      });
    }
  });
}


// Esta función está diseñada para ser inyectada en una página, por eso usa window.getSelection y document.
export function copySelectedTextToClipboard() {
  try {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(selectedText).catch(err => {
            console.error('❌ Error al copiar con API moderna:', err);
            fallbackCopyMethod(selectedText);
          });
        } else {
          fallbackCopyMethod(selectedText);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error al acceder a la selección:', error);
  }

  // Función de fallback para copiar texto (se ejecutará en el contexto de la página)
  function fallbackCopyMethod(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed'; // Prevenir scroll
      textarea.style.opacity = '0'; // Hacer invisible
      textarea.style.pointerEvents = 'none'; // No interferir con clics
      document.body.appendChild(textarea);
      
      textarea.select();
      textarea.setSelectionRange(0, text.length); // Para móviles
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        // console.log('Texto copiado con fallback'); // Opcional
      } else {
        console.error('❌ Error al copiar con execCommand');
      }
    } catch (fallbackError) {
      console.error('❌ Error en método fallback para copiar:', fallbackError);
    }
  }
}