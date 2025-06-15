// utils.js
import { getTranslation } from '/src/content-script/translations.js';

export async function getContextMenuTextForDisplay(isSelection = false, langOverride = null) {
  return new Promise((resolve) => {
    if (langOverride) {
      const texts = getTranslation(langOverride);
      resolve(isSelection ? texts.contextMenu.summaryClipboard : texts.contextMenu.summaryUrl);
    } else {
      chrome.storage.local.get(['language'], function(result) {
        const currentLanguage = result.language || 'es';
        const texts = getTranslation(currentLanguage);
        resolve(isSelection ? texts.contextMenu.summaryClipboard : texts.contextMenu.summaryUrl);
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