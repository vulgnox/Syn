// lib/sandbox/storage.js
// Namespaced storage — the foundation of the app sandbox (Phase 3).
// Every app/ subsystem gets its own prefix so data can't leak across apps.

const PREFIX = 'syn.';

export function createNamespacedStorage(namespace) {
    const key = (k) => `${PREFIX}${namespace}.${k}`;

    return {
        get(k, fallback = null) {
            if (typeof window === 'undefined') return fallback; // SSR-safe
            try {
                const raw = window.localStorage.getItem(key(k));
                return raw === null ? fallback : JSON.parse(raw);
            } catch {
                return fallback;
            }
        },
        set(k, value) {
            if (typeof window === 'undefined') return false;
            try {
                window.localStorage.setItem(key(k), JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },
        remove(k) {
            if (typeof window === 'undefined') return false;
            try {
                window.localStorage.removeItem(key(k));
                return true;
            } catch {
                return false;
            }
        },
    };
}

export default createNamespacedStorage;
