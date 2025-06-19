// Módulo común para funcionalidad compartida entre popup.js y sidebar.js

// Importar función de traducción
import { getTranslation } from '/src/content-script/translations.js';

// Variables que serán reutilizadas
let menuData = null;
let currentUrl = '';
let clipboardText = '';
let currentSection = null;
let currentLanguage = 'es'; // Idioma por defecto: Español
let currentAIModel = 'chatgpt'; // Modelo por defecto: ChatGPT
let useClipboard = false; // Por defecto, usar URL
let hoveredTranslationButton = null; // Para guardar referencia al botón de traducción con hover
let currentContext = 'url'; // Default context is URL
let availableLanguages = []; // Lista de idiomas disponibles cargada desde /src/common/languages/idiomaAI.json
let currentPrompt = '';
let clipboardContent = '';

export async function loadMotorAI() {
  try {
    const response = await fetch('/src/common/motorAI.json');
    if (!response.ok) {
      throw new Error(`Error al cargar /src/common/motorAI.json: ${response.status}`); // Intenta cargar json
    }
    return await response.json(); // Devuelve json
  } catch (error) {
    console.error('Error al cargar el motor de IA:', error);
  }
}

export async function getAIUrls() {
  const motorAIJson = await loadMotorAI();
  const motores = motorAIJson.motoresIA || [];
  const AI_URLS = {};
  motores.forEach(model => {
    if (model.id && model.web) {
      AI_URLS[model.id] = {web1 : model.web, web2: model.web2};
    }
  });
  return AI_URLS;
}

// Exportamos configuración que serán utilizadas por popup.js y sidebar.js
export const config = {
  // Getters y setters para variables globales
  getMenuData: () => menuData,
  setMenuData: (data) => { menuData = data; },

  getCurrentUrl: () => currentUrl,
  setCurrentUrl: (url) => { currentUrl = url; },

  getClipboardText: () => clipboardText,
  setClipboardText: (text) => { clipboardText = text; },

  getCurrentLanguage: () => currentLanguage,
  setCurrentLanguage: (lang) => { currentLanguage = lang; },

  getCurrentAIModel: () => currentAIModel,
  setCurrentAIModel: (model) => { currentAIModel = model; },

  getUseClipboard: () => useClipboard,
  setUseClipboard: (value) => { useClipboard = value; },

  getCurrentContext: () => currentContext,
  setCurrentContext: (context) => { currentContext = context; },

  getHoveredTranslationButton: () => hoveredTranslationButton,
  setHoveredTranslationButton: (button) => { hoveredTranslationButton = button; },

  getAvailableLanguages: () => availableLanguages,
  setAvailableLanguages: (languages) => { availableLanguages = languages; }
};

// Función para cargar los idiomas disponibles desde /src/common/languages/idiomaAI.json
export async function loadAvailableLanguages() {
  try {
    const response = await fetch('/src/common/languages/idiomaAI.json');
    if (!response.ok) {
      throw new Error(`Error al cargar /src/common/languages/idiomaAI.json: ${response.status}`);
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

// Función para intentar leer el portapapeles
export async function tryReadClipboard() {
  try {
    // Primero, solicitar permisos explícitamente
    const hasPermission = await requestClipboardPermission();
    
    // Si tenemos permisos, intentar leer directamente
    if (hasPermission) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          // Almacenar el contenido anterior para comparación
          const previousClipboardText = clipboardText;
          clipboardText = text;
          
          // Si el contenido cambió y estamos en contexto de clipboard, notificar el cambio
          if (previousClipboardText !== clipboardText && currentContext === 'clipboard') {
            console.log('Contenido del portapapeles actualizado:', clipboardText);
            // Disparar un evento personalizado para que otros módulos puedan reaccionar
            const clipboardChangeEvent = new CustomEvent('clipboardContentChanged', { 
              detail: { 
                newContent: clipboardText, 
                previousContent: previousClipboardText 
              } 
            });
            document.dispatchEvent(clipboardChangeEvent);
          }
        } else {
          clipboardText = '[Contenido del portapapeles vacío]';
        }
      } catch (readErr) {
        console.log('Error al leer el portapapeles:', readErr);
        clipboardText = '[No se pudo acceder al portapapeles]';
      }
    } else {
      // No tenemos permisos, devolver texto neutro
      const texts = getTranslation(currentLanguage);
      clipboardText = `[${texts.textPrompt.selectTextClick}]`;
    }
    
    return clipboardText;
  } catch (err) {
    console.log('Error general al acceder al portapapeles:', err);
    const texts = getTranslation(currentLanguage);
    clipboardText = `[${texts.textPrompt.selectTextClick}]`;
    return clipboardText;
  }
}

// Actualizar la visualización del contexto (URL o portapapeles)
export function updateContextDisplay() {
const labelText = document.getElementById('current-url');

// Configurar el estilo para que ocupe dos líneas
labelText.style.height = 'auto';
labelText.style.minHeight = '2.4em'; // Altura para aproximadamente 2 líneas
labelText.style.maxWidth = '100%';
labelText.style.whiteSpace = 'normal'; // Permitir saltos de línea
labelText.style.overflow = 'hidden';
labelText.style.textOverflow = 'ellipsis';
labelText.style.display = '-webkit-box';
labelText.style.webkitLineClamp = '2'; // Limitar a 2 líneas
labelText.style.webkitBoxOrient = 'vertical';
labelText.style.lineHeight = '1.2em';

let displayText = clipboardText || '[Portapapeles vacío]';
// Limitar el texto del portapapeles para la visualización
// Aumentar el límite de caracteres ya que ahora tenemos 2 líneas
if (displayText.length > 100) {
  displayText = displayText.substring(0, 100) + '...';
}

    switch (currentContext) {
      case 'url':
        labelText.textContent = `URL: ${shortenUrl(currentUrl)}`;
        break;
      case 'clipboard':
        labelText.textContent = `ClipB: ${displayText}`;
        break;
      case 'book':
        labelText.textContent = `Book: ${displayText}`;
        break;
      case 'pdf':
        labelText.textContent = ` ${displayText}`;
        break;
      case 'wiki':
        labelText.textContent = `Wiki: ${shortenUrl(currentUrl)}`;
        break;
      case 'twitter':
        labelText.textContent = ` ${displayText}`;
        break;
            case 'gmail':
        labelText.textContent = ` ${displayText}`;
        break;
      case '+add+':
        labelText.textContent = `Add: ${shortenUrl(currentUrl)}`;
        break;
      default:
        labelText.textContent = `URL: ${shortenUrl("error")}`;
    }
  }


