// Script de fondo para la extensión
import { getTranslation } from '/src/content-script/translations.js';

let availableLanguages = []; // Lista de idiomas disponibles

// Ruta donde se almacenan los archivos JSON de la extensión
const jsonPath = "C:\\Users\\Propietario\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\1.2_0\\idioma\\";

// Cargar idiomas disponibles
async function loadAvailableLanguages() {
  try {
    const response = await fetch('/src/common/languages/idiomaAI.json');
    if (!response.ok) {
      throw new Error(`Error al cargar idioma idiomaAI.json: ${response.status}`);
    }
    const data = await response.json();
    availableLanguages = data.idiomas || [];
    return availableLanguages;
  } catch (error) {
    console.error('Error al cargar los idiomas:', error);
    // Establecer una lista básica predeterminada en caso de error
    availableLanguages = [
      { nombreNativo: "Español", codigoISO: "es", nombreEspanol: "Español" },
      { nombreNativo: "English", codigoISO: "gb", nombreEspanol: "Inglés" }
    ];
    return availableLanguages;
  }
}

chrome.runtime.onInstalled.addListener(async function () {
  // Cargar idiomas disponibles
  await loadAvailableLanguages();
  
  // Abrir / Cerrar panel al click en Extensión
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Establecer configuración por defecto
  chrome.storage.local.get(['language', 'aiModel'], async function (result) {
    if (!result.language) {
      chrome.storage.local.set({ language: 'es' });
    }

    const defaultModel = result.aiModel || 'chatgpt';
    if (!result.aiModel) {
      chrome.storage.local.set({ aiModel: defaultModel });
    }

    // Crear menú contextual principal con nombre dinámico
    const urlText = await getContextMenuText(false);
    chrome.contextMenus.create({
      id: 'open-chatgpt-prompt-helper',
      title: `🧠 ${getAIModelName(defaultModel)} ${urlText}`,
      contexts: ['page']
    });

    // Crear menú contextual para texto seleccionado
    const clipboardText = await getContextMenuText(true);
    chrome.contextMenus.create({
      id: 'open-chatgpt-prompt-helper-selection',
      title: `🧠 ${getAIModelName(defaultModel)} ${clipboardText}`,
      contexts: ['selection']
    });

    // Crear menú de configuración
    chrome.contextMenus.create({
      id: 'extension-config',
      title: '⚙️ Configuración',
      contexts: ['action']  // Esto hace que aparezca en el menú contextual del icono de la extensión
    });

    // Añadir opción para abrir archivos JSON
    chrome.contextMenus.create({
      id: 'open-json-files',
      title: '📁 Open / Abrir .json files',
      contexts: ['action']
    });

    // Añadir opción para enviar feedback
    chrome.contextMenus.create({
      id: 'send-feedback',
      title: '📝 Send / Enviar feedback',
      contexts: ['action']
    });

    // Añadir opción para calificar la extensión
    chrome.contextMenus.create({
      id: 'rate-extension',
      title: '⭐ Rate / Calificar extensión',
      contexts: ['action']
    });

    // Añadir menú de compartir
    chrome.contextMenus.create({
      id: 'share-extension',
      title: '🚀 Share / Compartir extensión',
      contexts: ['action']
    });

    // Submenú de opciones para compartir
    chrome.contextMenus.create({
      id: 'share-email',
      parentId: 'share-extension',
      title: '📧 Email',
      contexts: ['action']
    });

    chrome.contextMenus.create({
      id: 'share-whatsapp',
      parentId: 'share-extension',
      title: '📱 WhatsApp',
      contexts: ['action']
    });

    chrome.contextMenus.create({
      id: 'share-gmail',
      parentId: 'share-extension',
      title: '📬 gMail',
      contexts: ['action']
    });

    // Submenú de idiomas
    chrome.contextMenus.create({
      id: 'language-config',
      parentId: 'extension-config',
      title: '🌐 Idioma',
      contexts: ['action']
    });

    // Crear opciones de idioma dinámicamente desde los idiomas disponibles
    availableLanguages.forEach(lang => {
      // Determinar la bandera para cada idioma
      let flag = '';
      switch(lang.codigoISO) {
        case 'es': flag = '🇪🇸'; break;
        case 'gb': flag = '🇬🇧'; break;
        case 'ca': flag = 'ca'; break;
        case 'fr': flag = '🇫🇷'; break;
        case 'de': flag = '🇩🇪'; break;
        case 'it': flag = '🇮🇹'; break;
        case 'pt': flag = '🇵🇹'; break;
        case 'ja': flag = '🇯🇵'; break;
        case 'zh': flag = '🇨🇳'; break;
        case 'ru': flag = '🇷🇺'; break;
        case 'ar': flag = '🇸🇦'; break;
        case 'hi': flag = '🇮🇳'; break;
        case 'kr': flag = '🇰🇷'; break;
        default: flag = '🌐'; break;
      }
      
      chrome.contextMenus.create({
        id: `lang-${lang.codigoISO}`,
        parentId: 'language-config',
        title: `${flag} ${lang.nombreNativo}`,
        type: 'radio',
        contexts: ['action'],
        checked: lang.codigoISO === 'es'  // Por defecto, español
      });
    });

    // Submenú de modelos de IA
    chrome.contextMenus.create({
      id: 'ai-model-config',
      parentId: 'extension-config',
      title: '🤖 Modelo de IA',
      contexts: ['action']
    });

    // Opciones de modelos de IA
    const aiModels = [
      { id: 'chatgpt', title: 'ChatGPT' },
      { id: 'claude', title: 'Claude' },
      { id: 'deepseek', title: 'DeepSeek' },
      { id: 'mistral', title: 'Mistral' },
      { id: 'copilot', title: 'Copilot' },
      { id: 'gemini', title: 'Gemini' },
      { id: 'meta', title: 'Meta' },
      { id: 'grok', title: 'Grok' }
    ];

    aiModels.forEach(model => {
      chrome.contextMenus.create({
        id: `model-${model.id}`,
        parentId: 'ai-model-config',
        title: model.title,
        type: 'radio',
        contexts: ['action'],
        checked: model.id === 'chatgpt'  // Por defecto, ChatGPT
      });
    });

    // Actualizar los estados de las casillas según la configuración
    chrome.storage.local.get(['language', 'aiModel'], function (result) {
      if (result.language) {
        chrome.contextMenus.update(`lang-${result.language}`, {
          checked: true
        });
      }
      if (result.aiModel) {
        chrome.contextMenus.update(`model-${result.aiModel}`, {
          checked: true
        });
      }
    });
  });
});

