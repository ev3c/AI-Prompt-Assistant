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
        case 'textOnlyButton':
          // Para prompts vacíos originales, enviar solo el texto del usuario
          finalPrompt = prompt;
          break;
        case 'urlButton':
          finalPrompt = `${prompt}\n\nURL: ${context}`;
          break;
        case 'clipboardButton':
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;
        case 'bookButton':
          finalPrompt = `${prompt}\n\n${context}`;
          break;
        case 'pdfButton':
          finalPrompt = `${prompt}\n\nTexto del PDF:\n${context}`;
          break;
        case 'xButton':
          finalPrompt = `${prompt}\n\nTexto de X/Twitter:\n${context}`;
          break;
        case 'gmailButton':
          finalPrompt = `${prompt}\n\nTexto del portapapeles:\n${context}`;
          break;
        case 'wikiButton':
          finalPrompt = `${prompt}\n\nContenido de Wikipedia:\n${context}`;
          break;
        case 'addButton':
          finalPrompt = `${prompt}\n\nURL: ${context}`;
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
export async function openAIWithPrompt(prompt, context, aiModel, isClipboard, buttonType, submit = true) {
  const finalPrompt = buildPrompt(prompt, context, isClipboard, buttonType, submit);
    const AI_URLS = await getAIUrls();

  // Helper para esperar a que una pestaña cargue o recargue completamente
  const waitForTabLoad = (tabId) => {
    return new Promise(resolve => {
      const listener = (tabId, info) => {
        if (tabId === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  };

  // Helper para procesar una IA: la busca, la activa, la recarga (si es nueva) y le envía el prompt
  const processAI = async (ai) => {
    if (!AI_URLS[ai]) {
      console.error(`Configuración para ${ai} no encontrada.`);
      return;
    }

    const aiUrls = AI_URLS[ai];
    const allTabs = await chrome.tabs.query({});

    // Lógica mejorada para encontrar una pestaña existente
    let targetTab = allTabs.find(tab => {
    if (!tab.url) return false;
      try {
        const tabHostname = new URL(tab.url).hostname.toLowerCase();
        if (ai === 'meta') return tabHostname.includes('meta.ai');
        if (ai === 'google') return tabHostname.includes('google.com') && !tabHostname.includes('mail.google.com');

        const web1Hostname = new URL(aiUrls.web1).hostname.toLowerCase().replace('www.', '');
        let matches = tabHostname.includes(web1Hostname);
        if (aiUrls.web2) {
          const web2Hostname = new URL(aiUrls.web2).hostname.toLowerCase().replace('www.', '');
          matches = matches || tabHostname.includes(web2Hostname);
        }
        return matches;
      } catch (e) {
        return false; // URL inválida en la pestaña
      }
    });

    let tabToUse;
    if (targetTab) {
      console.log(`✅ Pestaña existente encontrada para ${ai}:`, targetTab.id);
      tabToUse = targetTab;
      // Solo activar, no recargar para preservar la conversación
      await chrome.tabs.update(tabToUse.id, { active: true });
      console.log(`➡️ Pestaña ${ai} activada sin recargar.`);
    } else {
      console.log(`❌ No se encontró pestaña para ${ai}, creando nueva.`);
      tabToUse = await chrome.tabs.create({ url: aiUrls.web1, active: false });
      await waitForTabLoad(tabToUse.id);
      console.log(`✅ Pestaña nueva ${ai} cargada.`);
      
      // Activar y recargar la pestaña NUEVA
      await chrome.tabs.update(tabToUse.id, { active: true });
      console.log(`🔄 Recargando pestaña nueva ${ai}...`);
      await chrome.tabs.reload(tabToUse.id);
      await waitForTabLoad(tabToUse.id);
      console.log(`✅ Pestaña ${ai} recargada.`);
    }

    // Enviar el prompt con el tiempo de espera específico de la IA.
    await sendPromptToTab(tabToUse.id, finalPrompt, ai, submit);
  };

  // Lógica principal: procesar todas las IAs o solo una.
  if (aiModel === 'allai') {
    const supportedAIs = ['chatgpt', 'copilot', 'meta', 'claude', 'deepseek', 'mistral', 'gemini', 'grok', 'google'];
    for (const ai of supportedAIs) {
      try {
        await processAI(ai, submit);
      } catch (error) {
        console.error(`Error procesando ${ai}:`, error);
      }
    }
  } else {
    // Procesar una única IA
    try {
      await processAI(aiModel, submit);
    } catch (error)
    {
      console.error(`Error procesando ${aiModel}:`, error);
    }
  }
}

/**
 * Envía el prompt al content script de la pestaña, respetando los tiempos de espera.
 */
async function sendPromptToTab(tabId, prompt, aiModel, submit = true) {
  const AI_URLS = await getAIUrls();
  // Valor por defecto de 1.5 segundos si no se especifica.
  let delay = 1500; 

  if (aiModel && AI_URLS[aiModel] && AI_URLS[aiModel].waitSeconds) {
    // Si hay un valor específico en motorAI.json, lo usamos (convertido a ms).
    delay = AI_URLS[aiModel].waitSeconds * 1000;
    console.log(`⏳ Usando delay específico para ${aiModel}: ${delay}ms`);
  } else {
    console.log(`⏳ Usando delay por defecto para ${aiModel || 'AI desconocida'}: ${delay}ms`);
  }

  // Asegurarse de que el content script esté inyectado y listo.
  // Esto es crucial para evitar el error "Receiving end does not exist".
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content-script/content.js'] // Ruta a tu content script
    });
    console.log(`✅ Content script 'src/content-script/content.js' inyectado/asegurado en la pestaña ${tabId}`);
  } catch (e) {
    console.error(`❌ Error al inyectar el content script en la pestaña ${tabId}:`, e);
    return; // No podemos enviar el mensaje si el script no se inyectó
  }

  // Espera el tiempo configurado para asegurar que el content script está listo.
  await new Promise(resolve => setTimeout(resolve, delay));
  
  console.log(`💬 Inyectando prompt en la pestaña ${tabId} para ${aiModel}`);
  chrome.tabs.sendMessage(tabId, {
    action: 'insertarTexto',
    texto: prompt,
    submit: submit // ¡NUEVO! Pasamos la instrucción de enviar
  });
}