// contextMenuManager.js
import { getAIModelName, loadMotorAI } from '/src/common/common.js';
import { getContextMenuTextForDisplay, copySelectedTextToClipboard } from '/src/background/utils.js';
import { getAvailableLanguages } from '/src/background/languageManager.js';

// Cargar modelos IA
let AI_MODELS = [];

export async function initAIModels() {
  const motorAIJson = await loadMotorAI();
  AI_MODELS = motorAIJson.motoresIA || [];
}

export async function createInitialContextMenus(loadedLangs, defaultModelId, defaultLangIso) {
  await initAIModels();
  
  chrome.contextMenus.removeAll(async () => { // Asegura que no haya menús duplicados en recargas
    const urlText = await getContextMenuTextForDisplay(false, defaultLangIso);
    chrome.contextMenus.create({
      id: 'open-chatgpt-prompt-helper',
      title: `${getAIModelName(defaultModelId)} ${urlText}`,
      contexts: ['page']
    });

    const clipboardText = await getContextMenuTextForDisplay(true, defaultLangIso);
    chrome.contextMenus.create({
      id: 'open-chatgpt-prompt-helper-selection',
      title: `${getAIModelName(defaultModelId)} ${clipboardText}`,
      contexts: ['selection']
    });

    chrome.contextMenus.create({ id: 'extension-config', title: '⚙️ Configuración', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'open-json-files', title: '📁 Open / Abrir .json files', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'send-feedback', title: '📝 Send / Enviar feedback', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'rate-extension', title: '⭐ Rate / Calificar extensión', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'share-extension', title: '🚀 Share / Compartir extensión', contexts: ['action'] });

    chrome.contextMenus.create({ id: 'share-email', parentId: 'share-extension', title: '📧 Email', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'share-whatsapp', parentId: 'share-extension', title: '📱 WhatsApp', contexts: ['action'] });
    chrome.contextMenus.create({ id: 'share-gmail', parentId: 'share-extension', title: '📬 gMail', contexts: ['action'] });

    chrome.contextMenus.create({ id: 'language-config', parentId: 'extension-config', title: '🌐 Idioma', contexts: ['action'] });
    
    const languagesToDisplay = loadedLangs && loadedLangs.length > 0 ? loadedLangs : getAvailableLanguages(); // Fallback si la carga inicial falló

    languagesToDisplay.forEach(lang => {
      let flag = '';
      switch(lang.codigoISO) {
        case 'es': flag = '🇪🇸'; break; case 'gb': flag = '🇬🇧'; break; case 'ca': flag = '🏴󠁧󠁢󠁣󠁡󠁿'; break; // Cataluña
        case 'fr': flag = '🇫🇷'; break; case 'de': flag = '🇩🇪'; break; case 'it': flag = '🇮🇹'; break;
        case 'pt': flag = '🇵🇹'; break; case 'ja': flag = '🇯🇵'; break; case 'zh': flag = '🇨🇳'; break;
        case 'ru': flag = '🇷🇺'; break; case 'ar': flag = '🇸🇦'; break; case 'hi': flag = '🇮🇳'; break;
        case 'kr': flag = '🇰🇷'; break; default: flag = '🌐'; break;
      }
      chrome.contextMenus.create({
        id: `lang-${lang.codigoISO}`,
        parentId: 'language-config',
        title: `${flag} ${lang.nombreNativo}`,
        type: 'radio',
        contexts: ['action'],
        checked: lang.codigoISO === defaultLangIso
      });
    });

    chrome.contextMenus.create({ id: 'ai-model-config', parentId: 'extension-config', title: '🤖 Modelo de IA', contexts: ['action'] });
    AI_MODELS.forEach(model => {
      chrome.contextMenus.create({
        id: `model-${model.id}`,
        parentId: 'ai-model-config',
        title: model.nombre,
        type: 'radio',
        contexts: ['action'],
        checked: model.id === defaultModelId
      });
    });
    console.log("Menús contextuales creados/actualizados.");
  });
}