// Función para obtener el nombre del modelo de IA
function getAIModelName(modelId) {
  switch (modelId) {
    case 'chatgpt': return 'ChatGPT';
    case 'claude': return 'Claude';
    case 'deepseek': return 'DeepSeek';
    case 'mistral': return 'Mistral';
    case 'copilot': return 'Copilot';
    case 'gemini': return 'Gemini';
    case 'meta': return 'Meta';
    case 'grok': return 'Grok';
    default: return 'ChatGPT';
  }
}

// Función para actualizar el texto del menú contextual
async function updateContextMenuTitle(modelId) {
  const modelName = getAIModelName(modelId);
  const urlText = await getContextMenuText(false);
  const clipboardText = await getContextMenuText(true);
  
  chrome.contextMenus.update('open-chatgpt-prompt-helper', {
    title: `🧠 ${modelName} ${urlText}`
  });
  chrome.contextMenus.update('open-chatgpt-prompt-helper-selection', {
    title: `🧠 ${modelName} ${clipboardText}`
  });
}

// Listener para cambios en el almacenamiento local
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.aiModel) {
      // Si cambió el modelo de IA, actualizar el menú contextual
      updateContextMenuTitle(changes.aiModel.newValue);
    }
    if (changes.language) {
      // Si cambió el idioma, actualizar el menú contextual
      chrome.storage.local.get(['aiModel'], function(result) {
        const currentModel = result.aiModel || 'chatgpt';
        updateContextMenuTitle(currentModel);
      });
    }
  }
});

// Manejar clics en el icono de la extensión
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Abre la sidebar para la pestaña actual
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log('Sidebar abierta para la pestaña:', tab.id);
  } catch (error) {
    console.error('Error al abrir la sidebar:', error);
  }
});

