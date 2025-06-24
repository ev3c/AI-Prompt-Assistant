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
        save: "💾 Guardar",
        loadingDefault: "Cargando archivo por defecto...",
        textEditor: "📝 Editor de Texto JSON",
        validateJson: "✅ Validar JSON",
        copyPath: "📋 Copiar Ruta",
        copyFile: "📋 Copiar Archivo",
        editorPlaceholder: "Edita tu JSON aquí...",
        originLabel: "Origen:",
        platformLabel: "Plataforma:",
        pathCopied: "Ruta copiada al portapapeles:",
        pathCopyError: "No se pudo copiar la ruta al portapapeles.",
        saveMessage: "Guarda el archivo",
        saveLocationWin: "en (Windows):\n\n%localappdata%\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\1.3_0\\src\\common\\languages\\custom\\\n\nCon el siguiente formato de nombre: custom_N.json (donde N es de 1 a 4)",
        saveLocationMac: "en (Mac):\n\n~/Library/Application Support/Google/Chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.3_0/src/common/languages/custom/\n\nCon el siguiente formato de nombre: custom_N.json (donde N es de 1 a 4)",
        saveLocationLinux: "en (Linux):\n\n~/.config/google-chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.3_0/src/common/languages/custom/\n\nCon el siguiente formato de nombre: custom_N.json (donde N es de 1 a 4)",
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
        save: "💾 Save",
        loadingDefault: "Loading default file...",
        textEditor: "📝 JSON Text Editor",
        validateJson: "✅ Validate JSON",
        copyPath: "📋 Copy Path",
        copyFile: "📋 Copy File",
        editorPlaceholder: "Edit your JSON here...",
        originLabel: "Origin:",
        platformLabel: "Platform:",
        pathCopied: "Path copied to clipboard:",
        pathCopyError: "Could not copy path to clipboard.",
        saveMessage: "Save the file",
        saveLocationWin: "on (Windows):\n\n%localappdata%\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\1.2_0\\src\\common\\languages\\custom\\\n\nWith the following name format: custom_N.json (where N is from 1 to 4)",
        saveLocationMac: "on (Mac):\n\n~/Library/Application Support/Google/Chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.2_0/src/common/languages/custom/\n\nWith the following name format: custom_N.json (where N is from 1 to 4)",
        saveLocationLinux: "on (Linux):\n\n~/.config/google-chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/1.2_0/src/common/languages/custom/\n\nWith the following name format: custom_N.json (where N is from 1 to 4)",
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
        currentUrlPlaceholder: "Página actual"
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
    this.initializePlatformSelector();
    // Aplicar traducciones iniciales
    this.updateLanguage();
  }

  t(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  changeLanguage(lang) {
    console.log('Changing language to:', lang);
    this.currentLanguage = lang;
    
    // Actualizar botones activos
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');
    
    this.updateLanguage();
    
    // Recargar el archivo por defecto según el nuevo idioma
    this.loadDefaultFile();
  }

  updateLanguage() {
    // Actualizar textos del HTML
    const headerH1 = document.querySelector('.header h1');
    const headerP = document.querySelector('.header p');
    const buttonNameLabel = document.querySelector('.button-name-label');
    const originLabel = document.getElementById('origin-label');
    const platformLabel = document.getElementById('platform-label');
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
    if (platformLabel) platformLabel.textContent = this.t('platformLabel');
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

  async loadDefaultFile() {
    try {
      // Determinar el archivo por defecto según el idioma (archivos locales en jsonEditor)
      const defaultFileName = this.currentLanguage === 'en' ? 'menu_data_ADD_GB.json' : 'menu_data_ADD_ES.json';
      const fileUrl = chrome.runtime.getURL(`src/common/languages/${defaultFileName}`);
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
      const pathOnly = this.getPlatformPathOnly();
      navigator.clipboard.writeText(pathOnly).then(() => {
        alert(this.t('pathCopied') + '\n\n' + pathOnly);
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

    // Extraer el origen del JSON cargado
    if (this.currentData && this.currentData.origin) {
      const originFromJSON = this.currentData.origin;
      const originSelector = document.getElementById('origin-selector');
      
      if (originSelector) {
        originSelector.value = originFromJSON;
      }
    }
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

  saveFile() {
    const embeddedEditor = document.getElementById('embedded-json-editor');
    const titleInput = document.getElementById('add-button-text');
    const originSelector = document.getElementById('origin-selector');
    
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

    // 5. Proceder a guardar el archivo.
    const jsonString = JSON.stringify(this.currentData, null, 2);
    const fileNameParts = this.spritFileName();
    const filename = fileNameParts.fullFileName;
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mostrar mensaje con la ruta sugerida
    alert(this.t('saveMessage') + ' ' + filename + ' ' + this.getPlatformSaveMessage());
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
      
      this.currentData = data;
      this.updateJsonPreview();
      this.enableSave();
      
      console.log('Origin updated to:', origin);
    } catch (e) {
      // Si el JSON del editor no es válido, solo actualizar el estado interno
      this.currentData.origin = origin;
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

  initializePlatformSelector() {
    const platformSelector = document.getElementById('platform-selector');
    if (!platformSelector) return;

    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) {
      platformSelector.value = 'win';
    } else if (platform.includes('mac')) {
      platformSelector.value = 'mac';
    } else if (platform.includes('linux')) {
      platformSelector.value = 'linux';
    }
  }

  getPlatformSaveMessage() {
    const platformSelector = document.getElementById('platform-selector');
    const selectedPlatform = platformSelector ? platformSelector.value : 'win';

    switch (selectedPlatform) {
      case 'win':
        return this.t('saveLocationWin');
      case 'mac':
        return this.t('saveLocationMac');
      case 'linux':
        return this.t('saveLocationLinux');
      default:
        return this.t('saveLocationWin');
    }
  }

  getPlatformPathOnly() {
    const fullMessage = this.getPlatformSaveMessage();
    const parts = fullMessage.split('\n\n');
    if (parts.length > 1) {
      // La ruta es la segunda parte del mensaje
      return parts[1].trim();
    }
    return fullMessage; // Fallback si el formato no es el esperado
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