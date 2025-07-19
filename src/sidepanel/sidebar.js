// Importar funciones y variables compartidas desde el módulo común
import {
  config,
  tryReadClipboard,
  requestClipboardPermission,
  updateContextDisplay,
  getAIModelName,
  changeLanguage,
  changeAIModel,
  changeContext,
  showSettingsMenu,
  hideSettingsMenu,
  renderSections,
  closeLanguageDropdown,
  updateLanguageButtonIcon,
  loadMenuData,
  loadAvailableLanguages,
  generateLanguageOptions,
  generateLanguageSelectorOptions,
  saveMainConfig,
  loadMainConfig,
  textPrompt,
  confirmPrompt,
  isAISupportedURL,
  sendTextToAI,
  isClipboardBehaviorContext, // Import the moved function
  openAIWithPrompt, // Añadir import para openAIWithPrompt
  openAIWithPromptOnly // Añadir import para openAIWithPromptOnly
} from '/src/common/common.js';

import { updateUITexts, getTranslation, updateDirectQuestionButtonText } from '/src/content-script/translations.js';

// Guardar configuración al cerrar la sidebar
window.addEventListener('beforeunload', function () {
  saveMainConfig();
});

// Guardar configuración al cambiar la visibilidad de la página
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') {
    saveMainConfig();
  }
});

// Función auxiliar para copiar contenido al portapapeles del sistema
async function copyToSystemClipboard(text) {
  try {
    console.log('🔄 Copiando al portapapeles del sistema...');
    
    // Método principal: Chrome Extension Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      console.log('✅ Contenido copiado al portapapeles del sistema usando API moderna');
      return true;
    } else {
      throw new Error('API de portapapeles no disponible');
    }
  } catch (error) {
    console.warn('Error con API principal, usando método alternativo:', error);

    // Método alternativo mejorado
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = `
        position: fixed;
        top: -1000px;
        left: -1000px;
        opacity: 0;
        pointer-events: none;
        z-index: -1000;
      `;

      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        console.log('✅ Contenido copiado al portapapeles del sistema usando método alternativo');
        return true;
      } else {
        throw new Error('execCommand falló');
      }
    } catch (fallbackError) {
      console.error('❌ Error en todos los métodos de copia al portapapeles del sistema:', fallbackError);
      return false;
    }
  }
}

