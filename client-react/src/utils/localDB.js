export const DB_NAME = 'NodeMapDB';
export const DB_VERSION = 1;

let dbInstance = null;

export function initLocalDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log("IndexedDB inicializado correctamente.");
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log("Creando/Actualizando stores de IndexedDB...");

      // Works Stores
      if (!db.objectStoreNames.contains('mensajes_work')) {
        const store = db.createObjectStore('mensajes_work', { keyPath: 'id' });
        store.createIndex('canal', 'canal', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('preferencias_work')) {
        db.createObjectStore('preferencias_work', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('notificaciones_work')) {
        const store = db.createObjectStore('notificaciones_work', { keyPath: 'id' });
        store.createIndex('leida', 'leida', { unique: false });
      }

      // Consumer Stores
      if (!db.objectStoreNames.contains('mensajes_privados')) {
        const store = db.createObjectStore('mensajes_privados', { keyPath: 'id' });
        store.createIndex('peerId', 'peerId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('preferencias_consumer')) {
        db.createObjectStore('preferencias_consumer', { keyPath: 'key' });
      }
    };
  });
}

// Funciones de utilidad genéricas
export async function getLocalData(storeName, key) {
  if (!dbInstance) await initLocalDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setLocalData(storeName, item) {
  if (!dbInstance) await initLocalDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFromStore(storeName) {
  if (!dbInstance) await initLocalDB();
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