// Función para acortar URLs largas
export function shortenUrl(url) {
  const maxLength = 100; // Aumentado de 50 a 100 para mostrar más información en las 2 líneas
  return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
}

// Obtener el nombre formateado del modelo de IA actual
const modelNames = {
  'chatgpt': 'ChatGPT',
  'claude': 'Claude',
  'deepseek': 'DeepSeek',
  'mistral': 'Mistral',
  'copilot': 'Copilot',
  'gemini': 'Gemini',
  'meta': 'Meta',
  'grok': 'Grok',
  'allai': 'All AI\'s',
};

export function getAIModelName(modelId) {
  return modelNames[modelId] || 'ChatGPT';
}

// Función para cargar el archivo de menú según el idioma y el modelo de IA actual
export async function loadMenuData(language = 'es') {
  try {
    // Determinar qué archivo cargar según el idioma, el modelo de IA y el contexto seleccionado
    let fileName;
    const model = currentAIModel || 'chatgpt'; // Usar 'chatgpt' como valor por defecto
    const context = currentContext || 'url'; // Usar 'url' como contexto por defecto

    // Si el contexto es PDF, verificar si tenemos información del PDF seleccionado
    if (context === 'pdf') {
      chrome.storage.local.get(['lastSelectedPdf', 'lastSelectedPdfPath'], function(result) {
        if (result.lastSelectedPdf && result.lastSelectedPdfPath) {
          // Actualizar la información del portapapeles con la ruta del PDF
          clipboardText = `PDF: ${result.lastSelectedPdf} (${result.lastSelectedPdfPath})`;
          updateContextDisplay(); // Actualizar la visualización si está definida
        }
      });
    }

    // Prefijo según el tipo de contexto seleccionado
    let contextPrefix = 'AI'; // Por defecto, usa archivos AI

    switch (context) {
      case 'url':
        contextPrefix = 'AI';
        break;
      case 'clipboard':
        contextPrefix = 'Clipb';
        break;
      case 'book':
        contextPrefix = 'ePub';
        break;
      case 'pdf':
        contextPrefix = 'PDF';
        break;
      case 'wiki':
        contextPrefix = 'Wiki';
        break;
      case 'twitter':
        contextPrefix = 'X';
        break;
            case 'gmail':
        contextPrefix = 'Gmail';
        break;
      case '+add+':
        contextPrefix = 'ADD';
        break;
      default:
        contextPrefix = 'AI';
    }

    // Determinar el sufijo del idioma
    let langSuffix = 'ES'; // Español por defecto

    if (language === 'gb') {
      langSuffix = 'GB';
    } else if (language === 'fr') {
      langSuffix = 'FR';
    } else if (language === 'ca') {
      langSuffix = 'CA';
    } else if (language === 'de') {
      langSuffix = 'DE';
    } else if (language === 'it') {
      langSuffix = 'IT';
    } else if (language === 'pt') {
      langSuffix = 'PT';
    } else if (language === 'ja') {
      langSuffix = 'JA';
    } else if (language === 'zh') {
      langSuffix = 'ZH';
    } else if (language === 'ru') {
      langSuffix = 'RU';
    } else if (language === 'ar') {
      langSuffix = 'AR';
    } else if (language === 'kr') {
      langSuffix = 'KR';
    } else if (language === 'hi') {
      langSuffix = 'HI';
    } else if (language === 'es') {
      langSuffix = 'ES';
    }

    // Generar el nombre del archivo con la carpeta /src/common/languages/
    fileName = `/src/common/languages/menu_data_${contextPrefix}_${langSuffix}.json`;
    console.log(`Intentando cargar archivo: ${fileName}`);



    // Intentar cargar el archivo específico
    try {
      const response = await fetch(fileName);
      if (response.ok) {
        return await response.json();
      }
    } catch (specificError) {
      console.log(`No se encontró ${fileName}, intentando alternativas...`);
    }

    // Si no se encuentra el archivo específico, intentar con el archivo de AI en el idioma actual
    const aiFileName = `/src/common/languages/menu_data_AI_${langSuffix}.json`;
    try {
      console.log(`Intentando cargar archivo AI como fallback: ${aiFileName}`);
      const aiResponse = await fetch(aiFileName);
      if (aiResponse.ok) {
        return await aiResponse.json();
      }
    } catch (aiError) {
      console.log(`No se encontró ${aiFileName}, intentando con ADD...`);
    }

    // Si no se encuentra el archivo de AI, intentar con el archivo ADD en el idioma actual
    const addFile = `/src/common/languages/menu_data_ADD_${langSuffix}.json`;
    try {
      console.log(`Intentando cargar archivo ADD: ${addFile}`);
      const addResponse = await fetch(addFile);
      if (addResponse.ok) {
        return await addResponse.json();
      }
    } catch (addError) {
      console.log(`No se encontró ${addFile}, intentando con español...`);
    }

    // Como último recurso, intentar con el archivo en español
    console.log(`Intentando cargar archivo: /src/common/languages/menu_data_ADD_ES.json`);
    const fallbackResponse = await fetch('/src/common/languages/menu_data_ADD_ES.json');
    if (fallbackResponse.ok) {
      return await fallbackResponse.json();
    }

    throw new Error('No se pudo cargar ningún archivo de menú');
  } catch (error) {
    console.error('Error al cargar el archivo de menú:', error);
    throw error;
  }
}

