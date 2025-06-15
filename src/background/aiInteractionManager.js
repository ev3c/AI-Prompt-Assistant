// aiInteractionManager.js

export function getAIModelName(modelId) {
  switch (modelId) {
    case 'chatgpt': return 'ChatGPT';
    case 'claude': return 'Claude';
    case 'deepseek': return 'DeepSeek';
    case 'mistral': return 'Mistral';
    case 'copilot': return 'Copilot';
    case 'gemini': return 'Gemini';
    case 'meta': return 'Meta';
    case 'grok': return 'Grok';
    default: return 'ChatGPT'; // Default model
  }
}

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
    case 'grok': baseUrl = 'https://grok.x.ai/'; break; // Asumiendo que es x.ai/grok o similar
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