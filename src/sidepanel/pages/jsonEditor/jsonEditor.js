class JSONEditor {
  constructor() {
    this.currentData = this.getDefaultData();
    this.currentFilename = '';
    this.currentLanguage = this.detectBrowserLanguage(); // Detectar idioma del navegador
    this.translations = this.getTranslations();
  }

  // Función para detectar idioma del navegador
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'gb';
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Solo soporta español e inglés en el JSONEditor
    const languageMap = {
      'es': 'es',    // Español
      'en': 'gb'     // Inglés
    };
    
    const detectedLang = languageMap[langCode] || 'gb'; // Inglés por defecto
    console.log(`🌐 [JSONEditor] Idioma del navegador detectado: ${browserLang} -> ${detectedLang}`);
    return detectedLang;
  }

  getTranslations() {
    return {
      es: {
        title: "📝 JSON AI Prompt Editor",
        subtitle: "Editor visual para archivos JSON de AI Prompt Assistant",
        titleLabel: "🏷️ Titulo:",
        titlePlaceholder: "Máx. 12 chars",
        loadTemplate: "📋 Cargar Plantilla",
        loadingDefault: "Cargando archivo por defecto...",
        textEditor: "📝 Editor de Texto JSON",
        validateJson: "✅ Validar JSON",
        editorPlaceholder: "Edita tu JSON aquí...",
        originLabel: "Contexto:",
        loadButton: "📥 Cargar",
        saveButton: "💾 Guardar",
        infoButton: "ℹ️ Info",
        emailButton: "📧 Correo",
        updateButton: "🔄 Actualizar",
        diskLabel: "Disco Duro",
        previewTitle: "🔍 Previsualización del Menú",
        previewPlaceholder: "📋 Haz clic en \"Actualizar\" para ver cómo se verá tu menú JSON en la sidebar",
        menuInfoTitle: "📝 Información del Menú",
        titleLabel: "Título:",
        buttonTextLabel: "Texto del botón:",
        contextLabel: "Contexto:",
        sectionLabel: "Sección",
        buttonLabel: "Botón",
        translateLabel: "Traducir",
        noPromptDefined: "Sin prompt definido",
        translationButtonTitle: "Botón de traducción (previsualización)",
        previewInfoMessage: "🔍 Esta es una previsualización de cómo se verá tu menú JSON en la sidebar de AI Prompt Assistant.",
        emptyEditorMessage: "📋 El editor está vacío. Ingresa contenido JSON para ver la previsualización.",
        autoUpdateMessage: "La previsualización se actualizará automáticamente cuando el JSON sea válido.",
        sectionsRequiredMessage: "El JSON debe contener un array 'sections' para mostrar la previsualización del menú.",
        buttonPromptLog: "Prompt del botón",
        translationButtonLog: "Botón de traducción en modo previsualización",
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
        defaultLoaded: "Archivo por defecto cargado exitosamente",
        defaultLoadError: "No se pudo cargar el archivo por defecto:",
        customLoadSuccess: "✅ JSON cargado desde Custom",
        customLoadError: "❌ No se pudo cargar el JSON desde Custom",
        customSaveSuccess: "✅ JSON guardado en Custom",
        customSaveError: "❌ Error al guardar el JSON en Custom",
        customLoadEmpty: "⚠️ No hay datos guardados en Custom",
        customEmptyMessage: "Custom_x vacío, Carga Plantilla",
        diskLoadSuccess: "✅ Archivo JSON cargado desde disco duro",
        diskLoadError: "❌ Error al cargar el archivo desde disco duro",
        diskSaveSuccess: "✅ Archivo JSON guardado en disco duro",
        diskSaveError: "❌ Error al guardar el archivo en disco duro",
        infoButtonText: "📤 Puedes compartir con otros usuarios los menús .json que hayas creado en los botones custom_x\n\n🥷 Puedes modificar los menús originales de AI Prompt Assistant para personalizar los prompts a tus necesidades\n\nWindows:\nC:\\Users\\[USER_NAME]\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\2.x\\src\\common\\languages\\menu_data_XXXX_XX.json\n\nMac:\n~/Library/Application Support/Google/Chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/2.x/src/common/languages/menu_data_XXXX_XX.json\n\nLinux:\n~/.config/google-chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/2.x/src/common/languages/menu_data_XXXX_XX.json"
      },
      en: {
        title: "📝 JSON AI Prompt Editor",
        subtitle: "Visual editor for AI Prompt Assistant JSON files",
        titleLabel: "🏷️ Title:",
        titlePlaceholder: "Max. 12 chars",
        loadTemplate: "📋 Load Template",
        loadingDefault: "Loading default file...",
        textEditor: "📝 JSON Text Editor",
        validateJson: "✅ Validate JSON",
        editorPlaceholder: "Edit your JSON here...",
        originLabel: "Context:",
        loadButton: "📥 Load",
        saveButton: "💾 Save",
        infoButton: "ℹ️ Info",
        emailButton: "📧 Email",
        updateButton: "🔄 Update",
        diskLabel: "Hard Disk",
        previewTitle: "🔍 Menu Preview",
        previewPlaceholder: "📋 Click \"Update\" to see how your JSON menu will look in the sidebar",
        menuInfoTitle: "📝 Menu Information",
        titleLabel: "Title:",
        buttonTextLabel: "Button Text:",
        contextLabel: "Context:",
        sectionLabel: "Section",
        buttonLabel: "Button",
        translateLabel: "Translate",
        noPromptDefined: "No prompt defined",
        translationButtonTitle: "Translation button (preview)",
        previewInfoMessage: "🔍 This is a preview of how your JSON menu will look in the AI Prompt Assistant sidebar.",
        emptyEditorMessage: "📋 The editor is empty. Enter JSON content to see the preview.",
        autoUpdateMessage: "The preview will update automatically when the JSON is valid.",
        sectionsRequiredMessage: "The JSON must contain a 'sections' array to show the menu preview.",
        buttonPromptLog: "Button prompt",
        translationButtonLog: "Translation button in preview mode",
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
        defaultLoaded: "Default file loaded successfully",
        defaultLoadError: "Could not load default file:",
        customLoadSuccess: "✅ JSON loaded from Custom",
        customLoadError: "❌ Could not load JSON from Custom",
        customSaveSuccess: "✅ JSON saved to Custom",
        customSaveError: "❌ Error saving JSON to Custom",
        customLoadEmpty: "⚠️ No data saved in Custom",
        customEmptyMessage: "Custom_x empty, Load Template",
        diskLoadSuccess: "✅ JSON file loaded from hard disk",
        diskLoadError: "❌ Error loading file from hard disk",
        diskSaveSuccess: "✅ JSON file saved to hard disk",
        diskSaveError: "❌ Error saving file to hard disk",
        infoButtonText: "📤 You can share the .json menus you have created with custom_x buttons with other users.\n\n🥷 You can modify the original AI Prompt Assistant menus to customize the prompts to your needs.\n\nWindows:\nC:\\Users\\[USER_NAME]\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\jimdgbjdhdoiejncgdfcjpakokcpnalg\\2.x\\src\\common\\languages\\menu_data_XXXX_XX.json\n\nMac:\n~/Library/Application Support/Google/Chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/2.x/src/common/languages/menu_data_XXXX_XX.json\n\nLinux:\n~/.config/google-chrome/Default/Extensions/jimdgbjdhdoiejncgdfcjpakokcpnalg/2.x/src/common/languages/menu_data_XXXX_XX.json"
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

  async init() {
    this.bindEvents();
    await this.loadDefaultFile();
    // Inicializar el editor embebido
    this.initEmbeddedEditor();
    // Inicializar el campo Title con valor por defecto
    this.initializeButtonNameField();
    this.initializeOriginSelector();
    this.initializeAllModernTooltips();
    
    // Aplicar traducciones iniciales
    this.updateLanguage();
    
    // Cargar previsualización inicial del JSON cargado
    this.updatePreview();
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
    const headerP = document.getElementById('subtitle-text');
    const buttonNameLabel = document.getElementById('title-label');
    const originLabel = document.getElementById('origin-label');
    const addButtonText = document.getElementById('add-button-text');
    const loadDefaultBtn = document.getElementById('load-default-btn');
    const editorHeaderH3 = document.getElementById('editor-title');
    const validateJsonBtn = document.getElementById('validate-json-btn');
    const embeddedJsonEditor = document.getElementById('embedded-json-editor');
    const previewTitle = document.getElementById('preview-title');
    const previewPlaceholder = document.getElementById('preview-placeholder-text');
    const diskLabel = document.getElementById('disk-label');
    const updatePreviewBtn = document.getElementById('update-preview-btn');

    if (headerH1) headerH1.textContent = this.t('title');
    if (headerP) headerP.textContent = this.t('subtitle');
    if (buttonNameLabel) buttonNameLabel.textContent = this.t('titleLabel');
    if (originLabel) originLabel.textContent = this.t('originLabel');
    if (addButtonText) addButtonText.placeholder = this.t('titlePlaceholder');
    if (loadDefaultBtn) loadDefaultBtn.textContent = this.t('loadTemplate');
    if (editorHeaderH3) editorHeaderH3.textContent = this.t('textEditor');
    if (validateJsonBtn) validateJsonBtn.textContent = this.t('validateJson');
    if (embeddedJsonEditor) embeddedJsonEditor.placeholder = this.t('editorPlaceholder');
    if (previewTitle) previewTitle.textContent = this.t('previewTitle');
    if (previewPlaceholder) previewPlaceholder.textContent = this.t('previewPlaceholder');
    if (diskLabel) diskLabel.textContent = this.t('diskLabel');
    if (updatePreviewBtn) updatePreviewBtn.textContent = this.t('updateButton');

    // Actualizar botones con data-text
    const buttonsWithDataText = document.querySelectorAll('[data-text]');
    buttonsWithDataText.forEach(button => {
      const buttonType = button.id;
      if (buttonType.includes('load-custom') || buttonType.includes('load-disk')) {
        button.textContent = this.t('loadButton');
      } else if (buttonType.includes('save-custom') || buttonType.includes('save-disk')) {
        button.textContent = this.t('saveButton');
      } else if (buttonType.includes('info-disk')) {
        button.textContent = this.t('infoButton');
      } else if (buttonType.includes('email')) {
        button.textContent = this.t('emailButton');
      } else if (buttonType.includes('update-preview')) {
        button.textContent = this.t('updateButton');
      }
    });

    // Actualizar la previsualización del menú con el nuevo idioma
    this.updatePreview();
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
    return languageMap[languageCode] || 'GB';
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
      
      // Actualizar el editor JSON y la previsualización
      this.updateJsonPreview();
      this.updatePreview();
      
      console.log(this.t('defaultLoaded'));
    } catch (error) {
      console.warn(this.t('defaultLoadError'), error);
      // Si falla, usar datos por defecto
      this.updateJsonPreview();
      this.updatePreview();
    }
  }

  // Mostrar el menú emergente de selección de idioma
  showLanguageTemplatePopup() {
    const popup = document.getElementById('language-template-popup');
    if (popup) {
      popup.classList.remove('hidden');
      popup.classList.add('visible');
      console.log('🌍 Menú emergente de selección de idioma mostrado');
    }
  }

  // Ocultar el menú emergente de selección de idioma
  hideLanguageTemplatePopup() {
    const popup = document.getElementById('language-template-popup');
    if (popup) {
      popup.classList.add('hidden');
      popup.classList.remove('visible');
      console.log('🌍 Menú emergente de selección de idioma ocultado');
    }
  }

  // Cargar plantilla por idioma seleccionado
  async loadTemplateByLanguage(languageCode) {
    try {
      const langSuffix = this.getLanguageSuffix(languageCode);
      const templateFileName = `menu_data_CUSTOM_${langSuffix}.json`;
      const fileUrl = chrome.runtime.getURL(`src/common/languages/${templateFileName}`);
      
      console.log(`🌍 Cargando plantilla para idioma: ${languageCode} -> ${templateFileName}`);
      
      const response = await fetch(fileUrl);
      const jsonData = await response.json();
      
      this.currentData = jsonData;
      this.currentFilename = templateFileName;
      
      // Actualizar el campo Title con el header.title del archivo JSON
      this.updateTitleFieldFromJSON();
      
      // Actualizar la previsualización y el editor
      this.updateJsonPreview();
      this.updatePreview();
      
      // Mostrar mensaje de éxito
      const languageNames = {
        'es': 'Español',
        'gb': 'English',
        'fr': 'Français',
        'ca': 'Català',
        'de': 'Deutsch',
        'it': 'Italiano',
        'pt': 'Português',
        'ja': '日本語',
        'zh': '中文',
        'ru': 'Русский',
        'ar': 'العربية',
        'kr': '한국어',
        'hi': 'हिन्दी'
      };
      
      const languageName = languageNames[languageCode] || languageCode;
      console.log(`✅ Plantilla cargada exitosamente: ${languageName}`);
      
    } catch (error) {
      console.error(`❌ Error al cargar plantilla para idioma ${languageCode}:`, error);
    }
  }

  bindEvents() {
    // File operations
    document.getElementById('load-default-btn').addEventListener('click', () => this.showLanguageTemplatePopup());
    
    // Button name field
    document.getElementById('add-button-text').addEventListener('input', (e) => this.updateAddButtonText(e.target.value));
    
    // Origin selector
    document.getElementById('origin-selector').addEventListener('change', (e) => this.updateOriginSelection(e.target.value));
    
    // Add listener for the editor itself to sync changes back to the UI and update preview in real-time
    const editorElement = document.getElementById('embedded-json-editor');
    const updateRealTime = () => {
      this.syncUIFromEditor();
      this.updatePreview();
    };
    
    editorElement.addEventListener('input', updateRealTime);
    editorElement.addEventListener('paste', () => {
      // Use setTimeout to ensure paste content is processed
      setTimeout(updateRealTime, 10);
    });

    // Embedded editor controls
    document.getElementById('validate-json-btn').addEventListener('click', () => {
      this.validateEmbeddedJSON();
    });

    // Botón de actualización de previsualización
    document.getElementById('update-preview-btn').addEventListener('click', () => {
      this.updatePreview();
    });

    // Language selector buttons
    document.getElementById('lang-es').addEventListener('click', () => {
      this.changeLanguage('es');
    });

    document.getElementById('lang-en').addEventListener('click', () => {
      this.changeLanguage('en');
    });

    // Event listeners para las opciones de idioma
    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const selectedLang = e.target.getAttribute('data-lang');
        this.loadTemplateByLanguage(selectedLang);
        this.hideLanguageTemplatePopup();
      });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      const popup = document.getElementById('language-template-popup');
      const loadBtn = document.getElementById('load-default-btn');
      
      if (!popup.contains(e.target) && !loadBtn.contains(e.target)) {
        this.hideLanguageTemplatePopup();
      }
    });

    // Event listeners para botones custom
    for (let i = 1; i <= 4; i++) {
      document.getElementById(`load-custom-${i}-btn`).addEventListener('click', () => {
        console.log(`🖱️ Clic en botón Cargar Custom ${i}`);
        this.loadCustomSlot(i);
      });
      
      document.getElementById(`save-custom-${i}-btn`).addEventListener('click', () => {
        console.log(`🖱️ Clic en botón Guardar Custom ${i}`);
        this.saveCustomSlot(i);
      });
    }

    // Event listeners para botones de disco duro
    document.getElementById('load-disk-btn').addEventListener('click', () => {
      this.loadFromDisk();
    });
    
    document.getElementById('save-disk-btn').addEventListener('click', () => {
      this.saveToDisk();
    });

    document.getElementById('info-disk-btn').addEventListener('click', () => {
      this.showDiskInfo();
    });

    document.getElementById('email-btn').addEventListener('click', () => {
      this.showEmailInfo();
    });
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
      { elementId: 'validate-json-btn', tooltipId: 'validate-json-tooltip' },
      { elementId: 'update-preview-btn', tooltipId: 'update-preview-tooltip' },
      // Tooltips para botones custom
      { elementId: 'load-custom-1-btn', tooltipId: 'load-custom-1-tooltip' },
      { elementId: 'save-custom-1-btn', tooltipId: 'save-custom-1-tooltip' },
      { elementId: 'load-custom-2-btn', tooltipId: 'load-custom-2-tooltip' },
      { elementId: 'save-custom-2-btn', tooltipId: 'save-custom-2-tooltip' },
      { elementId: 'load-custom-3-btn', tooltipId: 'load-custom-3-tooltip' },
      { elementId: 'save-custom-3-btn', tooltipId: 'save-custom-3-tooltip' },
      { elementId: 'load-custom-4-btn', tooltipId: 'load-custom-4-tooltip' },
      { elementId: 'save-custom-4-btn', tooltipId: 'save-custom-4-tooltip' },
      // Tooltips para botones de disco duro
      { elementId: 'load-disk-btn', tooltipId: 'load-disk-tooltip' },
      { elementId: 'save-disk-btn', tooltipId: 'save-disk-tooltip' },
      { elementId: 'info-disk-btn', tooltipId: 'info-disk-tooltip' }
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

  // Función para actualizar la previsualización
  updatePreview() {
    const jsonEditor = document.getElementById('embedded-json-editor');
    const previewContent = document.getElementById('preview-content');
    
    try {
      const content = jsonEditor.value.trim();
      
      if (!content) {
        previewContent.innerHTML = `
          <div class="preview-placeholder">
            <p>${this.t('emptyEditorMessage')}</p>
          </div>
        `;
        return;
      }
      
      // Intentar parsear el JSON
      const parsed = JSON.parse(content);
      
      // Renderizar la previsualización
      this.renderPreview(parsed, previewContent);
      
    } catch (e) {
      // El JSON tiene errores de sintaxis - mostrar error de forma menos intrusiva
      previewContent.innerHTML = `
        <div class="preview-placeholder">
          <p style="color: #dc3545;">❌ Error de sintaxis JSON</p>
          <p style="color: #6c757d; font-size: 12px; margin-top: 8px;">${e.message}</p>
          <p style="color: #6c757d; font-size: 12px; margin-top: 8px;">${this.t('autoUpdateMessage')}</p>
        </div>
      `;
    }
  }

  // Función para renderizar la previsualización del menú
  renderPreview(jsonData, container) {
    container.innerHTML = '';
    
    // Verificar si tiene la estructura esperada
    if (!jsonData.sections || !Array.isArray(jsonData.sections)) {
      container.innerHTML = `
        <div class="preview-placeholder">
          <p style="color: #ffc107;">⚠️ Estructura JSON no válida</p>
          <p style="color: #6c757d; font-size: 12px; margin-top: 8px;">${this.t('sectionsRequiredMessage')}</p>
        </div>
      `;
      return;
    }
    
    // Mostrar información del header si existe
    if (jsonData.header && jsonData.header.title) {
      const headerInfo = document.createElement('div');
      headerInfo.className = 'preview-header-info';
      headerInfo.innerHTML = `
        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 14px;">${this.t('menuInfoTitle')}</h4>
          <p style="margin: 0; font-size: 13px; color: #374151;"><strong>${this.t('titleLabel')}</strong> ${jsonData.header.title}</p>
          ${jsonData.addButtonText ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #374151;"><strong>${this.t('buttonTextLabel')}</strong> ${jsonData.addButtonText}</p>` : ''}
          ${jsonData.origin ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #374151;"><strong>${this.t('contextLabel')}</strong> ${jsonData.origin}</p>` : ''}
        </div>
      `;
      container.appendChild(headerInfo);
    }
    
    // Renderizar cada sección con estilos idénticos a la sidebar
    jsonData.sections.forEach((section, index) => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'sidebar-section';
      
      // Título de la sección con estilos de sidebar
      const titleElement = document.createElement('h2');
      titleElement.className = 'sidebar-section-title';
      titleElement.textContent = section.title || `${this.t('sectionLabel')} ${index + 1}`;
      sectionElement.appendChild(titleElement);
      
      // Contenedor de botones con estilos de sidebar
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'sidebar-buttons-container';
      
      // Añadir botones regulares
      if (section.buttons && Array.isArray(section.buttons)) {
        section.buttons.forEach(button => {
          const buttonElement = this.createPreviewButton(button.label || this.t('buttonLabel'), button.prompt || '');
          buttonsContainer.appendChild(buttonElement);
        });
      }
      
      // Añadir botón de traducción si existe
      if (section.translationButton) {
        const translationContainer = document.createElement('div');
        translationContainer.className = 'sidebar-translation-container';
        
        const translationButton = this.createPreviewTranslationButton(section.translationButton);
        translationContainer.appendChild(translationButton);
        
        buttonsContainer.appendChild(translationContainer);
      }
      
      sectionElement.appendChild(buttonsContainer);
      container.appendChild(sectionElement);
    });
    
    // Mensaje informativo al final
    const infoMessage = document.createElement('div');
    infoMessage.innerHTML = `
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 12px; margin-top: 16px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #6c757d; font-style: italic;">
          ${this.t('previewInfoMessage')}
        </p>
      </div>
    `;
    container.appendChild(infoMessage);
  }

  // Crear un botón regular para la previsualización
  createPreviewButton(label, prompt) {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'sidebar-prompt-button';
    buttonElement.textContent = label;
    buttonElement.title = prompt ? `Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}` : this.t('noPromptDefined');
    
    // Hacer que el botón sea solo visual (no funcional)
    buttonElement.style.cursor = 'default';
    buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      // Mostrar el prompt en console para previsualización
      if (prompt) {
        console.log(`${this.t('buttonPromptLog')} "${label}":`, prompt);
      }
    });
    
    return buttonElement;
  }

  // Crear un botón de traducción para la previsualización
  createPreviewTranslationButton(translationData) {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'sidebar-translation-button';
    buttonElement.textContent = translationData.label || this.t('translateLabel');
    buttonElement.title = this.t('translationButtonTitle');
    
    // Hacer que el botón sea solo visual
    buttonElement.style.cursor = 'default';
    buttonElement.addEventListener('click', (e) => {
      e.preventDefault();
      console.log(this.t('translationButtonLog'));
    });
    
    return buttonElement;
  }

  // Función para cargar desde un slot custom
  async loadCustomSlot(slotNumber) {
    console.log(`🔄 Intentando cargar Custom ${slotNumber}...`);
    
    try {
      const storageKey = `custom_json_${slotNumber}`;
      console.log(`🔑 Clave de storage: ${storageKey}`);
      
      // Obtener datos desde chrome.storage.local
      const result = await new Promise((resolve) => {
        chrome.storage.local.get([storageKey], (result) => {
          console.log(`📦 Resultado de chrome.storage.local.get:`, result);
          resolve(result);
        });
      });
      
      const customData = result[storageKey];
      console.log(`📄 Datos encontrados:`, customData);
      
      if (!customData) {
        console.warn(`⚠️ No hay datos en Custom ${slotNumber}`);
        // Mostrar mensaje personalizado para slot vacío
        const message = this.t('customEmptyMessage').replace('Custom_x', `Custom ${slotNumber}`);
        alert(message);
        return;
      }
      
      // Cargar los datos en el editor
      this.currentData = customData;
      this.currentFilename = `custom_${slotNumber}.json`;
      
      // Actualizar el campo Title con el header.title del JSON cargado
      this.updateTitleFieldFromJSON();
      
      // Actualizar la previsualización y el editor
      this.updateJsonPreview();
      this.updatePreview();
      
      console.log(`✅ ${this.t('customLoadSuccess')} ${slotNumber}:`, customData);
      
    } catch (error) {
      console.error(`❌ Error loading custom slot ${slotNumber}:`, error);
    }
  }

  // Función para guardar en un slot custom
  async saveCustomSlot(slotNumber) {
    try {
      // Obtener y validar el JSON del editor
      const embeddedEditor = document.getElementById('embedded-json-editor');
      const titleInput = document.getElementById('add-button-text');
      const originSelector = document.getElementById('origin-selector');
      
      const jsonStringFromEditor = embeddedEditor.value;
      const titleFromInput = titleInput.value.trim();
      const originFromSelector = originSelector.value;

      let dataToSave;

      try {
        // Parsear el contenido del editor
        dataToSave = JSON.parse(jsonStringFromEditor);
      } catch (error) {
        let errorMessage = this.t('validationInvalid');
        errorMessage += `"${error.message}"\n\n`;
        errorMessage += "Por favor, corrige los errores en el editor de texto JSON antes de guardar.";
        console.error(errorMessage);
        return;
      }

      // Consolidar los datos con el título y origen
      if (dataToSave.header) {
        dataToSave.header.title = titleFromInput;
      }
      dataToSave.addButtonText = titleFromInput;
      dataToSave.origin = originFromSelector;

      // Actualizar el estado principal
      this.currentData = dataToSave;

      // Guardar en chrome.storage.local
      const storageKey = `custom_json_${slotNumber}`;
      const storageData = { [storageKey]: dataToSave };

      await new Promise((resolve, reject) => {
        chrome.storage.local.set(storageData, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });

      console.log(`${this.t('customSaveSuccess')} ${slotNumber}:`, dataToSave);

      // Enviar mensaje para recargar la sidebar si está abierta
      chrome.runtime.sendMessage({ action: 'reloadSidebar' });

    } catch (error) {
      console.error(`Error saving to custom slot ${slotNumber}:`, error);
    }
  }

  // Función para cargar desde disco duro
  loadFromDisk() {
    // Crear un input file temporal
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          // Cargar los datos en el editor
          this.currentData = jsonData;
          this.currentFilename = file.name;
          
          // Actualizar el campo Title con el header.title del JSON cargado
          this.updateTitleFieldFromJSON();
          
          // Actualizar la previsualización y el editor
          this.updateJsonPreview();
          this.updatePreview();
          
          console.log(this.t('diskLoadSuccess'), jsonData);
          
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };
      
      reader.onerror = () => {
        console.error(`${this.t('diskLoadError')}: Error reading file`);
      };
      
      reader.readAsText(file);
    });
    
    // Agregar al DOM temporalmente y hacer clic
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  // Función para guardar a disco duro
  saveToDisk() {
    try {
      // Obtener y validar el JSON del editor
      const embeddedEditor = document.getElementById('embedded-json-editor');
      const titleInput = document.getElementById('add-button-text');
      const originSelector = document.getElementById('origin-selector');
      
      const jsonStringFromEditor = embeddedEditor.value;
      const titleFromInput = titleInput.value.trim();
      const originFromSelector = originSelector.value;

      let dataToSave;

      try {
        // Parsear el contenido del editor
        dataToSave = JSON.parse(jsonStringFromEditor);
      } catch (error) {
        let errorMessage = this.t('validationInvalid');
        errorMessage += `"${error.message}"\n\n`;
        errorMessage += "Por favor, corrige los errores en el editor de texto JSON antes de guardar.";
        console.error(errorMessage);
        return;
      }

      // Consolidar los datos con el título y origen
      if (dataToSave.header) {
        dataToSave.header.title = titleFromInput;
      }
      dataToSave.addButtonText = titleFromInput;
      dataToSave.origin = originFromSelector;

      // Actualizar el estado principal
      this.currentData = dataToSave;

      // Crear el nombre del archivo
      const fileName = titleFromInput || 'custom_menu';
      
      // Crear el contenido JSON formateado
      const jsonContent = JSON.stringify(dataToSave, null, 2);
      
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
      
      console.log(this.t('diskSaveSuccess'), dataToSave);
      
    } catch (error) {
      console.error('Error saving to disk:', error);
    }
  }

  // Función para mostrar información sobre el disco duro
  showDiskInfo() {
    // Crear un modal personalizado para mostrar el mensaje completo
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
    `;

    const title = document.createElement('h2');
    title.textContent = this.currentLanguage === 'es' ? 'ℹ️ Información del Disco Duro' : 'ℹ️ Hard Disk Information';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
    `;

    const content = document.createElement('div');
    content.innerHTML = this.t('infoButtonText').replace(/\n/g, '<br>');
    content.style.cssText = `
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-line;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = this.currentLanguage === 'es' ? 'Cerrar' : 'Close';
    closeButton.style.cssText = `
      margin-top: 20px;
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;

    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Cerrar modal al hacer clic fuera de él
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Cerrar modal con la tecla Escape
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', closeOnEscape);
      }
    });

    modalContent.appendChild(title);
    modalContent.appendChild(content);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  // Función para enviar email con JSON adjunto
  showEmailInfo() {
    // Obtener el contenido del editor JSON
    const jsonEditor = document.getElementById('embedded-json-editor');
    const jsonContent = jsonEditor ? jsonEditor.value.trim() : '';
    
    // Verificar si hay contenido en el editor
    if (!jsonContent) {
      const noContentMessage = this.currentLanguage === 'es' 
        ? '⚠️ El editor JSON está vacío. Por favor, ingresa contenido JSON antes de enviar el correo.'
        : '⚠️ The JSON editor is empty. Please enter JSON content before sending the email.';
      alert(noContentMessage);
      return;
    }

    // Validar que el JSON sea válido
    try {
      JSON.parse(jsonContent);
    } catch (error) {
      const invalidJsonMessage = this.currentLanguage === 'es'
        ? '❌ El JSON no es válido. Por favor, corrige los errores antes de enviar el correo.'
        : '❌ The JSON is not valid. Please fix the errors before sending the email.';
      alert(invalidJsonMessage);
      return;
    }

    // Obtener el nombre del archivo del campo Title
    const titleInput = document.getElementById('add-button-text');
    const fileName = titleInput ? titleInput.value.trim() : 'custom';
    const customFileName = `${fileName}.json`;

    // Crear el contenido del email
    const emailSubject = `AI Prompt Assistant ${customFileName}`;
    const emailBody = this.currentLanguage === 'es'
      ? `Hola,

Te envío mi menú JSON personalizado de AI Prompt Assistant.

Incorporalo en tu AI Prompt Assistant desde el Disco Duro a los botones CUSTOM_X

Archivo adjunto: ${customFileName}

Saludos,
Usuario de AI Prompt Assistant`
      : `Hello,

I'm sending you my custom AI Prompt Assistant JSON menu.

Incorporate it in your AI Prompt Assistant from Hard Disk to CUSTOM_X buttons

Attached file: ${customFileName}

Best regards,
AI Prompt Assistant User`;

    // Crear el enlace de Gmail con el archivo adjunto
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const fileUrl = URL.createObjectURL(blob);
    
    // Crear un enlace temporal para descargar el archivo
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.download = customFileName;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(fileUrl);

    // Construir el enlace de Gmail (campo "Para:" en blanco)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Mostrar mensaje de confirmación primero
    const successMessage = this.currentLanguage === 'es'
      ? `✅ Email preparado en Gmail

📎 Archivo: ${customFileName} (descargado automáticamente) 
📧 Gmail se abrirá en una nueva pestaña. 
📎Adjunta manualmente el archivo ${customFileName} desde tu carpeta de descargas.`
      : `✅ Email prepared in Gmail

📎 File: ${customFileName} (automatically downloaded)
📧 Gmail will open in a new tab.
📎 Manually attach the ${customFileName} file from your downloads folder.`;

    // Mostrar modal con información primero
    this.showEmailModal(successMessage, () => {
      // Después de cerrar el modal, abrir Gmail
      window.open(gmailUrl, '_blank');
    });
  }

  // Función para mostrar modal de email
  showEmailModal(message, callback = null) {
    // Crear un modal personalizado para mostrar el mensaje completo
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
    `;

    const title = document.createElement('h2');
    title.textContent = this.currentLanguage === 'es' ? '📧 Email Enviado' : '📧 Email Sent';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
    `;

    const content = document.createElement('div');
    content.innerHTML = message.replace(/\n/g, '<br>');
    content.style.cssText = `
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-line;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = this.currentLanguage === 'es' ? 'Cerrar' : 'Close';
    closeButton.style.cssText = `
      margin-top: 20px;
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;

    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      if (callback) callback();
    });

    // Cerrar modal al hacer clic fuera de él
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        if (callback) callback();
      }
    });

    // Cerrar modal con la tecla Escape
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', closeOnEscape);
        if (callback) callback();
      }
    });

    modalContent.appendChild(title);
    modalContent.appendChild(content);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }
}

// Initialize the editor when the DOM is loaded
let jsonEditor;
document.addEventListener('DOMContentLoaded', async function() {
 jsonEditor = new JSONEditor();
 await jsonEditor.init();
});