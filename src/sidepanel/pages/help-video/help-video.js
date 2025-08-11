// AI Prompt Assistant - Help Video Page Script
// 
// Este script maneja la funcionalidad de la página de video de ayuda
// Incluye detección de idiomas, manejo de errores, y experiencia de usuario mejorada
//

class HelpVideoManager {
    constructor() {
        this.iframe = null;
        this.loading = null;
        this.errorMessage = null;
        this.successIndicator = null;
        this.videoLoaded = false;
        this.timeoutId = null;
        this.userLanguage = navigator.language || navigator.userLanguage;
        this.extensionLanguage = null; // Idioma de la extensión desde storage
        
        this.init();
    }

    async init() {
        this.initializeElements();
        this.setupEventListeners();
        await this.loadExtensionLanguage();
        this.updateLanguageTexts();
        this.setupTimeout();
        this.setupKeyboardHandlers();
        this.logInitialization();
        this.sendAnalytics('help_video_opened');
    }

    async loadExtensionLanguage() {
        try {
            // Cargar el idioma desde el storage de la extensión
            const result = await chrome.storage.local.get(['language']);
            if (result.language) {
                this.extensionLanguage = result.language;
                console.log(`🌐 [Help Video] Idioma de la extensión cargado: ${this.extensionLanguage}`);
            } else {
                // Si no hay idioma guardado, detectar del navegador como fallback
                const browserLang = this.userLanguage.split('-')[0].toLowerCase();
                const languageMap = {
                    'es': 'es', 'en': 'gb', 'ca': 'ca', 'de': 'de', 'fr': 'fr',
                    'it': 'it', 'pt': 'pt', 'zh': 'zh', 'ru': 'ru', 'ar': 'ar',
                    'ja': 'ja', 'hi': 'hi', 'ko': 'kr'
                };
                this.extensionLanguage = languageMap[browserLang] || 'gb';
                console.log(`🌐 [Help Video] No hay idioma guardado, usando detección del navegador: ${this.extensionLanguage}`);
            }
        } catch (error) {
            console.error('❌ Error cargando idioma de la extensión:', error);
            // Fallback al idioma del navegador
            const browserLang = this.userLanguage.split('-')[0].toLowerCase();
            this.extensionLanguage = browserLang === 'es' ? 'es' : 'gb';
        }
    }

    initializeElements() {
        this.iframe = document.getElementById('video-iframe');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('error-message');
        this.successIndicator = document.getElementById('success-indicator');

        if (!this.iframe || !this.loading || !this.errorMessage || !this.successIndicator) {
            console.error('❌ Error: No se pudieron encontrar todos los elementos necesarios');
            return;
        }
    }