// Función auxiliar para abrir una nueva pestaña con texto extraído
function openTextWindow(text, title = 'Contenido Extraído') {
  try {
    console.log('🪟 Abriendo nueva pestaña con texto extraído...');
    
    // Escapar HTML para evitar problemas de renderizado
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Crear contenido HTML con formato mejorado
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AI Prompt Assistant</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1DA1F2, #1991DA);
            color: white;
            padding: 20px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .text-content {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 70vh;
            overflow-y: auto;
            color: #333;
        }
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #1DA1F2, #1991DA);
            color: white;
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #1991DA, #1580C1);
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }
        .stats {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        }
        .stats-item {
            display: inline-block;
            margin: 0 15px;
            font-weight: 500;
        }
        .stats-value {
            color: #1976d2;
            font-size: 18px;
        }
        
        /* Scrollbar personalizada */
        .text-content::-webkit-scrollbar {
            width: 8px;
        }
        .text-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        .text-content::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
        }
        .text-content::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .header {
                padding: 15px 20px;
            }
            .btn {
                padding: 10px 20px;
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐦 ${title}</h1>
            <p>Contenido extraído y copiado al portapapeles - ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stats-item">
                    <span class="stats-value">${text.split('\\n').length}</span>
                    <span>líneas</span>
                </div>
                <div class="stats-item">
                    <span class="stats-value">${text.length.toLocaleString()}</span>
                    <span>caracteres</span>
                </div>
                <div class="stats-item">
                    <span class="stats-value">${text.split(' ').length.toLocaleString()}</span>
                    <span>palabras</span>
                </div>
            </div>
            
            <div class="text-content" id="textContent">${escapedText}</div>
            
            <div class="actions">
                <button class="btn btn-primary" onclick="copyToClipboard()">
                    📋 Copiar Todo
                </button>
                <button class="btn btn-secondary" onclick="selectAll()">
                    🔘 Seleccionar Todo
                </button>
                <button class="btn btn-secondary" onclick="downloadAsFile()">
                    💾 Descargar
                </button>
            </div>
        </div>
    </div>

    <script>
        // Función para copiar todo el contenido
        async function copyToClipboard() {
            try {
                const content = document.getElementById('textContent').textContent;
                await navigator.clipboard.writeText(content);
                showNotification('✅ Contenido copiado al portapapeles');
            } catch (error) {
                console.error('Error al copiar:', error);
                showNotification('❌ Error al copiar al portapapeles');
            }
        }

        // Función para seleccionar todo el texto
        function selectAll() {
            const textContent = document.getElementById('textContent');
            const range = document.createRange();
            range.selectNodeContents(textContent);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            showNotification('✅ Todo el texto seleccionado');
        }

        // Función para descargar como archivo
        function downloadAsFile() {
            const content = document.getElementById('textContent').textContent;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tweets_extraidos_' + new Date().toISOString().slice(0, 10) + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showNotification('✅ Archivo descargado');
        }

        // Función para mostrar notificaciones
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 1000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
            \`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // Añadir animaciones CSS
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;

    // Crear un blob con el contenido HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Abrir nueva pestaña con el contenido
    const newTab = window.open(url, '_blank');
    
    if (newTab) {
      console.log('✅ Nueva pestaña abierta con contenido extraído');
      
      // Limpiar el blob URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000); // 1 minuto
    } else {
      console.error('❌ No se pudo abrir la nueva pestaña. Verifica que los popups no estén bloqueados.');
    }
    
  } catch (error) {
    console.error('❌ Error al abrir ventana con texto:', error);
  }
}

// Función para mapear el contexto al ID del botón correspondiente
function getButtonIdFromContext(context) {
  const mapping = {
    'url': 'use-url',
    'clipboard': 'use-clipb',
    'book': 'use-book',
    'pdf': 'use-pdf',
    'wiki': 'use-wiki',
    'twitter': 'use-twitter',
    'gmail': 'use-gmail',
    '+add+': 'use-add'
  };

  return mapping[context] || 'use-url'; // Devuelve 'use-url' como fallback
}

// Función para obtener el contexto a partir del ID del botón
function getContextFromButtonId(buttonId) {
  const mapping = {
    'use-url': 'url',
    'use-clipb': 'clipboard',
    'use-book': 'book',
    'use-pdf': 'pdf',
    'use-wiki': 'wiki',
    'use-twitter': 'twitter',
    'use-gmail': 'gmail',
    'use-add': '+add+'
  };

  return mapping[buttonId] || 'url'; // Devuelve 'url' como fallback
}

// Función para extraer y copiar contenido de Gmail - VERSIÓN COMPLETAMENTE REESCRITA 2024
function extractAndCopyGmailContent() {
  // Crear notificación mejorada
  const notification = document.createElement('div');
  notification.textContent = '📧 Iniciando captura con scroll automático...';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #EA4335, #D33B2C);
    color: white;
    padding: 15px 25px;
    border-radius: 25px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(234, 67, 53, 0.3);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  `;
  document.body.appendChild(notification);

  // Función optimizada para ir al inicio específica para Gmail - MEJORADA PARA CONVERSACIONES
  async function scrollToTop() {
    notification.textContent = '⬆️ Navegando al inicio de la conversación...';
    
    // Método 1: Scroll de TODOS los contenedores principales de Gmail
    const gmailContainers = [
      document.querySelector('div[role="main"]'),        // Contenedor principal
      document.querySelector('.nH'),                     // Contenedor nH
      document.querySelector('.oy8Mbf'),                 // Contenedor oy8Mbf
      document.querySelector('.Tm.aeJ'),                 // Contenedor Tm aeJ
      document.querySelector('main'),                    // Elemento main
      document.querySelector('.adf'),                    // Contenedor adf
      document.querySelector('.Bs.nH'),                  // Contenedor Bs nH
      document.querySelector('.no'),                     // Contenedor no
      document.querySelector('.nH.if'),                  // Contenedor nH if
      document.querySelector('.nH.nn'),                  // Contenedor nH nn
      document.querySelector('[data-action-data]'),      // Contenedor con data-action
      document.querySelector('.nH .if .nH')              // Contenedor anidado
    ];
    
    gmailContainers.forEach(container => {
      if (container) {
        container.scrollTop = 0;
        console.log(`📧 Scroll al inicio del contenedor Gmail: ${container.className || container.tagName}`);
      }
    });

    // Método 2: Scroll de TODOS los contenedores de conversación
    const conversationContainers = [
      document.querySelector('.ii.gt'),                  // Contenedor principal mensaje
      document.querySelector('.adn.ads'),               // Contenedor ads
      document.querySelector('.zA'),                     // Contenedor zA
      document.querySelector('.gs'),                     // Contenedor gs
      document.querySelector('.h7'),                     // Contenedor h7
      document.querySelector('.nH .if'),                 // Contenedor if
      document.querySelector('div[data-thread-id]'),     // Thread container
      document.querySelector('div[data-legacy-thread-id]'), // Legacy thread
      document.querySelector('.thread-item'),            // Thread item
      document.querySelector('.message-container'),      // Message container
      document.querySelector('div[role="listitem"]'),    // List item
      document.querySelector('table[role="grid"]'),      // Grid table
      document.querySelector('tbody'),                   // Table body
      document.querySelector('div[jsname]'),             // JSName container
      document.querySelector('div[data-message-id]')     // Message ID container
    ];
    
    conversationContainers.forEach(container => {
      if (container) {
        container.scrollTop = 0;
        console.log(`📧 Scroll al inicio del contenedor de conversación: ${container.className || container.tagName}`);
      }
    });

    // Método 3: Scroll de elementos scrollables ocultos
    const scrollableElements = document.querySelectorAll('div[style*="overflow"], div[style*="scroll"]');
    scrollableElements.forEach(element => {
      if (element.scrollHeight > element.clientHeight) {
        element.scrollTop = 0;
        console.log(`📧 Scroll al inicio de elemento scrollable`);
      }
    });

    // Método 4: Scroll del window (como Twitter)
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    console.log('📧 Scroll al inicio completado - esperando carga de contenido...');
    await new Promise(resolve => setTimeout(resolve, 1200)); // Más tiempo para cargar contenido
  }

  // Función auxiliar para realizar scroll específico de Gmail MEJORADA
  async function performGmailScroll(scrollDistance) {
    let scrollPerformed = false;
    
    // Método 1: Scroll de contenedores principales de Gmail ACTUALIZADOS
    const gmailContainers = [
      document.querySelector('div[role="main"]'),        // Contenedor principal
      document.querySelector('.nH'),                     // Contenedor nH
      document.querySelector('.oy8Mbf'),                 // Contenedor oy8Mbf
      document.querySelector('.Tm.aeJ'),                 // Contenedor Tm aeJ
      document.querySelector('main'),                    // Elemento main
      document.querySelector('.adf'),                    // Contenedor adf
      document.querySelector('.Bs.nH'),                  // Contenedor Bs nH
      document.querySelector('.no'),                     // Contenedor no
      document.querySelector('.nH.if'),                  // Contenedor nH if
      document.querySelector('.nH.nn'),                  // Contenedor nH nn
      document.querySelector('[data-action-data]'),      // Contenedor con data-action
      document.querySelector('.nH .if .nH')              // Contenedor anidado
    ];
    
    gmailContainers.forEach(container => {
      if (container && container.scrollHeight > container.clientHeight) {
        container.scrollTop += scrollDistance;
        console.log(`📧 Scroll en contenedor Gmail: ${container.className} - ${container.scrollTop}`);
        scrollPerformed = true;
      }
    });

    // Método 2: Scroll de contenedores de conversación ESPECÍFICOS
    const conversationContainers = [
      document.querySelector('.ii.gt'),                  // Contenedor principal mensaje
      document.querySelector('.adn.ads'),               // Contenedor ads
      document.querySelector('.zA'),                     // Contenedor zA
      document.querySelector('.gs'),                     // Contenedor gs
      document.querySelector('.h7'),                     // Contenedor h7
      document.querySelector('.nH .if'),                 // Contenedor if
      document.querySelector('div[data-thread-id]'),     // Thread container
      document.querySelector('div[data-legacy-thread-id]'), // Legacy thread
      document.querySelector('.thread-item'),            // Thread item
      document.querySelector('.message-container'),      // Message container
      document.querySelector('div[role="listitem"]'),    // List item
      document.querySelector('table[role="grid"]'),      // Grid table
      document.querySelector('tbody'),                   // Table body
      document.querySelector('div[jsname]'),             // JSName container
      document.querySelector('div[data-message-id]')     // Message ID container
    ];
    
    conversationContainers.forEach(container => {
      if (container && container.scrollHeight > container.clientHeight) {
        container.scrollTop += scrollDistance;
        console.log(`📧 Scroll en contenedor de conversación: ${container.className} - ${container.scrollTop}`);
        scrollPerformed = true;
      }
    });

    // Método 3: Scroll del window (siempre activo)
    window.scrollBy({
      top: scrollDistance,
      behavior: 'smooth'
    });

    // Método 4: Scroll forzado del documento
    setTimeout(() => {
      document.documentElement.scrollTop += scrollDistance;
      document.body.scrollTop += scrollDistance;
    }, 100);

    // Método 5: Scroll específico para SCROLLBARS OCULTOS en Gmail
    const scrollableElements = document.querySelectorAll('div[style*="overflow"], div[style*="scroll"]');
    scrollableElements.forEach(element => {
      if (element.scrollHeight > element.clientHeight) {
        element.scrollTop += scrollDistance;
        console.log(`📧 Scroll en elemento scrollable: ${element.scrollTop}`);
      }
    });

    if (scrollPerformed) {
      console.log(`✅ Scroll realizado exitosamente: ${scrollDistance}px`);
    }
  }

  // Función auxiliar para obtener la altura de scroll de Gmail MEJORADA
  function getGmailScrollHeight() {
    // Intentar obtener altura de múltiples contenedores de Gmail
    const gmailContainers = [
      document.querySelector('div[role="main"]'),        // Contenedor principal
      document.querySelector('.nH'),                     // Contenedor nH
      document.querySelector('.oy8Mbf'),                 // Contenedor oy8Mbf
      document.querySelector('.Tm.aeJ'),                 // Contenedor Tm aeJ
      document.querySelector('main'),                    // Elemento main
      document.querySelector('.adf'),                    // Contenedor adf
      document.querySelector('.Bs.nH'),                  // Contenedor Bs nH
      document.querySelector('.no'),                     // Contenedor no
      document.querySelector('.nH.if'),                  // Contenedor nH if
      document.querySelector('.nH.nn'),                  // Contenedor nH nn
      document.querySelector('[data-action-data]'),      // Contenedor con data-action
      document.querySelector('.nH .if .nH'),             // Contenedor anidado
      document.querySelector('div[data-thread-id]'),     // Thread container
      document.querySelector('div[data-legacy-thread-id]'), // Legacy thread
      document.querySelector('.thread-item'),            // Thread item
      document.querySelector('.message-container'),      // Message container
      document.querySelector('table[role="grid"]'),      // Grid table
      document.querySelector('tbody')                    // Table body
    ];
    
    // Encontrar el contenedor con mayor altura de scroll
    let maxHeight = 0;
    gmailContainers.forEach(container => {
      if (container && container.scrollHeight > maxHeight) {
        maxHeight = container.scrollHeight;
        console.log(`📧 Altura máxima encontrada en: ${container.className || container.tagName} - ${maxHeight}px`);
      }
    });
    
    if (maxHeight > 0) {
      return maxHeight;
    }

    // Fallback a la altura del documento
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    
    console.log(`📧 Usando altura del documento como fallback: ${documentHeight}px`);
    return documentHeight;
  }

  async function scrollAndCollectEmails() {
    await scrollToTop();

    // Tiempo adicional para que Gmail cargue el contenido completo
    console.log('⏳ Esperando carga completa de conversación...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const processedEmailIds = new Set();
    let allEmails = [];
    let lastHeight = getGmailScrollHeight();
    let stagnantScrollCount = 0;
    let scrollAttempts = 0;

    // Configuración optimizada para Gmail 2024 - MÁXIMO 30 EMAILS CON SCROLL AUTOMÁTICO AGRESIVO
    const MAX_SCROLL_ATTEMPTS = 150; // Más intentos para conversaciones largas
    const MAX_STAGNANT_ATTEMPTS = 20; // Más persistencia para conversaciones complejas
    const SCROLL_DISTANCE = 1200; // Scroll más agresivo para conversaciones
    const SCROLL_DELAY = 800; // Más tiempo para carga de contenido dinámico
    const MAX_EMAILS = 30; // LÍMITE MÁXIMO: 30 emails

    // Función principal de scroll y captura
    async function performScrollAndExtract() {
      scrollAttempts++;

      if (scrollAttempts > MAX_SCROLL_ATTEMPTS) {
        return await finalizeEmailCollection();
      }

      // Actualizar notificación con progreso detallado
      notification.textContent = `🔄 Scroll automático... (${allEmails.length}/${MAX_EMAILS}) - Intento ${scrollAttempts}/${MAX_SCROLL_ATTEMPTS}`;

      // SELECTORES ACTUALIZADOS Y ROBUSTOS para conversaciones de Gmail 2024
      const emailSelectors = [
        // Selectores principales para CONVERSACIONES ABIERTAS
        'div[data-message-id]',                    // Mensaje principal con ID
        'tr[data-message-id]',                     // Fila con mensaje ID
        '[data-message-id]',                       // Cualquier elemento con mensaje ID
        
        // Contenedores de mensaje específicos para CONVERSACIONES
        '.ii.gt',                                  // Contenedor principal de mensaje 
        'div[jsname] .ii.gt',                      // ii.gt dentro de jsname
        '.adn.ads .ii.gt',                         // ii.gt en ads
        '.gs .ii.gt',                              // ii.gt en gs
        'div[role="listitem"] .ii.gt',             // ii.gt en listitem
        
        // Elementos de CONVERSACIÓN ESPECÍFICOS
        'div[role="listitem"]',                    // Items de lista principal
        '.nH .if',                                 // Contenedor if en nH
        '.h7',                                     // Contenedor h7
        'tr.zA',                                   // Fila zA
        '.zA',                                     // Elemento zA
        '.gs',                                     // Elemento gs
        'div[data-thread-id]',                     // Elementos con thread ID
        
        // Selectores para ELEMENTOS DE EMAIL INDIVIDUALES
        'div[jsname]',                             // Elementos con jsname
        'tr[jsname]',                              // Filas con jsname  
        'div[data-tid]',                           // Elementos con data-tid
        'table[role="grid"] tr',                   // Filas de tabla grid
        'div[data-legacy-thread-id]',              // Legacy thread ID
        
        // Selectores para CONVERSACIONES DINÁMICAS
        'div[dir="ltr"][role="listitem"]',         // Items LTR
        'main div[role="main"] div',               // Divs en main
        '[aria-label*="conversation" i]',          // Conversación en aria-label
        '[aria-label*="message" i]',               // Mensaje en aria-label
        '[aria-label*="email" i]',                 // Email en aria-label
        
        // Selectores ESPECÍFICOS para GMAIL NUEVO
        'div[data-legacy-thread-id]',              // Thread legacy
        '.thread-item',                            // Items de thread
        '.message-container',                      // Contenedor de mensaje
        '.email-container',                        // Contenedor de email
        'div[data-message-id][jsname]',            // Mensaje con jsname
        'tr[data-message-id][jsname]',             // Fila con jsname
        
        // Selectores de FALLBACK MEJORADOS
        'div[class*="ii"]',                        // Cualquier div con ii
        'tr[class*="zA"]',                         // Cualquier tr con zA
        'div[class*="gs"]',                        // Cualquier div con gs
        'div[class*="h7"]',                        // Cualquier div con h7
        '[data-thread-perm-id]',                   // Thread permanente ID
        '[data-smartmail]',                        // Smart mail
        'div[contenteditable="true"]',             // Contenido editable
        
        // Selectores ULTRA-ESPECÍFICOS para CONTENIDO
        'div[role="main"] div[jsname]',            // jsname en main
        'table[role="grid"] tbody tr',             // Filas de tabla
        'main section div',                        // Divs en section
        'div[aria-expanded="true"]',               // Contenido expandido
        'div[data-action-data]'                    // Data action
      ];

      let emailElements = [];
      
      // Buscar con múltiples selectores hasta encontrar emails
      for (const selector of emailSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          emailElements = Array.from(elements);
          console.log(`✅ Encontrados ${elements.length} elementos de email con selector: ${selector}`);
          break;
        }
      }

      // Si no encontramos con selectores específicos, buscar de forma más general
      if (emailElements.length === 0) {
        console.log('⚠️ No se encontraron elementos con selectores específicos. Intentando fallback...');
        
        // Buscar cualquier elemento que contenga estructura típica de email
        const allPotentialEmails = document.querySelectorAll('div, tr, article, [role="listitem"], table, tbody, section, main');
        emailElements = Array.from(allPotentialEmails).filter(el => {
          // Filtrar elementos que parezcan emails por su contenido
          const hasEmailStructure = el.textContent && el.textContent.trim().length > 50;
          const hasTimeOrDate = el.querySelector('time') || el.textContent.includes(':') || el.textContent.includes('AM') || el.textContent.includes('PM');
          const hasEmailSigns = el.textContent.includes('@') || el.querySelector('span[email]') || el.querySelector('[data-hovercard-id]');
          const hasMessageId = el.getAttribute('data-message-id') || el.querySelector('[data-message-id]');
          const hasEmailClasses = el.className.includes('ii') || el.className.includes('zA') || el.className.includes('gs') || el.className.includes('h7');
          const hasJsName = el.getAttribute('jsname') || el.querySelector('[jsname]');
          
          return hasMessageId || hasEmailClasses || hasJsName || (hasEmailStructure && (hasTimeOrDate || hasEmailSigns));
        });
        
        console.log(`🔍 Fallback: Encontrados ${emailElements.length} elementos con estructura de email`);
      }

      // Debug: Mostrar información sobre los elementos encontrados
      console.log(`📊 Total elementos encontrados: ${emailElements.length}`);
      if (emailElements.length > 0) {
        console.log(`📊 Muestra de elementos encontrados:`, emailElements.slice(0, 3).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          hasMessageId: !!el.getAttribute('data-message-id'),
          hasJsName: !!el.getAttribute('jsname'),
          textLength: el.textContent?.length || 0,
          textPreview: el.textContent?.substring(0, 100) + '...'
        })));
      }

      let newEmailsInThisStep = 0;

      for (const element of emailElements) {
        try {
          // IDENTIFICACIÓN ÚNICA MEJORADA con múltiples métodos
          let emailId = '';
          
          // Método 1: data-message-id (principal)
          emailId = element.getAttribute('data-message-id');
          
          // Método 2: data-legacy-thread-id
          if (!emailId) emailId = element.getAttribute('data-legacy-thread-id');
          
          // Método 3: ID único del elemento
          if (!emailId) emailId = element.getAttribute('id');
          
          // Método 4: Buscar data-message-id en hijos
          if (!emailId) emailId = element.querySelector('[data-message-id]')?.getAttribute('data-message-id');
          
          // Método 5: jsname como identificador
          if (!emailId) emailId = element.getAttribute('jsname');
          
          // Método 6: data-tid como identificador
          if (!emailId) emailId = element.getAttribute('data-tid');
          
          // Método 7: Hash del contenido del remitente + asunto
          if (!emailId) {
            const senderText = element.textContent?.match(/@[\w.-]+/)?.[0] || '';
            const subjectText = element.textContent?.trim().substring(0, 50) || '';
            if (senderText || subjectText) {
              emailId = `content-${(senderText + subjectText).replace(/\s+/g, '').substring(0, 30)}-${Date.now()}`;
            }
          }
          
          // Método 8: Posición como último recurso
          if (!emailId) {
            const rect = element.getBoundingClientRect();
            emailId = `pos-${Math.floor(rect.top)}-${Math.floor(rect.left)}-${Date.now()}`;
          }

          if (!processedEmailIds.has(emailId)) {
            processedEmailIds.add(emailId);

            // Extraer datos mejorados
            const emailData = extractEmailDataAdvanced(element);

            if (emailData.isValid) {
              allEmails.push(emailData);
              newEmailsInThisStep++;
              console.log(`📧 Email ${allEmails.length}: ${emailData.sender} - ${emailData.subject.substring(0, 30)}...`);

              // Límite de emails alcanzado
              if (allEmails.length >= MAX_EMAILS) {
                return await finalizeEmailCollection();
              }
            }
          }
        } catch (error) {
          console.error('❌ Error procesando email:', error);
        }
      }

      // Control de progreso del scroll
      if (newEmailsInThisStep > 0) {
        stagnantScrollCount = 0;
        console.log(`✅ Encontrados ${newEmailsInThisStep} emails nuevos en este paso`);
      } else {
        stagnantScrollCount++;
        console.log(`⚠️ No se encontraron emails nuevos. Intentos estancados: ${stagnantScrollCount}/${MAX_STAGNANT_ATTEMPTS}`);
      }

      // SCROLL AUTOMÁTICO MEJORADO ESPECÍFICO PARA GMAIL - IGUAL QUE TWITTER
      await performGmailScroll(SCROLL_DISTANCE);

      // También hacer scroll forzado del window como en Twitter
      window.scrollBy({
        top: SCROLL_DISTANCE,
        behavior: 'smooth'
      });

      // Scroll forzado adicional si el smooth no funciona
      setTimeout(() => {
        document.documentElement.scrollTop += SCROLL_DISTANCE;
        document.body.scrollTop += SCROLL_DISTANCE;
      }, 100);

      // Esperar tiempo optimizado para Gmail
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      const currentHeight = getGmailScrollHeight();
      const hasNewContent = currentHeight > lastHeight;

      // Continuar si hay nuevos emails o contenido - SCROLL AUTOMÁTICO CONTINUO
      if ((hasNewContent || stagnantScrollCount < MAX_STAGNANT_ATTEMPTS) && allEmails.length < MAX_EMAILS) {
        lastHeight = currentHeight;
        await performScrollAndExtract();
      } else {
        console.log(`🏁 Finalizando extracción de Gmail. Total emails: ${allEmails.length}`);
        return await finalizeEmailCollection();
      }
    }

    // Función auxiliar para convertir HTML a texto plano
    function htmlToPlainText(element) {
      if (!element) return '';
      
      // Crear un clon del elemento para no modificar el original
      const clone = element.cloneNode(true);
      
      // Remover elementos no deseados EXPANDIDO
      const unwantedSelectors = [
        'script', 'style', 'noscript', 'iframe', 'object', 'embed',
        '.gmail_quote', '.gmail_signature', '.gmail_extra',
        '.moz-cite-prefix', '.yahoo_quoted', '.outlook_quoted',
        '[data-smartmail="gmail_signature"]',
        'div[class*="signature"]', 'div[class*="quote"]',
        'div[class*="footer"]', 'div[class*="disclaimer"]',
        '.moz-forward-container', '.moz-email-headers-table',
        'blockquote[type="cite"]', 'blockquote.gmail_quote',
        '[data-ogsc]', '[data-ogsb]', // Outlook tracking
        'img[src*="tracking"]', 'img[src*="pixel"]', // Tracking pixels
        'meta', 'link', 'head', 'title'
      ];
      
      unwantedSelectors.forEach(selector => {
        const elements = clone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      // Procesar elementos HTML especiales para mejor conversión
      const htmlElements = clone.querySelectorAll('*');
      htmlElements.forEach(el => {
        const tagName = el.tagName.toLowerCase();
        
        // Convertir elementos de lista a texto con formato
        if (tagName === 'li') {
          const textContent = el.textContent?.trim();
          if (textContent) {
            el.textContent = `• ${textContent}`;
          }
        }
        
        // Convertir enlaces a texto con URL
        if (tagName === 'a') {
          const href = el.getAttribute('href');
          const text = el.textContent?.trim();
          if (href && text && href !== text) {
            el.textContent = `${text} (${href})`;
          }
        }
        
        // Convertir elementos de encabezado con formato
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          const text = el.textContent?.trim();
          if (text) {
            el.textContent = `\n${text.toUpperCase()}\n`;
          }
        }
        
        // Convertir elementos de tabla a texto estructurado
        if (tagName === 'td' || tagName === 'th') {
          const text = el.textContent?.trim();
          if (text) {
            el.textContent = `${text} | `;
          }
        }
        
        // Manejar elementos de párrafo
        if (tagName === 'p') {
          const text = el.textContent?.trim();
          if (text) {
            el.textContent = `\n${text}\n`;
          }
        }
        
        // Convertir elementos de división con saltos de línea
        if (tagName === 'div') {
          const text = el.textContent?.trim();
          if (text && text.length > 20) {
            el.textContent = `\n${text}`;
          }
        }
      });
      
      // Reemplazar elementos de bloque con saltos de línea apropiados
      const blockElements = clone.querySelectorAll('div, p, br, h1, h2, h3, h4, h5, h6, li, tr, td, th, blockquote, pre, article, section, header, footer, aside, nav, main');
      blockElements.forEach(el => {
        if (el.tagName === 'BR') {
          el.replaceWith('\n');
        } else {
          // Añadir salto de línea antes del contenido para separar bloques
          const textNode = document.createTextNode('\n');
          el.parentNode?.insertBefore(textNode, el);
        }
      });
      
      // Obtener texto plano
      let text = clone.textContent || clone.innerText || '';
      
      // Limpiar texto de manera más agresiva
      text = text
        .replace(/\s+/g, ' ')              // Múltiples espacios -> uno solo
        .replace(/\n\s*\n/g, '\n')         // Múltiples saltos -> uno solo
        .replace(/^\s+|\s+$/g, '')         // Espacios al inicio/final
        .replace(/\n{3,}/g, '\n\n')        // Máximo 2 saltos consecutivos
        .replace(/\|\s*\|/g, '|')          // Limpiar separadores de tabla
        .replace(/\n\s*\n/g, '\n')         // Segundo pase de limpieza
        .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1 $2') // Unir líneas de párrafos
        .replace(/\n\s*([•\-\*])/g, '\n$1') // Ajustar formato de listas
        .trim();
      
      return text;
    }

    // Función AVANZADA para extraer datos de un email individual - REESCRITA 2024
    function extractEmailDataAdvanced(element) {
      let sender = '';
      let subject = '';
      let snippet = '';
      let timestamp = '';
      let emailBody = '';

      try {
        // EXTRACCIÓN DE REMITENTE - Múltiples estrategias
        const senderSelectors = [
          // Selectores principales para remitente Gmail 2024
          'span[email]',                    // Atributo email directo
          '[data-hovercard-id]',           // ID de hover card
          '.go span[email]',               // Contenedor go con email
          '.yW span',                      // Clase yW común
          '.bA4 span',                     // Otra clase común
          '.yP',                           // Clase de persona
          '.a4W',                          // Alternativo
          'span[name]',                    // Atributo name
          '.qu [role="gridcell"] span:first-child',  // Grid cell
          '.yW .yX span',                  // Combinación yW yX
          'td .yW span',                   // En tabla
          '.bog .yW span',                 // Con bog
          'h3 span',                       // En header h3
          '[title*="@"]',                  // Cualquier elemento con @ en title
          
          // Selectores adicionales 2024
          '.c6 span',                      // Clase c6
          '.bw span',                      // Clase bw
          '.qg span',                      // Clase qg
          'span[dir="auto"]',              // Dirección auto
          '.y6 span',                      // Clase y6
          '.gs .y6',                       // y6 en gs
          '.h7 span',                      // Span en h7
          '.nH .if span',                  // Span en contenedor específico
          'div[data-hovercard-id] span',   // Span con hovercard
          '.bA4 .yW span',                 // Combinación bA4 yW
          
          // Fallbacks genéricos
          '[role="button"] span',          // Botón span
          'div[jsname] span',              // JSName span
          'tr[jsname] span',               // TR JSName span
          'td span:first-child',           // Primer span en TD
          '.zA span:first-child',          // Primer span en zA
          '[aria-label*="from" i] span',   // Aria label "from"
          '[aria-label*="de" i] span'      // Aria label "de"
        ];

        for (const selector of senderSelectors) {
          try {
            const senderElement = element.querySelector(selector);
            if (senderElement) {
              sender = senderElement.textContent?.trim() ||
                senderElement.getAttribute('email') ||
                senderElement.getAttribute('name') ||
                senderElement.getAttribute('title') || '';
              if (sender && sender.length > 2 && !sender.includes('AM') && !sender.includes('PM')) {
                break;
              }
            }
          } catch (e) { /* continuar con siguiente selector */ }
        }

        // EXTRACCIÓN DE ASUNTO - Múltiples estrategias
        const subjectSelectors = [
          // Selectores principales para asunto
          'h2',                            // Header h2 principal
          '.bog',                          // Clase bog
          '.y6 span',                      // Clase y6
          '.aLF .subject',                 // Subject class
          '[data-thread-perm-id] b',       // Thread con bold
          '.y6',                           // Solo y6
          '.bqe',                          // Clase bqe
          '.qu span[id] b',                // Con ID y bold
          '.gs .subject',                  // Gmail subject
          '.thread-content .subject',      // Thread content
          'h3',                            // Header h3
          '.hP',                           // Clase hP
          '.bzf',                          // Clase bzf
          
          // Selectores adicionales 2024
          '.bog span',                     // Span en bog
          '.ao4 span',                     // Clase ao4
          '.bqe span',                     // Span en bqe
          '.y6 > span',                    // Span hijo directo de y6
          '.gs .y6 span',                  // y6 span en gs
          '.h7 .bog',                      // bog en h7
          '.nH .if .bog',                  // bog en contenedor específico
          'b',                             // Cualquier bold
          'strong',                        // Cualquier strong
          '[data-thread-perm-id] span',    // Span con thread perm id
          'div[dir="ltr"] b',              // Bold en LTR
          '.zA .bog',                      // bog en zA
          
          // Fallbacks genéricos
          'div[jsname] b',                 // Bold en JSName
          'tr[jsname] b',                  // Bold en TR JSName
          'td b',                          // Bold en TD
          '[aria-label*="subject" i]',     // Aria label "subject"
          '[aria-label*="asunto" i]'       // Aria label "asunto"
        ];

        for (const selector of subjectSelectors) {
          try {
            const subjectElement = element.querySelector(selector);
            if (subjectElement) {
              subject = subjectElement.textContent?.trim() || '';
              if (subject && subject.length > 3 && !subject.includes('AM') && !subject.includes('PM') && !subject.includes('@')) {
                break;
              }
            }
          } catch (e) { /* continuar con siguiente selector */ }
        }

        // EXTRACCIÓN DE CONTENIDO/SNIPPET - Múltiples estrategias MEJORADAS
        const contentSelectors = [
          // Selectores principales para contenido HTML COMPLETO
          '.ii.gt',                        // Contenedor principal del mensaje
          '.ii.gt > div',                  // Div directo dentro de ii gt
          '.ii.gt div[dir]',               // Div con dirección dentro de ii gt
          '.adn.ads .ii.gt',               // Ads content
          'div[data-message-id] .ii.gt',   // Mensaje específico
          
          // Selectores específicos para emails HTML EXPANDIDOS
          '.ii.gt .a3s.aiL',               // Contenido principal del mensaje HTML
          '.ii.gt .a3s.aXjCH',             // Variante de contenido HTML
          '.ii.gt .a3s',                   // Cualquier contenido a3s
          '.a3s.aiL',                      // Contenido independiente
          '.Am.Al.editable',               // Contenido editable específico
          '.ii.gt .a3s.aiL .a3s.aXjCH',    // Contenido específico HTML
          '.ii.gt .a3s[dir]',              // Contenido con dirección
          
          // Selectores para emails HTML RICOS y FORMATEADOS
          '.ii.gt table',                  // Tablas en emails HTML
          '.ii.gt table td',               // Celdas de tabla
          '.ii.gt table tbody',            // Cuerpo de tablas
          '.ii.gt table tbody tr',         // Filas de tabla
          '.ii.gt div[style]',             // Divs con estilo inline
          '.ii.gt div[bgcolor]',           // Divs con color de fondo
          '.ii.gt div[class*="MsoNormal"]', // Estilos de Word/Outlook
          '.ii.gt .WordSection1',          // Contenido de Word
          '.ii.gt .moz-text-html',         // Contenido Mozilla HTML
          '.ii.gt .OutlookMessageBody',    // Cuerpo de mensaje Outlook
          '.ii.gt .x_MsoNormal',           // Estilos MsoNormal de Outlook
          
          // Selectores para contenido HTML ESTRUCTURADO
          '.ii.gt article',                // Artículos HTML
          '.ii.gt section',                // Secciones HTML
          '.ii.gt main',                   // Contenido principal
          '.ii.gt .content',               // Contenido genérico
          '.ii.gt .email-body',            // Cuerpo de email
          '.ii.gt .message-body',          // Cuerpo de mensaje
          '.ii.gt [role="main"]',          // Contenido principal por rol
          '.ii.gt [role="article"]',       // Artículo por rol
          
          // Selectores para contenido MULTIIDIOMA
          '.ii.gt div[dir="ltr"]',         // Contenido LTR
          '.ii.gt div[dir="rtl"]',         // Contenido RTL
          '.ii.gt div[dir="auto"]',        // Contenido auto-dirección
          '.ii.gt div[lang]',              // Contenido con idioma
          '.ii.gt span[dir]',              // Spans con dirección
          
          // Selectores para contenido EXPANDIDO Y COMPLETO
          '.ii.gt .gmail_default',         // Default Gmail
          '.ii.gt .editable',              // Contenido editable
          '.ii.gt div[aria-expanded="true"]', // Contenido expandido
          '.ii.gt div[data-smartmail]',    // Smart mail content
          '.ii.gt div[id*="message"]',     // Divs con ID de mensaje
          '.ii.gt div[id*="content"]',     // Divs con ID de contenido
          '.ii.gt div[id*="body"]',        // Divs con ID de cuerpo
          
          // Selectores de vista previa MEJORADOS
          '.y2',                           // Preview text
          '.y3',                           // Alternativo preview
          '.bog + span',                   // Siguiente a bog
          '.snippet',                      // Clase snippet directa
          '.bqe span',                     // Span en bqe
          '.qu .y2',                       // y2 en qu
          '.gs .y2',                       // y2 en gs
          '.aLF .snippet',                 // Snippet en aLF
          '.message-content',              // Content genérico
          
          // Selectores generales AMPLIADOS
          '.message-body',                 // Message body
          '.email-content',                // Email content
          'div[role="gridcell"] div',      // Grid cell content
          '.qu div',                       // Content en qu
          '.h7 div',                       // Div en h7
          'p',                             // Párrafos
          'div p',                         // Párrafos en divs
          'span[dir]',                     // Spans con dirección
          '.text-content',                 // Text content
          
          // Selectores de fallback más específicos
          '[jsname] div',                  // Divs con jsname
          'td[colspan] div',               // Divs en celdas
          '.nH .if div',                   // Divs en contenedores específicos
          'tr[id] div',                    // Divs en filas con ID
          
          // Selectores ultra-generales como último recurso
          'td',                            // Cualquier celda de tabla
          'div[class]',                    // Cualquier div con clase
          'span[class]'                    // Cualquier span con clase
        ];

        for (const selector of contentSelectors) {
          try {
            const contentElements = element.querySelectorAll(selector);
            for (const contentElement of contentElements) {
              if (contentElement) {
                // MÉTODO 1: Extracción COMPLETA de HTML a texto plano
                let potentialContent = htmlToPlainText(contentElement);
                
                // MÉTODO 2: Extracción específica de innerHTML para emails HTML RICOS
                if (!potentialContent || potentialContent.length < 20) {
                  const innerHTML = contentElement.innerHTML;
                  if (innerHTML && innerHTML.length > 100) {
                    // Crear elemento temporal para convertir HTML a texto
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = innerHTML;
                    potentialContent = htmlToPlainText(tempDiv);
                    console.log(`📧 Extracción HTML rica: ${potentialContent.substring(0, 100)}...`);
                  }
                }
                
                // MÉTODO 3: Fallback con textContent si los métodos HTML no funcionan
                if (!potentialContent || potentialContent.length < 20) {
                  potentialContent = contentElement.textContent?.trim() || '';
                }
                
                // MÉTODO 4: Extracción AGRESIVA de contenido HTML completo
                if (!potentialContent || potentialContent.length < 20) {
                  const allElements = contentElement.querySelectorAll('p, div, span, td, th, li, h1, h2, h3, h4, h5, h6');
                  const textParts = [];
                  allElements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 5) {
                      textParts.push(text);
                    }
                  });
                  if (textParts.length > 0) {
                    potentialContent = textParts.join(' ');
                    console.log(`📧 Extracción agresiva: ${potentialContent.substring(0, 100)}...`);
                  }
                }

                // Filtrar contenido no deseado y validar - FILTROS EXPANDIDOS
                if (potentialContent &&
                  potentialContent.length > 15 &&
                  !potentialContent.includes('Escribir') &&
                  !potentialContent.includes('Enviar') &&
                  !potentialContent.includes('Responder') &&
                  !potentialContent.includes('Reenviar') &&
                  !potentialContent.includes('Write') &&
                  !potentialContent.includes('Send') &&
                  !potentialContent.includes('Reply') &&
                  !potentialContent.includes('Forward') &&
                  !potentialContent.includes('Compose') &&
                  !potentialContent.includes('Inbox') &&
                  !potentialContent.includes('Drafts') &&
                  !potentialContent.includes('Sent') &&
                  !potentialContent.includes('Trash') &&
                  !potentialContent.includes('Show trimmed content') &&
                  !potentialContent.includes('Mostrar contenido recortado') &&
                  !potentialContent.includes('Unsubscribe') &&
                  !potentialContent.includes('Darse de baja') &&
                  !potentialContent.includes('Privacy Policy') &&
                  !potentialContent.includes('Terms of Service') &&
                  !potentialContent.includes('Click here') &&
                  !potentialContent.includes('Haga clic aquí') &&
                  !potentialContent.match(/^[\s\n]*$/)) {

                  // Priorizar contenido más largo para emailBody - LÍMITE EXPANDIDO
                  if (potentialContent.length > 50) {
                    emailBody = potentialContent.length > 2000 ? potentialContent.substring(0, 2000) + '...' : potentialContent;
                    console.log(`📧 Contenido HTML completo extraído: ${emailBody.substring(0, 150)}...`);
                    break;
                  } else if (!snippet && potentialContent.length > 15) {
                    snippet = potentialContent.length > 300 ? potentialContent.substring(0, 300) + '...' : potentialContent;
                  }
                }
              }
            }
            if (emailBody) break; // Salir del bucle exterior si encontramos contenido largo
          } catch (e) { 
            console.error('Error en extracción de contenido:', e);
            /* continuar con siguiente selector */ 
          }
        }

        // EXTRACCIÓN DE TIMESTAMP - Múltiples estrategias
        const timeSelectors = [
          // Selectores principales para timestamp
          '.xW span',                      // Tiempo en xW
          '.xY span',                      // Tiempo en xY
          'time',                          // Elemento time HTML5
          '[title*=":"]',                  // Cualquier con : en title
          '.g3',                           // Clase g3
          'span[title*="20"]',             // Con año 20xx
          'span[data-tooltip*=":"]',       // Tooltip con :
          '.qu span[title]',               // Title en qu
          '.date',                         // Clase date
          '.timestamp',                    // Clase timestamp
          '[aria-label*="20"]',            // Aria label con año
          
          // Selectores adicionales 2024
          '.xW',                           // Clase xW completa
          '.xY',                           // Clase xY completa
          '.g3 span',                      // Span en g3
          '.qu .xW',                       // xW en qu
          '.qu .xY',                       // xY en qu
          '.gs .xW',                       // xW en gs
          '.gs .xY',                       // xY en gs
          '.h7 .xW',                       // xW en h7
          '.nH .if .xW',                   // xW en contenedor específico
          '[data-tooltip]',                // Cualquier tooltip
          '[title*="AM"]',                 // Título con AM
          '[title*="PM"]',                 // Título con PM
          'span[title*="AM"]',             // Span con AM
          'span[title*="PM"]',             // Span con PM
          
          // Fallbacks genéricos
          'div[jsname] span[title]',       // Span con title en JSName
          'tr[jsname] span[title]',        // Span con title en TR JSName
          'td span[title]',                // Span con title en TD
          '[aria-label*="time" i]',        // Aria label "time"
          '[aria-label*="fecha" i]'        // Aria label "fecha"
        ];

        for (const selector of timeSelectors) {
          try {
            const timeElement = element.querySelector(selector);
            if (timeElement) {
              timestamp = timeElement.getAttribute('title') ||
                timeElement.getAttribute('data-tooltip') ||
                timeElement.getAttribute('aria-label') ||
                timeElement.getAttribute('datetime') ||
                timeElement.textContent?.trim() || '';
              if (timestamp && timestamp.length > 3) {
                break;
              }
            }
          } catch (e) { /* continuar con siguiente selector */ }
        }

                 // FALLBACK ULTRA-AGRESIVO - Extracción completa de elemento MEJORADA
         if (!emailBody && !snippet) {
           console.log('🔍 Intentando fallback ultra-agresivo para extracción de contenido HTML...');
           
           // Método 1: Extracción usando innerHTML completo con procesamiento mejorado
           const fullHTML = element.innerHTML;
           if (fullHTML && fullHTML.length > 100) {
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = fullHTML;
             const extractedText = htmlToPlainText(tempDiv);
             
             if (extractedText && extractedText.length > 30) {
               emailBody = extractedText.length > 2000 ? extractedText.substring(0, 2000) + '...' : extractedText;
               console.log(`📧 Contenido extraído via innerHTML completo: ${emailBody.substring(0, 150)}...`);
             }
           }
           
           // Método 2: Extracción específica de elementos HTML comunes
           if (!emailBody) {
             const htmlElements = element.querySelectorAll('p, div, span, table, tr, td, th, li, ul, ol, h1, h2, h3, h4, h5, h6, article, section, main, blockquote, pre');
             const contentParts = [];
             
             htmlElements.forEach(el => {
               const text = el.textContent?.trim();
               if (text && text.length > 10 && !text.includes('Escribir') && !text.includes('Enviar') && !text.includes('Reply') && !text.includes('Forward')) {
                 contentParts.push(text);
               }
             });
             
             if (contentParts.length > 0) {
               const combinedContent = contentParts.join(' ');
               emailBody = combinedContent.length > 2000 ? combinedContent.substring(0, 2000) + '...' : combinedContent;
               console.log(`📧 Contenido extraído via elementos HTML: ${emailBody.substring(0, 150)}...`);
             }
           }
           
           // Método 3: Extracción de texto directo con limpieza agresiva
           if (!emailBody) {
             const rawText = element.textContent?.trim() || '';
             if (rawText && rawText.length > 50) {
               // Limpiar texto de manera agresiva
               const cleanedText = rawText
                 .replace(/\s+/g, ' ')
                 .replace(/\n\s*\n/g, '\n')
                 .replace(/^\s+|\s+$/g, '')
                 .replace(/\b(Escribir|Enviar|Reply|Forward|Compose|Inbox|Drafts|Sent|Trash)\b/gi, '')
                 .replace(/\b(Show trimmed content|Mostrar contenido recortado)\b/gi, '')
                 .trim();
               
               if (cleanedText.length > 30) {
                 emailBody = cleanedText.length > 2000 ? cleanedText.substring(0, 2000) + '...' : cleanedText;
                 console.log(`📧 Contenido extraído via texto directo: ${emailBody.substring(0, 150)}...`);
               }
             }
           }
         }

         // FALLBACK AGRESIVO - Extracción de texto completo
         if (!sender && !subject && !snippet && !emailBody) {
           console.log('🔍 Aplicando fallback agresivo de extracción...');
           
           const allText = element.textContent?.trim() || '';
           if (allText && allText.length > 30) {
             // Dividir el texto en líneas para análisis
             const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

             if (lines.length > 0) {
               // Buscar patrones de email
               const emailPattern = /@[\w.-]+\.\w+/;
               const senderLine = lines.find(line => emailPattern.test(line));
               if (senderLine) {
                 sender = senderLine.length < 100 ? senderLine : 'Usuario Gmail';
               } else {
                 sender = lines[0].length < 100 ? lines[0] : 'Usuario Gmail';
               }

               // Buscar línea de asunto (generalmente la segunda o tercera)
               if (lines.length > 1) {
                 const potentialSubject = lines[1];
                 if (potentialSubject.length < 150 && !potentialSubject.includes('@')) {
                   subject = potentialSubject;
                 } else if (lines.length > 2) {
                   subject = lines[2].length < 150 ? lines[2] : 'Contenido extraído';
                 }
               }

               // El resto del contenido como cuerpo
               if (lines.length > 3) {
                 emailBody = lines.slice(3).join(' ').substring(0, 600) + '...';
               } else if (lines.length > 2) {
                 snippet = lines.slice(2).join(' ').substring(0, 300) + '...';
               } else {
                 snippet = allText.substring(0, 300) + '...';
               }
             }

             console.log(`⚠️ Usando extracción de fallback completo para elemento con ${allText.length} caracteres`);
           }
         }

         // Log final de resultados de extracción
         console.log(`📧 Email extraído - Remitente: "${sender.substring(0, 30)}", Asunto: "${subject.substring(0, 30)}", Contenido: ${emailBody ? emailBody.length : snippet ? snippet.length : 0} caracteres`);

        // Limpieza final de datos
        if (sender) sender = sender.replace(/\s+/g, ' ').trim();
        if (subject) subject = subject.replace(/\s+/g, ' ').trim();
        if (snippet) snippet = snippet.replace(/\s+/g, ' ').trim();
        if (emailBody) emailBody = emailBody.replace(/\s+/g, ' ').trim();

      } catch (error) {
        console.error('❌ Error extrayendo datos del email:', error);
      }

      const isValid = !!(sender || subject || snippet || emailBody);

      return {
        sender: sender || 'Usuario desconocido',
        subject: subject || 'Sin asunto',
        snippet: snippet || '',
        timestamp: timestamp || 'Sin fecha',
        emailBody: emailBody || '',
        isValid
      };
    }

    // Función auxiliar para abrir una nueva pestaña con emails extraídos
    function openTextWindow(text, title = 'Emails Extraídos') {
      try {
        console.log('🪟 Abriendo nueva pestaña con emails extraídos...');
        
        // Escapar HTML para evitar problemas de renderizado
        const escapedText = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

        // Crear contenido HTML con formato mejorado específico para emails
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AI Prompt Assistant</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #EA4335, #D33B2C);
            color: white;
            padding: 20px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .text-content {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 70vh;
            overflow-y: auto;
            color: #333;
        }

        .stats {
            background: #fce4ec;
            border: 1px solid #f8bbd9;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        }
        .stats-item {
            display: inline-block;
            margin: 0 15px;
            font-weight: 500;
        }
        .stats-value {
            color: #c2185b;
            font-size: 18px;
        }
        
        /* Scrollbar personalizada */
        .text-content::-webkit-scrollbar {
            width: 8px;
        }
        .text-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        .text-content::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
        }
        .text-content::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .header {
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 ${title}</h1>
            <p>Emails extraídos y copiados al portapapeles - ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stats-item">
                    <span class="stats-value">${text.split('\\n').length}</span>
                    <span>líneas</span>
                </div>
                <div class="stats-item">
                    <span class="stats-value">${text.length.toLocaleString()}</span>
                    <span>caracteres</span>
                </div>
                <div class="stats-item">
                    <span class="stats-value">${text.split(' ').length.toLocaleString()}</span>
                    <span>palabras</span>
                </div>
            </div>
            
            <div class="text-content" id="textContent">${escapedText}</div>
        </div>
    </div>
</body>
</html>`;

        // Crear un blob con el contenido HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Abrir nueva pestaña con el contenido
        const newTab = window.open(url, '_blank');
        
        if (newTab) {
          console.log('✅ Nueva pestaña abierta con emails extraídos');
          
          // Limpiar el blob URL después de un tiempo
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 60000); // 1 minuto
        } else {
          console.error('❌ No se pudo abrir la nueva pestaña. Verifica que los popups no estén bloqueados.');
        }
        
      } catch (error) {
        console.error('❌ Error al abrir ventana con emails:', error);
      }
    }

    // Función para finalizar y copiar emails
    async function finalizeEmailCollection() {
      if (allEmails.length >= MAX_EMAILS) {
        notification.textContent = `🎯 ¡Límite alcanzado! Procesando ${allEmails.length} emails...`;
      } else {
        notification.textContent = `📝 Procesando ${allEmails.length} emails...`;
      }

      if (allEmails.length === 0) {
        notification.textContent = '❌ No se encontraron emails. Verifica que estés en una conversación de Gmail.';
        notification.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)';
        setTimeout(() => {
          if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 5000);
        return;
      }

      // Formatear texto sin iconos
      let emailText = `CONVERSACION DE GMAIL - ${allEmails.length} de máximo ${MAX_EMAILS} emails extraidos\n`;
      emailText += `Capturado el ${new Date().toLocaleString('es-ES')}\n`;
      emailText += `URL: ${window.location.href}\n`;
      emailText += `${'='.repeat(60)}\n\n`;

      allEmails.forEach((email, index) => {
        emailText += `EMAIL #${index + 1}\n`;
        emailText += `De: ${email.sender}\n`;
        emailText += `Asunto: ${email.subject}\n`;
        emailText += `Fecha: ${email.timestamp}\n`;

        // Mostrar el contenido completo del email priorizando emailBody (HTML procesado)
        if (email.emailBody && email.emailBody.length > 10) {
          emailText += `Contenido completo (HTML): ${email.emailBody}\n`;
        } else if (email.snippet && email.snippet.length > 10) {
          emailText += `Vista previa: ${email.snippet}\n`;
        } else {
          emailText += `Contenido: [No se pudo extraer el contenido del mensaje]\n`;
        }

        emailText += `${'-'.repeat(40)}\n\n`;
      });

      emailText += `Total: ${allEmails.length} emails capturados exitosamente (máximo: ${MAX_EMAILS})`;

      // Copia mejorada al portapapeles
      await copyToClipboard(emailText, allEmails.length);

      // Comunicar resultado a la extensión
      window.postMessage({
        type: 'GMAIL_EXTRACT_COMPLETE',
        emailText: emailText,
        emailCount: allEmails.length
      }, '*');
      
      // Abrir nueva pestaña con el texto extraído
      openTextWindow(emailText, `Emails Extraídos (${allEmails.length}/${MAX_EMAILS})`);
    }

    // Función mejorada para copiar al portapapeles
    async function copyToClipboard(text, emailCount) {
      try {
        notification.textContent = '📋 Copiando al portapapeles...';

        // Método principal: Chrome Extension Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          notification.textContent = `✅ ¡${emailCount}/${MAX_EMAILS} emails copiados al portapapeles!`;
          notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
        } else {
          throw new Error('API de portapapeles no disponible');
        }
      } catch (error) {
        console.error('Error con API principal, usando método alternativo:', error);

        // Método alternativo mejorado
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            opacity: 0;
            pointer-events: none;
          `;

          document.body.appendChild(textarea);
          textarea.select();
          textarea.setSelectionRange(0, text.length);

          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (successful) {
            notification.textContent = `✅ ¡${emailCount}/${MAX_EMAILS} emails copiados! (método alternativo)`;
            notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
          } else {
            throw new Error('execCommand falló');
          }
        } catch (fallbackError) {
          notification.textContent = `❌ Error al copiar: ${fallbackError.message}`;
          notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
          console.error('Error en todos los métodos de copia:', fallbackError);
        }
      }

      // Remover notificación después de mostrar resultado (optimizado)
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2500);
    }

    // Iniciar el proceso de captura con logging mejorado
    console.log('🚀 Iniciando scroll automático para conversaciones de Gmail...');
    console.log(`📊 Parámetros: MAX_SCROLL_ATTEMPTS=${MAX_SCROLL_ATTEMPTS}, SCROLL_DISTANCE=${SCROLL_DISTANCE}px, SCROLL_DELAY=${SCROLL_DELAY}ms`);
    await performScrollAndExtract();
  }

  // Ejecutar la función principal
  scrollAndCollectEmails().catch(error => {
    console.error('Error general en extractAndCopyGmailContent:', error);
    notification.textContent = `❌ Error: ${error.message}`;
    notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 3000);
  });
}

// Función para extraer texto de PDF
function extractPDFText() {
  console.log('📄 Iniciando extracción de texto del PDF...');
  
  // Crear notificación visual en la página del PDF
  const notification = document.createElement('div');
  notification.textContent = '📄 Extrayendo texto del PDF...';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(notification);
  
  // Función para hacer scroll al inicio
  async function scrollToTop() {
    console.log('⬆️ Haciendo scroll al inicio...');
    notification.textContent = '⬆️ Navegando al inicio del PDF...';
    
    // Intentar diferentes métodos de scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Buscar el iframe del visor de PDF de Chrome
    const pdfViewer = document.querySelector('embed, iframe, object') || 
                     document.querySelector('#viewer') || 
                     document.querySelector('.pdf-viewer');
    
    if (pdfViewer && pdfViewer.contentWindow) {
      try {
        pdfViewer.contentWindow.scrollTo(0, 0);
      } catch (e) {
        console.log('No se pudo hacer scroll en el iframe del PDF');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Función moderna para extraer todo el texto usando selección automática
  async function scrollAndExtractText() {
    console.log('🔍 Iniciando extracción moderna del PDF...');
    notification.textContent = '🔍 Analizando estructura del PDF...';
    
    // Método 1: Intentar seleccionar todo el texto automáticamente
    const allTextMethod1 = await extractAllTextBySelection();
    if (allTextMethod1 && allTextMethod1.length > 100) {
      console.log(`✅ Método 1 exitoso: ${allTextMethod1.length} caracteres`);
      return allTextMethod1;
    }
    
    // Método 2: Extracción por páginas con scroll inteligente
    notification.textContent = '📄 Método de respaldo: extracción por scroll...';
    const allTextMethod2 = await extractTextByIntelligentScroll();
    if (allTextMethod2 && allTextMethod2.length > 50) {
      console.log(`✅ Método 2 exitoso: ${allTextMethod2.length} caracteres`);
      return allTextMethod2;
    }
    
    // Método 3: Extracción completa del DOM
    notification.textContent = '🔧 Método final: extracción completa del DOM...';
    const allTextMethod3 = await extractAllDOMText();
    console.log(`✅ Método 3 completado: ${allTextMethod3.length} caracteres`);
    return allTextMethod3;
  }
  
  // Método 1: Selección automática de todo el texto
  async function extractAllTextBySelection() {
    console.log('🎯 Intentando seleccionar todo el texto...');
    
    try {
      // Limpiar selección previa
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      
      // Intentar Ctrl+A programáticamente
      document.execCommand('selectAll');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Obtener texto seleccionado
      const selection = window.getSelection();
      if (selection && selection.toString().length > 100) {
        const selectedText = selection.toString();
        console.log(`📋 Texto seleccionado: ${selectedText.length} caracteres`);
        
        // Limpiar selección
        selection.removeAllRanges();
        return selectedText;
      }
      
      // Método alternativo: crear rango de selección manual
      const range = document.createRange();
      const bodyElement = document.body || document.documentElement;
      range.selectNodeContents(bodyElement);
      
      const newSelection = window.getSelection();
      newSelection.removeAllRanges();
      newSelection.addRange(range);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const rangeText = newSelection.toString();
      newSelection.removeAllRanges();
      
      if (rangeText && rangeText.length > 100) {
        console.log(`📋 Texto por rango: ${rangeText.length} caracteres`);
        return rangeText;
      }
      
    } catch (error) {
      console.error('❌ Error en selección automática:', error);
    }
    
    return null;
  }
  
  // Método 2: Scroll inteligente optimizado
  async function extractTextByIntelligentScroll() {
    console.log('📜 Iniciando scroll inteligente...');
    
    let allText = '';
    let processedChunks = new Set();
    let scrollPosition = 0;
    let maxScrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    
    // Ir al inicio
    await scrollToTop();
    
    const viewportHeight = window.innerHeight;
    const scrollStep = Math.floor(viewportHeight * 0.8);
    let attempts = 0;
    const maxAttempts = Math.ceil(maxScrollHeight / scrollStep) + 5;
    
    console.log(`📊 Altura total estimada: ${maxScrollHeight}px, Pasos: ${maxAttempts}`);
    
    while (attempts < maxAttempts && scrollPosition < maxScrollHeight) {
      attempts++;
      notification.textContent = `📄 Scroll inteligente... ${attempts}/${maxAttempts}`;
      
      // Extraer texto de la vista actual
      const currentViewText = extractCurrentViewText();
      
      if (currentViewText && currentViewText.length > 20) {
        // Crear hash simple para evitar duplicados
        const textHash = currentViewText.substring(0, 100);
        if (!processedChunks.has(textHash)) {
          allText += currentViewText + '\n\n';
          processedChunks.add(textHash);
          console.log(`📝 Chunk ${attempts}: ${currentViewText.length} caracteres`);
        }
      }
      
      // Scroll suave y controlado
      const nextPosition = scrollPosition + scrollStep;
      window.scrollTo({ top: nextPosition, behavior: 'smooth' });
      
      // Esperar renderizado
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Actualizar posición
      const newScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      // Si no hay cambio significativo, intentar scroll forzado
      if (Math.abs(newScrollPosition - scrollPosition) < 50) {
        document.documentElement.scrollTop = nextPosition;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      // Condición de salida si llegamos al final
      if (scrollPosition >= maxScrollHeight - viewportHeight) {
        console.log('📍 Llegamos al final del documento');
        break;
      }
    }
    
    return allText.trim();
  }
  
  // Método 3: Extracción completa del DOM
  async function extractAllDOMText() {
    console.log('🌐 Extrayendo todo el texto del DOM...');
    
    // Ir al inicio para asegurar que todo esté cargado
    await scrollToTop();
    
    // Hacer scroll completo una vez para cargar todo el contenido
    const maxHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    
    // Scroll rápido al final y luego al inicio para forzar carga
    window.scrollTo(0, maxHeight);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extraer todo el texto usando múltiples estrategias
    let allText = '';
    
    // Estrategia 1: Elementos específicos de PDF
    const pdfElements = document.querySelectorAll(`
      span[role="presentation"],
      .textLayer span,
      .textLayer div,
      div[role="textbox"],
      text,
      tspan
    `);
    
    if (pdfElements.length > 0) {
      console.log(`📄 Encontrados ${pdfElements.length} elementos de PDF`);
      const pdfTexts = Array.from(pdfElements)
        .map(el => (el.textContent || el.innerText || '').trim())
        .filter(text => text.length > 1)
        .join(' ');
      
      if (pdfTexts.length > 100) {
        allText = pdfTexts;
      }
    }
    
    // Estrategia 2: Si no hay elementos específicos, usar todo el body
    if (!allText || allText.length < 100) {
      console.log('📄 Usando extracción completa del body...');
      const bodyText = document.body.textContent || document.body.innerText || '';
      
      // Limpiar el texto
      const lines = bodyText.split('\n');
      const cleanLines = lines
        .map(line => line.trim())
        .filter(line => 
          line.length > 2 && 
          !line.includes('chrome-extension://') &&
          !line.includes('data:') &&
          !/^[\s\n\r\t]*$/.test(line)
        );
      
      allText = cleanLines.join(' ');
    }
    
    return allText.trim();
  }
  
  // Función auxiliar para extraer texto de la vista actual
  function extractCurrentViewText() {
    const viewportTop = window.pageYOffset;
    const viewportBottom = viewportTop + window.innerHeight;
    
    const elements = document.querySelectorAll('span, div, p, text, tspan');
    let viewText = '';
    
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + viewportTop;
      const elementBottom = elementTop + rect.height;
      
      // Verificar si el elemento está en la vista actual (con margen)
      if (elementBottom >= viewportTop - 100 && elementTop <= viewportBottom + 100) {
        const text = (element.textContent || element.innerText || '').trim();
        if (text.length > 1 && !/^[\s\n\r\t]*$/.test(text)) {
          viewText += text + ' ';
        }
      }
    });
    
    return viewText.trim();
  }
  

  
  // Función para copiar al clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('📋 Texto copiado al clipboard exitosamente');
      
      // Enviar mensaje de éxito al sidebar
      window.postMessage({
        type: 'PDF_EXTRACT_COMPLETE',
        success: true,
        textLength: text.length
      }, '*');
      
    } catch (error) {
      console.error('❌ Error al copiar al clipboard:', error);
      
      // Método de respaldo usando execCommand
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        console.log('📋 Texto copiado al clipboard usando método de respaldo');
        
        // Enviar mensaje de éxito al sidebar
        window.postMessage({
          type: 'PDF_EXTRACT_COMPLETE',
          success: true,
          textLength: text.length
        }, '*');
        
      } catch (fallbackError) {
        console.error('❌ Error en método de respaldo:', fallbackError);
        
        // Enviar mensaje de error al sidebar
        window.postMessage({
          type: 'PDF_EXTRACT_COMPLETE',
          success: false,
          error: fallbackError.message
        }, '*');
      }
    }
  }
  
  // Ejecutar la extracción
  scrollAndExtractText()
    .then(extractedText => {
      console.log(`📄 Extracción completada. Caracteres extraídos: ${extractedText.length}`);
      
      // Remover la notificación
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      if (extractedText.trim()) {
        // Copiar al clipboard
        copyToClipboard(extractedText);
      } else {
        console.warn('⚠️ No se pudo extraer texto del PDF');
        window.postMessage({
          type: 'PDF_EXTRACT_COMPLETE',
          success: false,
          error: 'No se pudo extraer texto del PDF'
        }, '*');
      }
    })
    .catch(error => {
      console.error('❌ Error durante la extracción:', error);
      
      // Remover la notificación en caso de error
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      window.postMessage({
        type: 'PDF_EXTRACT_COMPLETE',
        success: false,
        error: error.message
      }, '*');
  });
}

// Función para extraer y copiar tweets de Twitter/X - VERSIÓN COMPLETAMENTE REESCRITA 2024
function extractAndCopyTweets() {
  // Función auxiliar para abrir una nueva pestaña con texto extraído (disponible en contexto de página)
  function openTextWindow(text, title = 'Contenido Extraído') {
    try {
      console.log('🪟 Abriendo nueva pestaña con texto extraído...');
      
      // Escapar HTML para evitar problemas de renderizado
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      // Crear contenido HTML con formato mejorado
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AI Prompt Assistant</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1DA1F2, #1991DA);
            color: white;
            padding: 20px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .text-content {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 70vh;
            overflow-y: auto;
            color: #333;
        }
        .stats {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        }
        .stats-item {
            display: inline-block;
            margin: 0 15px;
            font-weight: 500;
        }
        .stats-value {
            color: #1976d2;
            font-size: 18px;
        }
        
        /* Scrollbar personalizada */
        .text-content::-webkit-scrollbar {
            width: 8px;
        }
        .text-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        .text-content::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
        }
        .text-content::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .header {
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐦 ${title}</h1>
            <p>Contenido extraído y copiado al portapapeles - ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stats-item">
                    <span class="stats-value">${text.split('\\n').length}</span>
                    <span>líneas</span>
                </div>
                <div class="stats-item">
                    <span class="stats-value">${text.length.toLocaleString()}</span>
                    <span>caracteres</span>
                </div>
                <div class="stats-item">
                    <span class="stats-value">${text.split(' ').length.toLocaleString()}</span>
                    <span>palabras</span>
                </div>
            </div>
            
            <div class="text-content" id="textContent">${escapedText}</div>
        </div>
    </div>
</body>
</html>`;

      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Abrir nueva pestaña con el contenido
      const newTab = window.open(url, '_blank');
      
      if (newTab) {
        console.log('✅ Nueva pestaña abierta con contenido extraído');
        
        // Limpiar el blob URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60000); // 1 minuto
      } else {
        console.error('❌ No se pudo abrir la nueva pestaña. Verifica que los popups no estén bloqueados.');
      }
      
    } catch (error) {
      console.error('❌ Error al abrir ventana con texto:', error);
    }
  }

  // Crear notificación mejorada
  const notification = document.createElement('div');
  notification.textContent = '🐦 Iniciando captura avanzada de tweets...';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #1DA1F2, #1991DA);
    color: white;
    padding: 15px 25px;
    border-radius: 25px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(29, 161, 242, 0.3);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  `;
  document.body.appendChild(notification);

  // Función optimizada para ir al inicio
  async function scrollToTop() {
    notification.textContent = '⬆️ Navegando al inicio del hilo...';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 800)); // Más tiempo para carga completa
  }

  async function scrollAndCollectTweets() {
    await scrollToTop();

    const processedTweetIds = new Set();
    let allTweets = [];
    let lastHeight = document.body.scrollHeight;
    let stagnantScrollCount = 0;
    let scrollAttempts = 0;

    // Configuración optimizada para X/Twitter 2024 - MÁXIMO 50 TWEETS
    const MAX_SCROLL_ATTEMPTS = 120; // Aumentado para garantizar 50 tweets
    const MAX_STAGNANT_ATTEMPTS = 15; // Más persistencia para encontrar los 50
    const SCROLL_DISTANCE = 1000; // Scroll optimizado para captura
    const SCROLL_DELAY = 500; // Más tiempo para asegurar carga completa
    const MAX_TWEETS = 50; // LÍMITE MÁXIMO: 50 tweets

    // Función principal de scroll y captura
    async function performScrollAndExtract() {
      scrollAttempts++;

      if (scrollAttempts > MAX_SCROLL_ATTEMPTS) {
        return await finalizeTweetCollection();
      }

      // Actualizar notificación con progreso detallado
      notification.textContent = `🔍 Extrayendo tweets... (${allTweets.length}/${MAX_TWEETS}) - Intento ${scrollAttempts}/${MAX_SCROLL_ATTEMPTS}`;

      // SELECTORES MÚLTIPLES Y ROBUSTOS para tweets
      const tweetSelectors = [
        'article[data-testid="tweet"]',           // Selector principal
        'article[role="article"]',                // Artículos genéricos
        'div[data-testid="tweet"]',              // Divs con testid
        '[data-testid="cellInnerDiv"] article',  // Dentro de celdas
        'article[tabindex="-1"]',                // Artículos con tabindex
        '[aria-label*="tweet" i]',               // Con aria-label que contenga "tweet"
        'div[role="article"]',                   // Divs con role article
        'article',                               // Todos los articles como fallback
        '[data-testid="primaryColumn"] article', // En columna principal
        'main article'                           // Articles en main
      ];

      let tweetElements = [];
      
      // Buscar con múltiples selectores hasta encontrar tweets
      for (const selector of tweetSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          tweetElements = Array.from(elements);
          console.log(`✅ Encontrados ${elements.length} elementos con selector: ${selector}`);
          break;
        }
      }

      // Si no encontramos con selectores específicos, buscar de forma más general
      if (tweetElements.length === 0) {
        // Buscar cualquier elemento que contenga estructura típica de tweet
        const allArticles = document.querySelectorAll('article, div[role="article"], [data-testid*="tweet"], [aria-label*="tweet" i]');
        tweetElements = Array.from(allArticles).filter(el => {
          // Filtrar elementos que parezcan tweets por su contenido
          const hasTime = el.querySelector('time');
          const hasTextContent = el.textContent && el.textContent.trim().length > 10;
          const hasUserInfo = el.querySelector('[data-testid*="User"]') || el.textContent.includes('@');
          
          return hasTime || (hasTextContent && hasUserInfo);
        });
        
        console.log(`🔍 Fallback: Encontrados ${tweetElements.length} elementos con estructura de tweet`);
      }

      let newTweetsInThisStep = 0;

      for (const element of tweetElements) {
        try {
          // IDENTIFICACIÓN ÚNICA MEJORADA con múltiples métodos
          let tweetId = '';
          
          // Método 1: URL del tiempo
          const timeLink = element.querySelector('time')?.closest('a')?.getAttribute('href');
          if (timeLink) tweetId = timeLink;
          
          // Método 2: aria-labelledby
          if (!tweetId) tweetId = element.getAttribute('aria-labelledby');
          
          // Método 3: data-testid o cualquier ID único
          if (!tweetId) tweetId = element.getAttribute('data-testid') || element.getAttribute('id');
          
          // Método 4: Contenido hash como último recurso
          if (!tweetId) {
            const content = element.textContent?.trim().substring(0, 100);
            if (content) {
              tweetId = `content-${content.replace(/\s+/g, '').substring(0, 20)}-${Date.now()}`;
            }
          }
          
          // Método 5: Posición como último recurso
          if (!tweetId) {
            const rect = element.getBoundingClientRect();
            tweetId = `pos-${Math.floor(rect.top)}-${Math.floor(rect.left)}-${Date.now()}`;
          }

          if (!processedTweetIds.has(tweetId)) {
            processedTweetIds.add(tweetId);

            // Extraer datos mejorados
            const tweetData = extractTweetDataAdvanced(element);

            if (tweetData.isValid) {
              allTweets.push(tweetData);
              newTweetsInThisStep++;
              console.log(`📝 Tweet ${allTweets.length}: ${tweetData.tweetText.substring(0, 50)}...`);

              // Límite de tweets alcanzado
              if (allTweets.length >= MAX_TWEETS) {
                return await finalizeTweetCollection();
              }
            }
          }
        } catch (error) {
          console.error('❌ Error procesando tweet:', error);
        }
      }

      // Control de progreso del scroll
      if (newTweetsInThisStep > 0) {
        stagnantScrollCount = 0;
        console.log(`✅ Encontrados ${newTweetsInThisStep} tweets nuevos en este paso`);
      } else {
        stagnantScrollCount++;
        console.log(`⚠️ No se encontraron tweets nuevos. Intentos estancados: ${stagnantScrollCount}/${MAX_STAGNANT_ATTEMPTS}`);
      }

      // Realizar scroll más agresivo
      window.scrollBy({
        top: SCROLL_DISTANCE,
        behavior: 'smooth'
      });

      // También intentar scroll forzado si el smooth no funciona
      setTimeout(() => {
        document.documentElement.scrollTop += SCROLL_DISTANCE;
      }, 100);

      // Esperar más tiempo para que cargue el contenido
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      const currentHeight = document.body.scrollHeight;
      const hasNewContent = currentHeight > lastHeight;

      // Continuar si hay nuevos tweets o contenido
      if ((hasNewContent || stagnantScrollCount < MAX_STAGNANT_ATTEMPTS) && allTweets.length < MAX_TWEETS) {
        lastHeight = currentHeight;
        await performScrollAndExtract();
      } else {
        console.log(`🏁 Finalizando extracción. Total tweets: ${allTweets.length}`);
        return await finalizeTweetCollection();
      }
    }

    // Función AVANZADA para extraer datos de un tweet individual
    function extractTweetDataAdvanced(element) {
      let username = '';
      let handle = '';
      let tweetText = '';
      let timestamp = '';
      let engagement = '';

      try {
        // EXTRACCIÓN DE USUARIO Y HANDLE - Múltiples estrategias
        const userSelectors = [
          'div[data-testid="User-Name"]',
          '[data-testid="User-Names"]',
          'div[data-testid="User-Name"] span',
          '[data-testid="UserAvatar-Container-unknown"] + div',
          'a[role="link"][href*="/"] span',
          'div[dir="ltr"] span[dir="ltr"]',
          'h3 span',
          'div:has(time) span:first-child'
        ];

        for (const selector of userSelectors) {
          try {
            const userElement = element.querySelector(selector);
            if (userElement) {
              const spans = userElement.querySelectorAll('span');
              if (spans.length >= 1 && !username) {
                username = spans[0].textContent?.trim() || '';
              }
              if (spans.length >= 2 && !handle) {
                const lastSpan = spans[spans.length - 1].textContent?.trim();
                if (lastSpan && lastSpan.includes('@')) {
                  handle = lastSpan;
                }
              }
              
              if (username && handle) break;
            }
          } catch (e) { /* continuar con siguiente selector */ }
        }

        // Fallback para handle: buscar cualquier texto que contenga @
        if (!handle) {
          const allText = element.textContent || '';
          const handleMatch = allText.match(/@[\w_]+/);
          if (handleMatch) handle = handleMatch[0];
        }

        // EXTRACCIÓN DE TEXTO DEL TWEET - Múltiples estrategias
        const textSelectors = [
          'div[data-testid="tweetText"]',
          '[data-testid="tweetText"]',
          'div[dir="auto"][lang]',
          'div[lang]:not([data-testid])',
          'span[dir="auto"]',
          'div[dir="ltr"]:not(:has(time))',
          'div[data-testid="card-wrapper"] + div',
          'article div[dir="auto"]'
        ];

        for (const selector of textSelectors) {
          try {
            const textElement = element.querySelector(selector);
            if (textElement && !tweetText) {
              const text = textElement.textContent?.trim();
              if (text && text.length > 5 && !text.includes('Retweeted') && !text.includes('ago')) {
                tweetText = text;
                break;
              }
            }
          } catch (e) { /* continuar con siguiente selector */ }
        }

        // Fallback: extraer el texto más largo que no sea metadata
        if (!tweetText) {
          const allDivs = element.querySelectorAll('div, span');
          let longestText = '';
          
          for (const div of allDivs) {
            const text = div.textContent?.trim() || '';
            if (text.length > longestText.length && 
                text.length > 10 && 
                !text.includes('ago') && 
                !text.includes('Retweet') &&
                !text.includes('Reply') &&
                !text.includes('Like') &&
                !text.match(/^\d+[KM]?$/)) {
              longestText = text;
            }
          }
          
          if (longestText) tweetText = longestText;
        }

        // EXTRACCIÓN DE TIMESTAMP - Múltiples estrategias
        const timeElement = element.querySelector('time');
        if (timeElement) {
          const datetime = timeElement.getAttribute('datetime');
          if (datetime) {
            try {
              const date = new Date(datetime);
              timestamp = date.toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
            } catch (e) {
              timestamp = timeElement.textContent?.trim() || '';
            }
          } else {
            timestamp = timeElement.textContent?.trim() || '';
          }
        }

        // EXTRACCIÓN DE ENGAGEMENT - Buscar métricas
        const engagementSelectors = [
          '[data-testid*="like"]',
          '[data-testid*="retweet"]', 
          '[data-testid*="reply"]',
          '[aria-label*="like" i]',
          '[aria-label*="retweet" i]',
          '[aria-label*="reply" i]'
        ];

        const metrics = [];
        for (const selector of engagementSelectors) {
          try {
            const elements = element.querySelectorAll(selector);
            for (const el of elements) {
              const text = el.textContent?.trim();
              const ariaLabel = el.getAttribute('aria-label');
              if (text && text.match(/^\d+[KM]?$/)) {
                metrics.push(text);
              } else if (ariaLabel && ariaLabel.includes('like')) {
                const match = ariaLabel.match(/\d+/);
                if (match) metrics.push(`${match[0]} likes`);
              }
            }
          } catch (e) { /* continuar */ }
        }
        
        if (metrics.length > 0) {
          engagement = metrics.join(' | ');
        }

        // Limpieza final de datos
        if (username) username = username.replace(/\s+/g, ' ').trim();
        if (handle && !handle.startsWith('@')) handle = '@' + handle;
        if (tweetText) tweetText = tweetText.replace(/\s+/g, ' ').trim();

      } catch (error) {
        console.error('Error extrayendo datos del tweet:', error);
      }

      const isValid = !!(username || handle || (tweetText && tweetText.length > 5));

      return {
        username: username || 'Usuario desconocido',
        handle: handle || '',
        tweetText: tweetText || 'Contenido no disponible',
        timestamp: timestamp || 'Fecha desconocida',
        engagement: engagement || '',
        isValid
      };
    }

    // Función para finalizar y copiar tweets
    async function finalizeTweetCollection() {
      if (allTweets.length >= MAX_TWEETS) {
        notification.textContent = `🎯 ¡Límite alcanzado! Procesando ${allTweets.length} tweets...`;
      } else {
        notification.textContent = `📝 Procesando ${allTweets.length} tweets...`;
      }

      if (allTweets.length === 0) {
        notification.textContent = '❌ No se encontraron tweets';
        setTimeout(() => {
          if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 3000);
        return;
      }

      // Formatear texto sin iconos
      let threadText = `HILO DE X/TWITTER - ${allTweets.length} de máximo 50 posts extraidos\n`;
      threadText += `Capturado el ${new Date().toLocaleString('es-ES')}\n`;
      threadText += `URL: ${window.location.href}\n`;
      threadText += `${'='.repeat(60)}\n\n`;

      allTweets.forEach((tweet, index) => {
        threadText += `X #${index + 1}\n`;
        if (tweet.username) threadText += `Usuario: ${tweet.username}\n`;
        if (tweet.handle) threadText += `Handle: ${tweet.handle}\n`;
        if (tweet.tweetText) threadText += `Contenido: ${tweet.tweetText}\n`;
        if (tweet.timestamp) threadText += `Fecha: ${tweet.timestamp}\n`;
        if (tweet.engagement) threadText += `Engagement: ${tweet.engagement}\n`;
        threadText += `${'-'.repeat(40)}\n\n`;
      });

      threadText += `Total: ${allTweets.length} posts capturados exitosamente (máximo: 50)`;

      // Copia mejorada al portapapeles
      await copyToClipboard(threadText, allTweets.length);

      // Comunicar resultado a la extensión
      window.postMessage({
        type: 'TWITTER_EXTRACT_COMPLETE',
        threadText: threadText,
        tweetCount: allTweets.length
      }, '*');
      
      // Abrir nueva pestaña con el texto extraído
      openTextWindow(threadText, `Tweets Extraídos (${allTweets.length}/50)`);
    }

    // Función mejorada para copiar al portapapeles
    async function copyToClipboard(text, tweetCount) {
      try {
        notification.textContent = '📋 Copiando al portapapeles...';

        // Método principal: Chrome Extension Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          notification.textContent = `✅ ¡${tweetCount}/50 tweets copiados al portapapeles!`;
          notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
        } else {
          throw new Error('API de portapapeles no disponible');
        }
      } catch (error) {
        console.error('Error con API principal, usando método alternativo:', error);

        // Método alternativo mejorado
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            opacity: 0;
            pointer-events: none;
          `;

          document.body.appendChild(textarea);
          textarea.select();
          textarea.setSelectionRange(0, text.length);

          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (successful) {
            notification.textContent = `✅ ¡${tweetCount}/50 tweets copiados! (método alternativo)`;
            notification.style.background = 'linear-gradient(135deg, #10B981, #059669)';
          } else {
            throw new Error('execCommand falló');
          }
        } catch (fallbackError) {
          notification.textContent = `❌ Error al copiar: ${fallbackError.message}`;
          notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
          console.error('Error en todos los métodos de copia:', fallbackError);
        }
      }

      // Remover notificación después de mostrar resultado (optimizado)
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 2500);
    }

    // Iniciar el proceso de captura
    await performScrollAndExtract();
  }

  // Ejecutar la función principal
  scrollAndCollectTweets().catch(error => {
    console.error('Error general en extractAndCopyTweets:', error);
    notification.textContent = `❌ Error: ${error.message}`;
    notification.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 3000);
  });
}

// Función para manejar el clic en un botón de menú custom
async function handleCustomButtonClick(context, buttonElement) {
  deselectAllButtons();
  buttonElement.classList.add('option-selected');

  // 1. Establecer el nuevo contexto primero. Esto es crucial para que `updateContextDisplay`
  //    interprete correctamente el tipo de contexto (URL vs. Portapapeles).
  config.setCurrentContext(context);
  saveMainConfig(); // Guardar la configuración actualizada inmediatamente

  // 2. Determinar el comportamiento y actualizar los datos relevantes (URL o contenido del Portapapeles).
  const behaviour = buttonElement.dataset.behaviour;
  if (behaviour === 'Clipboard') {
    config.setUseClipboard(true);
    await tryReadClipboard(); // Esperar a que se lea el portapapeles
  } else { // Comportamiento por defecto: URL
    config.setUseClipboard(false);
    await new Promise(resolve => { // Envolver chrome.tabs.query en una Promesa para esperar su finalización
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs && tabs.length > 0) {
          config.setCurrentUrl(tabs[0].url);
        }
        resolve(); // Resolver la promesa una vez que la callback se haya ejecutado
      });
    });
  }
  // Load and render sections based on the new context
  try {
    const newMenuData = await loadMenuData(config.getCurrentLanguage());
    config.setMenuData(newMenuData);
    renderSections();

    // No actualizar el título del sidepanel para botones custom
    // El título se mantiene como está configurado inicialmente

    // 3. Ahora que el contexto, los datos (URL/Portapapeles) y los datos del menú están establecidos, actualizar la visualización.
    updateContextDisplay();
  } catch (error) {
    console.error('Error loading menu data for custom context:', error);
  }
}

// Función para buscar JSONs custom (en storage o archivos) y crear los botones
async function initializeCustomButtons() {
  const customToggle = document.getElementById('custom-toggle');
  const customContainer = document.getElementById('custom-buttons-container');

  if (!customToggle || !customContainer) {
    console.warn('Elementos para botones personalizados no encontrados.');
    return;
  }

  const customFileNames = ['custom_1.json', 'custom_2.json', 'custom_3.json', 'custom_4.json'];
  let customButtonsCreated = 0;

  for (const fileName of customFileNames) {
    const context = fileName.replace('.json', ''); // e.g., "custom_1"
    const slot = context.split('_')[1];
    const storageKey = `custom_json_${slot}`;

    // Comprobar si existe en storage
    const storageData = await new Promise(resolve => chrome.storage.local.get(storageKey, result => resolve(result[storageKey])));

    let data;
    let source;

    if (storageData) {
      data = storageData;
      source = 'storage';
    } else {
      // Si no está en storage, comprobar si existe el archivo por defecto
      try {
        const fileUrl = chrome.runtime.getURL(`src/common/languages/custom/${fileName}`);
        const response = await fetch(fileUrl);
        if (response.ok) {
          data = await response.json();
          source = 'file';
        }
      } catch (error) { /* El archivo no existe, ignorar */ }
    }

    if (data) {
      const title = data.header?.title || context;
      const behaviour = data.header?.behaviour || 'url';

      const button = document.createElement('button');
      button.className = 'option-button custom-menu-button';
      button.textContent = title;
      button.dataset.context = context;
      button.dataset.behaviour = behaviour;
      button.title = `Cargado desde: ${source}`; // Tooltip útil para depuración

      button.addEventListener('click', () => handleCustomButtonClick(context, button));

      customContainer.appendChild(button);
      customButtonsCreated++;
    }
  }

  if (customButtonsCreated > 0) {
    customToggle.classList.remove('hidden');
    customToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = customContainer.classList.toggle('hidden');
      if (isHidden) {
        customToggle.textContent = '▼'; // Oculto, mostrar flecha hacia abajo para desplegar
      } else {
        customToggle.textContent = '▲'; // Visible, mostrar flecha hacia arriba para ocultar
      }
    });
  }
}

// Función para inicializar la extensión
document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Solicitar permisos de portapapeles al iniciar
    const hasClipboardPermission = await requestClipboardPermission();

    document.addEventListener('clipboardContentChanged', async function (event) {
      // Solo ejecutar si el contexto actual es de tipo clipboard
      if (isClipboardBehaviorContext(config.getCurrentContext())) {
        config.setClipboardText(event.detail.newContent);
        updateContextDisplay();
        const newMenuData = await loadMenuData(config.getCurrentLanguage());
        config.setMenuData(newMenuData);
        renderSections();
      }
    });

    // Cargar los idiomas disponibles primero
    await loadAvailableLanguages();

    const mainConfig = await loadMainConfig();

    updateLanguageMenus();

    updateUITexts(config.getCurrentLanguage());

    configureLanguageMenu();
    configureModelMenu();

    // Cargar datos del menú con el idioma actual
    const menuData = await loadMenuData(config.getCurrentLanguage());
    config.setMenuData(menuData);

    initializeUI();

    await initializeCustomButtons();

    // Seleccionar automáticamente el contexto adecuado y renderizar el menú
    const currentContext = config.getCurrentContext();
    const buttonId = getButtonIdFromContext(currentContext);
    let contextButton = document.getElementById(buttonId);

    // Handle custom buttons specifically if not found by getButtonIdFromContext
    if (!contextButton && currentContext.startsWith('custom_')) {
      contextButton = document.querySelector(`.custom-menu-button[data-context="${currentContext}"]`);
    }

    if (contextButton) {
      // Deseleccionar todos los botones
      deselectAllButtons();
      // Seleccionar el botón de contexto
      contextButton.classList.add('option-selected');

      // Determine behaviour for the selected context and load initial data
      const buttonBehaviour = contextButton.dataset.behaviour; // 'url' or 'Clipboard' for custom, undefined for standard

      if (isClipboardBehaviorContext(currentContext)) {
        config.setUseClipboard(true);
        await tryReadClipboard();
        updateContextDisplay();
      } else { // Default to URL behavior for all other contexts
        config.setUseClipboard(false);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs && tabs.length > 0) {
            config.setCurrentUrl(tabs[0].url);
            updateContextDisplay();
          }
        });
      }

      // Renderizar secciones del menú
      renderSections();
    } else {
      console.warn('No se encontró el botón para el contexto:', currentContext, 'ID:', buttonId);
      const urlButton = document.getElementById('use-url');
      if (urlButton) {
        deselectAllButtons();
        urlButton.classList.add('option-selected');
        config.setUseClipboard(false);
        config.setCurrentContext('url');
        updateContextDisplay();

        // Cargar el menú correspondiente al contexto de URL
        const newMenuData = await loadMenuData(config.getCurrentLanguage());
        config.setMenuData(newMenuData);
        renderSections();
      }
    }

    function isUrlBehaviorContext(context) {
      return !isClipboardBehaviorContext(context); // If it's not clipboard behavior, it's URL behavior
    }

    // Escuchar cambios de URL en la pestaña activa
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
      if (changeInfo.url && tab.active) {
        config.setCurrentUrl(changeInfo.url);
        if (isUrlBehaviorContext(config.getCurrentContext())) {
          updateContextDisplay();
        }
      }
    });

    chrome.tabs.onActivated.addListener(function (activeInfo) {
      chrome.tabs.get(activeInfo.tabId, function (tab) {
        if (tab) {
          config.setCurrentUrl(tab.url);
          if (isUrlBehaviorContext(config.getCurrentContext())) {
            updateContextDisplay();
          }
        }
      });
    });

  } catch (error) {
    console.error('Error al inicializar la extensión:', error);
    document.body.innerHTML = `<div class="error">Error al cargar los datos: ${error.message}</div>`;
  }
});

// Función para actualizar la URL de la pestaña activa
function updateActiveTabUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs && tabs.length > 0) {
      config.setCurrentUrl(tabs[0].url);
      // No actualizamos el display automáticamente
    } else {
      config.setCurrentUrl("URL no disponible");
      // No actualizamos el display automáticamente
    }
  });
}

// Función para deseleccionar todos los botones de opciones
function deselectAllButtons() {
  const urlButton = document.getElementById('use-url');
  const clipboardButton = document.getElementById('use-clipb');
  const bookButton = document.getElementById('use-book');
  const pdfButton = document.getElementById('use-pdf');
  const wikiButton = document.getElementById('use-wiki');
  const twitterButton = document.getElementById('use-twitter');
  const gmailButton = document.getElementById('use-gmail');
  const addButton = document.getElementById('use-add');

  if (urlButton) urlButton.classList.remove('option-selected');
  if (clipboardButton) clipboardButton.classList.remove('option-selected');
  if (bookButton) bookButton.classList.remove('option-selected');
  if (pdfButton) pdfButton.classList.remove('option-selected');
  if (wikiButton) wikiButton.classList.remove('option-selected');
  if (twitterButton) twitterButton.classList.remove('option-selected');
  if (gmailButton) gmailButton.classList.remove('option-selected');
  if (addButton) addButton.classList.remove('option-selected');

  // Añadir deselección para los botones custom
  const customButtons = document.querySelectorAll('.custom-menu-button');
  customButtons.forEach(btn => btn.classList.remove('option-selected'));
  
}

// Función para inicializar la interfaz de usuario
function initializeUI() {
  // Establecer título de la extensión de forma dinámica según el modelo y el idioma seleccionados
  const titleTextElement = document.getElementById('title-text');
  const modelName = getAIModelName(config.getCurrentAIModel()); // Obtener nombre del modelo actual

  // Actualizar el título con el modelo seleccionado
  titleTextElement.textContent = `${modelName} Prompt Assistant`; // Título dinámico

  // Actualizar el botón de idioma con la bandera correspondiente
  updateLanguageButtonIcon(config.getCurrentLanguage());

  // Actualizar el modelo seleccionado en el menú
  updateSelectedModelInMenu();

  // Actualizar el idioma seleccionado en el menú
  updateSelectedLanguageInMenu();
  
  // Asegurar que el icono del motor esté actualizado con el modelo actual
  updateMotorIcon();

  // Iniciar monitoreo del portapapeles
  const clipboardMonitor = setupClipboardMonitoring();

  // Inicializar botones de opción
  const urlButton = document.getElementById('use-url');
  const clipboardButton = document.getElementById('use-clipb');
  const bookButton = document.getElementById('use-book');
  const pdfButton = document.getElementById('use-pdf');
  const wikiButton = document.getElementById('use-wiki');
  const twitterButton = document.getElementById('use-twitter');
  const gmailButton = document.getElementById('use-gmail');
  const addButton = document.getElementById('use-add');
  const directQuestionButton = document.getElementById('direct-question-btn');

  // Configurar el enlace de feedback
  const feedbackLink = document.getElementById('feedback-button');
  if (feedbackLink) {
    feedbackLink.addEventListener('click', function (e) {
      e.preventDefault();
      // Abrir la página de feedback
      chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/pages/feedback/feedback.html') });
    });
  }

  // Configurar el botón de calificación
  const rateButton = document.getElementById('rate-button');
  if (rateButton) {
    rateButton.addEventListener('click', function (e) {
      e.preventDefault();
      // Abrir la página de la extensión en Chrome Web Store para calificar
      chrome.tabs.create({
        url: 'https://chrome.google.com/webstore/detail/ai-prompt-assistant/jimdgbjdhdoiejncgdfcjpakokcpnalg/reviews'
      });
    });
  }

  // Configurar el botón de ayuda/video
  const helpVideoButton = document.getElementById('help-video-button');
  if (helpVideoButton) {
    helpVideoButton.addEventListener('click', function (e) {
      e.preventDefault();
      // Usar el background script para abrir el video de ayuda
      chrome.runtime.sendMessage({
        action: 'openHelpVideo'
      }, (response) => {
        if (response && response.success) {
          console.log('Video de ayuda abierto correctamente');
        } else {
          console.error('Error al abrir el video de ayuda');
        }
      });
    });
  }

  // Configurar el botón de compartir con submenú
  const shareButton = document.getElementById('share-button');
  const shareSubmenu = document.getElementById('share-submenu');
  const shareEmailButton = document.getElementById('share-email');
  const shareWhatsappButton = document.getElementById('share-whatsapp');

  if (shareButton && shareSubmenu) {
    // Mostrar/ocultar submenú al hacer clic en el botón principal
    shareButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Toggle del submenú
      if (shareSubmenu.classList.contains('visible')) {
        shareSubmenu.classList.remove('visible');
        shareSubmenu.classList.add('hidden');
      } else {
        shareSubmenu.classList.remove('hidden');
        shareSubmenu.classList.add('visible');
      }
    });

    // Cerrar submenú al hacer clic fuera
    document.addEventListener('click', function (e) {
      if (!shareButton.contains(e.target) && !shareSubmenu.contains(e.target)) {
        shareSubmenu.classList.remove('visible');
        shareSubmenu.classList.add('hidden');
      }
    });

    // Evitar que clics dentro del submenú lo cierren
    shareSubmenu.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  // Configurar botón de Email
  if (shareEmailButton) {
    shareEmailButton.addEventListener('click', async function (e) {
      e.preventDefault();

      // Cerrar submenú
      shareSubmenu.classList.remove('visible');
      shareSubmenu.classList.add('hidden');

      // Definir subject y texto del email
      const emailSubject = "AI Prompt Assistant ";
      const emailBody = `Hola
¡Hola! 👋 
Encontré una extensión de Chrome que creo que te va a ser útil.

Se llama *AI Prompt Assistant* y tiene estas características increíbles:
• 🤖 Modelos AI de ChatGPT, Claude, Gemini, DeepSeek, etc...
• 🌐 Soporte multiidioma 
• 📝 Editor de prompts moderno
• 📧 Extracción de Gmail y Twitter/X
• 📚 Soporte para libros y PDFs
• 🎯 Interfaz intuitiva y elegante

🔗 La puedes instalar gratis aquí desde la Chrome Store de Google:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share

---

Hi! 👋
I found a Chrome extension that I think you'll find useful.

It's called *AI Prompt Assistant* and has these amazing features:
• 🤖 AI models from ChatGPT, Claude, Gemini, DeepSeek, etc...
• 🌐 Multi-language support
• 📝 Modern prompt editor  
• 📧 Gmail and Twitter/X extraction
• 📚 Support for books and PDFs
• 🎯 Intuitive and elegant interface

🔗 You can install it for free here from the Google Chrome Store:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share`;

      try {
        // Codificar el subject y body para URL
        const encodedSubject = encodeURIComponent(emailSubject);
        const encodedBody = encodeURIComponent(emailBody);

        // Crear el enlace mailto
        const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;

        // Abrir cliente de email
        window.open(mailtoUrl, '_self');

        // Mostrar notificación de éxito
        const notification = document.getElementById('copy-notification');
        notification.textContent = '📧 ¡Abriendo cliente de email para compartir!';
        notification.classList.remove('hidden');

        setTimeout(() => {
          notification.classList.add('hidden');
        }, 3000);

      } catch (error) {
        console.error('Error al abrir email:', error);

        // Mostrar notificación de error
        const notification = document.getElementById('copy-notification');
        notification.textContent = '❌ Error al abrir email - Inténtalo de nuevo';
        notification.classList.remove('hidden');

        setTimeout(() => {
          notification.classList.add('hidden');
        }, 3000);
      }
    });
  }

  // Configurar botón de WhatsApp
  if (shareWhatsappButton) {
    shareWhatsappButton.addEventListener('click', async function (e) {
      e.preventDefault();

      // Cerrar submenú
      shareSubmenu.classList.remove('visible');
      shareSubmenu.classList.add('hidden');

      // Crear mensaje para WhatsApp (formato más amigable)
      const whatsappMessage = `*AI Prompt Assistant*

¡Hola! 👋 
Encontré una extensión de Chrome que creo que te va a ser útil.

Se llama *AI Prompt Assistant* y tiene estas características increíbles:
• 🤖 Modelos AI de ChatGPT, Claude, Gemini, DeepSeek, etc...
• 🌐 Soporte multiidioma 
• 📝 Editor de prompts moderno
• 📧 Extracción de Gmail y Twitter/X
• 📚 Soporte para libros y PDFs
• 🎯 Interfaz intuitiva y elegante

🔗 La puedes instalar gratis aquí desde la Chrome Store de Google:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share

---

Hi! 👋
I found a Chrome extension that I think you'll find useful.

It's called *AI Prompt Assistant* and has these amazing features:
• 🤖 AI models from ChatGPT, Claude, Gemini, DeepSeek, etc...
• 🌐 Multi-language support
• 📝 Modern prompt editor  
• 📧 Gmail and Twitter/X extraction
• 📚 Support for books and PDFs
• 🎯 Intuitive and elegant interface

🔗 You can install it for free here from the Google Chrome Store:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share`;

      try {
        // Codificar el mensaje para WhatsApp
        const encodedMessage = encodeURIComponent(whatsappMessage);

        // Crear URL de WhatsApp
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');

        // Mostrar notificación de éxito
        const notification = document.getElementById('copy-notification');
        notification.textContent = '📱 ¡Abriendo WhatsApp para compartir!';
        notification.classList.remove('hidden');

        setTimeout(() => {
          notification.classList.add('hidden');
        }, 3000);

      } catch (error) {
        console.error('Error al abrir WhatsApp:', error);

        // Mostrar notificación de error
        const notification = document.getElementById('copy-notification');
        notification.textContent = '❌ Error al abrir WhatsApp - Inténtalo de nuevo';
        notification.classList.remove('hidden');

        setTimeout(() => {
          notification.classList.add('hidden');
        }, 3000);
      }
    });
  }

  // No seleccionamos ningún botón al inicio y no mostramos ningún contenido
  deselectAllButtons();

  // NO renderizamos las secciones automáticamente al inicio
  // NO actualizamos el display del contexto

  // Eventos para los botones de opción
  urlButton.addEventListener('click', function () {
    deselectAllButtons();
    urlButton.classList.add('option-selected');
    config.setUseClipboard(false);
    config.setCurrentContext('url');

    // Actualizar URL activa inmediatamente
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        config.setCurrentUrl(tabs[0].url);
        // Actualizar la visualización del contexto con la URL actual
        updateContextDisplay();
      }
    });

    // Guardar configuración principal
    saveMainConfig();

    // Cargar el menú correspondiente al contexto de URL
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de URL:', error);
    });
  });

  clipboardButton.addEventListener('click', async function () {
    deselectAllButtons();
    clipboardButton.classList.add('option-selected');
    config.setUseClipboard(true);
    config.setCurrentContext('clipboard');

    // Obtener el texto seleccionado de la pestaña activa
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        if (tabs && tabs.length > 0) {
        try {
          const url = tabs[0].url;
          if (
            url.startsWith('chrome://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('https://chrome.google.com/webstore')
          ) {
            // Mostrar mensaje de error en la sidebar
            mostrarError('No se puede acceder al portapapeles en esta página.');
            return;
          }
          // Ejecutar script para copiar texto seleccionado al portapapeles
          const result = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: function () {
              // Función que se ejecuta en el contexto de la página
              try {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                  const selectedText = selection.toString().trim();
                  if (selectedText) {
                    // Usar la API moderna de clipboard si está disponible
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(selectedText).then(() => {
                        // Texto copiado exitosamente
                      }).catch(err => {
                        console.error('❌ Error al copiar con API moderna:', err);
                      });
                    }
                    return selectedText;
                  } else {
                    return '[No hay texto seleccionado en la página]';
                  }
                } else {
                  return '[No hay texto seleccionado en la página]';
                }
              } catch (error) {
                console.error('❌ Error al acceder a la selección:', error);
                return '[Error al acceder al texto seleccionado]';
              }
            }
          });

          // Obtener el resultado del script ejecutado
          const selectedText = result[0].result;

                        // Establecer el texto seleccionado en el clipboard interno
              config.setClipboardText(selectedText);
              updateContextDisplay();

              // Mostrar notificación de éxito si se obtuvo texto
              const notification = document.getElementById('copy-notification');
              if (selectedText && !selectedText.includes('[No hay texto') && !selectedText.includes('[Error')) {
                notification.textContent = '✅ Texto seleccionado copiado al portapapeles';
                notification.classList.remove('hidden');
                setTimeout(() => {
                  notification.classList.add('hidden');
                }, 2000);
                
                // Copia adicional al portapapeles del sistema
                copyToSystemClipboard(selectedText);
              }

        } catch (error) {
          console.error("Error al obtener texto seleccionado:", error);
          config.setClipboardText("[Error al obtener texto seleccionado]");
          updateContextDisplay();
        }
      }
    });

    // Asegurar que el monitoreo está activo
    clipboardMonitor.start();

    // Guardar configuración principal
    saveMainConfig();

    // Cargar el menú correspondiente al contexto de portapapeles
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de portapapeles:', error);
    });
  });

  bookButton.addEventListener('click', async function () {
    deselectAllButtons();
    bookButton.classList.add('option-selected');
    config.setCurrentContext('book');
    // Establecer explícitamente que se usará el portapapeles
    config.setUseClipboard(true);

    // Lógica específica para libros
    const texts = getTranslation(config.getCurrentLanguage());
    var nombreLibro = await textPrompt(texts.textPrompt.bookPrompt, "The Old Man and the Sea");
    if (nombreLibro) {
      config.setClipboardText(nombreLibro);
      // Copiar al portapapeles del sistema usando función mejorada
      copyToSystemClipboard(nombreLibro);
      // Actualizar la visualización con el nombre del libro
      updateContextDisplay();
    } else {
      nombreLibro = "The Old Man and the Sea";
      config.setClipboardText(nombreLibro);
      // Copiar al portapapeles del sistema usando función mejorada
      copyToSystemClipboard(nombreLibro);
      // Actualizar la visualización con el nombre del libro por defecto
      updateContextDisplay();
    }
    // Guardar configuración principal
    saveMainConfig();

    // Cargar el menú correspondiente al contexto de libros
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de libros:', error);
    });
  });

  pdfButton.addEventListener('click', function () {
    deselectAllButtons();
    pdfButton.classList.add('option-selected');
    config.setCurrentContext('pdf');
    config.setUseClipboard(false);

    // Comprobar si ya tenemos información de un PDF seleccionado previamente
    chrome.storage.local.get(['lastSelectedPdf'], function (result) {
      if (result.lastSelectedPdf) {
        // Mostrar el PDF seleccionado anteriormente
        config.setClipboardText(`PDF: ${result.lastSelectedPdf}`);
        updateContextDisplay();
      } else {
        // No hay PDF seleccionado, mostrar mensaje genérico
        config.setClipboardText('Seleccione un PDF...');
        updateContextDisplay();
      }
    });

    // Crear un input file oculto para seleccionar archivos PDF
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Activar el diálogo de selección de archivo
    fileInput.click();

    // Manejar la selección del archivo
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) {
        const selectedFile = fileInput.files[0];

        // Mostrar el nombre del archivo seleccionado en la interfaz
        config.setClipboardText(`PDF: ${selectedFile.name}`);
        updateContextDisplay();

        // Crear un objeto URL para el archivo
        const fileUrl = URL.createObjectURL(selectedFile);

        // Guardar la ruta del archivo para usarla en los prompts
        const filePath = fileUrl;

        // Almacenar el nombre y la ruta del archivo en el almacenamiento local
        chrome.storage.local.set({
          lastSelectedPdf: selectedFile.name,
          lastSelectedPdfPath: filePath
        });

        // Guardar configuración principal
        saveMainConfig();

        // Cargar el PDF usando fetch
        fetch(fileUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Error al cargar el PDF: ${response.status}`);
            }
            return response.blob();
          })
          .then(pdfBlob => {
            // Crear un nuevo objeto URL para el blob
            const blobUrl = URL.createObjectURL(pdfBlob);

            // Abrir el PDF en una nueva pestaña
            chrome.tabs.create({ url: blobUrl, active: true }, (newTab) => {
              // Esperar a que la pestaña se cargue completamente
              chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                  // Remover el listener para evitar múltiples ejecuciones
                  chrome.tabs.onUpdated.removeListener(listener);
                  
                  // Esperar un poco más para asegurar que el PDF se renderice
                  setTimeout(() => {
                    // Ejecutar el script para extraer texto del PDF
                    chrome.scripting.executeScript({
                      target: { tabId: newTab.id },
                      function: extractPDFText
                    });
                  }, 2000);
                }
              });
            });

            // Mostrar notificación de éxito
            const notification = document.getElementById('copy-notification');
            notification.textContent = `PDF abierto: ${selectedFile.name}. Extrayendo texto...`;
            notification.classList.remove('hidden');

            // Configurar listener para recibir el resultado de la extracción
            const messageListener = (event) => {
              if (event.data && event.data.type === 'PDF_EXTRACT_COMPLETE') {
                if (event.data.success) {
                  // Éxito: actualizar el texto del clipboard y la interfaz
                  const extractedLength = event.data.textLength;
                  config.setClipboardText(`PDF extraído: ${selectedFile.name} (${extractedLength} caracteres)`);
                  updateContextDisplay();
                  
                  notification.textContent = `✅ Texto extraído del PDF: ${extractedLength} caracteres copiados al clipboard`;
            setTimeout(() => {
              notification.classList.add('hidden');
                  }, 4000);
                } else {
                  // Error: mostrar mensaje de error
                  notification.textContent = `❌ Error extrayendo texto del PDF: ${event.data.error}`;
                  setTimeout(() => {
                    notification.classList.add('hidden');
                  }, 5000);
                }
                
                // Remover el listener después de recibir el resultado
                window.removeEventListener('message', messageListener);
              }
            };
            
            // Agregar el listener
            window.addEventListener('message', messageListener);

            // Timeout de seguridad para remover el listener si no se recibe respuesta
            setTimeout(() => {
              window.removeEventListener('message', messageListener);
              if (!notification.classList.contains('hidden')) {
                notification.textContent = `⚠️ Tiempo de espera agotado para extraer texto del PDF`;
                setTimeout(() => {
                  notification.classList.add('hidden');
                }, 3000);
              }
            }, 30000); // 30 segundos de timeout
          })
          .catch(error => {
            console.error('Error al cargar el PDF:', error);

            // Mostrar notificación de error
            const notification = document.getElementById('copy-notification');
            notification.textContent = `UNDER CONSTRUCTION: Error al abrir el PDF: ${error.message}`;
            notification.classList.remove('hidden');

            setTimeout(() => {
              notification.classList.add('hidden');
            }, 3000);
          });
      }

      // Eliminar el input después de usarlo
      document.body.removeChild(fileInput);
    });

    // Cargar el menú correspondiente al contexto de pdf
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de pdf:', error);
    });

    // Llamar a la función underConstruction al final
    underConstruction();
  });

  wikiButton.addEventListener('click', function () {
    deselectAllButtons();
    wikiButton.classList.add('option-selected');
    config.setCurrentContext('wiki');
    config.setUseClipboard(false);

    // Actualizar URL activa inmediatamente
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        config.setCurrentUrl(tabs[0].url);
        // Actualizar la visualización para mostrar Wiki y la URL
        updateContextDisplay();
      }
    });

    // Lógica específica para Wikipedia: obtener la pestaña actual y verificar si es Wikipedia
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        const currentUrl = tabs[0].url;
        if (currentUrl.includes('wikipedia.org')) {
          // Ya estamos en Wikipedia, sólo actualizamos la visualización
          config.setCurrentUrl(currentUrl);
          updateContextDisplay();
          // Ya estamos en Wikipedia
        } else {
          // No estamos en Wikipedia, abrir una nueva pestaña
          chrome.tabs.create({ url: 'https://www.wikipedia.org/' }, function (newTab) {
            // Actualizar con la nueva URL de Wikipedia
            config.setCurrentUrl('https://www.wikipedia.org/');
            updateContextDisplay();
          });
          // Abriendo Wikipedia en nueva pestaña
        }
      }
    });

    // Guardar preferencia de contexto
    saveMainConfig();

    // Cargar el menú correspondiente al contexto de Wikipedia
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de Wikipedia:', error);
    });
  });

  twitterButton.addEventListener('click', async function () {
    deselectAllButtons();
    twitterButton.classList.add('option-selected');
    config.setCurrentContext('twitter');
    config.setUseClipboard(true); // Cambiado a true para usar el clipboard para tweets

    // Actualizar URL activa inmediatamente
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      if (tabs && tabs.length > 0) {
        const currentUrl = tabs[0].url;
        config.setCurrentUrl(currentUrl);

        // Si estamos en Twitter/X, mostrar eso en la etiqueta
        if (currentUrl.includes('twitter.com') || currentUrl.includes('x.com')) {
          config.setClipboardText('Preparando extracción de tweets...');
        } else {
          config.setClipboardText('No estamos en Twitter/X');
        }
        updateContextDisplay();
      }
    });

    // Lógica específica para Twitter/X: obtener la pestaña actual y verificar si es Twitter
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      if (tabs && tabs.length > 0) {
        const currentUrl = tabs[0].url;
        if (currentUrl.includes('twitter.com') || currentUrl.includes('x.com')) {
          // Solicitar confirmación antes de proceder
          const userConfirmed = await confirmPrompt(null, 'twitter');

          if (userConfirmed) {
            // El usuario confirmó, proceder con la extracción
            config.setClipboardText('Extrayendo tweets...');
            updateContextDisplay();

            // Ejecutar el script para extraer los tweets
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: extractAndCopyTweets
            });

            // Configurar listener para recibir el resultado
            const messageListener = (event) => {
              if (event.data && event.data.type === 'TWITTER_EXTRACT_COMPLETE') {
                // Actualizar clipboard interno y etiqueta
                config.setClipboardText(event.data.threadText);
                updateContextDisplay();

                // Remover listener después del uso
                window.removeEventListener('message', messageListener);

                console.log(`✅ Clipboard actualizado con ${event.data.tweetCount} posts de X/Twitter`);
                
                // Copia adicional al portapapeles del sistema desde la extensión
                copyToSystemClipboard(event.data.threadText);
              }
            };

            window.addEventListener('message', messageListener);

            // Timeout para limpiar listener si no recibe respuesta
            setTimeout(() => {
              window.removeEventListener('message', messageListener);
            }, 60000); // 1 minuto timeout
          } else {
            // El usuario canceló, no hacer nada
            config.setClipboardText('Extracción cancelada por el usuario');
            updateContextDisplay();
          }
        } else {
          // No estamos en Twitter/X, abrir una nueva pestaña
          chrome.tabs.create({ url: 'https://twitter.com' }, function (newTab) {
            // Actualizar con la nueva URL de Twitter
            config.setCurrentUrl('https://twitter.com');
            config.setClipboardText('Navegando a Twitter/X...');
            updateContextDisplay();
          });
        }
      }
    });

    // Guardar preferencia de contexto
    saveMainConfig();

    // Cargar el menú correspondiente al contexto de Twitter
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de Twitter:', error);
    });

    // Llamar a la función underConstruction al final
    underConstruction();
  });

  gmailButton.addEventListener('click', async function () {
    deselectAllButtons();
    gmailButton.classList.add('option-selected');
    config.setCurrentContext('gmail');
    config.setUseClipboard(true);

    // Leer portapapeles inmediatamente
    const clipText = await tryReadClipboard();
    config.setClipboardText('Gmail: ' + clipText);
    updateContextDisplay();

    // Lógica específica para Gmail: obtener la pestaña actual y verificar si es Gmail
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      if (tabs && tabs.length > 0) {
        const currentUrl = tabs[0].url;
        if (currentUrl.includes('mail.google.com')) {
          // Solicitar confirmación antes de proceder
          const userConfirmed = await confirmPrompt(null, 'gmail');

          if (userConfirmed) {
            // El usuario confirmó, proceder con la extracción
            config.setClipboardText('Extrayendo emails...');
            updateContextDisplay();

            // Ya estamos en Gmail, ejecutar el script para extraer emails
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: extractAndCopyGmailContent
            });

            // Configurar listener para recibir el resultado
            const messageListener = (event) => {
              if (event.data && event.data.type === 'GMAIL_EXTRACT_COMPLETE') {
                // Actualizar clipboard interno y etiqueta
                config.setClipboardText(event.data.emailText);
                updateContextDisplay();

                // Remover listener después del uso
                window.removeEventListener('message', messageListener);

                console.log(`✅ Clipboard actualizado con ${event.data.emailCount} emails de Gmail`);
                
                // Copia adicional al portapapeles del sistema desde la extensión
                copyToSystemClipboard(event.data.emailText);
              }
            };

            window.addEventListener('message', messageListener);

            // Timeout para limpiar listener si no recibe respuesta
            setTimeout(() => {
              window.removeEventListener('message', messageListener);
            }, 60000); // 1 minuto timeout

            // Ya estamos en Gmail
          } else {
            // El usuario canceló, no hacer nada
            config.setClipboardText('Extracción cancelada por el usuario');
            updateContextDisplay();
          }
        } else {
          // No estamos en Gmail, abrir una nueva pestaña
          chrome.tabs.create({ url: 'https://mail.google.com/' }, function (newTab) {
            // Actualizar con la nueva URL de Gmail
            config.setCurrentUrl('https://mail.google.com/');
            config.setClipboardText('Navegando a Gmail...');
            updateContextDisplay();
          });
          // Abriendo Gmail en nueva pestaña
        }
      }
    });

    // Guardar preferencia de contexto
    saveMainConfig();

    // Cargar el menú correspondiente al contexto de Gmail
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú de Gmail:', error);
    });

    // Llamar a la función underConstruction al final
    underConstruction();
  });

  addButton.addEventListener('click', function () {
    // Cambiar al contexto ADD para mostrar el menú JSON correspondiente
    const context = '+add+';
    config.setCurrentContext(context);
    
    // Actualizar el botón seleccionado
    deselectAllButtons();
    addButton.classList.add('option-selected');
    
    // Guardar la configuración
    saveMainConfig();
    
    // Desplegar los botones custom automáticamente
    const customContainer = document.getElementById('custom-buttons-container');
    const customToggle = document.getElementById('custom-toggle');
    
    if (customContainer && customToggle && !customToggle.classList.contains('hidden')) {
      // Si los botones custom existen y el toggle está visible, desplegarlos
      if (customContainer.classList.contains('hidden')) {
        customContainer.classList.remove('hidden');
        customToggle.textContent = '▲'; // Mostrar flecha hacia arriba para indicar que están desplegados
      }
    }
    
    // Cargar el menú correspondiente al contexto ADD (siempre recarga)
    loadMenuData(config.getCurrentLanguage()).then(newMenuData => {
      config.setMenuData(newMenuData);
      renderSections();
    }).catch(error => {
      console.error('Error al cargar el menú ADD:', error);
    });
    
    // También abrir el JSON Editor en una nueva pestaña
    window.open('/src/sidepanel/pages/jsonEditor/jsonEditor.html', '_blank');
  });

  // Event listener para el botón de pregunta directa
  if (directQuestionButton) {
    directQuestionButton.addEventListener('click', async function () {
      // Usar la función especial que envía solo el prompt sin contexto
      const texts = getTranslation(config.getCurrentLanguage());
      const label = texts.optionButtons.directQuestionButton;
      await openAIWithPromptOnly("", label);
    });
  }

  // Configurar eventos para la ventana emergente de configuración
  document.getElementById('settings-button').addEventListener('click', function () {
    showSettingsMenu();
  });

  document.getElementById('close-settings').addEventListener('click', function () {
    hideSettingsMenu();
  });

  // Cerrar ventana emergente al hacer clic fuera
  document.getElementById('settings-popup').addEventListener('click', function (event) {
    if (event.target === this) {
      hideSettingsMenu();
    }
  });

  // Configurar selectores de idioma y modelo
  const languageSelector = document.getElementById('language-selector');
  languageSelector.value = config.getCurrentLanguage();

  // Actualizar el icono del botón de idioma al inicio
  updateLanguageButtonIcon(config.getCurrentLanguage());

  languageSelector.addEventListener('change', function (e) {
    changeLanguage(e.target.value);
    saveMainConfig();
  });

  const modelSelector = document.getElementById('ai-model-selector');
  modelSelector.value = config.getCurrentAIModel();
  modelSelector.addEventListener('change', function (e) {
    changeAIModel(e.target.value);
    // Actualizar el icono del motor después de cambiar el modelo
    setTimeout(() => {
      updateMotorIcon();
    }, 100); // Pequeño delay para asegurar que el cambio se propague
    saveMainConfig();
  });

  // Configurar el botón de abrir JSON
  const openJsonButton = document.getElementById('open-json-button');
  if (openJsonButton) {
    openJsonButton.addEventListener('click', () => {
      window.open('/src/sidepanel/pages/jsonEditor/jsonEditor.html', '_blank');
    });
  }

  // Configurar el botón de Gmail para compartir
  const shareGmailButton = document.getElementById('share-gmail');
  if (shareGmailButton) {
    shareGmailButton.addEventListener('click', () => {
      sendGmail();
    });
  }

  // Configurar menús emergentes
  configureModelMenu();
  configureLanguageMenu();
  setupClickOutsideHandler();
}

