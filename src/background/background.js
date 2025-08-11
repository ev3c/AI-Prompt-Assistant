// Script de fondo para la extensión
// 
// Funcionalidades principales:
// - Inicialización y configuración al instalar la extensión
// - Gestión de menús contextuales
// - Manejo de mensajes entre diferentes partes de la extensión
// 
import { loadAvailableLanguages } from '/src/background/languageManager.js';
import { createInitialContextMenus, handleContextMenuClick, updateContextMenuTitlesFromStorage } from '/src/background/contextMenuManager.js';
import { openAIWithPrompt } from '/src/background/aiInteractionManager.js';
import { updateSelectedTextCache } from '/src/background/utils.js';

// Función para asegurar permisos del portapapeles en background
async function ensureClipboardPermissions() {
  try {
    // Intentar acceder al portapapeles para verificar permisos
    await navigator.clipboard.readText();
    console.log('✅ Permisos del portapapeles confirmados en background script');
    return true;
  } catch (error) {
    console.log('⚠️ Acceso al portapapeles limitado en background script:', error.message);
    return false;
  }
}

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

  // Función para detectar idioma del navegador
  function detectBrowserLanguage() {
    // Obtener idioma del navegador
    const browserLang = navigator.language || navigator.userLanguage || 'gb';
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Mapear códigos de navegador a códigos de la extensión
    const languageMap = {
      'es': 'es',    // Español
      'en': 'gb',    // Inglés -> gb (como en la extensión)
      'ca': 'ca',    // Catalán
      'de': 'de',    // Alemán
      'fr': 'fr',    // Francés
      'it': 'it',    // Italiano
      'pt': 'pt',    // Portugués
      'zh': 'zh',    // Chino
      'ru': 'ru',    // Ruso
      'ar': 'ar',    // Árabe
      'ja': 'ja',    // Japonés
      'hi': 'hi',    // Hindi
      'ko': 'kr'     // Coreano -> kr (como en la extensión)
    };
    
    const detectedLang = languageMap[langCode] || 'gb'; // Inglés por defecto
    console.log(`🌐 Idioma del navegador detectado: ${browserLang} -> ${detectedLang}`);
    return detectedLang;
  }

  // Establecer configuración por defecto
  chrome.storage.local.get(['language', 'aiModel', 'firstRunCompleted'], async function (result) {
    if (!result.language) {
      // En la primera ejecución, detectar idioma del navegador
      const defaultLanguage = !result.firstRunCompleted ? detectBrowserLanguage() : 'gb';
      chrome.storage.local.set({ language: defaultLanguage });
      console.log(`🎯 Idioma establecido: ${defaultLanguage} ${!result.firstRunCompleted ? '(detectado automáticamente)' : '(por defecto)'}`);
    }

    const defaultModel = result.aiModel || 'chatgpt';
    if (!result.aiModel) {
      chrome.storage.local.set({ aiModel: defaultModel });
    }
    const loadedLangs = await loadAvailableLanguages(); // Carga idiomas a través del manager
    const currentLanguage = result.language || detectBrowserLanguage(); // Usar idioma detectado como fallback
    await createInitialContextMenus(loadedLangs, defaultModel, currentLanguage);
    
    // Verificar y asegurar permisos del portapapeles
    await ensureClipboardPermissions();
  });
});

// Verificar permisos al inicio de la extensión (restart del navegador)
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 Extensión iniciada - verificando permisos del portapapeles...');
  await ensureClipboardPermissions();
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

    // Detectar cambios en los JSONs personalizados guardados en storage
    for (let key in changes) {
      if (key.startsWith('custom_json_')) {
        console.log(`🔄 Cambio detectado en ${key}. Recargando sidebar...`);
        chrome.runtime.sendMessage({ action: 'reloadSidebar' });
      }
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

// Actualizar menús cuando se esté a punto de mostrar el contextmenu
// Esto asegura que SOLO el texto seleccionado de la página se muestre SIEMPRE
if (chrome.contextMenus.onShown) {
  chrome.contextMenus.onShown.addListener(async (info, tab) => {
    console.log('📋 Menú contextual a punto de mostrarse - Obteniendo SOLO texto seleccionado...');
    
    // Obtener ÚNICAMENTE texto seleccionado de la página actual (NO clipboard)
    try {
      if (tab && tab.id) {
        // Verificar que la página permita scripting
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') || 
            tab.url.startsWith('edge://') || 
            tab.url.startsWith('about:') ||
            tab.url.startsWith('moz-extension://')) {
          
          console.log('📝 Página restringida en onShown - limpiar cache');
          updateSelectedTextCache(''); // Limpiar cache para páginas restringidas
        } else {
          // Obtener texto seleccionado FRESCO directamente de la página
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: () => {
                try {
                  const selection = window.getSelection();
                  if (selection.rangeCount > 0) {
                    return selection.toString().trim();
                  }
                  return '';
                } catch (error) {
                  return '';
                }
              }
            });

            const freshSelectedText = results[0]?.result || '';
            console.log('🔥 SOLO texto seleccionado obtenido en onShown:', freshSelectedText || '[ninguno]');
            
            // Actualizar cache SOLO con texto seleccionado (NO clipboard)
            updateSelectedTextCache(freshSelectedText);
          } catch (scriptError) {
            console.log('⚠️ No se pudo obtener texto seleccionado en onShown:', scriptError);
            updateSelectedTextCache(''); // Limpiar cache en caso de error
          }
        }
      }
      
      // Actualizar menús SOLO con texto seleccionado
      await updateContextMenuTitlesFromStorage();
      console.log('✅ Menú contextual actualizado CON SOLO texto seleccionado');
    } catch (error) {
      console.error('❌ Error actualizando menú contextual:', error);
    }
  });
}