// Función para cambiar el idioma
import { updateUITexts } from '/src/content-script/translations.js';

export function changeLanguage(language) {
  currentLanguage = language;

  // Guardar la preferencia de idioma
  chrome.storage.local.set({ language: language }, function () {
    console.log('Idioma guardado:', language);
  });

  // Actualizar el icono del botón de idioma
  updateLanguageButtonIcon(language);

  // Actualizar los textos de la interfaz
  updateUITexts(language);

  // Actualizar el idioma seleccionado en el menú
  updateSelectedLanguageInMenu();

  // Guardar la configuración principal
  saveMainConfig();

  // Cargar y actualizar el menú con el nuevo idioma y el contexto actual
  loadMenuData(language).then(newMenuData => {
    // Actualizar los datos del menú
    config.setMenuData(newMenuData);

    // Volver a renderizar las secciones
    renderSections();

    /*
    // Mostrar notificación
    const notification = document.getElementById('copy-notification');
    const texts = getTranslation(language);
    const selectedOption = document.querySelector(`#language-selector option[value="${language}"]`);
    notification.textContent = `${texts.notifications.languageChanged} ${selectedOption.textContent}`;
    notification.classList.remove('hidden');

    // Ocultar notificación después de 2 segundos
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 2000);
    */
  }).catch(error => {
    // console.error('Error al cambiar el idioma:', error);
    //const notification = document.getElementById('copy-notification');
    //const texts = getTranslation(language);
    //notification.textContent = texts.notifications.error;
    //notification.classList.remove('hidden');
    //setTimeout(() => {
    //  notification.classList.add('hidden');
    //}, 2000);
  });
}

// Función para actualizar el icono del botón de idioma
const flagMap = {
  'es': '🇪🇸',
  'gb': '🇬🇧',
  'ca': 'ca',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'pt': '🇵🇹',
  'ja': '🇯🇵',
  'zh': '🇨🇳',
  'ru': '🇷🇺',
  'ar': '🇸🇦',
  'hi': '🇮🇳',
  'kr': '🇰🇷'
};

export function updateLanguageButtonIcon(language) {
  const languageButton = document.getElementById('language-button');
  if (languageButton) {
    // Primero intentamos obtener el flag desde un language-option con data-lang
    const selectedOption = document.querySelector(`.language-option[data-lang="${language}"]`);
    if (selectedOption) {
      const flag = selectedOption.getAttribute('data-flag');
      if (flag) {
        languageButton.textContent = flag;
        return;
      }
    }
    
    // Si no encontramos la opción o no tiene flag, usamos el mapa de flags
    const flag = flagMap[language] || '🌐';
    languageButton.textContent = flag;
  }
}

// Función para cambiar el modelo de IA
export function changeAIModel(model) {
  currentAIModel = model;

  // Guardar la preferencia de modelo
  chrome.storage.local.set({ aiModel: model }, function () {
    console.log('Modelo cambiado a:', model);
  });

  // Actualizar el título dinámicamente
  const titleTextElement = document.getElementById('title-text');
  const modelName = getAIModelName(model); // Obtener nombre del modelo actual
  titleTextElement.textContent = `${modelName} Prompt Assistant`; // Actualizar título

  // Guardar la configuración principal
  saveMainConfig();

  // Cargar y actualizar el menú con el nuevo modelo y el contexto actual
  loadMenuData(currentLanguage).then(newMenuData => {
    // Actualizar los datos del menú
    config.setMenuData(newMenuData);

    // Volver a renderizar las secciones
    renderSections();

    /*
    // Mostrar notificación
    const notification = document.getElementById('copy-notification');
    notification.textContent = `Modelo cambiado a: ${modelName}`;
    notification.classList.remove('hidden');

    // Ocultar notificación después de 2 segundos
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 2000);
    */
   
  }).catch(error => {
    /*
    console.error('Error al cambiar el modelo:', error);
    const notification = document.getElementById('copy-notification');
    notification.textContent = 'Error al cambiar el modelo';
    notification.classList.remove('hidden');
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 2000);
    */
  });
}

// Mostrar ventana emergente de configuración
export function showSettingsMenu() {
  // Asegurarse de que los selectores tienen los valores actuales
  document.getElementById('language-selector').value = currentLanguage;
  document.getElementById('ai-model-selector').value = currentAIModel;

  // Mostrar la ventana emergente
  document.getElementById('settings-popup').classList.remove('hidden');
}

// Ocultar ventana emergente de configuración
export function hideSettingsMenu() {
  document.getElementById('settings-popup').classList.add('hidden');
}

// Cerrar el menú desplegable de idiomas
export function closeLanguageDropdown() {
  const visibleMenus = document.querySelectorAll('.inline-language-menu.visible');
  visibleMenus.forEach(menu => {
    menu.classList.remove('visible');
  });
  hoveredTranslationButton = null; // Limpiar la referencia al botón con hover
}