// Configurar el menú emergente de modelos de IA
function configureModelMenu() {
  const motorButton = document.getElementById('motor-button');
  const aiModelsPopup = document.getElementById('ai-models-popup');

  // Si no existen los elementos, salir de la función
  if (!motorButton || !aiModelsPopup) return;

  // Marcar el modelo actual como seleccionado
  updateSelectedModelInMenu();

  // Mostrar el menú al pasar el mouse sobre el botón
  motorButton.addEventListener('mouseenter', function (event) {
    event.stopPropagation(); // Evitar que el clic se propague

    // Si el menú de idiomas está visible, lo ocultamos
    const languagePopup = document.getElementById('language-popup');
    if (languagePopup && !languagePopup.classList.contains('hidden')) {
      languagePopup.classList.remove('visible');
      languagePopup.classList.add('hidden');
    }

    // Mostrar el menú de modelos
    if (aiModelsPopup.classList.contains('hidden')) {
      aiModelsPopup.classList.remove('hidden');
      setTimeout(() => {
        aiModelsPopup.classList.add('visible');
      }, 50);
    }
  });

  // Mantener el menú abierto mientras el mouse esté sobre él
  aiModelsPopup.addEventListener('mouseenter', function (event) {
    event.stopPropagation();
  });

  // Ocultar el menú cuando el mouse sale del botón y del menú
  motorButton.addEventListener('mouseleave', function (event) {
    // Verificar si el mouse se movió al menú
    const toElement = event.relatedTarget;
    if (!toElement || !aiModelsPopup.contains(toElement)) {
      setTimeout(() => {
        // Solo ocultar si el mouse no está sobre el menú
        if (!aiModelsPopup.matches(':hover')) {
          aiModelsPopup.classList.remove('visible');
          setTimeout(() => {
            aiModelsPopup.classList.add('hidden');
          }, 200);
        }
      }, 100);
    }
  });

  // Ocultar el menú cuando el mouse sale del menú
  aiModelsPopup.addEventListener('mouseleave', function (event) {
    const toElement = event.relatedTarget;
    if (!toElement || !motorButton.contains(toElement)) {
      aiModelsPopup.classList.remove('visible');
      setTimeout(() => {
        aiModelsPopup.classList.add('hidden');
      }, 200);
    }
  });

  // Evitar que los clics dentro del menú lo cierren
  aiModelsPopup.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  // Añadir eventos de clic a las opciones del menú
  const modelOptions = document.querySelectorAll('.ai-model-option');
  modelOptions.forEach(option => {
    option.addEventListener('click', function () {
      const modelId = this.getAttribute('data-model');
      changeAIModel(modelId);
      updateSelectedModelInMenu();
      aiModelsPopup.classList.remove('visible');
      setTimeout(() => {
        aiModelsPopup.classList.add('hidden');
      }, 200);
    });
  });
}

