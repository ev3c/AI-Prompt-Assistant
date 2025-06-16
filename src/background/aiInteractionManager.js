import { getAIUrls } from '/src/common/common.js';

/**
 * Devuelve el nombre del modelo IA por su id.
 */
export async function getAIModelName(modelId) {
  const AI_URLS = await getAIUrls();
  const model = Object.entries(AI_URLS).find(([id]) => id === modelId);
  return model ? model[0].charAt(0).toUpperCase() + model[0].slice(1) : 'ChatGPT';
}


/**
 * Construye el prompt final según el contexto y el tipo de botón.
 */
export function buildPrompt(prompt, context, isClipboard, buttonType) {
  let finalPrompt = prompt;

  // Contexto PDF
  if (context && typeof context === 'string' && context.startsWith("PDF: ")) {
    const pdfMatch = context.match(/PDF: (.*?) \((.*?)\)/);
    if (pdfMatch) {
      const pdfName = pdfMatch[1];
      const pdfPath = pdfMatch[2];

      if (prompt.includes('[PDF]')) {
        finalPrompt = prompt.replace(/\[PDF\]/g, pdfName);
      } else if (prompt.includes('[PDF_PATH]')) {
        finalPrompt = prompt.replace(/\[PDF_PATH\]/g, pdfPath);
      } else {
        finalPrompt = `${prompt}\n\nPDF: ${pdfName}\nRuta: ${pdfPath}`;
      }

      if (finalPrompt.includes('[TEMA]') || finalPrompt.includes('[TOPIC]')) {
        // NOTA: Si necesitas pedir el tema al usuario, hazlo desde la UI (no desde aquí)
        finalPrompt = finalPrompt.replace(/\[TEMA\]|\[TOPIC\]/g, 'tema principal');
      }
    }
  } else {
    if (prompt.includes('[URL]')) {
      finalPrompt = prompt.replace(/\[URL\]/g, context);
    } else {
      switch (buttonType) {
        case 'urlButton':
          finalPrompt = `${prompt}\n\nURL: ${context}`;
          break;
        case 'clipboardButton':
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;
        case 'bookButton':
          finalPrompt = `${prompt}\n\nTexto del libro:\n${context}`;
          break;
        case 'pdfButton':
          finalPrompt = `${prompt}\n\nTexto del PDF:\n${context}`;
          break;
        case 'xButton':
          finalPrompt = `${prompt}\n\nTexto del X:\n${context}`;
          break;
        case 'gmailButton':
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;
        case 'wikiButton':
          finalPrompt = `${prompt}\n\nContenido de Wikipedia:\n${context}`;
          break;
        default:
          if (isClipboard) {
            finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          } else {
            finalPrompt = `${prompt}\n\nURL: ${context}`;
          }
          break;
      }
    }
  }
  return finalPrompt;
}

/**
 * Busca o abre la pestaña de la IA y envía el prompt usando content script.
 */
export async function openAIWithPrompt(prompt, context, aiModel, isClipboard, buttonType) {
  const AI_URLS = await getAIUrls();
  const aiUrls = AI_URLS[aiModel];
  if (!aiUrls) throw new Error('IA no soportada');

  const finalPrompt = buildPrompt(prompt, context, isClipboard, buttonType);

  // Buscar pestaña existente
  const tabs = await chrome.tabs.query({});
  console.log('🔍 Buscando pestaña existente para:', aiModel);
  console.log('🔍 URLs a buscar:', aiUrls);
  console.log('🔍 Pestañas abiertas:', tabs.map(tab => ({ id: tab.id, url: tab.url })));
  
  let targetTab = tabs.find(tab => {
    if (!tab.url) return false;
    
    // Para MetaAI, buscar específicamente meta.ai en el hostname
    if (aiModel === 'meta') {
      try {
        const tabUrl = new URL(tab.url);
        const isMetaAI = tabUrl.hostname.includes('meta.ai');
        console.log(`🔍 Pestaña ${tab.id}: ${tab.url} - es meta.ai: ${isMetaAI}`);
        return isMetaAI;
      } catch (e) {
        console.log(`🔍 Error parsing URL ${tab.url}:`, e);
        return false;
      }
    }
    
    // Para otras IAs, usar la lógica original
    const matchesWeb1 = tab.url.includes(aiUrls.web1);
    const matchesWeb2 = aiUrls.web2 && tab.url.includes(aiUrls.web2);
    console.log(`🔍 Pestaña ${tab.id}: ${tab.url} - web1: ${matchesWeb1}, web2: ${matchesWeb2}`);
    return matchesWeb1 || matchesWeb2;
  });

  if (targetTab) {
    console.log('✅ Pestaña existente encontrada:', targetTab.id, targetTab.url);
    await chrome.tabs.update(targetTab.id, { active: true });
    
    // OJU OSCAR: Actualizar la página antes de enviar el prompt
    await chrome.tabs.reload(targetTab.id);
    
    // Esperar a que se complete la recarga antes de enviar el prompt
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === targetTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        sendPromptToTab(targetTab.id, finalPrompt);
      }
    });
  } else {
    console.log('❌ No se encontró pestaña existente, creando nueva');
    console.log('🔗 Creando nueva pestaña con URL:', aiUrls.web1);
    const newTab = await chrome.tabs.create({ url: aiUrls.web1 });
    // Esperar a que cargue la pestaña antes de enviar el prompt
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === newTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        sendPromptToTab(newTab.id, finalPrompt);
      }
    });
  }
}

