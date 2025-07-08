// Script de fondo para la extensión
// 
// Funcionalidades principales:
// - Inicialización automática al instalar la extensión
// - Apertura automática del video de ayuda en la primera instalación
// - Gestión de menús contextuales
// - Manejo de mensajes entre diferentes partes de la extensión
// 
import { loadAvailableLanguages } from '/src/background/languageManager.js';
import { createInitialContextMenus, handleContextMenuClick, updateContextMenuTitlesFromStorage } from '/src/background/contextMenuManager.js';
import { openAIWithPrompt } from '/src/background/aiInteractionManager.js';
import { startFileWatcher } from './fileWatcher.js';

// Nota: La importación de funciones de content.js como detectarSitio, obtenerSelectores, etc.,
// no es adecuada para el background script ya que operan en el contexto de la página (DOM, window.location).
// Se han eliminado las importaciones y usos no efectivos de estas funciones desde aquí.

// Ruta donde se almacenan los archivos JSON de la extensión
const jsonPath = "C:\\Users\\Propietario\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\1.2_0\\idioma\\";

// Función para abrir el video de ayuda (útil para testing)
function openHelpVideo() {
  // Usar la página personalizada de la extensión que muestra el video sin anuncios
  const helpVideoUrl = chrome.runtime.getURL('/src/sidepanel/pages/help-video/help-video.html');
  
  chrome.tabs.create({
    url: helpVideoUrl
  }).then(() => {
    console.log('Video de ayuda abierto en página personalizada sin anuncios');
  }).catch((error) => {
    console.error('Error al abrir el video de ayuda:', error);
    
    // Fallback: si falla la página personalizada, usar YouTube directamente
    chrome.tabs.create({
      url: 'https://youtu.be/40AoSd_o7Z8'
    }).then(() => {
      console.log('Video de ayuda abierto en YouTube (fallback)');
    }).catch((fallbackError) => {
      console.error('Error en fallback al abrir video de ayuda:', fallbackError);
    });
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  // Abrir / Cerrar panel al click en Extensión
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Verificar si es la primera instalación
  if (details.reason === 'install') {
    // Verificar si es realmente la primera vez ejecutando la extensión
    chrome.storage.local.get(['firstRunCompleted'], function (result) {
      if (!result.firstRunCompleted) {
        // Marcar que ya se ejecutó la primera vez
        chrome.storage.local.set({ firstRunCompleted: true });
        
        // Agregar un pequeño delay para que Chrome se estabilice después de la instalación
        setTimeout(() => {
          // Abrir el video de ayuda automáticamente
          openHelpVideo();
          console.log('Primera instalación detectada - Video de ayuda abierto automáticamente');
        }, 1000); // Delay de 1 segundo
      }
    });
  }

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

    // Iniciar el vigilante de archivos JSON personalizados
    startFileWatcher();
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
    // En lugar de abrir la carpeta del sistema, abrir el editor de JSON
    chrome.tabs.create({ url: chrome.runtime.getURL('/src/sidepanel/pages/jsonEditor/jsonEditor.html') });
    
    sendResponse({ success: true });
    return true;
  }
  else if (request.action === 'getJsonFolderPath') {
    // Devolver la ruta donde se almacenan los archivos JSON
    sendResponse({ path: jsonPath });
    return true;
  }
  else if (request.action === 'openHelpVideo') {
    // Abrir el video de ayuda manualmente
    openHelpVideo();
    sendResponse({ success: true });
    return true;
  }
  else if (request.action === 'resetFirstRun') {
    // Resetear el flag de primera ejecución (útil para testing)
    chrome.storage.local.set({ firstRunCompleted: false });
    sendResponse({ success: true });
    return true;
  }
  // Otros manejadores de mensajes pueden ir aquí
});