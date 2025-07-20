class JSONEditor {
  constructor() {
    this.currentData = this.getDefaultData();
    this.currentFilename = '';
    this.currentLanguage = 'es'; // Idioma por defecto: español
    this.translations = this.getTranslations();
    this.init();
  }

  getTranslations() {
    return {
      es: {
        title: "📝 JSON AI Prompt Editor",
        subtitle: "Editor visual para archivos JSON del asistente de prompts de IA",
        titleLabel: "🏷️ Title:",
        titlePlaceholder: "Máx. 12 chars",
        loadTemplate: "📋 Cargar Plantilla",
        openJson: "📁 Abrir JSON",
        save: "💾 Guardar en :",
        loadingDefault: "Cargando archivo por defecto...",
        textEditor: "📝 Editor de Texto JSON",
        validateJson: "✅ Validar JSON",
        copyPath: "📋 Copiar Ruta",
        copyFile: "📋 Copiar Archivo",
        editorPlaceholder: "Edita tu JSON aquí...",
        originLabel: "Origen:",
        pathCopied: "Ruta copiada al portapapeles:",
        pathCopyError: "No se pudo copiar la ruta al portapapeles.",
        saveMessage: "Guarda el archivo",
        saveSuccess: "✅ ¡Tu menú personalizado ha sido guardado y actualizado!",
        saveError: "❌ Error al guardar el menú personalizado.",
        jsonError: "Error al cargar el archivo JSON:",
        validationEmpty: "⚠️ Validación JSON\n\nEl editor está vacío. Por favor, ingresa contenido JSON para validar.",
        validationValid: "✅ JSON válido\n\nLa sintaxis del archivo es correcta.\n\n",
        validationInfo: "📊 Información del archivo:\n",
        validationProperties: "• Propiedades principales:",
        validationSections: "• Secciones encontradas:",
        validationButtonText: "• Texto del botón:",
        validationTitle: "• Título:",
        validationInvalid: "❌ JSON inválido\n\nError de sintaxis encontrado:\n",
        validationLocation: "📍 Ubicación aproximada: Línea",
        validationTips: "💡 Consejos para corregir:\n",
        validationTip1: "• Revisa caracteres inesperados o mal colocados\n• Verifica que las comillas sean dobles (\")\n",
        validationTip2: "• Falta cerrar llaves } o corchetes ]\n• Verifica que la estructura esté completa\n",
        validationTip3: "• Usa comillas dobles (\") para strings\n• Separa elementos con comas\n• Balancea llaves {} y corchetes []\n• No uses comas finales\n",
        copiedToClipboard: "📋 Copiado al portapapeles",
        copyError: "No se pudo copiar al portapapeles.",
        defaultLoaded: "Archivo por defecto cargado exitosamente",
        defaultLoadError: "No se pudo cargar el archivo por defecto:"
      },
      en: {
        title: "📝 JSON AI Prompt Editor",
        subtitle: "Visual editor for AI prompt assistant JSON files",
        titleLabel: "🏷️ Title:",
        titlePlaceholder: "Max. 12 chars",
        loadTemplate: "📋 Load Template",
        openJson: "📁 Open JSON",
        save: "💾 Save in :",
        loadingDefault: "Loading default file...",
        textEditor: "📝 JSON Text Editor",
        validateJson: "✅ Validate JSON",
        copyPath: "📋 Copy Path",
        copyFile: "📋 Copy File",
        editorPlaceholder: "Edit your JSON here...",
        originLabel: "Origin:",
        pathCopied: "Path copied to clipboard:",
        pathCopyError: "Could not copy path to clipboard.",
        saveMessage: "Save the file",
        saveSuccess: "✅ Your custom menu has been saved and updated!",
        saveError: "❌ Error saving the custom menu.",
        jsonError: "Error loading JSON file:",
        validationEmpty: "⚠️ JSON Validation\n\nThe editor is empty. Please enter JSON content to validate.",
        validationValid: "✅ Valid JSON\n\nThe file syntax is correct.\n\n",
        validationInfo: "📊 File information:\n",
        validationProperties: "• Main properties:",
        validationSections: "• Sections found:",
        validationButtonText: "• Button text:",
        validationTitle: "• Title:",
        validationInvalid: "❌ Invalid JSON\n\nSyntax error found:\n",
        validationLocation: "📍 Approximate location: Line",
        validationTips: "💡 Tips to fix:\n",
        validationTip1: "• Check for unexpected or misplaced characters\n• Verify that quotes are double (\")\n",
        validationTip2: "• Missing closing braces } or brackets ]\n• Verify that the structure is complete\n",
        validationTip3: "• Use double quotes (\") for strings\n• Separate elements with commas\n• Balance braces {} and brackets []\n• Don't use trailing commas\n",
        copiedToClipboard: "📋 Copied to clipboard",
        copyError: "Could not copy to clipboard.",
        defaultLoaded: "Default file loaded successfully",
        defaultLoadError: "Could not load default file:"
      }
    };
  }

  getDefaultData() {
    return {
      header: {
        title: "AI prompt assistant",
        currentUrlPlaceholder: "Página actual",
        behaviour: "URL"
      },
      addButtonText: "Añadir",
      origin: "url",
      jsonPath: "C:/Users/[usuario]/AppData/Local/Google/Chrome/User Data/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.2_0/idioma/",
      sections: []
    };
  }

  init() {
    this.bindEvents();
    this.loadDefaultFile();
    // Inicializar el editor embebido
    this.initEmbeddedEditor();
    // Inicializar el campo Title con valor por defecto
    this.initializeButtonNameField();
    this.initializeOriginSelector();
    this.initializeAllModernTooltips();
    
    // Aplicar traducciones iniciales
    this.updateLanguage();
  }

  t(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  changeLanguage(lang) {
    console.log('Changing jsonEditor interface language to:', lang);
    this.currentLanguage = lang;
    
    // Actualizar botones activos
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    // Solo actualizar la interfaz del jsonEditor, NO recargar el archivo
    this.updateLanguage();
    
    console.log('Interface language changed. Current file remains unchanged.');
  }

  updateLanguage() {
    // Actualizar textos del HTML
    const headerH1 = document.querySelector('.header h1');
    const headerP = document.querySelector('.header p');
    const buttonNameLabel = document.querySelector('.button-name-label');
    const originLabel = document.getElementById('origin-label');
    const addButtonText = document.getElementById('add-button-text');
    const loadDefaultBtn = document.getElementById('load-default-btn');
    const fileLabel = document.querySelector('.file-label');
    const saveBtn = document.getElementById('save-btn');
    const editorHeaderH3 = document.querySelector('.editor-header h3');
    const validateJsonBtn = document.getElementById('validate-json-btn');
    const copyPathBtn = document.getElementById('copy-path-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const embeddedJsonEditor = document.getElementById('embedded-json-editor');

    if (headerH1) headerH1.textContent = this.t('title');
    if (headerP) headerP.textContent = this.t('subtitle');
    if (buttonNameLabel) buttonNameLabel.textContent = this.t('titleLabel');
    if (originLabel) originLabel.textContent = this.t('originLabel');
    if (addButtonText) addButtonText.placeholder = this.t('titlePlaceholder');
    if (loadDefaultBtn) loadDefaultBtn.textContent = this.t('loadTemplate');
    if (fileLabel) fileLabel.textContent = this.t('openJson');
    if (saveBtn) saveBtn.textContent = this.t('save');
    if (editorHeaderH3) editorHeaderH3.textContent = this.t('textEditor');
    if (validateJsonBtn) validateJsonBtn.textContent = this.t('validateJson');
    if (copyPathBtn) copyPathBtn.textContent = this.t('copyPath');
    if (copyJsonBtn) copyJsonBtn.textContent = this.t('copyFile');
    if (embeddedJsonEditor) embeddedJsonEditor.placeholder = this.t('editorPlaceholder');
  }

  // Función para obtener el idioma actual de la extensión principal
  async getExtensionLanguage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['mainConfig'], function(result) {
        const extensionLanguage = result.mainConfig?.language || 'es';
        resolve(extensionLanguage);
      });
    });
  }

  // Función para convertir código de idioma a sufijo de archivo
  getLanguageSuffix(languageCode) {
    const languageMap = {
      'es': 'ES',
      'gb': 'GB',
      'fr': 'FR',
      'ca': 'CA',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT',
      'ja': 'JA',
      'zh': 'ZH',
      'ru': 'RU',
      'ar': 'AR',
      'kr': 'KR',
      'hi': 'HI'
    };
    return languageMap[languageCode] || 'ES';
  }

  async loadDefaultFile() {
    try {
      // Obtener el idioma actual de la extensión principal
      const extensionLanguage = await this.getExtensionLanguage();
      const langSuffix = this.getLanguageSuffix(extensionLanguage);
      
      // Determinar el archivo por defecto según el idioma de la extensión principal
      const defaultFileName = `menu_data_CUSTOM_${langSuffix}.json`;
      const fileUrl = chrome.runtime.getURL(`src/common/languages/${defaultFileName}`);
      
      console.log(`Cargando archivo para idioma de extensión: ${extensionLanguage} -> ${defaultFileName}`);
      
      const response = await fetch(fileUrl);
      const jsonData = await response.json();
      
      this.currentData = jsonData;
      this.currentFilename = defaultFileName;
      
      // Actualizar el campo Title con el header.title del archivo JSON
      this.updateTitleFieldFromJSON();
      
      this.updateJsonPreview();
      this.enableSave();
      
      console.log(this.t('defaultLoaded'));
    } catch (error) {
      console.warn(this.t('defaultLoadError'), error);
      // Si falla, usar datos por defecto
      this.updateJsonPreview();
    }
  }

  bindEvents() {
    // File operations
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => this.loadFile(e));
    document.getElementById('load-default-btn').addEventListener('click', () => this.loadDefaultFile());
    document.getElementById('save-btn').addEventListener('click', () => this.saveFile());
    
    // Button name field
    document.getElementById('add-button-text').addEventListener('input', (e) => this.updateAddButtonText(e.target.value));
    
    // Origin selector
    document.getElementById('origin-selector').addEventListener('change', (e) => this.updateOriginSelection(e.target.value));
    
    // Add listener for the editor itself to sync changes back to the UI
    document.getElementById('embedded-json-editor').addEventListener('input', () => this.syncUIFromEditor());

    // Copy path button
    document.getElementById('copy-path-btn').addEventListener('click', () => {
      const customPath = 'src/common/languages/custom/';
      navigator.clipboard.writeText(customPath).then(() => {
        alert(this.t('pathCopied') + '\n\n' + customPath);
      }, () => {
        alert(this.t('pathCopyError'));
      });
    });



    // Embedded editor controls
    document.getElementById('validate-json-btn').addEventListener('click', () => {
      this.validateEmbeddedJSON();
    });



    document.getElementById('copy-json-btn').addEventListener('click', () => {
      this.copyEmbeddedJSON();
    });

    // Language selector buttons
    document.getElementById('lang-es').addEventListener('click', () => {
      this.changeLanguage('es');
    });

    document.getElementById('lang-en').addEventListener('click', () => {
      this.changeLanguage('en');
    });
  }

  loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Intentar capturar la ruta del archivo (limitado por seguridad del navegador)
    this.currentFilePath = null;
    
    // Intentar diferentes métodos para obtener la ruta
    if (file.webkitRelativePath && file.webkitRelativePath !== file.name) {
      this.currentFilePath = file.webkitRelativePath;
    } else if (file.path) {
      this.currentFilePath = file.path;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.currentData = JSON.parse(e.target.result);
        this.currentFilename = file.name;
        
        // Extraer jsonPath y jsonName del archivo abierto
        let jsonPath = '';
        let jsonName = file.name;
        
        if (this.currentFilePath && (this.currentFilePath.includes('/') || this.currentFilePath.includes('\\'))) {
          // Separar la ruta del nombre del archivo
          const pathSeparator = this.currentFilePath.includes('/') ? '/' : '\\';
          const pathParts = this.currentFilePath.split(pathSeparator);
          jsonName = pathParts.pop(); // Último elemento es el nombre del archivo
          jsonPath = pathParts.join(pathSeparator) + pathSeparator; // Resto es la ruta
        }
        
        // Actualizar jsonPath y jsonName en los datos solo si tenemos información válida
        if (jsonPath) {
          this.currentData.jsonPath = jsonPath;
        }
        this.currentData.jsonName = jsonName;
        
        // Actualizar el campo Title con el header.title del archivo JSON
        this.updateTitleFieldFromJSON();
        
        this.updateJsonPreview();
        this.enableSave();
        
      } catch (error) {
        alert(this.t('jsonError') + ' ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  updateTitleFieldFromJSON() {
    // Extraer el título del header del JSON cargado
    if (this.currentData && this.currentData.header && this.currentData.header.title) {
      const titleFromJSON = this.currentData.header.title;
      const buttonNameInput = document.getElementById('add-button-text');
      
      if (buttonNameInput) {
        buttonNameInput.value = titleFromJSON;
        // También actualizar el addButtonText en los datos
        this.currentData.addButtonText = titleFromJSON;
      }
    }

    // Sincronizar el origen y el comportamiento.
    // Si el JSON cargado no tiene 'origin', se asume 'url' por defecto para mantener la consistencia.
    const originFromJSON = this.currentData.origin || 'url';
    this.currentData.origin = originFromJSON; // Asegurarse de que la propiedad exista en el objeto de datos.

    const originSelector = document.getElementById('origin-selector');
    if (originSelector) {
      originSelector.value = originFromJSON;
    }

    // Asegurarse de que el header exista antes de añadirle propiedades.
    if (!this.currentData.header) {
      this.currentData.header = {};
    }
    
    // Actualizar (o añadir) el 'behaviour' basado en el 'origin' que hemos determinado.
    this.currentData.header.behaviour = originFromJSON === 'clipboard' ? 'Clipboard' : 'URL';
  }

  spritFileName() {
    // Obtener el contenido del campo Title
    const buttonNameInput = document.getElementById('add-button-text');
    const fileButtonName = buttonNameInput ? buttonNameInput.value.trim() : '';
    
    // Definir las partes del nombre del archivo según el idioma
    const fileName = "menu_data_";
    const fileLanguage = this.currentLanguage === 'en' ? "GB" : "ES";
    const fileExtension = ".json";
    
    // Construir el nombre completo del archivo
    const fullFileName = fileName + fileButtonName + '_' + fileLanguage + fileExtension;
    
    return {
      fileName: fileName,
      fileButtonName: fileButtonName,
      fileLanguage: fileLanguage,
      fileExtension: fileExtension,
      fullFileName: fullFileName
    };
  }

  async saveFile() {
    const embeddedEditor = document.getElementById('embedded-json-editor');
    const titleInput = document.getElementById('add-button-text');
    const originSelector = document.getElementById('origin-selector');
    
    // --- Comprobación de robustez: Asegurarse de que el selector de slot existe ---
    const slotSelector = document.getElementById('custom-file-selector');
    if (!slotSelector) {
        // Este es un error crítico del desarrollador. Falta el elemento HTML.
        const errorMessage = "Error de desarrollador: El elemento 'custom-file-selector' no se encuentra en jsonEditor.html. Por favor, añádelo para poder guardar.";
        console.error(errorMessage);
        alert(errorMessage);
        return; // Detener la ejecución
    }

    const jsonStringFromEditor = embeddedEditor.value;
    const titleFromInput = titleInput.value.trim();
    const originFromSelector = originSelector.value;

    let dataToSave;

    try {
      // 1. Parsear el contenido del editor. Esta es nuestra base.
      dataToSave = JSON.parse(jsonStringFromEditor);

    } catch (error) {
      // Si el JSON del editor es inválido, no podemos continuar.
      let errorMessage = this.t('validationInvalid');
      errorMessage += `"${error.message}"\n\n`;
      errorMessage += "Por favor, corrige los errores en el editor de texto JSON antes de guardar.";
      alert(errorMessage);
      return; // Detener la ejecución
    }

    // 2. Consolidar: Actualizar el objeto JSON con el valor del campo de título y origen.
    //    Esto asegura que los cambios en el título y origen se incluyan en el archivo guardado.
    if (dataToSave.header) {
      dataToSave.header.title = titleFromInput;
    }
    dataToSave.addButtonText = titleFromInput;
    dataToSave.origin = originFromSelector;

    // 3. Actualizar el estado principal de la clase con los datos consolidados.
    this.currentData = dataToSave;

    // 4. Sincronizar la UI para que refleje el estado que se va a guardar.
    this.updateJsonPreview(); // Actualiza el <textarea> con el JSON formateado.

    // 5. Determinar si guardar en chrome.storage.local o descargar al disco
    const selectedSlot = slotSelector.value; // e.g., "custom_1" o "custom_5"
    if (!selectedSlot) {
        alert("Por favor, selecciona un 'Slot' donde guardar tu menú personalizado.");
        return;
    }

    // Si es "custom_5" (Hard Disk), descargar al disco
    if (selectedSlot === 'custom_5') {
        this.downloadToDisk();
        return;
    }

    // Para los demás slots, guardar en chrome.storage.local
    const storageKey = `custom_json_${selectedSlot.split('_')[1]}`; // e.g., "custom_json_1"
    const dataToStore = { [storageKey]: this.currentData };

    chrome.storage.local.set(dataToStore, () => {
      if (chrome.runtime.lastError) {
        console.error('Error al guardar en chrome.storage:', chrome.runtime.lastError);
        alert(this.t('saveError'));
      } else {
        console.log(`Datos guardados en ${storageKey}:`, this.currentData);
        alert(this.t('saveSuccess'));

        // Enviar un mensaje para que el sidebar se recargue si está abierto.
        // El listener en background.js ya se encarga de esto, pero una notificación
        // directa puede ser más rápida si el editor y el sidebar están en la misma extensión.
        chrome.runtime.sendMessage({ action: 'reloadSidebar' });
      }
    });

  }

  downloadToDisk() {
    const titleInput = document.getElementById('add-button-text');
    const fileName = titleInput.value.trim() || 'custom_menu';
    
    // Crear el contenido JSON formateado
    const jsonContent = JSON.stringify(this.currentData, null, 2);
    
    // Crear un blob con el contenido JSON
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    // Crear un enlace de descarga temporal
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${fileName}.json`;
    
    // Agregar el enlace al DOM, hacer clic y removerlo
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Limpiar el objeto URL
    URL.revokeObjectURL(downloadLink.href);
    
    // Mostrar mensaje de éxito
    alert(`✅ Archivo "${fileName}.json" descargado exitosamente al disco.`);
    
    console.log(`Archivo JSON descargado: ${fileName}.json`, this.currentData);
  }

  enableSave() {
    document.getElementById('save-btn').disabled = false;
  }

  updateJsonPreview() {
    // Actualizar el editor embebido
    const embeddedEditor = document.getElementById('embedded-json-editor');
    if (embeddedEditor) {
      embeddedEditor.value = JSON.stringify(this.currentData, null, 2);
    }
  }

  updateAddButtonText(value) {
    // Para mantener la UI sincronizada, actualizamos el JSON en el editor.
    // Para no perder otras ediciones manuales, primero leemos el contenido del editor.
    const editor = document.getElementById('embedded-json-editor');
    try {
      const data = JSON.parse(editor.value);

      data.addButtonText = value;
      if (data.header) {
        data.header.title = value;
      }

      this.currentData = data;
      this.updateJsonPreview(); // Esto reescribe el contenido del editor, manteniéndolo sincronizado.
    } catch (e) {
      // Si el JSON del editor no es válido, no podemos actualizarlo. El usuario probablemente está editando.
      // La fusión final se realizará al guardar.
    }

    this.enableSave();
  }

  updateOriginSelection(origin) {
    // Actualizar los datos JSON con la nueva selección de origen
    try {
      const editor = document.getElementById('embedded-json-editor');
      const data = JSON.parse(editor.value);
      
      // Agregar o actualizar la propiedad origin en los datos
      data.origin = origin;
      
      // Actualizar la propiedad behaviour en el header
      if (!data.header) {
        data.header = {}; // Asegurarse de que el header exista
      }
      data.header.behaviour = origin === 'clipboard' ? 'Clipboard' : 'URL';

      this.currentData = data;
      this.updateJsonPreview();
      this.enableSave();
      
      console.log('Origin updated to:', origin);
    } catch (e) {
      // Si el JSON del editor no es válido, solo actualizar el estado interno
      this.currentData.origin = origin;
      if (!this.currentData.header) {
        this.currentData.header = {};
      }
      this.currentData.header.behaviour = origin === 'clipboard' ? 'Clipboard' : 'URL';
      console.log('Origin updated to:', origin, '(JSON editor invalid, updated internal state only)');
    }
  }

  initEmbeddedEditor() {
    // Cargar contenido inicial
    const jsonEditor = document.getElementById('embedded-json-editor');
    if (jsonEditor) {
      jsonEditor.value = JSON.stringify(this.currentData, null, 2);
    }
  }

  initializeButtonNameField() {
    const buttonNameInput = document.getElementById('add-button-text');
    if (buttonNameInput && buttonNameInput.value) {
      // Actualizar los datos con el valor por defecto del campo
      this.updateAddButtonText(buttonNameInput.value);
    }
  }

  initializeOriginSelector() {
    const originSelector = document.getElementById('origin-selector');
    if (!originSelector) return;

    // Por defecto seleccionar URL
    originSelector.value = 'url';
  }

  initializeAllModernTooltips() {
    // Inicializar todos los tooltips específicos
    this.initializeOriginTooltip();
    this.initializeStaticTooltips();
    
    // Listener para reajustar tooltips visibles al redimensionar ventana
    window.addEventListener('resize', () => {
      document.querySelectorAll('.modern-tooltip.show').forEach(tooltip => {
        // Resetear la flecha antes de reajustar posición
        const arrow = tooltip.querySelector('.tooltip-arrow');
        if (arrow) {
          arrow.style.left = '';
          arrow.style.right = '';
          arrow.style.transform = '';
        }
        this.adjustTooltipPosition(tooltip);
      });
    });
  }

  initializeOriginTooltip() {
    const originSelector = document.getElementById('origin-selector');
    const tooltip = document.getElementById('origin-tooltip');
    
    if (!originSelector || !tooltip) return;
    
    let tooltipTimeout;
    
    const showTooltip = () => {
      clearTimeout(tooltipTimeout);
      tooltip.classList.add('show');
    };
    
    const hideTooltip = () => {
      tooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
      }, 200);
    };
    
    // Eventos para mostrar/ocultar tooltip
    originSelector.addEventListener('mouseenter', showTooltip);
    originSelector.addEventListener('mouseleave', hideTooltip);
    originSelector.addEventListener('focus', showTooltip);
    originSelector.addEventListener('blur', hideTooltip);
    
    // Mantener tooltip visible si el mouse está sobre él
    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimeout);
    });
    
    tooltip.addEventListener('mouseleave', hideTooltip);
  }

  initializeStaticTooltips() {
    // Lista de tooltips con sus elementos y IDs correspondientes
    const tooltipConfig = [
      { elementId: 'add-button-text', tooltipId: 'add-button-text-tooltip' },
      { elementId: 'load-default-btn', tooltipId: 'load-default-tooltip' },
      { elementId: 'file-input', tooltipId: 'file-input-tooltip', useLabel: true },
      { elementId: 'save-btn', tooltipId: 'save-btn-tooltip' },
      { elementId: 'custom-file-selector', tooltipId: 'custom-file-selector-tooltip' },
      { elementId: 'validate-json-btn', tooltipId: 'validate-json-tooltip' },
      { elementId: 'copy-path-btn', tooltipId: 'copy-path-tooltip' },
      { elementId: 'copy-json-btn', tooltipId: 'copy-json-tooltip' }
    ];
    
    tooltipConfig.forEach(config => {
      let element = document.getElementById(config.elementId);
      const tooltip = document.getElementById(config.tooltipId);
      
      // Para file-input, usar el label en su lugar
      if (config.useLabel && element) {
        element = element.previousElementSibling; // El label está antes del input
      }
      
      if (element && tooltip) {
        this.setupTooltipEvents(element, tooltip);
      }
    });
  }

  setupTooltipEvents(element, tooltip) {
    let tooltipTimeout;
    let mousePosition = { x: 0, y: 0 };
    
    const showTooltip = (event) => {
      clearTimeout(tooltipTimeout);
      
      // Capturar posición del mouse si está disponible
      if (event && event.clientX !== undefined) {
        const elementRect = element.getBoundingClientRect();
        mousePosition.x = event.clientX - elementRect.left;
        mousePosition.y = event.clientY - elementRect.top;
      }
      
      // Resetear clases de posición y estilos inline
      tooltip.classList.remove('adjust-left', 'adjust-right');
      tooltip.style.left = '';
      tooltip.style.right = '';
      tooltip.style.maxWidth = '';
      
      // Resetear posición de la flecha
      const arrow = tooltip.querySelector('.tooltip-arrow');
      if (arrow) {
        arrow.style.left = '';
        arrow.style.right = '';
        arrow.style.transform = '';
      }
      
      tooltip.classList.add('show');
      
      // Verificar y ajustar posición después de que se muestre
      setTimeout(() => {
        this.adjustTooltipPosition(tooltip, element, mousePosition);
      }, 10);
    };
    
    const hideTooltip = () => {
      tooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
        // Resetear posición de la flecha al ocultar
        const arrow = tooltip.querySelector('.tooltip-arrow');
        if (arrow) {
          arrow.style.left = '';
          arrow.style.right = '';
          arrow.style.transform = '';
        }
      }, 200);
    };
    
    // Eventos para mostrar/ocultar tooltip con captura de posición del mouse
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mousemove', (event) => {
      if (tooltip.classList.contains('show')) {
        const elementRect = element.getBoundingClientRect();
        mousePosition.x = event.clientX - elementRect.left;
        mousePosition.y = event.clientY - elementRect.top;
        this.adjustTooltipArrow(tooltip, element, mousePosition);
      }
    });
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);
    
    // Mantener tooltip visible si el mouse está sobre él
    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimeout);
    });
    
    tooltip.addEventListener('mouseleave', hideTooltip);
  }

  adjustTooltipPosition(tooltip, element = null, mousePosition = null) {
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Margen de seguridad dinámico según el tamaño de pantalla
    let margin = 15;
    let leftOffset = 10;
    
    if (viewportWidth < 480) {
      margin = 8;
      leftOffset = 8;
    } else if (viewportWidth < 768) {
      margin = 10;
      leftOffset = 10;
    }
    
    // Verificar si se desborda por la izquierda
    if (rect.left < margin) {
      tooltip.classList.add('adjust-left');
      tooltip.classList.remove('adjust-right');
      
      // Asegurar que el tooltip no sobresalga del borde izquierdo
      tooltip.style.left = `${leftOffset}px`;
      
      // Verificar después del ajuste que no sobresalga por la derecha
      setTimeout(() => {
        const newRect = tooltip.getBoundingClientRect();
        if (newRect.right > viewportWidth - margin) {
          // Si aún sobresale, reducir el ancho máximo dinámicamente
          const maxAllowedWidth = viewportWidth - leftOffset - margin;
          tooltip.style.maxWidth = `${maxAllowedWidth}px`;
        }
        // Ajustar flecha después del reposicionamiento
        if (element && mousePosition) {
          this.adjustTooltipArrow(tooltip, element, mousePosition);
        }
      }, 5);
    }
    // Verificar si se desborda por la derecha
    else if (rect.right > viewportWidth - margin) {
      tooltip.classList.add('adjust-right');
      tooltip.classList.remove('adjust-left');
      tooltip.style.left = '';
      tooltip.style.maxWidth = '';
    }
    // Si está bien centrado, mantener posición original
    else {
      tooltip.classList.remove('adjust-left', 'adjust-right');
      tooltip.style.left = '';
      tooltip.style.maxWidth = '';
    }
    
    // Ajustar posición de la flecha según la posición del mouse
    if (element && mousePosition) {
      this.adjustTooltipArrow(tooltip, element, mousePosition);
    }
  }

  adjustTooltipArrow(tooltip, element, mousePosition) {
    const arrow = tooltip.querySelector('.tooltip-arrow');
    if (!arrow) return;
    
    const tooltipRect = tooltip.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Calcular posición relativa del mouse respecto al tooltip
    let arrowLeft;
    const arrowMargin = 12; // Margen mínimo desde los bordes
    
    if (tooltip.classList.contains('adjust-left')) {
      // Si el tooltip está ajustado a la izquierda
      arrowLeft = Math.max(arrowMargin, Math.min(mousePosition.x, tooltipRect.width - arrowMargin));
    } else if (tooltip.classList.contains('adjust-right')) {
      // Si el tooltip está ajustado a la derecha
      const tooltipLeft = parseInt(tooltip.style.left) || 0;
      const elementLeft = elementRect.left - tooltipRect.left + tooltipLeft;
      const relativeMouseX = elementLeft + mousePosition.x;
      arrowLeft = Math.max(arrowMargin, Math.min(relativeMouseX, tooltipRect.width - arrowMargin));
    } else {
      // Tooltip centrado - calcular posición relativa
      const tooltipCenter = tooltipRect.width / 2;
      const elementCenter = elementRect.width / 2;
      const mouseOffset = mousePosition.x - elementCenter;
      arrowLeft = Math.max(arrowMargin, Math.min(tooltipCenter + mouseOffset, tooltipRect.width - arrowMargin));
    }
    
    // Aplicar la posición calculada con suavizado
    arrow.style.left = `${Math.round(arrowLeft)}px`;
    arrow.style.right = 'auto';
    arrow.style.transform = 'translateX(0)';
  }





  validateEmbeddedJSON() {
    const jsonEditor = document.getElementById('embedded-json-editor');
    
    try {
      const content = jsonEditor.value.trim();
      
      if (!content) {
        alert(this.t('validationEmpty'));
        return false;
      }
      
      // Intentar parsear el JSON
      const parsed = JSON.parse(content);
      
      // Validaciones adicionales específicas para el formato esperado
      let validationInfo = this.t('validationValid');
      
      // Información adicional sobre la estructura
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        validationInfo += this.t('validationInfo');
        validationInfo += `${this.t('validationProperties')} ${keys.length}\n`;
        
        if (parsed.sections && Array.isArray(parsed.sections)) {
          validationInfo += `${this.t('validationSections')} ${parsed.sections.length}\n`;
        }
        
        if (parsed.addButtonText) {
          validationInfo += `${this.t('validationButtonText')} "${parsed.addButtonText}"\n`;
        }
        
        if (parsed.header && parsed.header.title) {
          validationInfo += `${this.t('validationTitle')} "${parsed.header.title}"`;
        }
      }
      
      alert(validationInfo);
      return true;
      
    } catch (e) {
      // El JSON tiene errores de sintaxis
      let errorMessage = this.t('validationInvalid');
      errorMessage += `"${e.message}"\n\n`;
      
      // Intentar extraer información de posición del error
      const match = e.message.match(/position (\d+)/i);
      if (match) {
        const position = parseInt(match[1]);
        const lines = jsonEditor.value.substring(0, position).split('\n');
        const lineNumber = lines.length;
        const columnNumber = lines[lines.length - 1].length + 1;
        errorMessage += `${this.t('validationLocation')} ${lineNumber}, Columna ${columnNumber}\n\n`;
      }
      
      // Consejos para corregir errores comunes
      errorMessage += this.t('validationTips');
      if (e.message.includes('Unexpected token')) {
        errorMessage += this.t('validationTip1');
      } else if (e.message.includes('Unexpected end')) {
        errorMessage += this.t('validationTip2');
      } else {
        errorMessage += this.t('validationTip3');
      }
      
      alert(errorMessage);
      return false;
    }
  }

  copyEmbeddedJSON() {
    const jsonEditor = document.getElementById('embedded-json-editor');
    const content = jsonEditor.value;
    
    navigator.clipboard.writeText(content).then(() => {
      alert(this.t('copiedToClipboard'));
    }).catch(() => {
      alert(this.t('copyError'));
    });
  }

  syncUIFromEditor() {
    const editor = document.getElementById('embedded-json-editor');
    try {
      const data = JSON.parse(editor.value);
      // El editor es la fuente de la verdad, así que actualizamos el estado central de datos.
      this.currentData = data;

      const titleFromEditor = data?.header?.title;
      const titleInput = document.getElementById('add-button-text');
      const originFromEditor = data?.origin;
      const originSelector = document.getElementById('origin-selector');

      // Sincronizar el campo de entrada del título SI ha cambiado en el editor.
      if (titleFromEditor !== undefined && titleInput.value !== titleFromEditor) {
        titleInput.value = titleFromEditor;
      }

      // Sincronizar el selector de origen SI ha cambiado en el editor.
      if (originFromEditor !== undefined && originSelector.value !== originFromEditor) {
        originSelector.value = originFromEditor;
      }
    } catch (e) {
      // Es de esperar que el JSON no sea válido mientras el usuario escribe. No hacer nada.
    }
  }
}

// Initialize the editor when the DOM is loaded
let jsonEditor;
document.addEventListener('DOMContentLoaded', function() {
 jsonEditor = new JSONEditor();
});