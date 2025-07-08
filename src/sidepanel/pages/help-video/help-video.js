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
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.updateLanguageTexts();
        this.setupTimeout();
        this.setupKeyboardHandlers();
        this.logInitialization();
        this.sendAnalytics('help_video_opened');
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
            this.closeWindow();
        };
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
        const container = document.querySelector('.container');
        
        // Animación de cierre
        if (container) {
            container.style.transition = 'all 0.3s ease';
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0';
        }
        
        setTimeout(() => {
            // Intentar cerrar la pestaña
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
            }
        }, 300);

        this.sendAnalytics('help_video_closed');
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
        
        // Actualizar textos según el idioma detectado
        document.querySelector('.header h1 span').textContent = translations.title;
        document.querySelector('.header p').textContent = translations.subtitle;
        document.querySelector('.footer p').textContent = translations.footerText;
        document.querySelector('.close-button').textContent = translations.closeButton;
        
        // Actualizar textos de elementos con contenido dinámico
        this.loading.innerHTML = `<div class="spinner"></div>${translations.loading}`;
        this.errorMessage.innerHTML = translations.error;
        this.successIndicator.textContent = translations.success;
        
        // Actualizar el título de la página
        document.title = `AI Prompt Assistant ${translations.pageTitle}`;
    }

    getTranslations() {
        const lang = this.userLanguage.toLowerCase();
        
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
                title: '- Vidéo d\'aide',
                subtitle: 'Apprenez à utiliser l\'extension facilement et rapidement',
                footerText: '🚀 Merci d\'utiliser AI Prompt Assistant !',
                closeButton: '✨ Fermer et commencer à utiliser l\'extension',
                loading: 'Chargement de la vidéo...',
                error: '⚠️ Erreur lors du chargement de la vidéo. Veuillez vérifier votre connexion internet et réessayer.',
                success: '✅ Vidéo chargée avec succès',
                pageTitle: '- Vidéo d\'aide'
            };
        } else if (lang.startsWith('de')) {
            return {
                title: '- Hilfevideo',
                subtitle: 'Lernen Sie, die Erweiterung einfach und schnell zu verwenden',
                footerText: '🚀 Vielen Dank für die Nutzung von AI Prompt Assistant!',
                closeButton: '✨ Schließen und Erweiterung verwenden',
                loading: 'Video wird geladen...',
                error: '⚠️ Fehler beim Laden des Videos. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
                success: '✅ Video erfolgreich geladen',
                pageTitle: '- Hilfevideo'
            };
        } else if (lang.startsWith('it')) {
            return {
                title: '- Video di aiuto',
                subtitle: 'Impara a usare l\'estensione facilmente e velocemente',
                footerText: '🚀 Grazie per aver utilizzato AI Prompt Assistant!',
                closeButton: '✨ Chiudi e inizia a utilizzare l\'estensione',
                loading: 'Caricamento video...',
                error: '⚠️ Errore nel caricamento del video. Si prega di controllare la connessione internet e riprovare.',
                success: '✅ Video caricato con successo',
                pageTitle: '- Video di aiuto'
            };
        } else if (lang.startsWith('pt')) {
            return {
                title: '- Vídeo de ajuda',
                subtitle: 'Aprenda a usar a extensão de forma fácil e rápida',
                footerText: '🚀 Obrigado por usar o AI Prompt Assistant!',
                closeButton: '✨ Fechar e começar a usar a extensão',
                loading: 'Carregando vídeo...',
                error: '⚠️ Erro ao carregar o vídeo. Por favor, verifique sua conexão com a internet e tente novamente.',
                success: '✅ Vídeo carregado com sucesso',
                pageTitle: '- Vídeo de ajuda'
            };
        } else {
            // Español por defecto
            return {
                title: '- Video de Ayuda',
                subtitle: 'Aprende a usar la extensión de manera fácil y rápida',
                footerText: '🚀 ¡Gracias por usar AI Prompt Assistant!',
                closeButton: '✨ Cerrar y empezar a usar la extensión',
                loading: 'Cargando video...',
                error: '⚠️ Error al cargar el video. Por favor, verifica tu conexión a internet e inténtalo de nuevo.',
                success: '✅ Video cargado correctamente',
                pageTitle: '- Video de Ayuda'
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
                language: this.userLanguage,
                userAgent: navigator.userAgent
            }).catch(() => {
                // Silenciar errores si no hay background script disponible
            });
        }
    }

    logInitialization() {
        console.log('🎥 AI Prompt Assistant - Help Video Page');
        console.log('📺 URL del video:', this.iframe?.src || 'No disponible');
        console.log('🌐 Idioma detectado:', this.userLanguage);
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