// Manejar clics en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-chatgpt-prompt-helper') {
    // Abrir el panel lateral
    chrome.sidePanel.open({ tabId: tab.id });
    
    // Enviar mensaje al sidebar para hacer clic en el botón URL
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'clickContextButton',
        buttonId: 'use-url'   //REPASAR
      });
    }, 500); // Pequeño delay para asegurar que el sidebar se haya cargado
  }
  
  // Manejar clic en menú contextual para texto seleccionado
  else if (info.menuItemId === 'open-chatgpt-prompt-helper-selection') {
    // Abrir el panel lateral
    chrome.sidePanel.open({ tabId: tab.id });
    
    // Copiar el texto seleccionado al portapapeles automáticamente
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copySelectedTextToClipboard
    }, (results) => {
      // Después de copiar, enviar mensaje al sidebar para hacer clic en el botón Clipboard
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'clickContextButton',
          buttonId: 'use-clipb'   //REPASAR
        });
      }, 500); // Pequeño delay para asegurar que el sidebar se haya cargado
    });
  }
  
  // Manejar clic en abrir archivos JSON
  else if (info.menuItemId === 'open-json-files') {
    // Abrir la página del visor de archivos JSON
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/components/json-viewer/json-viewer.html') });
  }
  
  // Manejar clic en enviar feedback
  else if (info.menuItemId === 'send-feedback') {
    // Abrir la página de feedback
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/components/feedback/feedback.html') });
  }

  // Manejar clic en calificar extensión
  else if (info.menuItemId === 'rate-extension') {
    // Abrir la página de la extensión en Chrome Web Store para calificar
    chrome.tabs.create({ 
      url: 'https://chrome.google.com/webstore/detail/ai-prompt-assistant/jimdgbjdhdoiejncgdfcjpakokcpnalg/reviews' 
    });
  }

  // Manejar clic en compartir por email
  else if (info.menuItemId === 'share-email') {
    // Definir subject y texto del email
    const emailSubject = "🧠 AI Prompt Assistant";
    const emailBody = `🧠 AI Prompt Assistant

¡Hola! 👋 
Encontré una extensión de Chrome que creo que te va a ser útil.

Se llama *AI Prompt Assistant* y tiene estas características increíbles:
• 🌐 Soporte multiidioma 
• 📝 Editor de prompts moderno
• 📧 Extracción de Gmail y Twitter/X
• 📚 Soporte para libros y PDFs
• 🎯 Interfaz intuitiva y elegante

🔗 La puedes instalar gratis aquí:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share

---

Hi! 👋
I found a Chrome extension that I think you'll find useful.

It's called *AI Prompt Assistant* and has these amazing features:
• 🌐 Multi-language support
• 📝 Modern prompt editor  
• 📧 Gmail and Twitter/X extraction
• 📚 Support for books and PDFs
• 🎯 Intuitive and elegant interface

🔗 You can install it for free here:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share`;

    // Codificar el subject y body para URL
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    
    // Crear el enlace mailto
    const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Abrir cliente de email
    chrome.tabs.create({ url: mailtoUrl });
  }

  // Manejar clic en compartir por WhatsApp
  else if (info.menuItemId === 'share-whatsapp') {
    // Crear mensaje para WhatsApp (formato más amigable)
    const whatsappMessage = `🧠 *AI Prompt Assistant*

¡Hola! 👋 
Encontré una extensión de Chrome que creo que te va a ser útil.

Se llama *AI Prompt Assistant* y tiene estas características increíbles:
• 🌐 Soporte multiidioma 
• 📝 Editor de prompts moderno
• 📧 Extracción de Gmail y Twitter/X
• 📚 Soporte para libros y PDFs
• 🎯 Interfaz intuitiva y elegante

🔗 La puedes instalar gratis aquí:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share

---

Hi! 👋
I found a Chrome extension that I think you'll find useful.

It's called *AI Prompt Assistant* and has these amazing features:
• 🌐 Multi-language support
• 📝 Modern prompt editor  
• 📧 Gmail and Twitter/X extraction
• 📚 Support for books and PDFs
• 🎯 Intuitive and elegant interface

🔗 You can install it for free here:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share`;

    // Codificar el mensaje para WhatsApp
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    chrome.tabs.create({ url: whatsappUrl });
  }

  // Manejar clic en compartir por Gmail
  else if (info.menuItemId === 'share-gmail') {
    // Definir subject y texto del email
    const gmailSubject = "🧠 AI Prompt Assistant";
    const gmailBody = `🧠 AI Prompt Assistant

¡Hola! 👋 
Encontré una extensión de Chrome que creo que te va a ser útil.

Se llama *AI Prompt Assistant* y tiene estas características increíbles:
• 🌐 Soporte multiidioma 
• 📝 Editor de prompts moderno
• 📧 Extracción de Gmail y Twitter/X
• 📚 Soporte para libros y PDFs
• 🎯 Interfaz intuitiva y elegante

🔗 La puedes instalar gratis aquí:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share

---

Hi! 👋
I found a Chrome extension that I think you'll find useful.

It's called *AI Prompt Assistant* and has these amazing features:
• 🌐 Multi-language support
• 📝 Modern prompt editor  
• 📧 Gmail and Twitter/X extraction
• 📚 Support for books and PDFs
• 🎯 Intuitive and elegant interface

🔗 You can install it for free here:
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=whatsapp-share`;
    
    // Codificar el subject y body para URL
    const encodedSubject = encodeURIComponent(gmailSubject);
    const encodedBody = encodeURIComponent(gmailBody);
    
    // Crear la URL de Gmail con los parámetros
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;
    
    // Abrir Gmail en una nueva pestaña
    chrome.tabs.create({ url: gmailUrl });
  }

  // Manejar selección de idioma
  else if (info.menuItemId.startsWith('lang-')) {
    const language = info.menuItemId.replace('lang-', '');
    chrome.storage.local.set({ language: language });
  }

  // Manejar selección de modelo de IA
  else if (info.menuItemId.startsWith('model-')) {
    const aiModel = info.menuItemId.replace('model-', '');
    chrome.storage.local.set({ aiModel: aiModel });
    // Actualizar el título del menú contextual
    updateContextMenuTitle(aiModel);
  }
});

