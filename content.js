// Content script universal para insertar texto en múltiples sitios web

// Función para detectar el tipo de sitio web
function detectarSitio() {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) {
    return 'chatgpt';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  } else if (hostname.includes('google.com')) {
    return 'google';
  } else if (hostname.includes('facebook.com') || hostname.includes('meta.ai')) {
    return 'meta';
  } else if (hostname.includes('wikipedia.org')) {
    return 'wikipedia';
  } else if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
    return 'claude';
  } else if (hostname.includes('chat.deepseek.com')) {
    return 'deepseek';
  } else if (hostname.includes('copilot.microsoft.com')) {
    return 'copilot';
  } else if (hostname.includes('chat.mistral.ai')) {
    return 'mistral';
  } else if (hostname.includes('grok.x.ai')) {
    return 'grok';
  } else {
    return 'generico';
  }
}

// Selectores específicos por sitio web
function obtenerSelectores(sitio) {
  const selectores = {
    chatgpt: [
      'textarea[data-id]',
      'textarea[id*="prompt"]',
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="mensaje"]',
      'div[contenteditable="true"][role="textbox"]',
      'main textarea',
      'form textarea'
    ],
    
    gemini: [
      'div[contenteditable="true"][data-placeholder*="Enter a prompt"]',
      'div[contenteditable="true"][data-placeholder*="Introduce un mensaje"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][aria-label*="Message"]',
      'div[contenteditable="true"][aria-label*="Prompt"]',
      'textarea[placeholder*="Enter a prompt"]',
      'textarea[placeholder*="Introduce un mensaje"]',
      'rich-textarea div[contenteditable="true"]',
      '.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea[aria-label*="Message"]',
      'main textarea',
      'form textarea'
    ],
    
    google: [
      'input[name="q"]',
      'textarea[name="q"]',
      'input[title*="Buscar"]',
      'input[title*="Search"]',
      'input[role="combobox"]',
      'input[type="search"]',
      '#searchboxinput',
      '.gLFyf'
    ],
    
    meta: [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-text*="thinking"]',
      'div[contenteditable="true"][data-text*="pensando"]',
      'textarea[placeholder*="What\'s on your mind"]',
      'textarea[placeholder*="¿Qué estás pensando"]',
      'div[data-testid="status-attachment-mentions-input"]',
      '[role="textbox"]',
      'textarea'
    ],
    
    wikipedia: [
      'input[name="search"]',
      'input#searchInput',
      'input.searchboxInput',
      'textarea[name="wpTextbox1"]',  // Editor de Wikipedia
      'input[placeholder*="Search"]',
      'input[placeholder*="Buscar"]',
      'textarea',
      'input[type="search"]'
    ],
    
    claude: [
      'textarea[placeholder*="Talk to Claude"]',
      'textarea[placeholder*="Habla con Claude"]',
      'div[contenteditable="true"]',
      'textarea[data-id]',
      'main textarea',
      'form textarea',
      '[role="textbox"]',
      'textarea'
    ],
    
    deepseek: [
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Pregunta cualquier cosa"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[data-testid="chat-input"]',
      'main textarea',
      'form textarea',
      '[role="textbox"]',
      'textarea'
    ],
    
    copilot: [
      'textarea[placeholder*="Ask me anything"]',
      'textarea[placeholder*="Pregúntame cualquier cosa"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[data-testid="chat-input"]',
      'main textarea',
      'form textarea',
      '[role="textbox"]',
      'textarea'
    ],
    
    mistral: [
      'textarea[placeholder*="Type a message"]',
      'textarea[placeholder*="Escribe un mensaje"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[data-testid="chat-input"]',
      'main textarea',
      'form textarea',
      '[role="textbox"]',
      'textarea'
    ],
    
    grok: [
      'textarea[placeholder*="Ask Grok"]',
      'textarea[placeholder*="Pregunta a Grok"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[data-testid="chat-input"]',
      'main textarea',
      'form textarea',
      '[role="textbox"]',
      'textarea'
    ],
    
    generico: [
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="search"]:not([disabled])',
      'div[contenteditable="true"]',
      '[role="textbox"]',
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      'textarea'
    ]
  };
  
  return selectores[sitio] || selectores.generico;
}