    setupEventListeners() {
        // Evento de carga exitosa del iframe
        this.iframe.addEventListener('load', () => {
            this.onVideoLoaded();
        });

        // Evento de error del iframe
        this.iframe.addEventListener('error', () => {
            this.onVideoError();
        });

        // Evento del botón de cerrar (delegado al window para que funcione globalmente)
        window.closeWindow = () => {
            console.log('🚪 Botón de cerrar presionado - iniciando cierre de ventana...');
            this.closeWindow();
        };

        // Asegurar que el botón de cerrar funcione correctamente
        const closeButton = document.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🖱️ Click en botón detectado - cerrando ventana...');
                this.closeWindow();
            });
        }
    }

    onVideoLoaded() {
        this.videoLoaded = true;
        this.loading.style.display = 'none';
        this.successIndicator.style.display = 'block';
        
        // Limpiar timeout ya que el video se cargó exitosamente
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        // Ocultar el indicador de éxito después de 3 segundos
        setTimeout(() => {
            this.successIndicator.style.display = 'none';
        }, 3000);
        
        console.log('✅ Video cargado correctamente');
        this.sendAnalytics('help_video_loaded_successfully');
    }

    onVideoError() {
        this.loading.style.display = 'none';
        this.errorMessage.style.display = 'block';
        console.error('❌ Error al cargar el video');
        this.sendAnalytics('help_video_error');
    }

    setupTimeout() {
        // Timeout de 15 segundos para mostrar error si el video no carga
        this.timeoutId = setTimeout(() => {
            if (!this.videoLoaded && this.loading.style.display !== 'none') {
                this.loading.style.display = 'none';
                this.errorMessage.style.display = 'block';
                console.warn('⏰ Timeout: El video tardó demasiado en cargar');
                this.sendAnalytics('help_video_timeout');
            }
        }, 15000);
    }

    closeWindow() {
        console.log('🚪 Iniciando proceso de cierre de ventana...');
        
        const container = document.querySelector('.container');
        const closeButton = document.querySelector('.close-button');
        
        // Cambiar texto del botón para dar feedback bilingüe
        if (closeButton) {
            closeButton.innerHTML = '✨ Closing... / Cerrando...';
            closeButton.disabled = true;
            closeButton.style.opacity = '0.7';
        }
        
        // Animación de cierre
        if (container) {
            container.style.transition = 'all 0.3s ease';
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0';
        }
        
        // Registrar analytics antes de cerrar
        this.sendAnalytics('help_video_closed');
        
        // Aplicar múltiples estrategias de cierre
        this.attemptWindowClose();
    }

    attemptWindowClose() {
        console.log('🔄 Intentando cerrar ventana con múltiples métodos...');
        
        setTimeout(() => {
            try {
                // Estrategia 1: Chrome tabs API (más efectivo para extensiones)
                if (typeof chrome !== 'undefined' && chrome.tabs) {
                    console.log('📋 Intentando cerrar con chrome.tabs API...');
                    chrome.tabs.getCurrent((tab) => {
                        if (tab && tab.id) {
                            chrome.tabs.remove(tab.id, () => {
                                console.log('✅ Ventana cerrada con chrome.tabs API');
                            });
                        } else {
                            // Si no se puede obtener el tab, usar método alternativo
                            this.fallbackClose();
                        }
                    });
                } else {
                    // Si no hay chrome API, usar métodos estándar
                    this.fallbackClose();
                }
                
            } catch (error) {
                console.error('❌ Error en estrategia principal:', error);
                this.fallbackClose();
            }
        }, 300);
    }

    fallbackClose() {
        console.log('🔄 Usando métodos de cierre alternativos...');
        
        try {
            // Método 1: window.close() estándar
            console.log('🪟 Intentando window.close()...');
            window.close();
            
            // Método 2: Con delay para asegurar ejecución
            setTimeout(() => {
                console.log('⏱️ Segundo intento con window.close()...');
                window.close();
            }, 100);
            
            // Método 3: Usar history si está disponible
            setTimeout(() => {
                if (window.history.length > 1) {
                    console.log('🔙 Intentando con window.history.back()...');
                    window.history.back();
                } else {
                    console.log('🪟 Tercer intento con window.close()...');
                    window.close();
                }
            }, 300);
            
            // Método 4: Último recurso con mensaje al usuario
            setTimeout(() => {
                console.log('⚠️ Métodos automáticos fallaron, notificando al usuario...');
                
                const container = document.querySelector('.container');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #2c3e50;">
                            <h2>✅ Thank you for watching! / ¡Gracias por ver el video!</h2>
                            <p style="margin: 20px 0;">You can close this tab manually<br>
                            Puedes cerrar esta pestaña manualmente</p>
                            <p style="font-size: 14px; color: #6c757d;">
                                Press <kbd>Ctrl+W</kbd> or <kbd>Cmd+W</kbd> to close<br>
                                Presiona <kbd>Ctrl+W</kbd> o <kbd>Cmd+W</kbd> para cerrar
                            </p>
                        </div>
                    `;
                }
                
                // Intentar cerrar una vez más después de mostrar el mensaje
                setTimeout(() => {
                    window.close();
                }, 2000);
                
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error en métodos de fallback:', error);
            
            // Si todo falla, al menos mostrar mensaje de agradecimiento bilingüe
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #2c3e50;">
                        <h2>✅ Video completed! / ¡Video completado!</h2>
                        <p>Please close this tab manually<br>
                        Por favor, cierra esta pestaña manualmente</p>
                    </div>
                `;
            }
        }
    }

    setupKeyboardHandlers() {
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'Escape':
                    this.closeWindow();
                    break;
                
                case 'F11':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
                
                case 'r':
                case 'R':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.reloadVideo();
                    }
                    break;
            }
        });
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            const container = document.querySelector('.container');
            if (container && container.requestFullscreen) {
                container.requestFullscreen();
            }
        }
    }

    reloadVideo() {
        this.videoLoaded = false;
        this.loading.style.display = 'block';
        this.errorMessage.style.display = 'none';
        this.successIndicator.style.display = 'none';
        
        // Recargar el iframe
        const currentSrc = this.iframe.src;
        this.iframe.src = '';
        setTimeout(() => {
            this.iframe.src = currentSrc;
        }, 100);
        
        this.setupTimeout();
        console.log('🔄 Recargando video...');
        this.sendAnalytics('help_video_reloaded');
    }

    updateLanguageTexts() {
        const translations = this.getTranslations();
        console.log(`🌐 Extension language: ${this.extensionLanguage} - Applying translations`);
        
        // Obtener el código de idioma de la extensión para mostrar
        const langCode = this.extensionLanguage.toUpperCase();
        
        // Actualizar el título de la página con etiqueta de idioma
        document.title = `AI Prompt Assistant ${translations.pageTitle} [${langCode}]`;
        
        // Actualizar elementos del DOM
        const titleElement = document.querySelector('h1 span');
        if (titleElement) {
            titleElement.textContent = `${translations.title} [${langCode}]`;
        }
        
        // Actualizar también el título principal con la etiqueta de idioma
        const mainTitleElement = document.querySelector('h1');
        if (mainTitleElement) {
            const iconAndText = mainTitleElement.innerHTML.split('<span')[0]; // Preservar el emoji y texto base
            const spanElement = mainTitleElement.querySelector('span');
            if (spanElement) {
                mainTitleElement.innerHTML = `${iconAndText.trim()} [${langCode}]<span style="font-size: 18px;">${translations.title}</span>`;
            }
        }
        
        const subtitleElement = document.querySelector('.header p');
        if (subtitleElement) {
            subtitleElement.textContent = translations.subtitle;
        }
        
        const footerTextElement = document.querySelector('.footer p');
        if (footerTextElement) {
            footerTextElement.textContent = translations.footerText;
        }
        
        const closeButtonElement = document.querySelector('.close-button');
        if (closeButtonElement) {
            closeButtonElement.textContent = translations.closeButton;
        }
        
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.textContent = translations.loading;
        }
        
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = translations.error;
        }
        
        const successElement = document.getElementById('success-indicator');
        if (successElement) {
            successElement.textContent = translations.success;
        }
        
        // Actualizar el lang del HTML
        const langMap = {
            'es': 'es', 'ca': 'ca', 'fr': 'fr', 'de': 'de', 'it': 'it', 'pt': 'pt',
            'zh': 'zh', 'ru': 'ru', 'ar': 'ar', 'ja': 'ja', 'hi': 'hi', 'kr': 'ko'
        };
        document.documentElement.lang = langMap[this.extensionLanguage] || 'en';
        
        // Configurar dirección del texto para idiomas RTL
        if (this.extensionLanguage === 'ar' || this.extensionLanguage === 'hi') {
            document.documentElement.dir = 'rtl';
            document.body.style.direction = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
            document.body.style.direction = 'ltr';
        }
        
        this.detectedLanguage = this.extensionLanguage;
        console.log(`✅ Interface updated to extension language: ${this.detectedLanguage}`);
    }

    getTranslations() {
        const lang = this.extensionLanguage ? this.extensionLanguage.toLowerCase() : this.userLanguage.toLowerCase();
        
        if (lang.startsWith('en')) {
            return {
                title: '- Help Video',
                subtitle: 'Learn to use the extension easily and quickly',
                footerText: '🚀 Thank you for using AI Prompt Assistant!',
                closeButton: '✨ Close and start using the extension',
                loading: 'Loading video...',
                error: '⚠️ Error loading video. Please check your internet connection and try again.',
                success: '✅ Video loaded successfully',
                pageTitle: '- Help Video'
            };
        } else if (lang.startsWith('fr')) {
            return {
                title: '- Aide',
                subtitle: 'Apprenez à utiliser l\'extension facilement et rapidement',
                footerText: '🚀 Merci d\'utiliser AI Prompt Assistant !',
                closeButton: '✨ Fermer et commencer à utiliser l\'extension',
                loading: 'Chargement de la vidéo...',
                error: '⚠️ Erreur lors du chargement de la vidéo. Veuillez vérifier votre connexion internet et réessayer.',
                success: '✅ Vidéo chargée avec succès',
                pageTitle: '- Aide'
            };
        } else if (lang.startsWith('de')) {
            return {
                title: '- Hilfe',
                subtitle: 'Lernen Sie, die Erweiterung einfach und schnell zu verwenden',
                footerText: '🚀 Vielen Dank für die Nutzung von AI Prompt Assistant!',
                closeButton: '✨ Schließen und Erweiterung verwenden',
                loading: 'Video wird geladen...',
                error: '⚠️ Fehler beim Laden des Videos. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
                success: '✅ Video erfolgreich geladen',
                pageTitle: '- Hilfe'
            };
        } else if (lang.startsWith('it')) {
            return {
                title: '- Aiuto',
                subtitle: 'Impara a usare l\'estensione facilmente e velocemente',
                footerText: '🚀 Grazie per aver utilizzato AI Prompt Assistant!',
                closeButton: '✨ Chiudi e inizia a utilizzare l\'estensione',
                loading: 'Caricamento video...',
                error: '⚠️ Errore nel caricamento del video. Si prega di controllare la connessione internet e riprovare.',
                success: '✅ Video caricato con successo',
                pageTitle: '- Aiuto'
            };
        } else if (lang.startsWith('pt')) {
            return {
                title: '- Ajuda',
                subtitle: 'Aprenda a usar a extensão de forma fácil e rápida',
                footerText: '🚀 Obrigado por usar o AI Prompt Assistant!',
                closeButton: '✨ Fechar e começar a usar a extensão',
                loading: 'Carregando vídeo...',
                error: '⚠️ Erro ao carregar o vídeo. Por favor, verifique sua conexão com a internet e tente novamente.',
                success: '✅ Vídeo carregado com sucesso',
                pageTitle: '- Ajuda'
            };
        } else if (lang === 'ca' || lang.startsWith('ca')) {
            // Catalán
            return {
                title: '- Ajuda',
                subtitle: 'Aprèn a utilitzar l\'extensió de manera fàcil i ràpida',
                footerText: '🚀 Gràcies per utilitzar AI Prompt Assistant!',
                closeButton: '✨ Tancar i començar a utilitzar l\'extensió',
                loading: 'Carregant vídeo...',
                error: '⚠️ Error en carregar el vídeo. Si us plau, verifica la teva connexió a internet i torna-ho a intentar.',
                success: '✅ Vídeo carregat correctament',
                pageTitle: '- Ajuda'
            };
        } else if (lang === 'zh' || lang.startsWith('zh')) {
            // Chino
            return {
                title: '- 帮助',
                subtitle: '轻松快速地学习如何使用扩展程序',
                footerText: '🚀 感谢您使用 AI Prompt Assistant！',
                closeButton: '✨ 关闭并开始使用扩展程序',
                loading: '正在加载视频...',
                error: '⚠️ 视频加载错误。请检查您的网络连接并重试。',
                success: '✅ 视频加载成功',
                pageTitle: '- 帮助'
            };
        } else if (lang === 'ru' || lang.startsWith('ru')) {
            // Ruso
            return {
                title: '- Помощь',
                subtitle: 'Изучите, как легко и быстро использовать расширение',
                footerText: '🚀 Спасибо за использование AI Prompt Assistant!',
                closeButton: '✨ Закрыть и начать использовать расширение',
                loading: 'Загрузка видео...',
                error: '⚠️ Ошибка загрузки видео. Пожалуйста, проверьте интернет-соединение и попробуйте снова.',
                success: '✅ Видео успешно загружено',
                pageTitle: '- Помощь'
            };
        } else if (lang === 'ar' || lang.startsWith('ar')) {
            // Árabe
            return {
                title: '- مساعدة',
                subtitle: 'تعلم كيفية استخدام الإضافة بسهولة وسرعة',
                footerText: '🚀 شكراً لاستخدامك AI Prompt Assistant!',
                closeButton: '✨ إغلاق وبدء استخدام الإضافة',
                loading: 'جاري تحميل الفيديو...',
                error: '⚠️ خطأ في تحميل الفيديو. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
                success: '✅ تم تحميل الفيديو بنجاح',
                pageTitle: '- مساعدة'
            };
        } else if (lang === 'ja' || lang.startsWith('ja')) {
            // Japonés
            return {
                title: '- ヘルプ',
                subtitle: '拡張機能の使い方を簡単かつ迅速に学習',
                footerText: '🚀 AI Prompt Assistant をご利用いただきありがとうございます！',
                closeButton: '✨ 閉じて拡張機能を使い始める',
                loading: 'ビデオを読み込み中...',
                error: '⚠️ ビデオの読み込みエラー。インターネット接続を確認して再試行してください。',
                success: '✅ ビデオが正常に読み込まれました',
                pageTitle: '- ヘルプ'
            };
        } else if (lang === 'hi' || lang.startsWith('hi')) {
            // Hindi
            return {
                title: '- सहायता',
                subtitle: 'एक्सटेंशन का उपयोग आसानी से और जल्दी सीखें',
                footerText: '🚀 AI Prompt Assistant का उपयोग करने के लिए धन्यवाद!',
                closeButton: '✨ बंद करें और एक्सटेंशन का उपयोग शुरू करें',
                loading: 'वीडियो लोड हो रहा है...',
                error: '⚠️ वीडियो लोड करने में त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।',
                success: '✅ वीडियो सफलतापूर्वक लोड हुआ',
                pageTitle: '- सहायता'
            };
        } else if (lang === 'kr' || lang.startsWith('ko')) {
            // Coreano
            return {
                title: '- 도움말',
                subtitle: '확장 프로그램 사용법을 쉽고 빠르게 배우세요',
                footerText: '🚀 AI Prompt Assistant를 사용해 주셔서 감사합니다!',
                closeButton: '✨ 닫고 확장 프로그램 사용 시작',
                loading: '비디오 로딩 중...',
                error: '⚠️ 비디오 로딩 오류. 인터넷 연결을 확인하고 다시 시도해주세요.',
                success: '✅ 비디오가 성공적으로 로드되었습니다',
                pageTitle: '- 도움말'
            };
        } else if (lang.startsWith('es')) {
            // Español
            return {
                title: '- Ayuda',
                subtitle: 'Aprende a usar la extensión de manera fácil y rápida',
                footerText: '🚀 ¡Gracias por usar AI Prompt Assistant!',
                closeButton: '✨ Cerrar y empezar a usar la extensión',
                loading: 'Cargando video...',
                error: '⚠️ Error al cargar el video. Por favor, verifica tu conexión a internet e inténtalo de nuevo.',
                success: '✅ Video cargado correctamente',
                pageTitle: '- Ayuda'
            };
        } else {
            // Inglés por defecto
            return {
                title: '- Help Video',
                subtitle: 'Learn to use the extension easily and quickly',
                footerText: '🚀 Thank you for using AI Prompt Assistant!',
                closeButton: '✨ Close and start using the extension',
                loading: 'Loading video...',
                error: '⚠️ Error loading video. Please check your internet connection and try again.',
                success: '✅ Video loaded successfully',
                pageTitle: '- Help Video'
            };
        }
    }

    sendAnalytics(event) {
        // Enviar analytics al background script si está disponible
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'analytics',
                event: event,
                timestamp: new Date().toISOString(),
                language: this.extensionLanguage || this.userLanguage,
                userAgent: navigator.userAgent
            }).catch(() => {
                // Silenciar errores si no hay background script disponible
            });
        }
    }

    logInitialization() {
        console.log('🎥 AI Prompt Assistant - Help Video Page');
        console.log('📺 URL del video:', this.iframe?.src || 'No disponible');
        console.log('🌐 Idioma del navegador:', this.userLanguage);
        console.log('🎨 Idioma de la extensión:', this.extensionLanguage);
        console.log('🖥️ User Agent:', navigator.userAgent);
        console.log('📱 Es móvil:', /Mobi|Android/i.test(navigator.userAgent));
        console.log('🎯 Página inicializada correctamente');
    }
}

// Inicializar cuando el DOM esté listo
function initializeHelpVideo() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new HelpVideoManager();
        });
    } else {
        new HelpVideoManager();
    }
}

// Función de utilidad para debugging (disponible en consola)
window.helpVideoDebug = {
    reloadVideo: () => {
        if (window.helpVideoManager) {
            window.helpVideoManager.reloadVideo();
        }
    },
    getVideoInfo: () => {
        const iframe = document.getElementById('video-iframe');
        return {
            src: iframe?.src,
            loaded: iframe?.contentDocument !== null,
            dimensions: {
                width: iframe?.clientWidth,
                height: iframe?.clientHeight
            }
        };
    },
    toggleFullscreen: () => {
        if (window.helpVideoManager) {
            window.helpVideoManager.toggleFullscreen();
        }
    }
};

// Inicializar la página
initializeHelpVideo(); 