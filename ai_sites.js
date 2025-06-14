// ai_sites.js - Script de contenido para sitios de IA
// Previene el envío automático de prompts cuando se abre una nueva página

(function() {
  // Detectar en qué sitio de IA estamos
  const currentURL = window.location.href;
  let aiSite = 'unknown';
  let aiPng = 'google-color.png';
  
  if (currentURL.includes('chat.openai.com')) {
    aiSite = 'chatgpt';
    aiPng = 'src/assets/images/openai.png';
  } else if (currentURL.includes('claude.ai')) {
    aiSite = 'claude';
    aiPng = 'src/assets/images/claude-color.png';
  } else if (currentURL.includes('chat.deepseek.com')) {
    aiSite = 'deepseek';
    aiPng = 'src/assets/images/deepseek-color.png';
  } else if (currentURL.includes('copilot.microsoft.com')) {
    aiSite = 'copilot';
    aiPng = 'src/assets/images/copilot-color.png';
  } else if (currentURL.includes('gemini.google.com')) {
    aiSite = 'gemini';
    aiPng = 'src/assets/images/gemini-color.png';
  } else if (currentURL.includes('grok.x.ai')) {
    aiSite = 'grok';
    aiPng = 'src/assets/images/grok.png';
  } else if (currentURL.includes('meta.ai')) {
    aiSite = 'meta';
    aiPng = 'src/assets/images/meta-color.png';
  } else if (currentURL.includes('chat.mistral.ai')) {
    aiSite = 'mistral';
    aiPng = 'src/assets/images/mistral-color.png';
  }
  
  // Sitio detectado: ${aiSite}
  
  // Obtener parámetros de la URL que contienen el prompt
  const urlParams = new URLSearchParams(window.location.search);
  let prompt = '';
  
  // Diferentes sitios pueden usar diferentes parámetros para el prompt
  switch (aiSite) {
    case 'claude':
      prompt = urlParams.get('input') || '';
      break;
    default:
      prompt = urlParams.get('q') || '';
      break;
  }
  
  if (prompt) {
    
    // La función principal que evita el envío automático
    const preventAutoSubmit = () => {
      // Para cada sitio de IA, necesitamos un enfoque específico
      switch (aiSite) {
        case 'chatgpt':
          preventChatGPTAutoSubmit();
          break;
        case 'claude':
          preventClaudeAutoSubmit();
          break;
        case 'deepseek':
          preventDeepSeekAutoSubmit();
          break;
        case 'copilot':
          preventCopilotAutoSubmit();
          break;
        case 'gemini':
          preventGeminiAutoSubmit();
          break;
        case 'grok':
          preventGrokAutoSubmit();
          break;
        case 'meta':
          preventMetaAutoSubmit();
          break;
        case 'mistral':
          preventMistralAutoSubmit();
          break;
      }
    };
    
    // Funciones específicas para cada sitio
    const preventChatGPTAutoSubmit = () => {
      // Interceptar eventos de teclado para evitar envíos automáticos
      document.addEventListener('keydown', function(event) {
        // Verificar si es la tecla Enter y está siendo enviada programáticamente
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
      
      // Buscar y cancelar cualquier evento de envío automático
      setTimeout(() => {
        // Buscar el área de texto y asegurarnos de que solo tiene el prompt sin enviar
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          // Si encontramos textarea con el prompt, verificamos que no se envíe
          if (textarea.value && textarea.value.includes(prompt)) {
            // Desactivar cualquier listener que pudiera enviar el prompt
            const originalAddEventListener = textarea.addEventListener;
            textarea.addEventListener = function(type, listener, options) {
              if (type === 'keydown' || type === 'keypress' || type === 'submit') {
                return;
              }
              return originalAddEventListener.call(this, type, listener, options);
            };
          }
        });
      }, 500);
    };
    
    const preventClaudeAutoSubmit = () => {
      // Similar a ChatGPT pero adaptado para Claude
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
      
      // Para Claude podemos necesitar otros selectores
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea, [contenteditable="true"]');
        textareas.forEach(el => {
          if ((el.value && el.value.includes(prompt)) || 
              (el.textContent && el.textContent.includes(prompt))) {
            // Elemento con prompt encontrado en Claude
          }
        });
      }, 500);
    };
    
    // Para DeepSeek
    const preventDeepSeekAutoSubmit = () => {
      // Implementación similar a las anteriores
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    };
    
    // Para Copilot
    const preventCopilotAutoSubmit = () => {
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    };
    
    // Para Gemini
    const preventGeminiAutoSubmit = () => {
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    };
    
    // Para Grok
    const preventGrokAutoSubmit = () => {
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    };
    
    // Para Meta AI
    const preventMetaAutoSubmit = () => {
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    };
    
    // Para Mistral
    const preventMistralAutoSubmit = () => {
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.isTrusted) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    };
    
    // Ejecutar la función principal cuando la página esté lista
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(preventAutoSubmit, 100);
    } else {
      document.addEventListener('DOMContentLoaded', preventAutoSubmit);
    }
    
    // Adicionalmente, ejecutar una verificación después de que la página se cargue completamente
    window.addEventListener('load', () => {
      setTimeout(preventAutoSubmit, 500);
    });
  }
})(); 