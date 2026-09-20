import { Match, MatchEvent } from './types';

const DB_NAME = 'SoccerTrackerDB';
const DB_VERSION = 1;
const STORE_MATCHES = 'matches';
const STORE_EVENTS = 'events';

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes or retrieves the IndexedDB database instance
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is not available on server-side'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store: matches
      if (!db.objectStoreNames.contains(STORE_MATCHES)) {
        db.createObjectStore(STORE_MATCHES, { keyPath: 'id' });
      }

      // Store: events
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        const eventsStore = db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
        eventsStore.createIndex('matchId', 'matchId', { unique: false });
        eventsStore.createIndex('realTimestamp', 'realTimestamp', { unique: false });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;

      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Retrieves the most recent active match from IndexedDB
 */
export async function getCurrentMatch(): Promise<Match | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MATCHES], 'readonly');
      const store = transaction.objectStore(STORE_MATCHES);
      const request = store.getAll();

      request.onsuccess = () => {
        const matches: Match[] = request.result || [];
        if (matches.length === 0) {
          resolve(null);
        } else {
          // Sort descending by updatedAt
          matches.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          resolve(matches[0]);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error fetching current match from IDB:', err);
    return null;
  }
}

/**
 * Persists match record to IndexedDB
 */
export async function saveMatch(match: Match): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_MATCHES], 'readwrite');
    const store = transaction.objectStore(STORE_MATCHES);
    const updated = {
      ...match,
      updatedAt: new Date().toISOString(),
    };
    const request = store.put(updated);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Adds an event to the events store in IndexedDB
 */
export async function addEvent(event: MatchEvent): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EVENTS], 'readwrite');
    const store = transaction.objectStore(STORE_EVENTS);
    const request = store.put(event);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves all events associated with a specific matchId
 */
export async function getMatchEvents(matchId: string): Promise<MatchEvent[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_EVENTS], 'readonly');
      const store = transaction.objectStore(STORE_EVENTS);
      const index = store.index('matchId');
      const request = index.getAll(IDBKeyRange.only(matchId));

      request.onsuccess = () => {
        const events: MatchEvent[] = request.result || [];
        // Sort chronologically by realTimestamp
        events.sort((a, b) => new Date(a.realTimestamp).getTime() - new Date(b.realTimestamp).getTime());
        resolve(events);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error fetching match events from IDB:', err);
    return [];
  }
}

/**
 * Deletes a single event (e.g. for undo)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EVENTS], 'readwrite');
    const store = transaction.objectStore(STORE_EVENTS);
    const request = store.delete(eventId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes all events for a match and the match itself
 */
export async function deleteMatch(matchId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_MATCHES, STORE_EVENTS], 'readwrite');
    const matchStore = transaction.objectStore(STORE_MATCHES);
    const eventStore = transaction.objectStore(STORE_EVENTS);

    // Delete match
    matchStore.delete(matchId);

    // Delete all associated events
    const index = eventStore.index('matchId');
    const request = index.openCursor(IDBKeyRange.only(matchId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
