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
export async function openAIWithPrompt(prompt, context, aiModel, isClipboard, buttonType) {
  const finalPrompt = buildPrompt(prompt, context, isClipboard, buttonType);
  
  // Caso especial para "All AI's" - abrir todas las AIs disponibles
  if (aiModel === 'allai') {
    const AI_URLS = await getAIUrls();
    const supportedAIs = ['chatgpt', 'claude', 'deepseek', 'mistral', 'copilot', 'gemini', 'meta', 'grok', 'google'];
    const allTabs = await chrome.tabs.query({});
    
    // Usar un bucle for...of con await para procesar cada IA de forma secuencial y pausada.
    for (const ai of supportedAIs) {
      if (AI_URLS[ai]) {
        try {
          const aiUrls = AI_URLS[ai];
          let targetTab = allTabs.find(tab => {
            if (!tab.url) return false;
            if (ai === 'meta') {
              try {
                return new URL(tab.url).hostname.includes('meta.ai');
              } catch (e) { return false; }
            }
            const matchesWeb1 = tab.url.includes(aiUrls.web1);
            const matchesWeb2 = aiUrls.web2 && tab.url.includes(aiUrls.web2);
            return matchesWeb1 || matchesWeb2;
          });

          let tabToUse;
          if (targetTab) {
            console.log(`✅ Pestaña existente encontrada para ${ai}:`, targetTab.id);
            tabToUse = targetTab;
          } else {
            console.log(`❌ No se encontró pestaña para ${ai}, creando nueva.`);
            tabToUse = await chrome.tabs.create({ url: aiUrls.web1, active: false });
            // Esperar a que la nueva pestaña cargue completamente.
            await new Promise(resolve => {
              const listener = (tabId, info) => {
                if (tabId === tabToUse.id && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  console.log(`✅ Pestaña nueva ${ai} cargada.`);
                  resolve();
                }
              };
              chrome.tabs.onUpdated.addListener(listener);
            });
          }

          // Activar la pestaña y recargarla
          await chrome.tabs.update(tabToUse.id, { active: true });
          console.log(`🔄 Recargando pestaña ${ai}...`);
          await chrome.tabs.reload(tabToUse.id);

          // Esperar a que la recarga se complete.
           await new Promise(resolve => {
            const reloadListener = (tabId, info) => {
              if (tabId === tabToUse.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(reloadListener);
                console.log(`✅ Pestaña ${ai} recargada.`);
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(reloadListener);
          });

          // Enviar el prompt con el tiempo de espera específico de la IA.
          await sendPromptToTab(tabToUse.id, finalPrompt, ai);
        } catch (error) {
          console.error(`Error abriendo ${ai}:`, error);
        }
      }
    }
    return; // Salir temprano para All AI's
  }

  const AI_URLS = await getAIUrls();
  const aiUrls = AI_URLS[aiModel];
  if (!aiUrls) throw new Error('IA no soportada');

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
    console.log(`Prompt para ${aiModel}:`, finalPrompt);
    await chrome.tabs.reload(targetTab.id);
    
    // Esperar a que se complete la recarga antes de enviar el prompt
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === targetTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        sendPromptToTab(targetTab.id, finalPrompt, aiModel);
      }
    });
  } else {
    console.log('❌ No se encontró pestaña existente, creando nueva');
    console.log('🔗 Creando nueva pestaña con URL:', aiUrls.web1);
    console.log(`Prompt para ${aiModel}:`, finalPrompt);
    const newTab = await chrome.tabs.create({ url: aiUrls.web1, active: true });

    // Esperar a que cargue la pestaña antes de enviar el prompt
    await new Promise(resolve => {
      const listener = (tabId, info) => {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    // Recargar y esperar
    await chrome.tabs.reload(newTab.id);
    await new Promise(resolve => {
      const reloadListener = (tabId, info) => {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(reloadListener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(reloadListener);
    });

    // Enviar prompt
    await sendPromptToTab(newTab.id, finalPrompt, aiModel);
  }
}

/**
 * Envía el prompt al content script de la pestaña, respetando los tiempos de espera.
 */
async function sendPromptToTab(tabId, prompt, aiModel) {
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

  // Espera el tiempo configurado para asegurar que el content script está listo.
  await new Promise(resolve => setTimeout(resolve, delay));
  
  console.log(`💬 Inyectando prompt en la pestaña ${tabId}`);
  chrome.tabs.sendMessage(tabId, {
    action: 'insertarTexto',
    texto: prompt
  });
}