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

// Función para extraer y copiar contenido de Gmail - VERSIÓN MEJORADA 2024
function extractAndCopyGmailContent() {
  // Crear notificación mejorada
  const notification = document.createElement('div');
  notification.textContent = '📧 Iniciando captura de emails...';
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

  // Función mejorada para ir al inicio
  async function scrollToTop() {
    notification.textContent = '⬆️ Navegando al inicio de la conversación...';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async function scrollAndCollectEmails() {
    await scrollToTop();

    const processedEmailIds = new Set();
    let allEmails = [];
    let lastHeight = document.body.scrollHeight;
    let stagnantScrollCount = 0;
    let scrollAttempts = 0;

    // Configuración mejorada para Gmail 2024
    const MAX_SCROLL_ATTEMPTS = 25;
    const MAX_STAGNANT_ATTEMPTS = 3;
    const SCROLL_DISTANCE = 500;
    const SCROLL_DELAY = 1200;
    const MAX_EMAILS = 20;

    // Función principal de scroll y captura
    async function performScrollAndExtract() {
      scrollAttempts++;

      if (scrollAttempts > MAX_SCROLL_ATTEMPTS) {
        return await finalizeEmailCollection();
      }

      // Actualizar notificación con progreso detallado
      notification.textContent = `🔍 Capturando emails... (${allEmails.length} encontrados) - Paso ${scrollAttempts}/${MAX_SCROLL_ATTEMPTS}`;

      // Selectores ESPECÍFICOS para Gmail 2024 - Mensajes de conversación
      const emailSelectors = [
        // Mensajes principales en conversaciones
        'div[data-message-id]:not([data-legacy-thread-id])',
        '.ii.gt[data-message-id]',
        'div[jsname][data-message-id]',
        '.adn.ads .ii.gt',
        '.gs .ii.gt',

        // Contenedores de mensaje expandidos
        'div[role="listitem"][data-message-id]',
        '.nH .if',
        '.h7',

        // Mensajes en hilos
        'tr.zA',
        '.zA',

        // Contenedores de mensaje alternativos
        'div[data-legacy-thread-id]',
        '.thread-item',
        '.message-container'
      ];

      let emailElements = [];

      // Intentar con cada selector hasta encontrar elementos
      for (const selector of emailSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          emailElements = Array.from(elements);
          break;
        }
      }

      // Si no encontramos con selectores específicos, usar approach más general
      if (emailElements.length === 0) {
        emailElements = Array.from(document.querySelectorAll('div[role="listitem"], .ii.gt, .zA, div[data-message-id], div[jsname]'));
      }

      let newEmailsInThisStep = 0;

      for (const element of emailElements) {
        try {
          // Mejorar identificación única del email
          const emailId = element.getAttribute('data-message-id') ||
            element.getAttribute('data-legacy-thread-id') ||
            element.getAttribute('id') ||
            element.querySelector('[data-message-id]')?.getAttribute('data-message-id') ||
            element.getAttribute('jsname') ||
            `gmail-${Math.random().toString(36).substr(2, 9)}`;

          if (!processedEmailIds.has(emailId)) {
            processedEmailIds.add(emailId);

            // Extraer datos mejorados
            const emailData = extractEmailData(element);

            if (emailData.isValid) {
              allEmails.push(emailData);
              newEmailsInThisStep++;

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
      } else {
        stagnantScrollCount++;
      }

      // Realizar scroll más suave y controlado
      window.scrollBy({
        top: SCROLL_DISTANCE,
        behavior: 'smooth'
      });

      // Esperar más tiempo para que cargue el contenido de Gmail
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      const currentHeight = document.body.scrollHeight;
      const hasNewContent = currentHeight > lastHeight;

      // Continuar si hay nuevos emails o contenido
      if ((hasNewContent || stagnantScrollCount < MAX_STAGNANT_ATTEMPTS) && allEmails.length < MAX_EMAILS) {
        lastHeight = currentHeight;
        await performScrollAndExtract();
      } else {
        return await finalizeEmailCollection();
      }
    }

    // Función para extraer datos de un email individual - MEJORADA
    function extractEmailData(element) {
      let sender = '';
      let subject = '';
      let snippet = '';
      let timestamp = '';
      let emailBody = '';

      try {
        // Selectores ESPECÍFICOS para remitente (Gmail 2024)
        const senderSelectors = [
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
          '[title*="@"]'                   // Cualquier elemento con @ en title
        ];

        for (const selector of senderSelectors) {
          const senderElement = element.querySelector(selector);
          if (senderElement) {
            sender = senderElement.textContent?.trim() ||
              senderElement.getAttribute('email') ||
              senderElement.getAttribute('name') ||
              senderElement.getAttribute('title') || '';
            if (sender && sender.length > 2) {
              break;
            }
          }
        }

        // Selectores ESPECÍFICOS para asunto
        const subjectSelectors = [
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
          '.bzf'                           // Clase bzf
        ];

        for (const selector of subjectSelectors) {
          const subjectElement = element.querySelector(selector);
          if (subjectElement) {
            subject = subjectElement.textContent?.trim() || '';
            if (subject && subject.length > 3) {
              break;
            }
          }
        }

        // Selectores ESPECÍFICOS para snippet/preview
        const snippetSelectors = [
          '.y2',                           // Preview text
          '.y3',                           // Alternativo preview
          '.bog + span',                   // Siguiente a bog
          '.snippet',                      // Clase snippet directa
          '.bqe span',                     // Span en bqe
          '.qu .y2',                       // y2 en qu
          '.gs .y2',                       // y2 en gs
          '.aLF .snippet',                 // Snippet en aLF
          'div[dir="ltr"]',                // Contenido LTR
          '.ii.gt > div',                  // Div dentro de ii gt
          '.message-content'               // Content genérico
        ];

        for (const selector of snippetSelectors) {
          const snippetElement = element.querySelector(selector);
          if (snippetElement) {
            snippet = snippetElement.textContent?.trim() || '';
            if (snippet && snippet.length > 15) {
              break;
            }
          }
        }

        // Selectores ESPECÍFICOS para timestamp
        const timeSelectors = [
          '.xW span',                      // Tiempo en xW
          '.xY span',                      // Tiempo en xY
          '[title*=":"]',                  // Cualquier con : en title
          '.g3',                           // Clase g3
          'span[title*="20"]',             // Con año 20xx
          'span[data-tooltip*=":"]',       // Tooltip con :
          '.qu span[title]',               // Title en qu
          'time',                          // Elemento time HTML5
          '.date',                         // Clase date
          '.timestamp',                    // Clase timestamp
          '[aria-label*="20"]'             // Aria label con año
        ];

        for (const selector of timeSelectors) {
          const timeElement = element.querySelector(selector);
          if (timeElement) {
            timestamp = timeElement.getAttribute('title') ||
              timeElement.getAttribute('data-tooltip') ||
              timeElement.getAttribute('aria-label') ||
              timeElement.textContent?.trim() || '';
            if (timestamp && timestamp.length > 3) {
              break;
            }
          }
        }

        // Selectores ESPECÍFICOS para cuerpo del email - ACTUALIZADOS 2024
        const bodySelectors = [
          // Selectores principales del cuerpo del mensaje
          '.ii.gt',                        // Contenedor principal del mensaje
          '.ii.gt > div',                  // Div directo dentro de ii gt
          '.ii.gt div[dir]',               // Div con dirección dentro de ii gt
          '.adn.ads .ii.gt',               // Ads content
          'div[data-message-id] .ii.gt',   // Mensaje específico

          // Selectores de contenido de texto
          '.gmail_quote',                  // Quote Gmail
          '.gmail_default',                // Default Gmail
          'div[dir="ltr"]',                // LTR content
          'div[dir="rtl"]',                // RTL content
          '.editable',                     // Editable content
          '.Am.Al.editable',               // Contenido editable específico

          // Selectores generales
          '.message-body',                 // Message body
          '.email-content',                // Email content
          'div[role="gridcell"] div',      // Grid cell content
          '.qu div',                       // Content en qu
          '.h7 div',                       // Div en h7

          // Selectores de párrafos y texto
          'p',                             // Párrafos
          'div p',                         // Párrafos en divs
          'span[dir]',                     // Spans con dirección
          '.text-content',                 // Text content

          // Selectores de fallback más específicos
          '[jsname] div',                  // Divs con jsname
          'td[colspan] div',               // Divs en celdas
          '.nH .if div',                   // Divs en contenedores específicos
          'tr[id] div'                     // Divs en filas con ID
        ];

        for (const selector of bodySelectors) {
          const bodyElements = element.querySelectorAll(selector);
          for (const bodyElement of bodyElements) {
            if (bodyElement) {
              let potentialBody = bodyElement.textContent?.trim() || '';

              // Filtrar contenido no deseado
              if (potentialBody &&
                potentialBody.length > 25 &&
                !potentialBody.includes('Escribir') &&
                !potentialBody.includes('Enviar') &&
                !potentialBody.includes('Responder') &&
                !potentialBody.includes('Reenviar') &&
                !potentialBody.includes('Write') &&
                !potentialBody.includes('Send') &&
                !potentialBody.includes('Reply') &&
                !potentialBody.includes('Forward')) {

                emailBody = potentialBody;

                // Limitar el cuerpo a primeras 500 caracteres
                if (emailBody.length > 500) {
                  emailBody = emailBody.substring(0, 500) + '...';
                }
                break;
              }
            }
          }
          if (emailBody) break; // Salir del bucle exterior si encontramos contenido
        }

        // Fallback agresivo si no encontramos cuerpo del email
        if (!emailBody && (sender || subject)) {

          // Buscar todos los divs que contengan texto significativo
          const allDivs = element.querySelectorAll('div');
          let longestText = '';

          for (const div of allDivs) {
            const divText = div.textContent?.trim() || '';
            // Buscar el div con más contenido de texto (excluyendo botones y elementos de UI)
            if (divText.length > longestText.length &&
              divText.length > 50 &&
              !divText.includes('Escribir') &&
              !divText.includes('Enviar') &&
              !divText.includes('Responder') &&
              !divText.includes('Write') &&
              !divText.includes('Send') &&
              !divText.includes('Reply') &&
              !divText.includes('Gmail') &&
              !divText.includes('Inbox')) {
              longestText = divText;
            }
          }

          if (longestText) {
            emailBody = longestText.length > 500 ? longestText.substring(0, 500) + '...' : longestText;
          }
        }

        // Si no encontramos contenido específico, extraer cualquier texto visible significativo
        if (!sender && !subject && !snippet && !emailBody) {
          const allText = element.textContent?.trim() || '';
          if (allText && allText.length > 30) {
            // Dividir el texto en partes para intentar identificar componentes
            const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            if (lines.length > 0) {
              // Primera línea podría ser el remitente o asunto
              sender = lines[0].length < 100 ? lines[0] : 'Usuario Gmail';

              // Si hay más líneas, la segunda podría ser el asunto
              if (lines.length > 1) {
                subject = lines[1].length < 150 ? lines[1] : 'Contenido extraído';
              }

              // El resto podría ser el cuerpo
              if (lines.length > 2) {
                emailBody = lines.slice(2).join(' ').substring(0, 400) + '...';
              } else {
                snippet = allText.substring(0, 300) + '...';
              }
            } else {
              snippet = allText.substring(0, 300) + '...';
              sender = 'Usuario Gmail';
              subject = 'Contenido extraído';
            }

            console.log(`⚠️ Usando extracción de fallback completo para elemento con ${allText.length} caracteres`);
          }
        }

      } catch (error) {
        console.error('❌ Error extrayendo datos del email:', error);
      }

      const isValid = !!(sender || subject || snippet || emailBody);

      const result = {
        sender: sender || 'Usuario desconocido',
        subject: subject || 'Sin asunto',
        snippet,
        timestamp: timestamp || 'Sin fecha',
        emailBody,
        isValid
      };

      return result;
    }

    // Función para finalizar y copiar emails
    async function finalizeEmailCollection() {
      notification.textContent = `📝 Procesando ${allEmails.length} emails...`;

      if (allEmails.length === 0) {
        notification.textContent = '❌ No se encontraron emails. Verifica que estés en una conversación de Gmail.';
        notification.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)';
        setTimeout(() => {
          if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 5000);
        return;
      }

      // Formatear texto sin iconos
      let emailText = `CONVERSACION DE GMAIL - ${allEmails.length} emails extraidos\n`;
      emailText += `Capturado el ${new Date().toLocaleString('es-ES')}\n`;
      emailText += `URL: ${window.location.href}\n`;
      emailText += `${'='.repeat(60)}\n\n`;

      allEmails.forEach((email, index) => {
        emailText += `EMAIL #${index + 1}\n`;
        emailText += `De: ${email.sender}\n`;
        emailText += `Asunto: ${email.subject}\n`;
        emailText += `Fecha: ${email.timestamp}\n`;

        // Mostrar el cuerpo completo del email si está disponible
        if (email.emailBody && email.emailBody.length > 10) {
          emailText += `Contenido completo: ${email.emailBody}\n`;
        } else if (email.snippet && email.snippet.length > 10) {
          emailText += `Vista previa: ${email.snippet}\n`;
        } else {
          emailText += `Contenido: [No se pudo extraer el contenido del mensaje]\n`;
        }

        emailText += `${'-'.repeat(40)}\n\n`;
      });

      emailText += `Total: ${allEmails.length} emails capturados exitosamente`;

      // Copia mejorada al portapapeles
      await copyToClipboard(emailText, allEmails.length);

      // Comunicar resultado a la extensión
      window.postMessage({
        type: 'GMAIL_EXTRACT_COMPLETE',
        emailText: emailText,
        emailCount: allEmails.length
      }, '*');
    }

    // Función mejorada para copiar al portapapeles
    async function copyToClipboard(text, emailCount) {
      try {
        notification.textContent = '📋 Copiando al portapapeles...';

        // Método principal: Chrome Extension Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          notification.textContent = `✅ ¡${emailCount} emails copiados al portapapeles!`;
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
            notification.textContent = `✅ ¡${emailCount} emails copiados! (método alternativo)`;
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

      // Remover notificación después de mostrar resultado
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 4000);
    }

    // Iniciar el proceso de captura
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

// Función para extraer y copiar tweets de Twitter/X - VERSIÓN MEJORADA
function extractAndCopyTweets() {
  // Crear notificación mejorada
  const notification = document.createElement('div');
  notification.textContent = '🐦 Iniciando captura de tweets...';
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
    await new Promise(resolve => setTimeout(resolve, 400)); // Optimizado para velocidad máxima
  }

  async function scrollAndCollectTweets() {
    await scrollToTop();

    const processedTweetIds = new Set();
    let allTweets = [];
    let lastHeight = document.body.scrollHeight;
    let stagnantScrollCount = 0;
    let scrollAttempts = 0;

    // Configuración optimizada - scroll ultra rápido
    const MAX_SCROLL_ATTEMPTS = 50;
    const MAX_STAGNANT_ATTEMPTS = 5; // Reducido para terminar más rápido
    const SCROLL_DISTANCE = 900; // Aumentado para hacer menos scrolls
    const SCROLL_DELAY = 250; // Reducido significativamente para mayor velocidad
    const MAX_TWEETS = 30;

    // Función principal de scroll y captura
    async function performScrollAndExtract() {
      scrollAttempts++;

      if (scrollAttempts > MAX_SCROLL_ATTEMPTS) {
        return await finalizeTweetCollection();
      }

      // Actualizar notificación con progreso detallado
      notification.textContent = `🔍 Capturando tweets... (${allTweets.length} encontrados) - Paso ${scrollAttempts}/${MAX_SCROLL_ATTEMPTS}`;

      // Extraer tweets visibles actualmente
      const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
      let newTweetsInThisStep = 0;

      for (const article of tweetArticles) {
        try {
          // Mejorar identificación única del tweet
          const tweetLink = article.querySelector('time')?.parentElement?.getAttribute('href');
          const ariaLabel = article.getAttribute('aria-labelledby');
          const tweetId = tweetLink || ariaLabel || `random-${Math.random().toString(36).substr(2, 9)}`;

          if (!processedTweetIds.has(tweetId)) {
            processedTweetIds.add(tweetId);

            // Extraer datos mejorados
            const tweetData = extractTweetData(article);

            if (tweetData.isValid) {
              allTweets.push(tweetData);
              newTweetsInThisStep++;

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
      } else {
        stagnantScrollCount++;
      }

      // Realizar scroll más suave y controlado
      window.scrollBy({
        top: SCROLL_DISTANCE,
        behavior: 'smooth'
      });

      // Esperar más tiempo para que cargue el contenido
      await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

      const currentHeight = document.body.scrollHeight;
      const hasNewContent = currentHeight > lastHeight;

      // Continuar si hay nuevos tweets o contenido, y no hemos estado demasiado tiempo sin progreso
      if ((hasNewContent || stagnantScrollCount < MAX_STAGNANT_ATTEMPTS) && allTweets.length < MAX_TWEETS) {
        lastHeight = currentHeight;
        await performScrollAndExtract(); // Recursión con await para mejor control
      } else {
        return await finalizeTweetCollection();
      }
    }

    // Función para extraer datos de un tweet individual
    function extractTweetData(article) {
      let username = '';
      let handle = '';
      let tweetText = '';
      let timestamp = '';
      let engagement = '';

      try {
        // Extraer usuario y handle
        const userElement = article.querySelector('div[data-testid="User-Name"]');
        if (userElement) {
          const spans = userElement.querySelectorAll('span');
          if (spans.length >= 1) username = spans[0].textContent.trim();
          if (spans.length >= 2) handle = spans[spans.length - 1].textContent.trim();
        }

        // Extraer texto del tweet con mejor selector
        const tweetTextElement = article.querySelector('div[data-testid="tweetText"]') ||
          article.querySelector('[lang]') ||
          article.querySelector('div[dir]');
        if (tweetTextElement) {
          tweetText = tweetTextElement.textContent.trim();
        }

        // Extraer timestamp mejorado
        const timeElement = article.querySelector('time');
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
              timestamp = timeElement.textContent.trim();
            }
          } else {
            timestamp = timeElement.textContent.trim();
          }
        }

        // Extraer métricas de engagement (opcional)
        const metrics = article.querySelectorAll('[data-testid*="like"], [data-testid*="retweet"], [data-testid*="reply"]');
        if (metrics.length > 0) {
          const engagementData = Array.from(metrics).map(m => m.textContent.trim()).filter(t => t);
          engagement = engagementData.join(' | ');
        }

      } catch (error) {
        console.error('Error extrayendo datos del tweet:', error);
      }

      return {
        username,
        handle,
        tweetText,
        timestamp,
        engagement,
        isValid: !!(username || handle || tweetText)
      };
    }

    // Función para finalizar y copiar tweets
    async function finalizeTweetCollection() {
      notification.textContent = `📝 Procesando ${allTweets.length} tweets...`;

      if (allTweets.length === 0) {
        notification.textContent = '❌ No se encontraron tweets';
        setTimeout(() => {
          if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 3000);
        return;
      }

      // Formatear texto sin iconos
      let threadText = `HILO DE X/TWITTER - ${allTweets.length} posts extraidos\n`;
      threadText += `Capturado el ${new Date().toLocaleString('es-ES')}\n`;
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

      threadText += `Total: ${allTweets.length} posts capturados exitosamente`;

      // Copia mejorada al portapapeles
      await copyToClipboard(threadText, allTweets.length);

      // Comunicar resultado a la extensión
      window.postMessage({
        type: 'TWITTER_EXTRACT_COMPLETE',
        threadText: threadText,
        tweetCount: allTweets.length
      }, '*');
    }

    // Función mejorada para copiar al portapapeles
    async function copyToClipboard(text, tweetCount) {
      try {
        notification.textContent = '📋 Copiando al portapapeles...';

        // Método principal: Chrome Extension Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          notification.textContent = `✅ ¡${tweetCount} tweets copiados al portapapeles!`;
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
            notification.textContent = `✅ ¡${tweetCount} tweets copiados! (método alternativo)`;
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

// Función para buscar archivos JSON custom y crear los botones
async function initializeCustomButtons() {
  const customToggle = document.getElementById('custom-toggle');
  const customContainer = document.getElementById('custom-buttons-container');

  if (!customToggle || !customContainer) {
    console.warn('Elementos para botones custom no encontrados.');
    return;
  }

  const customFileNames = ['custom_1.json', 'custom_2.json', 'custom_3.json', 'custom_4.json'];
  let customButtonsCreated = 0;

  // Usar un bucle for...of para procesar los archivos secuencialmente y mantener el orden
  for (const fileName of customFileNames) {
    try {
      const fileUrl = chrome.runtime.getURL(`src/common/languages/custom/${fileName}`);
      const response = await fetch(fileUrl);

      if (response.ok) {
        const data = await response.json();
        const title = data.header?.title || fileName.replace('.json', '');
        const behaviour = data.header?.behaviour || 'url';
        // FIX: Derivar el contexto directamente del nombre del archivo para evitar race conditions
        const context = fileName.replace('.json', ''); // e.g., "custom_1"

        const button = document.createElement('button');
        button.className = 'option-button custom-menu-button';
        button.textContent = title;
        button.dataset.context = context;
        button.dataset.behaviour = behaviour;

        button.addEventListener('click', () => handleCustomButtonClick(context, button));

        customContainer.appendChild(button);
        customButtonsCreated++;
      }
    } catch (error) {
      // El archivo no existe o es inválido, se ignora silenciosamente.
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
      const emailSubject = "🧠 AI Prompt Assistant ";
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
      const whatsappMessage = `🧠 *AI Prompt Assistant*

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
      // Copiar al portapapeles del sistema
      navigator.clipboard.writeText(nombreLibro).then(() => {
        // Nombre del libro copiado al portapapeles
      }).catch(err => {
        console.error('Error al copiar al portapapeles: ', err);
      });
      // Actualizar la visualización con el nombre del libro
      updateContextDisplay();
    } else {
      nombreLibro = "The Old Man and the Sea";
      config.setClipboardText(nombreLibro);
      // Copiar al portapapeles del sistema
      navigator.clipboard.writeText(nombreLibro).then(() => {
        // Nombre del libro por defecto copiado
      }).catch(err => {
        console.error('Error al copiar al portapapeles: ', err);
      });
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
  
  console.log(`🧠 AI Prompt Assistant: Icono del motor actualizado a ${iconPath} para modelo ${currentModel}`);
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
  const subject = "🧠 AI Prompt Assistant";
  const body = `🧠 AI Prompt Assistant

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