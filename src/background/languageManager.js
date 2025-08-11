// languageManager.js

let availableLanguages = [];

export async function loadAvailableLanguages() {
  try {
    const response = await fetch('/src/common/languages/idiomaAI.json');
    if (!response.ok) {
      throw new Error(`Error al cargar idiomaAI.json: ${response.status}`);
    }
    const data = await response.json();
    availableLanguages = data.idiomas || [];
    console.log('Idiomas cargados:', availableLanguages);
    return availableLanguages;
  } catch (error) {
    console.error('Error al cargar los idiomas:', error);
    availableLanguages = [
      { nombreNativo: "English", codigoISO: "gb", nombreEspanol: "Inglés" },
      { nombreNativo: "Español", codigoISO: "es", nombreEspanol: "Español" }
    ];
    return availableLanguages; // Devuelve un default básico
  }
}

export function getAvailableLanguages() {
  return availableLanguages;
}