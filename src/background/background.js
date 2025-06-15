// Script de fondo para la extensión
import { loadAvailableLanguages } from '/src/background/languageManager.js';
import { createInitialContextMenus, handleContextMenuClick, updateContextMenuTitlesFromStorage } from '/src/background/contextMenuManager.js';
import { openAIWithPrompt } from '/src/background/aiInteractionManager.js';

// Nota: La importación de funciones de content.js como detectarSitio, obtenerSelectores, etc.,
// no es adecuada para el background script ya que operan en el contexto de la página (DOM, window.location).
// Se han eliminado las importaciones y usos no efectivos de estas funciones desde aquí.

// Ruta donde se almacenan los archivos JSON de la extensión
const jsonPath = "C:\\Users\\Propietario\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\1.2_0\\idioma\\";

chrome.runtime.onInstalled.addListener(async () => {
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
    const loadedLangs = await loadAvailableLanguages(); // Carga idiomas a través del manager
    await createInitialContextMenus(loadedLangs, defaultModel, result.language || 'es');
  });
});

// Listener para cambios en el almacenamiento local
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.aiModel) {
      // Si cambió el modelo de IA, actualizar el menú contextual
      updateContextMenuTitlesFromStorage(changes.aiModel.newValue, null);
    } else if (changes.language) {
      updateContextMenuTitlesFromStorage(null, changes.language.newValue);
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
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

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
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/pages/json-viewer/json-viewer.html') });
    
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