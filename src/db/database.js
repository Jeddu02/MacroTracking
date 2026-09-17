// Tiny promise wrapper around IndexedDB. No external dependency on purpose —
// this is the one piece of the app that must keep working fully offline, so it
// stays dependency-free and easy to audit.

const DB_NAME = 'macrofit';
const DB_VERSION = 1;

// Every store gets an auto-incrementing `id` unless noted, plus createdAt/updatedAt
// timestamps stamped by put()/add() below. Stores map 1:1 to the data model in
// the project README.
const STORES = [
  { name: 'profile', keyPath: 'id' }, // singleton, id: 'me'
  { name: 'settings', keyPath: 'id' }, // singleton, id: 'app'
  { name: 'foods', keyPath: 'id', autoIncrement: true, indexes: ['name', 'source'] },
  { name: 'foodLogs', keyPath: 'id', autoIncrement: true, indexes: ['date', 'meal'] },
  { name: 'savedMeals', keyPath: 'id', autoIncrement: true, indexes: ['name'] },
  { name: 'workoutPrograms', keyPath: 'id', autoIncrement: true },
  { name: 'workouts', keyPath: 'id', autoIncrement: true, indexes: ['date'] },
  { name: 'exercises', keyPath: 'id', autoIncrement: true, indexes: ['muscleGroup'] },
  { name: 'bodyWeights', keyPath: 'id', autoIncrement: true, indexes: ['date'] },
  { name: 'bodyMeasurements', keyPath: 'id', autoIncrement: true, indexes: ['date'] },
  { name: 'progressPhotos', keyPath: 'id', autoIncrement: true, indexes: ['date', 'angle'] },
  { name: 'waterLogs', keyPath: 'id', autoIncrement: true, indexes: ['date'] },
  { name: 'habitLogs', keyPath: 'id', autoIncrement: true, indexes: ['date'] },
  { name: 'sleepLogs', keyPath: 'id', autoIncrement: true, indexes: ['date'] },
  { name: 'personalRecords', keyPath: 'id', autoIncrement: true, indexes: ['exerciseName'] }
];

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (db.objectStoreNames.contains(store.name)) continue;
        const os = db.createObjectStore(store.name, {
          keyPath: store.keyPath,
          autoIncrement: !!store.autoIncrement
        });
        (store.indexes || []).forEach((idx) => os.createIndex(idx, idx, { unique: false }));
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDatabase().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const db = {
  async get(storeName, key) {
    const store = await tx(storeName, 'readonly');
    return wrap(store.get(key));
  },

  async getAll(storeName) {
    const store = await tx(storeName, 'readonly');
    return wrap(store.getAll());
  },

  async getAllByIndex(storeName, indexName, value) {
    const store = await tx(storeName, 'readonly');
    return wrap(store.index(indexName).getAll(value));
  },

  async put(storeName, value) {
    const now = new Date().toISOString();
    const record = { ...value, updatedAt: now, createdAt: value.createdAt || now };
    const store = await tx(storeName, 'readwrite');
    const key = await wrap(store.put(record));
    return { ...record, id: record.id ?? key };
  },

  async delete(storeName, key) {
    const store = await tx(storeName, 'readwrite');
    return wrap(store.delete(key));
  },

  async clear(storeName) {
    const store = await tx(storeName, 'readwrite');
    return wrap(store.clear());
  },

  async clearAll() {
    for (const store of STORES) {
      await this.clear(store.name);
    }
  },

  async exportAll() {
    const dump = {};
    for (const store of STORES) {
      dump[store.name] = await this.getAll(store.name);
    }
    dump.exportedAt = new Date().toISOString();
    dump.version = DB_VERSION;
    return dump;
  },

  async importAll(dump) {
    for (const store of STORES) {
      const rows = dump[store.name];
      if (!Array.isArray(rows)) continue;
      const os = await tx(store.name, 'readwrite');
      for (const row of rows) os.put(row);
    }
  },

  storeNames: STORES.map((s) => s.name)
};