// Manejar mensajes de los scripts de contenido y del popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Manejar distintos tipos de mensajes
  if (request.action === 'openAI') {
    openAIWithPrompt(request.prompt, request.context, request.aiModel, request.isClipboard, request.buttonType);
    sendResponse({ success: true });
    return true;
  } 
  else if (request.action === 'openJsonFolder') {
    // En lugar de abrir la carpeta del sistema, abrir nuestra página de visualización de JSON
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/components/json-viewer/json-viewer.html') });
    
    sendResponse({ success: true });
    return true;
  }
  else if (request.action === 'getJsonFolderPath') {
    // Devolver la ruta donde se almacenan los archivos JSON
    sendResponse({ path: jsonPath });
    return true;
  }
  // Otros manejadores de mensajes pueden ir aquí
});

// Función para abrir el modelo de IA correspondiente con un prompt
function openAIWithPrompt(prompt, context, aiModel, isClipboard, buttonType) {
  // Esta es la ÚNICA función que modifica el prompt para incluir el contexto
  let finalPrompt = prompt;

  // Verificar si estamos en contexto PDF
  if (context && context.startsWith("PDF: ")) {
    // Estamos trabajando con un PDF, extraer información
    const pdfMatch = context.match(/PDF: (.*?) \((.*?)\)/);
    if (pdfMatch) {
      const pdfName = pdfMatch[1];
      const pdfPath = pdfMatch[2];
      
      // Determinar qué tipo de marcador usar
      if (prompt.includes('[PDF]')) {
        // Si el prompt contiene el marcador [PDF], reemplazarlo con el nombre del PDF
        finalPrompt = prompt.replace(/\[PDF\]/g, pdfName);
      } else if (prompt.includes('[PDF_PATH]')) {
        // Si el prompt contiene el marcador [PDF_PATH], reemplazarlo con la ruta del PDF
        finalPrompt = prompt.replace(/\[PDF_PATH\]/g, pdfPath);
      } else {
        // Si no tiene ningún marcador, añadir la información al final
        finalPrompt = `${prompt}\n\nPDF: ${pdfName}\nRuta: ${pdfPath}`;
      }
      
      // En caso de tener [TEMA] en el prompt, pedir al usuario que especifique
      if (finalPrompt.includes('[TEMA]') || finalPrompt.includes('[TOPIC]')) {
        // Pedir al usuario que ingrese el tema
        const themeMatch = finalPrompt.match(/\[TEMA\]|\[TOPIC\]/);
        if (themeMatch) {
          const userTopic = prompt('Especifique el tema a buscar en el PDF:', '');
          if (userTopic) {
            // Reemplazar [TEMA] o [TOPIC] con el tema ingresado por el usuario
            finalPrompt = finalPrompt.replace(/\[TEMA\]|\[TOPIC\]/g, userTopic);
          } else {
            // Si el usuario no ingresa nada, usar un valor genérico
            finalPrompt = finalPrompt.replace(/\[TEMA\]|\[TOPIC\]/g, 'tema principal');
          }
        }
      }
    }
  }
  else {
    // Si el prompt tiene el marcador [URL], lo reemplazamos con el contexto apropiado
    if (prompt.includes('[URL]')) {
      finalPrompt = prompt.replace(/\[URL\]/g, context);
    } else {
      // Manejar diferentes tipos de botones
      switch (buttonType) {
        case 'urlButton':
          // Pasar la URL al final del prompt
          finalPrompt = `${prompt}\n\nURL: ${context}`;
          break;
        case 'clipboardButton':
          // Pasar el texto del portapapeles al final del prompt
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;  
        case 'bookButton':
          // Pasar el texto del libro al final del prompt
          finalPrompt = `${prompt}\n\nTexto del libro:\n${context}`;
          break;
        case 'pdfButton':
          // Pasar el texto del PDF al final del prompt
          finalPrompt = `${prompt}\n\nTexto del PDF:\n${context}`;
          break;
        case 'xButton':
          // Pasar el texto del X al final del prompt
          finalPrompt = `${prompt}\n\nTexto del X:\n${context}`;
          break;
        case 'gmailButton':
          // Para estos botones, añadir el texto del clipboard
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;
        case 'wikiButton':
          // Para este botón, añadir el texto de la URL
          finalPrompt = `${prompt}\n\nContenido de Wikipedia:\n${context}`;
          break;
        default:
          // Comportamiento por defecto (igual que urlButton)
          if (isClipboard) {
            finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          } else {
            finalPrompt = `${prompt}\n\nURL: ${context}`;
          }
          break;
      }
    }
  }

  // Codificar el prompt
  const encodedPrompt = encodeURIComponent(finalPrompt);

  // Determinar la URL base según el modelo seleccionado
  let baseUrl;
  switch (aiModel) {
    case 'claude':
      baseUrl = 'https://claude.ai/';
      break;
    case 'deepseek':
      baseUrl = 'https://chat.deepseek.com/';
      break;
    case 'mistral':
      baseUrl = 'https://chat.mistral.ai/';
      break;
    case 'copilot':
      baseUrl = 'https://copilot.microsoft.com/';
      break;
    case 'gemini':
      baseUrl = 'https://gemini.google.com/app';
      break;
    case 'grok':
      baseUrl = 'https://grok.x.ai/';
      break;
    case 'meta':
      baseUrl = 'https://meta.ai/';
      break;
    case 'chatgpt':
    default:
      baseUrl = 'https://chat.openai.com/';
      break;
  }

  // Abrir nueva pestaña con la URL actual y el prompt
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTabUrl = tabs[0]?.url || "";

    // Crear una URL para el modelo de IA que incluya el prompt y la URL actual
    let aiUrl;

    // Diferentes plataformas pueden requerir diferentes formatos de URL
    switch (aiModel) {
      case 'claude':
        // Claude puede tener un formato específico
        aiUrl = `${baseUrl}?input=${encodedPrompt}&context=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'deepseek':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'mistral':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'copilot':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'gemini':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'grok':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'meta':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      case 'chatgpt':
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
      default:
        // Formato general para la mayoría de plataformas
        aiUrl = `${baseUrl}?q=${encodedPrompt}&url=${encodeURIComponent(currentTabUrl)}`;
        break;
    }

    // Abrir la pestaña con la URL formateada
    chrome.tabs.create({
      url: aiUrl
    });
  });
}

// Función para obtener el texto del menú contextual según el idioma
async function getContextMenuText(isSelection = false) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['language'], function(result) {
      const currentLanguage = result.language || 'es';
      const texts = getTranslation(currentLanguage);
      
      if (isSelection) {
        resolve(texts.contextMenu.summaryClipboard);
      } else {
        resolve(texts.contextMenu.summaryUrl);
      }
    });
  });
}

// Función para copiar el texto seleccionado al portapapeles
function copySelectedTextToClipboard() {
  try {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText) {
        // Usar la API moderna de clipboard si está disponible
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(selectedText).catch(err => {
            console.error('❌ Error al copiar con API moderna:', err);
            // Fallback al método tradicional
            fallbackCopyMethod(selectedText);
          });
        } else {
          // Método de fallback para navegadores que no soportan la API moderna
          fallbackCopyMethod(selectedText);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error al acceder a la selección:', error);
  }

  // Función de fallback para copiar texto
  function fallbackCopyMethod(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        // Removed verbose success log
      } else {
        console.error('❌ Error al copiar con execCommand');
      }
    } catch (fallbackError) {
      console.error('❌ Error en método fallback:', fallbackError);
    }
  }
}