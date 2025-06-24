// /src/background/fileWatcher.js

// Almacenará el último contenido conocido de los archivos para compararlos.
const lastFileContents = {};
const customFileNames = ['custom_1.json', 'custom_2.json', 'custom_3.json', 'custom_4.json'];

/**
 * Comprueba si el contenido de un archivo ha cambiado desde la última vez que se revisó.
 * @param {string} fileName - El nombre del archivo a comprobar.
 */
async function checkFileForChanges(fileName) {
  try {
    // Usamos 'no-store' para asegurarnos de que no estamos leyendo una versión en caché del archivo.
    const fileUrl = chrome.runtime.getURL(`src/common/languages/custom/${fileName}`);
    const response = await fetch(fileUrl, { cache: 'no-store' });

    if (response.ok) {
      const newContent = await response.text();

      // Si el archivo es nuevo (no está en lastFileContents) o su contenido ha cambiado...
      if (lastFileContents[fileName] === undefined || lastFileContents[fileName] !== newContent) {
        // Si no es la primera vez que lo vemos (es decir, es un cambio real y no la carga inicial)...
        if (lastFileContents[fileName] !== undefined) {
          console.log(`🔄 Cambio detectado en ${fileName}. Recargando sidebar...`);
          // Enviamos un mensaje a cualquier sidebar que esté abierta.
          chrome.runtime.sendMessage({ action: 'reloadSidebar' });
        }
        // Actualizamos el contenido guardado con el nuevo.
        lastFileContents[fileName] = newContent;
      }
    } else {
      // Si el archivo ya no existe pero lo teníamos registrado, es un cambio (eliminación).
      if (lastFileContents.hasOwnProperty(fileName)) {
        console.log(`🗑️ Archivo ${fileName} eliminado. Recargando sidebar...`);
        delete lastFileContents[fileName];
        chrome.runtime.sendMessage({ action: 'reloadSidebar' });
      }
    }
  } catch (error) {
    // Si el archivo no existe y no lo teníamos, no hacemos nada.
    // Esto es normal si el usuario no ha creado todos los custom_X.json.
  }
}

/**
 * Inicia un intervalo para vigilar los cambios en los archivos custom.
 */
export function startFileWatcher() {
  console.log('👁️ Iniciando vigilancia de archivos custom...');
  // Comprobamos los archivos cada 3 segundos.
  setInterval(() => {
    customFileNames.forEach(fileName => checkFileForChanges(fileName));
  }, 3000);
}