import { getAIUrls } from '/src/common/common.js';

let AI_URLS = {};

async function init() {
    AI_URLS = await getAIUrls();
}

// Verificar si la URL actual coincide con el servicio seleccionado
function isCorrectAIWebsite(currentUrl, selectedAI) {
    if (selectedAI === 'google') return true;
    const aiUrl = AI_URLS[selectedAI];
    if (!aiUrl) return false;
    const aiDomain = new URL(aiUrl).hostname.replace('www.', '');
    const currentDomain = new URL(currentUrl).hostname.replace('www.', '');
    return currentDomain.includes(aiDomain.split('.')[0]) || aiDomain.includes(currentDomain.split('.')[0]);
}

// Abrir nueva pestaña con el servicio de IA correcto
async function openCorrectAITab(selectedAI) {
    const url = AI_URLS[selectedAI];
    if (!url) throw new Error(`No hay URL definida para ${selectedAI}`);
    
    const newTab = await chrome.tabs.create({ url: url, active: true });
    
    return new Promise((resolve) => {
        const checkTabLoaded = () => {
            chrome.tabs.get(newTab.id, (tab) => {
                if (tab.status === 'complete') {
                    resolve(tab);
                } else {
                    setTimeout(checkTabLoaded, 500);
                }
            });
        };
        checkTabLoaded();
    });
}

// Cargar preferencia guardada
async function loadUserPreference() {
    try {
        const result = await chrome.storage.sync.get(['selectedAI']);
        const value = result.selectedAI || 'chatgpt';
        const radioButton = document.querySelector(`input[name="aiService"][value="${value}"]`);
        if (radioButton) radioButton.checked = true;
    } catch (error) {
        // Error silencioso - usará chatgpt por defecto
    }
}

// Guardar preferencia
async function saveUserPreference(selectedAI) {
    try {
        await chrome.storage.sync.set({ selectedAI: selectedAI });
    } catch (error) {
        // Error silencioso - no crítico
    }
}

// Obtener servicio seleccionado
function getSelectedAI() {
    const selectedRadio = document.querySelector('input[name="aiService"]:checked');
    return selectedRadio ? selectedRadio.value : null;
}

// Enviar texto
async function textToAI(textPrompt, targetTab = null) {
    const tab = targetTab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('No se puede ejecutar en esta página');
    }

    if (!targetTab) await chrome.tabs.reload(tab.id);
    
    const isSpecialSite = tab.url.includes('facebook.com') || tab.url.includes('instagram.com') || 
                         tab.url.includes('meta.ai') || tab.url.includes('messenger.com') ||
                         tab.url.includes('copilot.microsoft.com') || tab.url.includes('github.com/features/copilot') ||
                         tab.url.includes('grok.com') || tab.url.includes('deepseek.com') ||
                         tab.url.includes('mistral.ai') || tab.url.includes('mail.google.com') || tab.url.includes('gmail.com') ||
                         tab.url.includes('claude.ai') || tab.url.includes('openai.com') || tab.url.includes('gemini.google.com');
    
    // Tiempo extra para Mistral que puede necesitar más tiempo para cargar
    const isMistral = tab.url.includes('mistral.ai');
    const waitTime = isMistral ? 3500 : (isSpecialSite ? 2500 : 1500);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));

    return await chrome.tabs.sendMessage(tab.id, {
        action: 'insertarTexto',
        texto: textPrompt,
        submit: true // ¡NUEVO! Indicamos que queremos enviar el prompt
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', async function() {
    await loadUserPreference();
    
    document.querySelectorAll('input[name="aiService"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) saveUserPreference(this.value);
        });
    });
});

// Botón YES
document.getElementById('yesButton').addEventListener('click', async function() {
    this.disabled = true;
    
    try {
        const selectedAI = getSelectedAI();
        if (!selectedAI) throw new Error('No hay servicio seleccionado');
        
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const textPrompt = prompt("Escribe / Write a Question") || "";
    
        if (textPrompt === "") {
            alert("You have to write a question");
            return;
        }

        
        // OJU OSCAR: AÑADIR AQUÍ EL TEXTO QUE QUIERAS AÑADIR AL PROMPT
        // textPrompt = textPrompt + "yes yes yes yes";

        if (selectedAI === 'allai') {
            // Confirmar antes de abrir todas las AI's
            const confirmOpen = confirm("Voy a abrir todas las AI's");
            if (!confirmOpen) {
                this.disabled = false; // Re-habilitar el botón si cancela
                return;
            }

            const newTabChatgpt = await openCorrectAITab('chatgpt');
            await textToAI(textPrompt, newTabChatgpt);

            const newTabClaude = await openCorrectAITab('claude');
            await textToAI(textPrompt, newTabClaude);

            const newTabDeepseek = await openCorrectAITab('deepseek');
            await textToAI(textPrompt, newTabDeepseek);

            const newTabCopilot = await openCorrectAITab('copilot');
            await textToAI(textPrompt, newTabCopilot);

            const newTabGemini = await openCorrectAITab('gemini');
            await textToAI(textPrompt, newTabGemini);

            const newTabGrok = await openCorrectAITab('grok');
            await textToAI(textPrompt, newTabGrok);

            const newTabMeta = await openCorrectAITab('meta');
            await textToAI(textPrompt, newTabMeta);

            const newTabMistral = await openCorrectAITab('mistral');
            await textToAI(textPrompt, newTabMistral);

            const newTabGoogle = await openCorrectAITab('google');
            await textToAI(textPrompt, newTabGoogle);

        } else {
            if (selectedAI !== 'google' && !isCorrectAIWebsite(currentTab.url, selectedAI)) {
                const newTab = await openCorrectAITab(selectedAI);
                //alert('sidebar newtab')
                await textToAI(textPrompt, newTab);

            } else {
                //alert('sidebar currenttab')
                await textToAI(textPrompt);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        this.disabled = false;
    }
}); 

// Siempre inicializar al cargar el script
init();