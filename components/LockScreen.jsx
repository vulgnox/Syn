"use client";

import React, { useEffect, useState } from 'react'
import usePhoneStore from '@/store/usePhone';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';

const LockScreen = ({ unlock }) => {
    const { currentTime, setCurrentTime, authed, devicePin, auth } = usePhoneStore();
    const [pinMode, setPinMode] = useState(null); // null | 'enter' | 'create'
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const interval = setInterval(setCurrentTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [setCurrentTime]);

    const reset = () => {
        setPin('');
        setConfirm('');
        setError('');
    };

    // Phase 4: swipe only unlocks an authenticated device. Otherwise it
    // surfaces the PIN challenge instead of the home screen.
    const handlers = useSwipeable({
        onSwipedUp: () => {
            if (authed) {
                unlock();
                return;
            }
            setPinMode(devicePin ? 'enter' : 'create');
            reset();
        },
        swipeDuration: 5000,
        preventScrollOnSwipe: true,
        trackMouse: true
    });

    const handleAuth = () => {
        if (pinMode === 'enter') {
            if (auth(pin) === 'ok') {
                unlock();
                setPinMode(null);
                reset();
            } else {
                setError('Wrong PIN');
                setPin('');
            }
            return;
        }

        // create mode
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        if (pin !== confirm) {
            setError("PINs don't match");
            return;
        }
        auth(pin); // creates the PIN
        unlock();
        setPinMode(null);
        reset();
    };

    const pinInput = (value, onChange, placeholder) => (
        <input
            type="password"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            placeholder={placeholder}
            className="w-48 mb-3 p-2.5 px-3 rounded-xl bg-white/10 border border-white/30 focus:outline-none text-center text-white text-xl tracking-[0.4em] placeholder:tracking-normal placeholder:text-white/40"
        />
    );

    return (
        <div className="h-full w-full flex flex-col justify-center gap-40" style={{ backgroundImage: "url('/wall.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }} {...handlers}>
            <Image src="/wall.webp" alt="Background" layout="fill" className="absolute -z-10 object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />

            <div className="text-6xl text-center text-white" suppressHydrationWarning>
                {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
            </div>

            {!pinMode && (
                <div className="text-center w-full block">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-26 mx-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>

                    <span className='text-white' style={{
                        fontSize: '3.6vh',
                    }}>Swipe To Unlock</span>
                </div>
            )}

            {pinMode && (
                <div className="w-full flex flex-col items-center">
                    <h2 className="text-white text-xl font-semibold mb-4">
                        {pinMode === 'create' ? 'Create a device PIN' : 'Enter PIN'}
                    </h2>

                    {pinMode === 'create' ? (
                        <>
                            {pinInput(pin, setPin, 'PIN (4+ digits)')}
                            {pinInput(confirm, setConfirm, 'Confirm PIN')}
                        </>
                    ) : (
                        pinInput(pin, setPin, 'PIN')
                    )}

                    {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

                    <button
                        onClick={handleAuth}
                        className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-lg cursor-pointer"
                    >
                        {pinMode === 'create' ? 'Set PIN & Unlock' : 'Unlock'}
                    </button>

                    {pinMode === 'enter' && (
                        <button
                            onClick={() => { setPinMode(null); reset(); }}
                            className="mt-4 text-white/60 text-sm underline cursor-pointer"
                        >
                            Back
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default LockScreen;
