"use client";

import React, { useState } from 'react';
import usePhoneStore from '@/store/usePhone';

const humanize = (perm) => {
    const name = perm.split(':')[1] || perm;
    return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const PermissionPrompt = () => {
    const { permRequest, resolvePerm } = usePhoneStore();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!permRequest) return null;

    const isProtected = permRequest.perm.startsWith('protected:');
    const label = humanize(permRequest.perm);

    const handleAllow = () => {
        const result = resolvePerm(true, pin);
        if (result === 'bad-pin') {
            setError('Incorrect admin PIN');
            setPin('');
        } else {
            setPin('');
            setError('');
        }
    };

    const handleDeny = () => {
        resolvePerm(false);
        setPin('');
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
            <div className="w-72 rounded-2xl bg-gray-900 text-white p-5 shadow-xl">
                <h2 className="text-lg font-semibold mb-1">
                    {isProtected ? 'Protected area' : 'Permission required'}
                </h2>

                <p className="text-sm text-gray-300 mb-4">
                    {isProtected
                        ? `${label} requires admin access. Enter the admin PIN to continue.`
                        : `An app is requesting ${label} access.`}
                </p>

                {isProtected && (
                    <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Admin PIN"
                        className="w-full mb-2 p-2 px-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none text-center tracking-widest"
                    />
                )}

                {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleDeny}
                        className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm cursor-pointer"
                    >
                        Deny
                    </button>
                    <button
                        onClick={handleAllow}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm cursor-pointer"
                    >
                        {isProtected ? 'Unlock' : 'Allow'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionPrompt;
