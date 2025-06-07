// Clasificación por categorías basada en el nombre del archivo
function categorizeFile(filename) {
  if (filename.includes('menu_data_AI_')) {
    return "Archivos de Menú AI";
  } else if (filename.includes('menu_data_X_')) {
    return "Archivos de Menú X/Twitter";
  } else if (filename.includes('menu_data_WIKI_')) {
    return "Archivos de Menú Wiki";
  } else if (filename.includes('menu_data_PDF_')) {
    return "Archivos de Menú PDF";
  } else if (filename.includes('menu_data_ePub_')) {
    return "Archivos de Menú ePub";
  } else if (filename.includes('menu_data_Gmail_')) {
    return "Archivos de Menú Gmail";
  } else if (filename.includes('menu_data_ADD_')) {
    return "Archivos de Menú ADD";
  } else if (filename === 'idiomaAI.json' || filename === 'motorAI.json' || filename === 'json-iconos.json') {
    return "Archivos de Configuración";
  } else {
    return "Otros Archivos";
  }
}

// La ruta base donde están los archivos JSON
const basePath = 'idioma/';

// Actualizar el elemento que muestra la ruta
function updatePathInfo() {
  const pathInfoElement = document.getElementById('path-info');
  if (pathInfoElement) {
    // Mostrar la ruta real de los archivos JSON en el sistema de archivos
    chrome.runtime.sendMessage({ action: 'getJsonFolderPath' }, function(response) {
      if (response && response.path) {
        pathInfoElement.textContent = `Ruta/Path: ${response.path}`;
      } else {
        pathInfoElement.textContent = `Ruta/Path: ${basePath}`;
      }
    });
  }
}

// Función para obtener dinámicamente la lista de archivos JSON
async function loadJsonFileList() {
  try {
    // Obtener la lista de archivos dinámicamente
    const response = await fetch(chrome.runtime.getURL('idioma/'));
    
    if (!response.ok) {
      throw new Error(`Error al obtener la lista de archivos: ${response.status}`);
    }
    
    // Intentar interpretar la respuesta como HTML para extraer los enlaces a archivos
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extraer los enlaces que apuntan a archivos JSON
    const links = Array.from(doc.querySelectorAll('a'));
    const jsonFiles = links
      .map(link => link.getAttribute('href'))
      .filter(href => href && href.toLowerCase().endsWith('.json'));
    
    // Si no podemos obtener los archivos mediante directorio, usaremos una estrategia alternativa
    if (jsonFiles.length === 0) {
      return await loadJsonFilesAlternative();
    }
    
    return jsonFiles;
  } catch (error) {
    console.error('Error al cargar la lista de archivos:', error);
    // Fallback: Usar estrategia alternativa
    return await loadJsonFilesAlternative();
  }
}

// Estrategia alternativa: Intentar cargar los archivos individualmente
async function loadJsonFilesAlternative() {
  console.log("Usando estrategia alternativa para detectar archivos JSON");
  
  // Lista base de prefijos comunes para buscar
  const prefixes = [
    "menu_data_AI_",
    "menu_data_X_",
    "menu_data_WIKI_",
    "menu_data_PDF_",
    "menu_data_ePub_",
    "menu_data_Gmail_",
    "menu_data_ADD_"
  ];
  
  // Lista de sufijos (códigos de idioma) para probar
  const suffixes = [
    "ES.json", "GB.json", "CA.json", "FR.json", "DE.json",
    "IT.json", "PT.json", "AR.json", "ZH.json", "RU.json",
    "JA.json", "HI.json", "KR.json", "EN.json"
  ];
  
  // Archivos específicos que sabemos que existen
  const knownFiles = ["idiomaAI.json", "motorAI.json", "json-iconos.json"];
  
  const existingFiles = [];
  
  // Verificar cada combinación posible
  const checkPromises = [];
  
  // Agregar archivos conocidos
  for (const file of knownFiles) {
    checkPromises.push(checkFileExists(`idioma/${file}`).then(exists => {
      if (exists) existingFiles.push(file);
    }));
  }
  
  // Verificar combinaciones de prefijo y sufijo
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      const filename = prefix + suffix;
      checkPromises.push(checkFileExists(`idioma/${filename}`).then(exists => {
        if (exists) existingFiles.push(filename);
      }));
    }
  }
  
  // Esperar a que terminen todas las comprobaciones
  await Promise.all(checkPromises);
  
  return existingFiles;
}