// Actualizar menús contextuales cuando cambie la pestaña activa
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Actualizar los títulos de los menús contextuales para la nueva pestaña activa
  await updateContextMenuTitlesFromStorage();
});

// Actualizar menús contextuales cuando se actualice una pestaña (nueva URL)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Solo actualizar si la pestaña cambió de URL y está activa
  if (changeInfo.url && tab.active) {
    await updateContextMenuTitlesFromStorage();
  }
});

// Agregar listener para actualizar menús cuando cambie el foco de ventana
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    // Pequeño delay para asegurar que la pestaña esté lista
    setTimeout(async () => {
      await updateContextMenuTitlesFromStorage();
    }, 100);
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
  else if (request.action === 'updateContextMenus') {
    // Si es por clic derecho, procesar inmediatamente SOLO con texto seleccionado
    if (request.rightClick) {
      console.log('🖱️ Clic derecho - Actualizando summaryClipboard con SOLO texto seleccionado:', request.selectedText || '[ninguno]');
      
      // Actualizar cache SOLO con texto seleccionado (NO clipboard)
      if (request.selectedText !== undefined) {
        updateSelectedTextCache(request.selectedText);
        console.log('📝 Cache actualizado EXCLUSIVAMENTE con texto seleccionado');
      }
      
      // Recrear menús con SOLO texto seleccionado
      updateContextMenuTitlesFromStorage().then(() => {
        console.log('✅ summaryClipboard actualizado SOLO con texto seleccionado');
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error actualizando menús contextuales:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else if (request.selectionChange) {
      // Actualización por cambio de selección
      console.log('📝 Cambio de selección - Actualizando summaryClipboard:', request.selectedText || '[ninguno]');
      
      if (request.selectedText !== undefined) {
        updateSelectedTextCache(request.selectedText);
        console.log('📝 Cache actualizado por cambio de selección');
      }
      
      // Actualizar menús contextuales
      updateContextMenuTitlesFromStorage().then(() => {
        console.log('✅ summaryClipboard actualizado por cambio de selección');
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error actualizando menús contextuales:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      // Actualización normal
      if (request.selectedText !== undefined) {
        updateSelectedTextCache(request.selectedText);
      }
      
      console.log('📝 Actualizando menús contextuales - Texto seleccionado:', request.selectedText || '[ninguno]');
      
      // Actualizar menús contextuales
      updateContextMenuTitlesFromStorage().then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error('Error actualizando menús contextuales:', error);
        sendResponse({ success: false, error: error.message });
      });
    }
    
    return true; // Mantener el canal abierto para respuesta asíncrona
  }
  else if (request.action === 'forceUpdateSummaryClipboard') {
    // Acción específica para forzar actualización inmediata del summaryClipboard
    console.log('⚡ FORZAR actualización summaryClipboard - Texto:', request.selectedText || '[ninguno]');
    
    // Actualizar cache con timestamp para máxima frescura
    if (request.selectedText !== undefined) {
      updateSelectedTextCache(request.selectedText);
      console.log('📝 Cache forzado actualizado a:', request.selectedText || '[vacío]');
    }
    
    // Forzar recreación inmediata de menús contextuales
    updateContextMenuTitlesFromStorage().then(() => {
      console.log('✅ summaryClipboard FORZADO actualizado');
      sendResponse({ success: true, forced: true });
    }).catch(error => {
      console.error('❌ Error forzando actualización summaryClipboard:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Mantener el canal abierto para respuesta asíncrona
  }
  else if (request.action === 'updateSummaryClipboardOnly') {
    // Acción específica para actualizar SOLO summaryClipboard cuando cambia la selección
    console.log('📝 Actualizando SOLO summaryClipboard por cambio de selección:', request.selectedText || '[ninguno]');
    
    // Actualizar cache SOLO con texto seleccionado de la página (NO clipboard)
    if (request.selectedText !== undefined) {
      updateSelectedTextCache(request.selectedText);
      console.log('📝 Cache actualizado SOLO con texto seleccionado:', request.selectedText || '[vacío]');
    }
    
    // Actualizar menús contextuales para reflejar el cambio
    updateContextMenuTitlesFromStorage().then(() => {
      console.log('✅ summaryClipboard actualizado por cambio de selección');
      sendResponse({ success: true, selectionUpdate: true });
    }).catch(error => {
      console.error('❌ Error actualizando summaryClipboard por selección:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Mantener el canal abierto para respuesta asíncrona
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