// Función principal para insertar texto
function enviarTextoUniversal(texto) {
  const sitio = detectarSitio();
  const selectores = obtenerSelectores(sitio);

  for (let i = 0; i < selectores.length; i++) {
    const selector = selectores[i];
    
    try {
      const elemento = document.querySelector(selector);
      
      if (elemento) {
        if (elemento.offsetParent !== null && !elemento.disabled) {
          try {
            // Enfocar el elemento
            elemento.focus();
            elemento.click();
            
            // Limpiar contenido existente
            if (elemento.tagName === 'TEXTAREA' || elemento.tagName === 'INPUT') {
              elemento.value = '';
            } else if (elemento.contentEditable === 'true') {
              elemento.textContent = '';
              elemento.innerHTML = '';
            }
            
            // Pequeña pausa para que el sitio se prepare
            setTimeout(() => {
              // Insertar el texto
              if (elemento.tagName === 'TEXTAREA' || elemento.tagName === 'INPUT') {
                elemento.value = texto;
                elemento.dispatchEvent(new Event('input', { bubbles: true }));
                elemento.dispatchEvent(new Event('change', { bubbles: true }));
                elemento.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
              } else if (elemento.contentEditable === 'true') {
                
                // Para Gemini y otros editores rich text
                if (sitio === 'gemini') {
                  // Método específico para Gemini
                  elemento.innerHTML = texto;
                  elemento.textContent = texto;
                  
                  // Eventos específicos para Gemini
                  elemento.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                  elemento.dispatchEvent(new Event('keyup', { bubbles: true }));
                  elemento.dispatchEvent(new Event('paste', { bubbles: true }));
                  
                  // Simular typing para Gemini
                  const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: texto
                  });
                  elemento.dispatchEvent(inputEvent);
                } else {
                  // Método estándar para otros sitios
                  elemento.textContent = texto;
                  elemento.innerHTML = texto;
                  elemento.dispatchEvent(new Event('input', { bubbles: true }));
                  elemento.dispatchEvent(new Event('keyup', { bubbles: true }));
                  elemento.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: texto
                  }));
                }
              }
              
              // Eventos adicionales que algunos sitios necesitan
              elemento.dispatchEvent(new Event('focus', { bubbles: true }));
              elemento.dispatchEvent(new Event('blur', { bubbles: true }));
              elemento.focus(); // Volver a enfocar
              
            }, 100);
            
            return true;
            
          } catch (error) {
            console.error(`Error insertando con selector ${selector}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error con selector ${selector}:`, error);
    }
  }
  
  console.error('No se encontró ningún campo de texto válido en:', window.location.href);
  return false;
}

// Escuchar mensajes del background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertarTexto') {
    const exito = enviarTextoUniversal(request.texto);
    sendResponse({ success: exito });
    return true; // Importante: mantener el canal abierto para respuesta asíncrona
  }
  
  const action = request.action;
  const selectionText = request.selectionText || '';
  
  // Obtener el contenido de la página
  const pageContent = document.body.innerText;
  const pageTitle = document.title;
  const pageUrl = window.location.href;

  // Procesar la acción solicitada
  switch(action) {
    case 'resumen-completo':
      generarResumenCompleto(pageContent);
      break;
    case 'puntos-principales':
      identificarPuntosPrincipales(pageContent);
      break;
    // ... otros casos para cada acción
    default:
      console.log('Acción no reconocida:', action);
  }
  
  return true;
});

function generarResumenCompleto(content) {
  // Aquí iría la lógica para generar el resumen
  // En una implementación real, podrías usar una API de IA o un algoritmo propio
  
  // Ejemplo simplificado: tomar las primeras 3 oraciones
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const summary = sentences.slice(0, 3).join('. ') + '.';
  
  mostrarResultado(summary, 'Resumen completo');
}

function identificarPuntosPrincipales(content) {
  // Lógica para identificar puntos clave...
  mostrarResultado("Puntos principales identificados (ejemplo)", "Puntos clave");
}

function mostrarResultado(texto, titulo) {
  // Crear un overlay para mostrar el resultado
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '20px';
  overlay.style.right = '20px';
  overlay.style.width = '300px';
  overlay.style.padding = '15px';
  overlay.style.backgroundColor = '#fff';
  overlay.style.border = '1px solid #ddd';
  overlay.style.borderRadius = '5px';
  overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  overlay.style.zIndex = '9999';
  
  const titleEl = document.createElement('h3');
  titleEl.textContent = titulo;
  titleEl.style.marginTop = '0';
  
  const contentEl = document.createElement('p');
  contentEl.textContent = texto;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Cerrar';
  closeBtn.style.marginTop = '10px';
  closeBtn.onclick = () => overlay.remove();
  
  overlay.appendChild(titleEl);
  overlay.appendChild(contentEl);
  overlay.appendChild(closeBtn);
  
  document.body.appendChild(overlay);
}