// Renderizar secciones del menú
export function renderSections() {
  const sectionsContainer = document.getElementById('sections-container');
  sectionsContainer.innerHTML = '';

  menuData.sections.forEach((section, index) => {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'section';

    // Título de la sección
    const titleElement = document.createElement('h2');
    titleElement.textContent = section.title;
    sectionElement.appendChild(titleElement);

    // Contenedor de botones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';

    // Añadir botones regulares
    if (section.buttons) {
      section.buttons.forEach(button => {
        const buttonElement = createButton(button.label, button.prompt);
        buttonsContainer.appendChild(buttonElement);
      });
    }

    // Añadir botón de traducción si existe
    if (section.translationButton) {
      const translationContainer = document.createElement('div');
      translationContainer.className = 'translation-container';

      const translationButton = createTranslationButton(section);
      translationContainer.appendChild(translationButton);

      // Crear submenú de idiomas directamente en el contenedor
      const languageMenu = document.createElement('div');
      languageMenu.className = 'inline-language-menu';
      languageMenu.id = `inline-language-menu-${index}`;

      renderInlineLanguageOptions(languageMenu, section.translationSubmenu);

      translationContainer.appendChild(languageMenu);
      buttonsContainer.appendChild(translationContainer);
    }

    sectionElement.appendChild(buttonsContainer);
    sectionsContainer.appendChild(sectionElement);
  });
}

// Crear un botón regular
export function createButton(label, prompt) {
  const button = document.createElement('button');
  button.className = 'prompt-button';
  button.textContent = label;

  button.addEventListener('click', async function () {
    await openAIWithPrompt(prompt, label);
  });

  return button;
}

// Crear un botón de traducción con submenú desplegable
export function createTranslationButton(section) {
  const button = document.createElement('button');
  button.className = 'prompt-button translation-button';
  button.textContent = section.translationButton.label;
  button.dataset.sectionIndex = menuData.sections.indexOf(section);

  // Mostrar menú al pasar el ratón sobre el botón
  button.addEventListener('mouseenter', function (event) {
    // Guardar referencia al botón con hover
    hoveredTranslationButton = button;

    // Mostrar el menú de idiomas inline asociado a este botón
    const sectionIndex = button.dataset.sectionIndex;
    const menuElement = document.getElementById(`inline-language-menu-${sectionIndex}`);
    if (menuElement) {
      menuElement.classList.add('visible');

      // Asignar evento mouseleave al menú para cerrarlo cuando el ratón sale
      menuElement.addEventListener('mouseleave', function () {
        menuElement.classList.remove('visible');
        hoveredTranslationButton = null;
      });

      // Asignar evento mouseenter al menú para asegurar que se mantenga visible
      menuElement.addEventListener('mouseenter', function () {
        menuElement.classList.add('visible');
      });
    }
  });

  // Ocultar menú cuando el ratón sale del botón
  button.addEventListener('mouseleave', function (event) {
    // Revisar si el ratón se mueve hacia el menú
    const sectionIndex = button.dataset.sectionIndex;
    const menuElement = document.getElementById(`inline-language-menu-${sectionIndex}`);

    // Dar un poco de tiempo para que el ratón pueda moverse al menú si va en esa dirección
    setTimeout(() => {
      if (!menuElement.matches(':hover')) {
        menuElement.classList.remove('visible');
        hoveredTranslationButton = null;
      }
    }, 100);
  });

  return button;
}

// Renderizar opciones de idioma en el menú inline
export function renderInlineLanguageOptions(container, options) {
  container.innerHTML = '';

  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'inline-language-option';
    button.textContent = option.label;

    button.addEventListener('click', async function () {
      await openAIWithPrompt(option.prompt, option.label);
    });

    container.appendChild(button);
  });
}

// Función para abrir el modelo de IA con un prompt
export async function openAIWithPrompt(prompt, label) {
  // Siempre preguntar al usuario para confirmar/modificar el prompt
  const defaultText = prompt || "";
  const iPrompt = await textPrompt(label || "Editar prompt:", defaultText);
  
  // Si el usuario cancela o no ingresa nada, salir de la función
  if (!iPrompt) return;
  
  // Usar el prompt ingresado por el usuario
  prompt = iPrompt;
  console.log("Prompt confirmado/modificado:", prompt);

  // Limitar el prompt a 1000 caracteres
  prompt = truncatePrompt(prompt, 1000);
  console.log("Prompt después de truncar:", prompt.length, "caracteres");

  // Verificar si el prompt contiene [TEMA] o [TOPIC]
  if (prompt.includes('[TEMA]') || prompt.includes('[TOPIC]')) {
    // Pedir al usuario que ingrese el tema específico
    const texts = getTranslation(currentLanguage);
    const userTopic = await textPrompt(texts.textPrompt.topicPrompt, texts.textPrompt.topicPlaceholder);
    if (userTopic) {
      // Reemplazar [TEMA] o [TOPIC] con el tema ingresado por el usuario
      prompt = prompt.replace(/\[TEMA\]|\[TOPIC\]/g, userTopic);
    } else {
      // Si el usuario no ingresa nada, usar un valor genérico
      prompt = prompt.replace(/\[TEMA\]|\[TOPIC\]/g, 'tema principal');
    }
  }

  // Comprobar si estamos en el contexto de PDF
  if (currentContext === 'pdf') {
    // Obtener la información del último PDF seleccionado
    chrome.storage.local.get(['lastSelectedPdf', 'lastSelectedPdfPath'], function(result) {
      if (result.lastSelectedPdf && result.lastSelectedPdfPath) {
        // Crear un formato específico para el contexto PDF
        const pdfContext = `PDF: ${result.lastSelectedPdf} (${result.lastSelectedPdfPath})`;
        
        // Enviar mensaje al background script para abrir el modelo de IA con la información del PDF
        chrome.runtime.sendMessage({
          action: 'openAI',
          prompt: prompt,
          context: pdfContext,
          aiModel: currentAIModel,
          isClipboard: true, // Usamos el formato de portapapeles para enviar la info del PDF
          buttonType: 'pdfButton'
        });
        
        // Mostrar notificación
        const notification = document.getElementById('copy-notification');
        notification.textContent = `Abriendo ${getAIModelName(currentAIModel)} con ${result.lastSelectedPdf}...`;
        notification.classList.remove('hidden');
        
        // Si estamos en el popup, cerrarlo después de un segundo
        if (location.pathname.includes('popup.html')) {
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // Si estamos en el sidebar, solo ocultar la notificación
          setTimeout(() => {
            notification.classList.add('hidden');
          }, 2000);
        }
      } else {
        // No hay información del PDF, usar el comportamiento estándar
        openAIWithStandardContext(prompt, label);
      }
    });
  } else {
    // Para otros contextos, usar el comportamiento estándar
    openAIWithStandardContext(prompt, label);
  }
}

