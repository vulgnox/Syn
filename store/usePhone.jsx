import { create } from 'zustand';
import Phone from '@/components/Phone';
import { createNamespacedStorage } from '@/lib/sandbox/storage';

// Security subsystem storage (namespaced — Phase 2 dogfoods the Phase 3 sandbox)
const secStorage = createNamespacedStorage('sec');

// Demo-grade admin PIN for 'protected:' permissions. Frontend-only auth (Open
// Question 1 resolved) — replace with backend auth if the OS ever connects.
const DEFAULT_ADMIN_PIN = '1234';

const usePhoneStore = create((set, get) => ({
    locked: true,
    qs: false,
    bios: false,
    toggleQs: () => set((state) => ({ qs: !state.qs })),
    setQs: (v) => set({ qs: v }),
    setBios: (v) => set({ bios: v }),

    // Phase 4: locking is auth-aware. Direct unlocks are only honored when the
    // device is authenticated — otherwise the lock screen demands the PIN.
    toggleLock: () => set((state) => {
        if (state.locked) {
            return state.authed ? { locked: false } : {};
        }
        return { locked: true, authed: false };
    }),

    currentTime: new Date(),
    setCurrentTime: () => set({ currentTime: new Date() }),

    // perm: 'normal' | 'permission:<name>' | 'protected:<name>'
    // NOTE: 'permission:camera' currently sits on app id 4 as a stand-in until
    // the Camera teammate ships their app — move it to the real Camera then.
    allApps: [
        { id: 1, name: 'Phone', icon: '/phone.png', comp: <Phone />, perm: 'normal' },
        { id: 2, name: 'Messages', icon: '/messages.png', perm: 'normal' },
        { id: 3, name: 'Camera', icon: '/camera.webp', perm: 'normal' },
        { id: 4, name: 'Phone', icon: '/phone.png', comp: <Phone />, perm: 'permission:camera' },
        { id: 5, name: 'Messages', icon: '/messages.png', perm: 'normal' },
    ],

    currentApp: null,
    openedApps: [],
    openApp: (app) => set((state) => ({
        currentApp: app,
        openedApps: [...state.openedApps, app],
    })),
    backFromApp: () => set({ currentApp: null }),
    closeApp: (app) => set((state) => ({
        currentApp: state.currentApp === app ? null : state.currentApp,
        openedApps: state.openedApps.filter((a) => a !== app),
    })),

    // ---- Security & Permissions (Phase 2) ----

    grantedPerms: secStorage.get('grantedPerms', []),
    permRequest: null, // { perm, action: 'open-app' | 'open-bios', appId }

    canOpen: (perm) => {
        if (!perm || perm === 'normal') return true;
        return get().grantedPerms.includes(perm);
    },

    requestPerm: (perm, action = 'open-app', appId = null) =>
        set({ permRequest: { perm, action, appId } }),

    // Returns 'ok' | 'bad-pin'. Performs the pending action only if allowed.
    resolvePerm: (allow, pin = '') => {
        const req = get().permRequest;
        if (!req) return 'ok';

        const isProtected = req.perm.startsWith('protected:');

        if (allow && isProtected) {
            const adminPin = secStorage.get('adminPin', DEFAULT_ADMIN_PIN);
            if (pin !== adminPin) return 'bad-pin';
        }

        if (allow && !get().grantedPerms.includes(req.perm)) {
            const next = [...get().grantedPerms, req.perm];
            secStorage.set('grantedPerms', next);
            set({ grantedPerms: next });
        }

        const { action, appId } = req;
        set({ permRequest: null });

        if (allow) {
            if (action === 'open-app' && appId !== null) get().openApp(appId);
            if (action === 'open-bios') set({ bios: true });
        }

        return 'ok';
    },

    // ---- Device Authentication (Phase 4) ----

    authed: false, // has the user proven themselves since the last lock?
    devicePin: secStorage.get('devicePin', null), // null until first setup

    // 'ok' | 'bad-pin'. If no PIN exists yet, the first call creates it.
    auth: (pin) => {
        const { devicePin } = get();

        if (devicePin === null || devicePin === undefined) {
            secStorage.set('devicePin', pin); // demo-grade (plaintext, local only)
            set({ devicePin: pin, authed: true });
            return 'ok';
        }

        if (pin === devicePin) {
            set({ authed: true });
            return 'ok';
        }

        return 'bad-pin';
    },
}));

export default usePhoneStore;