// Función para verificar si un archivo existe
async function checkFileExists(url) {
  try {
    const response = await fetch(chrome.runtime.getURL(url), { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Función para obtener el tamaño de un archivo
async function getFileSize(filename) {
  try {
    const response = await fetch(chrome.runtime.getURL(`idioma/${filename}`));
    if (!response.ok) {
      throw new Error(`Error al obtener el archivo: ${response.status}`);
    }
    
    const blob = await response.blob();
    const sizeInKB = (blob.size / 1024).toFixed(1);
    return `${sizeInKB}KB`;
  } catch (error) {
    console.error(`Error al obtener el tamaño de ${filename}:`, error);
    return "Desconocido";
  }
}

// Función para cargar los archivos en la interfaz
async function loadFiles() {
  const fileContainer = document.getElementById('file-container');
  fileContainer.innerHTML = '<div class="loading">Cargando archivos JSON...</div>';
  
  try {
    // Actualizar la información de la ruta
    updatePathInfo();
    
    // Obtener la lista de archivos JSON
    const files = await loadJsonFileList();
    
    if (files.length === 0) {
      fileContainer.innerHTML = '<div class="error">No se encontraron archivos JSON</div>';
      return;
    }
    
    // Limpiar contenedor
    fileContainer.innerHTML = '';
    
    // Organizar archivos por categoría
    const filesByCategory = {};
    
    // Clasificar cada archivo en su categoría
    for (const file of files) {
      const category = categorizeFile(file);
      
      if (!filesByCategory[category]) {
        filesByCategory[category] = [];
      }
      
      filesByCategory[category].push(file);
    }
    
    // Para cada categoría, mostrar los archivos
    for (const [category, categoryFiles] of Object.entries(filesByCategory)) {
      // Ordenar archivos alfabéticamente
      categoryFiles.sort();
      
      // Agregar encabezado de categoría
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'category-header';
      categoryHeader.textContent = category;
      fileContainer.appendChild(categoryHeader);
      
      // Agregar los archivos de esta categoría
      for (const file of categoryFiles) {
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.dataset.filename = file;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file;
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = '<span class="loading-size">Calculando tamaño...</span>';
        
        fileCard.appendChild(fileName);
        fileCard.appendChild(fileInfo);
        
        // Agregar evento de clic para descargar
        fileCard.addEventListener('click', function() {
          downloadFile(file);
        });
        
        fileContainer.appendChild(fileCard);
        
        // Obtener y mostrar el tamaño del archivo (asíncrono)
        getFileSize(file).then(size => {
          fileInfo.innerHTML = `Tamaño: <span class="file-size">${size}</span>`;
        });
      }
    }
  } catch (error) {
    console.error('Error al cargar los archivos:', error);
    fileContainer.innerHTML = `<div class="error">Error al cargar archivos: ${error.message}</div>`;
  }
}

// Función para descargar un archivo
function downloadFile(filename) {
  // La ruta base donde están los archivos JSON
  const filepath = basePath + filename;
  
  // Realizar la solicitud para obtener el contenido del archivo
  fetch(chrome.runtime.getURL(filepath))
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error al cargar el archivo: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Crear un blob con el contenido JSON formateado
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      // Crear un enlace de descarga y hacer clic en él
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Limpiar
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Error al descargar el archivo:', error);
      alert(`Error al descargar ${filename}: ${error.message}`);
    });
}

// Listener para el botón de volver
document.addEventListener('DOMContentLoaded', function() {
  // Configurar el botón de volver
  setupBackButton();
  
  // Cargar la lista de archivos
  loadFiles();
});

// Configurar el botón de volver
function setupBackButton() {
  const backButton = document.getElementById('back-button');
  
  if (backButton) {
    backButton.addEventListener('click', function() {
      // Cerrar la pestaña actual
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
      });
    });
  }
} 