// Función interna para manejar contextos estándar (no PDF)
function openAIWithStandardContext(prompt, label) {
  // Determinar qué tipo de botón estamos usando basado en el contexto
  let buttonType;
  switch (currentContext) {
    case 'url':
      buttonType = 'urlButton';
      break;
    case 'clipboard':
      buttonType = 'clipboardButton';
      break;
    case 'book':
      buttonType = 'bookButton';
      break;
    case 'pdf':
      buttonType = 'pdfButton';
      break;
    case 'wiki':
      buttonType = 'wikiButton';
      break;
    case 'twitter':
      buttonType = 'xButton';
      break;
    case 'gmail':
      buttonType = 'gmailButton';
      break;
    default:
      buttonType = 'urlButton';
      break;
  }

  // Si estamos usando URL o estamos en otros contextos que no usan clipboard
  if (!config.getUseClipboard() && currentContext !== 'book') {
    // Obtener la URL de la pestaña activa justo antes de enviar el prompt
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        // Actualizar la URL con la de la pestaña activa
        const activeTabUrl = tabs[0].url;

        // Enviar mensaje al background script para abrir el modelo de IA
        chrome.runtime.sendMessage({
          action: 'openAI',
          prompt: prompt,
          context: activeTabUrl,
          aiModel: currentAIModel,
          isClipboard: config.getUseClipboard(),
          buttonType: buttonType
        });

        // Mostrar notificación
        const notification = document.getElementById('copy-notification');
        notification.textContent = `Abriendo ${getAIModelName(currentAIModel)}...`;
        notification.classList.remove('hidden');

        // Si estamos en el popup, cerrarlo después de un segundo
        if (location.pathname.includes('popup.html')) {
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // Si estamos en el sidebar, solo ocultar la notificación
          setTimeout(() => {
            notification.classList.add('hidden');
          }, 2000);
        }
      }
    });
  } else {
    // Si usamos el portapapeles o estamos en contexto de libro, usar el texto del clipboard
    chrome.runtime.sendMessage({
      action: 'openAI',
      prompt: prompt,
      context: config.getClipboardText(),
      aiModel: currentAIModel,
      isClipboard: true,
      buttonType: buttonType
    });

    // Mostrar notificación
    const notification = document.getElementById('copy-notification');
    notification.textContent = `Abriendo ${getAIModelName(currentAIModel)}...`;
    notification.classList.remove('hidden');

    // Si estamos en el popup, cerrarlo después de un segundo
    if (location.pathname.includes('popup.html')) {
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // Si estamos en el sidebar, solo ocultar la notificación
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 2000);
    }
  }
}

// Función para generar el HTML de opciones de idioma
export function generateLanguageOptions() {
  const languages = availableLanguages;
  let languageOptionsHTML = '';
  const currentLang = config.getCurrentLanguage();

  languages.forEach(lang => {
    // Determinar la bandera para cada idioma
    let flag = '';
    switch (lang.codigoISO) {
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

    // Crear la opción de idioma para el menú emergente
    const isSelected = lang.codigoISO === currentLang ? ' selected' : '';
    languageOptionsHTML += `
      <li class="language-option${isSelected}" data-lang="${lang.codigoISO}" data-flag="${flag}">
        ${flag} ${lang.nombreNativo}
      </li>
    `;
  });

  return languageOptionsHTML;
}

// Función para actualizar el idioma seleccionado en el menú
export function updateSelectedLanguageInMenu() {
  const languageOptions = document.querySelectorAll('.language-option');
  const currentLang = config.getCurrentLanguage();

  languageOptions.forEach(option => {
    const langId = option.getAttribute('data-lang');
    if (langId === currentLang) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
}

// Función para generar opciones de idioma para el selector del menú de configuración
export function generateLanguageSelectorOptions() {
  const languages = availableLanguages;
  let optionsHTML = '';

  languages.forEach(lang => {
    // Determinar la bandera para cada idioma
    let flag = '';
    switch (lang.codigoISO) {
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

    // Crear la opción para el select de idiomas
    optionsHTML += `
      <option value="${lang.codigoISO}" data-flag="${flag}">
        ${flag} ${lang.nombreNativo}
      </option>
    `;
  });

  return optionsHTML;
}

// Función para cambiar el contexto
export function changeContext(context) {
  currentContext = context;
  useClipboard = context === 'clipboard';

  // Guardar la preferencia de contexto
  chrome.storage.local.set({ context: context }, function () {
    console.log('Contexto guardado:', context);
  });

  // Actualizar la visualización
  updateContextDisplay();

  // Actualizar el botón seleccionado
  const contextButtons = document.querySelectorAll('.context-button');
  contextButtons.forEach(button => {
    if (button.dataset.context === context) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });

  // Cargar y actualizar el menú con el nuevo contexto
  loadMenuData(currentLanguage).then(newMenuData => {
    // Actualizar los datos del menú
    config.setMenuData(newMenuData);

    // Volver a renderizar las secciones
    renderSections();
  }).catch(error => {
    console.error('Error al cambiar el contexto:', error);
  });
}

// Función para inicializar el estado de la extensión
export async function initializeExtensionState() {
  try {
    // Cargar preferencias guardadas
    const result = await chrome.storage.local.get(['language', 'aiModel', 'context']);
    
    // Establecer idioma
    if (result.language) {
      currentLanguage = result.language;
      changeLanguage(currentLanguage);
    }

    // Establecer modelo de IA
    if (result.aiModel) {
      currentAIModel = result.aiModel;
      changeAIModel(currentAIModel);
    }

    // Establecer contexto
    if (result.context) {
      currentContext = result.context;
      useClipboard = currentContext === 'clipboard';
      changeContext(currentContext);
    }

    // Cargar datos del menú
    const menuData = await loadMenuData(currentLanguage);
    config.setMenuData(menuData);
    renderSections();

  } catch (error) {
    console.error('Error al inicializar el estado:', error);
  }
}

// Función para guardar la configuración principal
export function saveMainConfig() {
  const configToSave = {
    language: currentLanguage,
    aiModel: currentAIModel,
    context: currentContext,
    useClipboard: useClipboard
  };
  
  console.log('Guardando configuración:', configToSave);
  
  chrome.storage.local.set({ mainConfig: configToSave }, function() {
    console.log('Configuración principal guardada correctamente');
  });
  
  return configToSave;
}

// Función para cargar la configuración principal
export async function loadMainConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mainConfig'], function(result) {
      if (result.mainConfig) {
        // Restaurar valores
        currentLanguage = result.mainConfig.language || 'es';
        currentAIModel = result.mainConfig.aiModel || 'chatgpt';
        currentContext = result.mainConfig.context || 'url';
        useClipboard = result.mainConfig.useClipboard || false;
        
        // Actualizar valores en el objeto config
        config.setCurrentLanguage(currentLanguage);
        config.setCurrentAIModel(currentAIModel);
        config.setCurrentContext(currentContext);
        config.setUseClipboard(useClipboard);
        
        console.log('Configuración principal cargada y aplicada:', result.mainConfig);
      } else {
        console.log('No se encontró configuración guardada, usando valores por defecto');
      }
      resolve(result.mainConfig);
    });
  });
}