export async function updateContextMenuTitles(modelId, languageIso) {
  const modelName = getAIModelName(modelId);
  const urlText = await getContextMenuTextForDisplay(false, languageIso);
  const clipboardText = await getContextMenuTextForDisplay(true, languageIso);

  chrome.contextMenus.update('open-chatgpt-prompt-helper', { title: `${modelName} ${urlText}` }, () => {
    if (chrome.runtime.lastError) console.warn("Error actualizando menú 'page':", chrome.runtime.lastError.message);
  });
  chrome.contextMenus.update('open-chatgpt-prompt-helper-selection', { title: `${modelName} ${clipboardText}` }, () => {
     if (chrome.runtime.lastError) console.warn("Error actualizando menú 'selection':", chrome.runtime.lastError.message);
  });
}

export async function updateContextMenuTitlesFromStorage(newModelId, newLanguageIso) {
    chrome.storage.local.get(['aiModel', 'language'], async (result) => {
        const modelToUse = newModelId || result.aiModel || 'chatgpt';
        const langToUse = newLanguageIso || result.language || 'es';
        await updateContextMenuTitles(modelToUse, langToUse);
    });
}


export function handleContextMenuClick(info, tab) {
  const menuItemId = info.menuItemId;

  if (menuItemId === 'open-chatgpt-prompt-helper' || menuItemId === 'open-chatgpt-prompt-helper-selection') {
    chrome.sidePanel.open({ tabId: tab.id });
    const actionType = menuItemId === 'open-chatgpt-prompt-helper' ? 'clickContextButtonUrl' : 'clickContextButtonClipboard';
    const buttonId = menuItemId === 'open-chatgpt-prompt-helper' ? 'use-url' : 'use-clipb';

    if (menuItemId === 'open-chatgpt-prompt-helper-selection') {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: copySelectedTextToClipboard
        }, () => {
            // Después de copiar (o intentar), enviar mensaje al sidebar
            setTimeout(() => { // Delay para asegurar que el panel lateral esté listo
                chrome.runtime.sendMessage({ action: 'clickContextButton', buttonId: buttonId });
            }, 500);
        });
    } else {
        setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'clickContextButton', buttonId: buttonId });
        }, 500);
    }
  }
  else if (menuItemId === 'open-json-files') {
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/pages/jsonEditor/jsonEditor.html') });
    console.log("Abriendo JSON Editor");
   // chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/pages/json-viewer/json-viewer.html') });
  }
  else if (menuItemId === 'send-feedback') {
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/pages/feedback/feedback.html') });
  }
  else if (menuItemId === 'rate-extension') {
    chrome.tabs.create({ url: 'https://chrome.google.com/webstore/detail/ai-prompt-assistant/jimdgbjdhdoiejncgdfcjpakokcpnalg/reviews' });
  }
  else if (menuItemId.startsWith('share-')) {
    handleShareMenuClick(menuItemId);
  }
  else if (menuItemId.startsWith('lang-')) {
    const language = menuItemId.replace('lang-', '');
    chrome.storage.local.set({ language: language }, () => {
        // No es necesario llamar a updateContextMenuTitlesFromStorage aquí directamente
        // porque el listener de chrome.storage.onChanged lo hará.
        // Solo actualizamos el estado 'checked' del radio button.
        chrome.contextMenus.update(menuItemId, { checked: true });
    });
  }
  else if (menuItemId.startsWith('model-')) {
    const aiModel = menuItemId.replace('model-', '');
    chrome.storage.local.set({ aiModel: aiModel }, () => {
        // Idem para el modelo.
        chrome.contextMenus.update(menuItemId, { checked: true });
    });
  }
}

function handleShareMenuClick(menuItemId) {
  const baseShareText = `*AI Prompt Assistant*

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
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=share

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
https://chromewebstore.google.com/detail/jimdgbjdhdoiejncgdfcjpakokcpnalg?utm_source=share`;

  const emailSubject = "Recomendación: AI Prompt Assistant";

  let url;
  if (menuItemId === 'share-email') {
    url = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(baseShareText.replace(/\*/g, ''))}`; // Quitar asteriscos para email
  } else if (menuItemId === 'share-whatsapp') {
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(baseShareText)}`;
  } else if (menuItemId === 'share-gmail') {
    url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(baseShareText.replace(/\*/g, ''))}`;
  }

  if (url) {
    chrome.tabs.create({ url });
  }
}