// Actualizar el modelo seleccionado en el menú
function updateSelectedModelInMenu() {
  // Quitar la clase selected de todas las opciones
  const modelOptions = document.querySelectorAll('.ai-model-option');
  modelOptions.forEach(option => {
    option.classList.remove('selected');
  });

  // Añadir la clase selected a la opción correspondiente al modelo actual
  const selectedOption = document.querySelector(`.ai-model-option[data-model="${config.getCurrentAIModel()}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
  
  // Actualizar el icono del motor con la imagen correspondiente
  updateMotorIcon();
}

// Función para actualizar el icono del motor con la imagen del modelo de IA seleccionado
function updateMotorIcon() {
  const motorIcon = document.getElementById('motor-icon');
  if (!motorIcon) return;
  
  // Mapeo de modelos de IA a sus archivos PNG
  const modelIconMap = {
    'chatgpt': '/src/assets/images/chatgpt.png',
    'claude': '/src/assets/images/claude-color.png',
    'deepseek': '/src/assets/images/deepseek-color.png',
    'mistral': '/src/assets/images/mistral-color.png',
    'copilot': '/src/assets/images/copilot-color.png',
    'gemini': '/src/assets/images/gemini-color.png',
    'meta': '/src/assets/images/meta-color.png',
    'grok': '/src/assets/images/grok.png',
    'allai': '/src/assets/images/All-AI.png'
  };
  
  // Obtener el modelo actual y su icono correspondiente
  const currentModel = config.getCurrentAIModel();
  const iconPath = modelIconMap[currentModel] || '/src/assets/images/chatgpt.png'; // Default fallback
  
  // Actualizar la imagen del motor
  motorIcon.src = iconPath;
  motorIcon.alt = `${currentModel} AI Model`;
  
  // Actualizar el texto del botón de pregunta directa
  const modelName = getAIModelName(currentModel);
  const currentLanguage = config.getCurrentLanguage();
  updateDirectQuestionButtonText(currentLanguage, modelName);
  
  console.log(`AI Prompt Assistant: Icono del motor actualizado a ${iconPath} para modelo ${currentModel}`);
}

// Configurar el menú de idiomas
function configureLanguageMenu() {
  const languageButton = document.getElementById('language-button');
  const languagePopup = document.getElementById('language-popup');

  // Si no existen los elementos, salir de la función
  if (!languageButton || !languagePopup) return;

  // Marcar el idioma actual como seleccionado
  updateSelectedLanguageInMenu();

  // Mostrar el menú al pasar el mouse sobre el botón
  languageButton.addEventListener('mouseenter', function (event) {
    event.stopPropagation(); // Evitar que el evento se propague

    // Si el menú de modelos está visible, lo ocultamos
    const aiModelsPopup = document.getElementById('ai-models-popup');
    if (aiModelsPopup && !aiModelsPopup.classList.contains('hidden')) {
      aiModelsPopup.classList.remove('visible');
      aiModelsPopup.classList.add('hidden');
    }

    // Mostrar menú de idiomas
    if (languagePopup.classList.contains('hidden')) {
      languagePopup.classList.remove('hidden');
      setTimeout(() => {
        languagePopup.classList.add('visible');
      }, 50);
    }
  });

  // Mantener el menú abierto mientras el mouse esté sobre él
  languagePopup.addEventListener('mouseenter', function (event) {
    event.stopPropagation();
  });

  // Ocultar el menú cuando el mouse sale del botón y del menú
  languageButton.addEventListener('mouseleave', function (event) {
    // Verificar si el mouse se movió al menú
    const toElement = event.relatedTarget;
    if (!toElement || !languagePopup.contains(toElement)) {
      setTimeout(() => {
        // Solo ocultar si el mouse no está sobre el menú
        if (!languagePopup.matches(':hover')) {
          languagePopup.classList.remove('visible');
          setTimeout(() => {
            languagePopup.classList.add('hidden');
          }, 200);
        }
      }, 100);
    }
  });

  // Ocultar el menú cuando el mouse sale del menú
  languagePopup.addEventListener('mouseleave', function (event) {
    const toElement = event.relatedTarget;
    if (!toElement || !languageButton.contains(toElement)) {
      languagePopup.classList.remove('visible');
      setTimeout(() => {
        languagePopup.classList.add('hidden');
      }, 200);
    }
  });

  // Evitar que los clics dentro del menú lo cierren
  languagePopup.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  // Añadir eventos de clic a las opciones del menú - delegación de eventos
  languagePopup.addEventListener('click', function (event) {
    const option = event.target.closest('.language-option');
    if (option) {
      const langId = option.getAttribute('data-lang');
      changeLanguage(langId);
      updateLanguageButtonIcon(langId);
      languagePopup.classList.remove('visible');
      setTimeout(() => {
        languagePopup.classList.add('hidden');
      }, 200);
    }
  });
}

// Actualizar el idioma seleccionado en el menú
function updateSelectedLanguageInMenu() {
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach(option => {
    option.classList.remove('selected');
  });

  // Añadir la clase selected a la opción correspondiente al idioma actual
  const selectedOption = document.querySelector(`.language-option[data-lang="${config.getCurrentLanguage()}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
}

// Cerrar menús al hacer clic fuera
function setupClickOutsideHandler() {
  document.addEventListener('click', function (event) {
    // Mantener la funcionalidad para cierre de menús al hacer clic
    // pero solo para interacciones específicas que lo requieran
    // Por ejemplo, al seleccionar una opción

    // Los menús ahora se manejan principalmente con eventos de mouse (hover)
    // sin necesidad de cerrarlos al hacer clic fuera
  });
}

// Función para actualizar los menús de idioma con los idiomas disponibles
function updateLanguageMenus() {
  // Actualizar el menú desplegable de idiomas
  const languagePopup = document.getElementById('language-popup');
  if (languagePopup) {
    const languageList = languagePopup.querySelector('ul');
    languageList.innerHTML = generateLanguageOptions();
  }

  // Actualizar el selector de idiomas en la configuración
  const languageSelector = document.getElementById('language-selector');
  if (languageSelector) {
    languageSelector.innerHTML = generateLanguageSelectorOptions();

    // Seleccionar el idioma actual
    const currentLang = config.getCurrentLanguage();
    const option = languageSelector.querySelector(`option[value="${currentLang}"]`);
    if (option) {
      option.selected = true;
    }
  }
}

// Agregar esta función para monitorear el portapapeles
function setupClipboardMonitoring() {
  let clipboardPollingInterval = null;

  // Crear un elemento de texto oculto para manejar la entrada del usuario
  const hiddenInput = document.createElement('textarea');
  hiddenInput.style.position = 'fixed';
  hiddenInput.style.opacity = '0';
  hiddenInput.style.pointerEvents = 'none';
  hiddenInput.style.zIndex = '-1000';
  document.body.appendChild(hiddenInput);

  document.addEventListener('copy', async function (e) {
    // Solo proceder si el contexto actual es de tipo clipboard
    if (isClipboardBehaviorContext(config.getCurrentContext())) {
      console.log('Evento de copia detectado');

      // Necesitamos esperar un momento para que el portapapeles se actualice
      setTimeout(async () => {
        try {
          // Intentar leer el nuevo contenido del portapapeles
          const oldClipboardContent = config.getClipboardText();
          await tryReadClipboard();
          const newClipboardContent = config.getClipboardText();

          // Si el contenido no es un mensaje de error y ha cambiado, ejecutar la funcionalidad de clipboardButton
          if (!newClipboardContent.includes('[Acceso al portapapeles') && !newClipboardContent.includes('[Haga clic aquí') && oldClipboardContent !== newClipboardContent) {
            const hasPermission = await requestClipboardPermission();
            config.setClipboardText(newClipboardContent);
            updateContextDisplay();
            const newMenuData = await loadMenuData(config.getCurrentLanguage());
            config.setMenuData(newMenuData);
            renderSections();
          }
        } catch (err) {
          console.error('Error al leer el portapapeles después de copia:', err);
        }
      }, 100); // Pequeño retraso para asegurar que el portapapeles se haya actualizado
    }
  });

  // Agregar manejador de clics para facilitar el pegado cuando se muestra el mensaje de acceso denegado
  document.getElementById('current-url').addEventListener('click', function () {
    const currentText = this.textContent || '';
    if (currentText.includes('[Haga clic aquí') || currentText.includes('[Acceso al portapapeles')) {
      // Mostrar notificación
      const notification = document.getElementById('copy-notification');
      //notification.textContent = 'Pulse Ctrl+V para pegar desde el portapapeles';
      //notification.classList.remove('hidden');

      // Poner foco en el input oculto
      //hiddenInput.focus();

      // Ocultar notificación después de 3 segundos
      //setTimeout(() => {
      //  notification.classList.add('hidden');
      //}, 3000);
    }
  });

  // Manejar evento de pegado en el input oculto
  hiddenInput.addEventListener('paste', function (e) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (pasteData) {
      config.setClipboardText(pasteData);
      console.log('Contenido pegado manualmente:', pasteData);

      // Agregar un prefijo según el contexto
      switch (config.getCurrentContext()) {
        case 'book':
          config.setClipboardText(`Libro: ${pasteData}`);
          break;
        case 'pdf':
          if (!pasteData.startsWith('PDF:')) {
            config.setClipboardText(`PDF: ${pasteData}`);
          } else {
            config.setClipboardText(pasteData);
          }
          break;
        case 'twitter':
          config.setClipboardText(`X: ${pasteData}`);
          break;
        case 'gmail':
          config.setClipboardText(`Gmail: ${pasteData}`);
          break;
        default:
          config.setClipboardText(pasteData);
          break;
      }
      updateContextDisplay();

      /* Mostrar notificación de éxito
      const notification = document.getElementById('copy-notification');
      notification.textContent = 'Contenido pegado correctamente';
      notification.classList.remove('hidden');
      
      // Ocultar notificación después de 2 segundos
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 2000);
      */
    }
  });

  // Iniciar monitoreo del portapapeles
  function startClipboardMonitoring() {
    if (clipboardPollingInterval) {
      clearInterval(clipboardPollingInterval);
    }

    // Determinar el intervalo basado en si el contexto es clipboard o no
    const pollingInterval = isClipboardBehaviorContext(config.getCurrentContext()) ? 1000 : 2000;

    // Verificar el portapapeles cada 1-2 segundos cuando está activo
    clipboardPollingInterval = setInterval(async () => {
      if (isClipboardBehaviorContext(config.getCurrentContext())) {
        const oldText = config.getClipboardText();
        await tryReadClipboard();
        const newText = config.getClipboardText();

        // Solo actualizar la visualización si el contenido cambió y el contexto es clipboard
        if (oldText !== newText) {
          // Si estamos específicamente en el contexto clipboard, actualizar más agresivamente
          if (isClipboardBehaviorContext(config.getCurrentContext())) {
            // Intentar leer directamente del portapapeles del sistema
            try {
              const directClipboardText = await navigator.clipboard.readText();
              if (directClipboardText && directClipboardText !== oldText) {
                config.setClipboardText(directClipboardText);
                console.log('Contenido de portapapeles de Windows actualizado:', directClipboardText);

                // Ejecutar la funcionalidad de clipboardButton cuando el contenido cambia
                console.log('Ejecutando funcionalidad de clipboardButton por cambio en el portapapeles');
                const newMenuData = await loadMenuData(config.getCurrentLanguage());
                config.setMenuData(newMenuData);
                renderSections();
              }
            } catch (e) {
              // Silenciar error, usar el valor de tryReadClipboard
            }
          }

          // Agregar un prefijo según el contexto
          switch (config.getCurrentContext()) {
            case 'book':
              config.setClipboardText(`Libro: ${newText}`);
              break;
            case 'pdf':
              if (!newText.startsWith('PDF:')) {
                config.setClipboardText(`PDF: ${newText}`);
              } else {
                config.setClipboardText(newText);
              }
              break;
            case 'twitter':
              config.setClipboardText(`X: ${newText}`);
              break;
            case 'gmail':
              config.setClipboardText(`Gmail: ${newText}`);
              break;
            default:
              // Para clipboard, no añadir prefijo
              break;
          }
          updateContextDisplay();
        }
      }
    }, pollingInterval);
  }

  // Detener monitoreo al cerrar o cambiar de contexto
  function stopClipboardMonitoring() {
    if (clipboardPollingInterval) {
      clearInterval(clipboardPollingInterval);
      clipboardPollingInterval = null;
    }
  }

  // Iniciar monitoreo
  startClipboardMonitoring();

  // Eventos para manejo del monitoreo
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (isClipboardBehaviorContext(config.getCurrentContext())) {
        startClipboardMonitoring();
        // Leer el portapapeles inmediatamente al volver a la ventana
        tryReadClipboard().then(() => {
          updateContextDisplay();
        });
      }
    } else {
      stopClipboardMonitoring();
    }
  });

  // Limpiar cuando se cierra la ventana
  window.addEventListener('beforeunload', () => {
    stopClipboardMonitoring();
    if (hiddenInput && hiddenInput.parentNode) {
      hiddenInput.parentNode.removeChild(hiddenInput);
    }
  });

  return {
    start: startClipboardMonitoring,
    stop: stopClipboardMonitoring
  };
}