// Función para solicitar permisos de portapapeles de manera explícita
export async function requestClipboardPermission() {
  try {
    // Verificar el estado actual de los permisos
    const permissionStatus = await navigator.permissions.query({
      name: 'clipboard-read'
    });

    /*/ Si ya tiene permisos, no es necesario hacer nada más
    //if (permissionStatus.state === 'granted') {
      console.log('Permisos de portapapeles ya concedidos');
      return true;
    }*/

    // Si el permiso está en estado "prompt", intentar explícitamente solicitar el permiso
    // realizando una operación de lectura
    if (permissionStatus.state === 'prompt') {
      console.log('Solicitando permisos de portapapeles...');
      try {
        // Intentar leer para activar el diálogo de permiso
        await navigator.clipboard.readText();
        console.log('Permiso de portapapeles concedido');
        return true;
      } catch (error) {
        // Si el usuario rechaza o hay un error
      //  console.warn('Error al solicitar permisos de portapapeles:', error);
      //  return false;
      }
    }

    // Si el permiso está denegado, informar de ello
    if (permissionStatus.state === 'denied') {
      console.warn('Permisos de portapapeles denegados por el usuario');
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error al verificar permisos de portapapeles:', error);
    return false;
  }
}

// Función textPrompt() - Reemplazo moderno para window.prompt() con estilo de sidebar
export function textPrompt(title = null, defaultText = "") {
  return new Promise((resolve) => {
    // Obtener traducciones del idioma actual
    const texts = getTranslation(currentLanguage);
    
    // Usar título traducido si no se proporciona uno específico
    const finalTitle = title || texts.textPrompt.defaultTitle;
    
    // Crear overlay con estilo de sidebar
    const overlay = document.createElement('div');
    overlay.className = 'text-prompt-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      visibility: visible;
    `;

    // Crear modal con estilo de sidebar
    const modal = document.createElement('div');
    modal.className = 'text-prompt-modal';
    modal.style.cssText = `
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      width: 80%;
      max-width: 500px;
      min-width: 300px;
      overflow: hidden;
      transform: scale(1);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      margin: auto;
    `;

    // Verificar si es RTL (árabe)
    const isRTL = currentLanguage === 'ar';
    if (isRTL) {
      modal.style.direction = 'rtl';
    }

    // Crear header con estilo de sidebar
    const header = document.createElement('div');
    header.className = 'text-prompt-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #87CEEB;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    `;

    const headerTitle = document.createElement('h3');
    headerTitle.textContent = finalTitle;
    headerTitle.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: white;
      font-weight: bold;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    header.appendChild(headerTitle);

    // Crear contenido con estilo de sidebar
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
    `;

    // Crear textarea con estilo de sidebar
    const textarea = document.createElement('textarea');
    textarea.value = defaultText;
    textarea.style.cssText = `
      width: 100%;
      min-height: 120px;
      max-height: 200px;
      padding: 10px 12px;
      border: 1px solid #dadce0;
      border-radius: 6px;
      background-color: white;
      font-size: 14px;
      color: #2c3e50;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    `;

    // Focus y selección del texto con estilo de sidebar
    textarea.addEventListener('focus', () => {
      textarea.style.borderColor = '#87CEEB';
      textarea.style.boxShadow = '0 0 0 3px rgba(135, 206, 235, 0.3)';
      textarea.select();
    });

    textarea.addEventListener('blur', () => {
      textarea.style.borderColor = '#dadce0';
      textarea.style.boxShadow = 'none';
    });

    // Crear contenedor de botones con estilo de sidebar
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 16px;
    `;

    // Crear botón "Cancelar" con estilo de sidebar
    const cancelButton = document.createElement('button');
    cancelButton.textContent = texts.textPrompt.cancelButton;
    cancelButton.style.cssText = `
      background-color: #f0f0f0;
      border: 1px solid #dcdcdc;
      border-radius: 6px;
      color: #2c3e50;
      cursor: pointer;
      font-size: 14px;
      padding: 10px 15px;
      transition: background-color 0.2s, box-shadow 0.2s;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: normal;
      min-width: 80px;
    `;

    // Crear botón "Aceptar" con estilo de sidebar (color principal)
    const acceptButton = document.createElement('button');
    acceptButton.textContent = texts.textPrompt.acceptButton;
    acceptButton.style.cssText = `
      background-color: #87CEEB;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      padding: 10px 15px;
      transition: background-color 0.3s, transform 0.2s;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-width: 80px;
    `;

    // Efectos hover con estilo de sidebar
    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.backgroundColor = '#e0e0e0';
      cancelButton.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
    });

    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.backgroundColor = '#f0f0f0';
      cancelButton.style.boxShadow = 'none';
    });

    acceptButton.addEventListener('mouseenter', () => {
      acceptButton.style.backgroundColor = '#5bb4dc';
      acceptButton.style.transform = 'translateY(-2px)';
      acceptButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });

    acceptButton.addEventListener('mouseleave', () => {
      acceptButton.style.backgroundColor = '#87CEEB';
      acceptButton.style.transform = 'translateY(0)';
      acceptButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    // Eventos de botones
    const closeModal = (result) => {
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      modal.style.transform = 'scale(0.95)';
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(result);
      }, 300);
    };

    cancelButton.addEventListener('click', () => closeModal(null));
    acceptButton.addEventListener('click', async () => {
      const text = textarea.value.trim();
      
      if (text) {
        // Verificar si estamos en una página de AI soportada
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          
          if (tab && isAISupportedURL(tab.url)) {
            console.log('🎯 Detectada página de AI, enviando texto directamente...');
            


            // Enviar el texto directamente a la página de AI
            const success = await sendTextToAI(text);
            
            if (success) {
              console.log('✅ Texto enviado correctamente a la AI');
              closeModal(text); // Cerrar modal y devolver el texto
            } else {
              console.log('❌ Error al enviar texto a la AI, devolviendo texto normalmente');
              closeModal(text); // Devolver el texto normalmente si falla
            }
          } else {
            // No es una página de AI, comportamiento normal
            closeModal(text);
          }
        } catch (error) {
          console.error('Error al verificar página de AI:', error);
          // En caso de error, comportamiento normal
          closeModal(text);
        }
      } else {
        closeModal(null);
      }
    });

    // Cerrar con Escape
    const handleKeydown = async (e) => {
      if (e.key === 'Escape') {
        closeModal(null);
        document.removeEventListener('keydown', handleKeydown);
      } else if (e.key === 'Enter' && e.ctrlKey) {
        const text = textarea.value.trim();
        document.removeEventListener('keydown', handleKeydown);
        
        if (text) {
          // Verificar si estamos en una página de AI soportada
          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && isAISupportedURL(tab.url)) {
              console.log('🎯 Detectada página de AI (Ctrl+Enter), enviando texto directamente...');
              
              // Enviar el texto directamente a la página de AI
              const success = await sendTextToAI(text);
              
              if (success) {
                console.log('✅ Texto enviado correctamente a la AI');
                closeModal(text); // Cerrar modal y devolver el texto
              } else {
                console.log('❌ Error al enviar texto a la AI, devolviendo texto normalmente');
                closeModal(text); // Devolver el texto normalmente si falla
              }
            } else {
              // No es una página de AI, comportamiento normal
              closeModal(text);
            }
          } catch (error) {
            console.error('Error al verificar página de AI:', error);
            // En caso de error, comportamiento normal
            closeModal(text);
          }
        } else {
          closeModal(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Cerrar clickeando fuera del modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(null);
      }
    });

    // Ensamblar modal
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(acceptButton);
    content.appendChild(textarea);
    content.appendChild(buttonContainer);
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);

    // Agregar al DOM y enfocar
    document.body.appendChild(overlay);
    
    // Enfocar textarea después de un breve delay
    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 100);
  });
}

// Función confirmPrompt() - Modal de confirmación con estilo de sidebar
export function confirmPrompt(message = null, type = 'general') {
  return new Promise((resolve) => {
    // Obtener traducciones del idioma actual
    const texts = getTranslation(currentLanguage);
    
    // Determinar el mensaje basado en el tipo
    let finalMessage;
    switch (type) {
      case 'twitter':
        finalMessage = message || texts.confirmPrompt.twitterMessage;
        break;
      case 'gmail':
        finalMessage = message || texts.confirmPrompt.gmailMessage;
        break;
      default:
        finalMessage = message || texts.confirmPrompt.message;
    }
    
    // Crear overlay con estilo de sidebar
    const overlay = document.createElement('div');
    overlay.className = 'confirm-prompt-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      visibility: visible;
    `;

    // Crear modal con estilo de sidebar
    const modal = document.createElement('div');
    modal.className = 'confirm-prompt-modal';
    modal.style.cssText = `
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      width: 80%;
      max-width: 450px;
      min-width: 280px;
      overflow: hidden;
      transform: scale(1);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      margin: auto;
    `;

    // Verificar si es RTL (árabe)
    const isRTL = currentLanguage === 'ar';
    if (isRTL) {
      modal.style.direction = 'rtl';
    }

    // Crear header con estilo de sidebar (usando color principal #87CEEB)
    const header = document.createElement('div');
    header.className = 'confirm-prompt-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #87CEEB;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    `;

    const headerTitle = document.createElement('h3');
    headerTitle.textContent = texts.confirmPrompt.title;
    headerTitle.style.cssText = `
      margin: 0;
      font-size: 16px;
      color: white;
      font-weight: bold;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      width: 100%;
    `;

    header.appendChild(headerTitle);

    // Crear contenido con estilo de sidebar
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px;
      text-align: center;
    `;

    // Crear mensaje
    const messageElement = document.createElement('p');
    messageElement.textContent = finalMessage;
    messageElement.style.cssText = `
      font-size: 14px;
      line-height: 1.5;
      color: #2c3e50;
      margin: 0 0 16px 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Crear contenedor de botones con estilo de sidebar
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: center;
    `;

    // Crear botón "No" con estilo de sidebar (secundario)
    const noButton = document.createElement('button');
    noButton.textContent = texts.confirmPrompt.noButton;
    noButton.style.cssText = `
      background-color: #f0f0f0;
      border: 1px solid #dcdcdc;
      border-radius: 6px;
      color: #2c3e50;
      cursor: pointer;
      font-size: 14px;
      padding: 10px 15px;
      transition: background-color 0.2s, box-shadow 0.2s;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: normal;
      min-width: 100px;
    `;

    // Crear botón "Sí" con estilo de sidebar (color principal)
    const yesButton = document.createElement('button');
    yesButton.textContent = texts.confirmPrompt.yesButton;
    yesButton.style.cssText = `
      background-color: #87CEEB;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      padding: 10px 15px;
      transition: background-color 0.3s, transform 0.2s;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-width: 100px;
    `;

    // Efectos hover con estilo de sidebar
    noButton.addEventListener('mouseenter', () => {
      noButton.style.backgroundColor = '#e0e0e0';
      noButton.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
    });

    noButton.addEventListener('mouseleave', () => {
      noButton.style.backgroundColor = '#f0f0f0';
      noButton.style.boxShadow = 'none';
    });

    yesButton.addEventListener('mouseenter', () => {
      yesButton.style.backgroundColor = '#5bb4dc';
      yesButton.style.transform = 'translateY(-2px)';
      yesButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });

    yesButton.addEventListener('mouseleave', () => {
      yesButton.style.backgroundColor = '#87CEEB';
      yesButton.style.transform = 'translateY(0)';
      yesButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    // Eventos de botones
    const closeModal = (result) => {
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      modal.style.transform = 'scale(0.95)';
      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve(result);
      }, 300);
    };

    noButton.addEventListener('click', () => closeModal(false));
    yesButton.addEventListener('click', () => closeModal(true));

    // Cerrar con Escape (por defecto "No")
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
        document.removeEventListener('keydown', handleKeydown);
      } else if (e.key === 'Enter') {
        closeModal(true); // Enter acepta por defecto
        document.removeEventListener('keydown', handleKeydown);
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Cerrar clickeando fuera del modal (por defecto "No")
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });

    // Ensamblar modal
    buttonContainer.appendChild(noButton);
    buttonContainer.appendChild(yesButton);
    content.appendChild(messageElement);
    content.appendChild(buttonContainer);
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);

    // Agregar al DOM y enfocar botón "Sí"
    document.body.appendChild(overlay);
    
    // Enfocar botón "Sí" después de un breve delay
    setTimeout(() => {
      yesButton.focus();
    }, 100);
  });
}

// Función para detectar si la URL actual es de una AI soportada
export function isAISupportedURL(url = window.location.href) {
  const hostname = url.toLowerCase();
  
  return hostname.includes('chat.openai.com') ||
         hostname.includes('claude.ai') ||
         hostname.includes('chat.deepseek.com') ||
         hostname.includes('chat.mistral.ai') ||
         hostname.includes('copilot.microsoft.com') ||
         hostname.includes('gemini.google.com') ||
         hostname.includes('x.ai/grok') ||
         hostname.includes('meta.ai');
}

// Función para enviar texto usando enviarTextoUniversal() en sitios de AI
export async function sendTextToAI(texto) {
  try {
    // Obtener la pestaña activa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      console.log('❌ No se pudo obtener la pestaña activa');
      return false;
    }
    
    // Verificar si es un sitio de AI soportado
    if (!isAISupportedURL(tab.url)) {
      console.log('❌ La URL actual no es de una AI soportada:', tab.url);
      return false;
    }
    
    console.log('🚀 Enviando texto a AI en:', tab.url);
    
    // Enviar mensaje al content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'insertarTexto',
      texto: texto
    });
    
    console.log('📨 Respuesta del content script:', response);
    return response && response.success;
    
  } catch (error) {
    console.error('💥 Error al enviar texto a AI:', error);
    return false;
  }
}

// Función para truncar el prompt a un número máximo de caracteres de manera inteligente
export function truncatePrompt(prompt, maxLength = 1000) {
  // Si el prompt es menor o igual al límite, devolverlo tal como está
  if (prompt.length <= maxLength) {
    return prompt;
  }
  
  // Truncar al límite máximo
  let truncated = prompt.substring(0, maxLength);
  
  // Intentar cortar en el último espacio para no cortar palabras a la mitad
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // Si encontramos un espacio y no está muy cerca del inicio (al menos 80% del límite)
  if (lastSpaceIndex > maxLength * 0.8) {
    truncated = truncated.substring(0, lastSpaceIndex);
  }
  
  // Agregar indicador de que el texto fue truncado
  truncated += '...';
  
  console.log(`Prompt truncado de ${prompt.length} a ${truncated.length} caracteres`);
  
  return truncated;
}