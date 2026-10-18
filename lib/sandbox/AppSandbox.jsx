"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { createNamespacedStorage } from './storage';
import usePhoneStore from '@/store/usePhone';

/**
 * AppSandbox — the app sandbox runtime.
 *
 * Every app component renders inside <AppSandbox>. Apps get a scoped API via
 * useSandbox() and must NOT import usePhoneStore or touch localStorage directly.
 *
 * Sandbox API surface (what apps are allowed to touch):
 *   const { appId, storage, close } = useSandbox();
 *   - appId   : this app's manifest id
 *   - storage : namespaced persistent storage (get/set/remove) — the app can
 *               only ever see its own `syn.app.<id>.*` keys
 *   - close   : return to the home screen
 *
 * Crash isolation: if an app throws during render, the boundary unmounts the
 * app, returns to home (via onCrash), and logs the error — the OS keeps running.
 */

const SandboxContext = createContext(null);

class Boundary extends React.Component {
    state = { crashed: false };

    static getDerivedStateFromError() {
        return { crashed: true };
    }

    componentDidCatch(error, info) {
        console.error(
            `[sandbox] app "${this.props.appId}" crashed and was unmounted:`,
            error,
            info.componentStack
        );
        this.props.onCrash?.(error);
    }

    render() {
        if (this.state.crashed) return null;
        return this.props.children;
    }
}

export function AppSandbox({ appId, onCrash, children }) {
    const value = useMemo(() => ({
        appId,
        storage: createNamespacedStorage(`app.${appId}`),
        close: () => usePhoneStore.getState().backFromApp(),
    }), [appId]);

    return (
        <SandboxContext.Provider value={value}>
            <Boundary appId={appId} onCrash={onCrash}>
                {children}
            </Boundary>
        </SandboxContext.Provider>
    );
}

export function useSandbox() {
    const ctx = useContext(SandboxContext);
    if (!ctx) {
        throw new Error('useSandbox() must be used inside <AppSandbox> (app components only)');
    }
    return ctx;
}

export default AppSandbox;