// Función general para mostrar alerta "UNDER CONSTRUCTION"
function underConstruction() {
  // Crear elemento de alerta
  const alertDiv = document.createElement('div');
  alertDiv.textContent = 'UNDER CONSTRUCTION';

  // Aplicar estilos para centrar en pantalla
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '50%';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translate(-50%, -50%)';
  alertDiv.style.backgroundColor = '#ff6b6b';
  alertDiv.style.color = 'white';
  alertDiv.style.padding = '20px 40px';
  alertDiv.style.borderRadius = '10px';
  alertDiv.style.fontSize = '18px';
  alertDiv.style.fontWeight = 'bold';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  alertDiv.style.border = '2px solid #ff5252';

  // Agregar al DOM
  document.body.appendChild(alertDiv);

  // Remover después de 3 segundos
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 3000);
}

// Listener para mensajes del background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clickContextButton') {
    console.log('Mensaje recibido del background script:', request);

    // Simular clic en el botón correspondiente
    const button = document.getElementById(request.buttonId);
    if (button) {
      console.log('Simulando clic en:', request.buttonId);
      button.click();
      sendResponse({ success: true });
    } else {
      console.warn('Botón no encontrado:', request.buttonId);
      sendResponse({ success: false, error: 'Botón no encontrado' });
    }
  }

  // NUEVO: Escuchar la orden de recarga desde el fileWatcher
  if (request.action === 'reloadSidebar') {
    console.log('Recibida orden de recarga desde el background script. Recargando...');
    window.location.reload();
  }

  return true; // Mantener el canal abierto para respuesta asíncrona
});

