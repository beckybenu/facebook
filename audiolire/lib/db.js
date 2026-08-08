// Stockage local : bibliothèque de livres + réglages (IndexedDB).
const DB_NAME = 'audiolire';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('books')) {
        const books = db.createObjectStore('books', { keyPath: 'id' });
        books.createIndex('openedAt', 'openedAt');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, run) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const db = {
  getBook: id => tx('books', 'readonly', s => s.get(id)),
  putBook: book => tx('books', 'readwrite', s => s.put(book)),
  deleteBook: id => tx('books', 'readwrite', s => s.delete(id)),
  allBooks: () => tx('books', 'readonly', s => s.getAll()),
  getSetting: key => tx('settings', 'readonly', s => s.get(key)),
  setSetting: (key, value) => tx('settings', 'readwrite', s => s.put(value, key)),
};

// Sauvegarde de position throttlée : appelée à chaque phrase, écrit au plus
// une fois par seconde (et systématiquement au dernier appel).
export function makePositionSaver(delay = 1000) {
  let timer = null;
  let pending = null;
  const write = () => {
    timer = null;
    if (!pending) return Promise.resolve();
    const patch = pending;
    pending = null;
    return db.getBook(patch.id).then(book => {
      if (!book) return;
      Object.assign(book, patch.fields);
      return db.putBook(book);
    }).catch(() => {});
  };
  return {
    save(id, fields) {
      pending = { id, fields };
      if (timer) return;
      timer = setTimeout(write, delay);
    },
    // Renvoie une promesse : l'appelant peut attendre l'écriture avant de
    // réafficher la bibliothèque.
    flush() {
      if (timer) { clearTimeout(timer); timer = null; }
      return write();
    },
  };
}