/**
 * Envía el prompt al content script de la pestaña.
 */
async function sendPromptToTab(tabId, prompt) {
  // Espera un poco para asegurar que el content script está listo
  await new Promise(resolve => setTimeout(resolve, 1000));
  chrome.tabs.sendMessage(tabId, {
    action: 'insertarTexto',
    texto: prompt
  });
}
/*
export function openAIWithPrompt(prompt, context, aiModel, isClipboard, buttonType) {
  let finalPrompt = prompt;

  // Verificar si estamos en contexto PDF
  if (context && typeof context === 'string' && context.startsWith("PDF: ")) {
    const pdfMatch = context.match(/PDF: (.*?) \((.*?)\)/);
    if (pdfMatch) {
      const pdfName = pdfMatch[1];
      const pdfPath = pdfMatch[2];
      
      if (prompt.includes('[PDF]')) {
        finalPrompt = prompt.replace(/\[PDF\]/g, pdfName);
      } else if (prompt.includes('[PDF_PATH]')) {
        finalPrompt = prompt.replace(/\[PDF_PATH\]/g, pdfPath);
      } else {
        finalPrompt = `${prompt}\n\nPDF: ${pdfName}\nRuta: ${pdfPath}`;
      }
      
      if (finalPrompt.includes('[TEMA]') || finalPrompt.includes('[TOPIC]')) {
        const themeMatch = finalPrompt.match(/\[TEMA\]|\[TOPIC\]/);
        if (themeMatch) {
          const userTopic = window.prompt('Especifique el tema a buscar en el PDF:', ''); // window.prompt no funciona en service worker. Esto necesitará un modal en el sidepanel.
          if (userTopic) {
            finalPrompt = finalPrompt.replace(/\[TEMA\]|\[TOPIC\]/g, userTopic);
          } else {
            finalPrompt = finalPrompt.replace(/\[TEMA\]|\[TOPIC\]/g, 'tema principal');
          }
        }
      }
    }
  } else {
    if (prompt.includes('[URL]')) {
      finalPrompt = prompt.replace(/\[URL\]/g, context);
    } else {
      switch (buttonType) {
        case 'urlButton':
          finalPrompt = `${prompt}\n\nURL: ${context}`;
          break;
        case 'clipboardButton':
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;  
        case 'bookButton':
          finalPrompt = `${prompt}\n\nTexto del libro:\n${context}`;
          break;
        case 'pdfButton': // Asumiendo que el texto del PDF ya está extraído y en 'context'
          finalPrompt = `${prompt}\n\nTexto del PDF:\n${context}`;
          break;
        case 'xButton':
          finalPrompt = `${prompt}\n\nTexto del X:\n${context}`;
          break;
        case 'gmailButton':
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;
        case 'wikiButton':
          finalPrompt = `${prompt}\n\nContenido de Wikipedia:\n${context}`;
          break;
        default:
          if (isClipboard) {
            finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          } else {
            finalPrompt = `${prompt}\n\nURL: ${context}`;
          }
          break;
      }
    }
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
  let baseUrl;
  switch (aiModel) {
    case 'claude': baseUrl = 'https://claude.ai/'; break;
    case 'deepseek': baseUrl = 'https://chat.deepseek.com/'; break;
    case 'mistral': baseUrl = 'https://chat.mistral.ai/'; break;
    case 'copilot': baseUrl = 'https://copilot.microsoft.com/'; break;
    case 'gemini': baseUrl = 'https://gemini.google.com/app'; break;
    case 'grok': baseUrl = 'https://x.ai/grok/'; break; // Asumiendo que es x.ai/grok o similar
    case 'meta': baseUrl = 'https://meta.ai/'; break;
    case 'chatgpt':
    default: baseUrl = 'https://chat.openai.com/'; break;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTabUrl = tabs[0]?.url || "";
    let aiUrl;

    // La mayoría de las IAs aceptan el prompt como un parámetro 'q' o similar.
    // Algunas podrían necesitar una estructura de URL diferente o enviar el prompt vía POST
    // o a través de un content script después de abrir la página.
    // Por simplicidad, usamos un parámetro 'q', pero esto puede necesitar ajustes por IA.
    // Claude, por ejemplo, no tiene una forma estándar de pasar prompts vía URL query.
    // Gemini tampoco tiene una forma documentada y estable para pasar prompts vía URL.
    // La mejor manera de enviar un prompt a estas IAs es abrir la página y luego usar un content script.
    // La lógica actual de textToAI (la otra extensión) es más robusta para esto.
    // Aquí, simplificaremos para el ejemplo de refactorización.

    if (aiModel === 'gemini') {
        aiUrl = `${baseUrl}/search?q=${encodedPrompt}`; // Ejemplo, puede no ser el método oficial
    } else if (aiModel === 'claude') {
        aiUrl = `${baseUrl}`; // Claude no soporta prompts en URL directamente, se debe pegar manualmente o con content script
    }
    else {
        aiUrl = `${baseUrl}?q=${encodedPrompt}`; // Formato genérico
    }
    // Podrías añadir &url=${encodeURIComponent(currentTabUrl)} si la IA lo soporta

    chrome.tabs.create({ url: aiUrl });
  });
}
  */