// Función para enviar email a través de Gmail
function sendGmail() {
  const subject = "AI Prompt Assistant";
  const body = `AI Prompt Assistant

¡Hola! 👋 
Encontré una extensión de Chrome que creo que te va a ser útil.

Se llama AI Prompt Assistant y tiene estas características increíbles:
• 🤖 Modelos AI de ChatGPT, Claude, Gemini, DeepSeek, etc...
• 🌐 Soporte multiidioma 
• 📝 Editor de prompts moderno
• 📧 Extracción de Gmail y Twitter/X
• 📚 Soporte para libros y PDFs
• 🎯 Interfaz intuitiva y elegante

🔗 La puedes instalar gratis aquí desde la Chrome Store de Google:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share

---

Hi! 👋
I found a Chrome extension that I think you'll find useful.

It's called AI Prompt Assistant and has these amazing features:
• 🤖 AI models from ChatGPT, Claude, Gemini, DeepSeek, etc...
• 🌐 Multi-language support
• 📝 Modern prompt editor  
• 📧 Gmail and Twitter/X extraction
• 📚 Support for books and PDFs
• 🎯 Intuitive and elegant interface

🔗 You can install it for free here from the Google Chrome Store:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share`;

  // Codificar el asunto y el cuerpo para URL
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  // Crear la URL de Gmail con los parámetros
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;

  // Abrir Gmail en una nueva pestaña
  window.open(gmailUrl, '_blank');
}