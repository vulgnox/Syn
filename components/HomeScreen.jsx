import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from "motion/react";
import { PiTriangleFill } from "react-icons/pi";
import { FaBars, FaRegCircleDot } from "react-icons/fa6";
import usePhoneStore from '@/store/usePhone';
import Image from 'next/image';
import Quicksettings from './Quicksettings';
import { AppSandbox } from '@/lib/sandbox/AppSandbox';

const HomeScreen = () => {
    const { qs, setQs, toggleQs, currentApp, openApp, backFromApp, toggleLock, currentTime, setCurrentTime, allApps, canOpen, requestPerm } = usePhoneStore();
    const [speed, setSpeed] = useState("");
    const [anim, setAnim] = useState(0); // State to force re-render
    const [key, setKey] = useState(0);

    useEffect(() => {
        const timeInterval = setInterval(setCurrentTime, 60000);

        return () => clearInterval(timeInterval);
    }, []);

    useEffect(() => {
        if (navigator.connection) {
            setSpeed(navigator.connection.effectiveType);
        }

        function updateConnectionStatus() {
            setSpeed(navigator.connection.effectiveType);
        }

        if (navigator.connection) {
            navigator.connection.addEventListener("change", updateConnectionStatus);
        }

        return () => {
            if (navigator.connection) {
                navigator.connection.removeEventListener("change", updateConnectionStatus);
            }
        };
    }, []);

    const handleAppClick = (app) => {
        if (!app.comp) return;

        const perm = app.perm || 'normal';
        if (canOpen(perm)) {
            openApp(app.id);
        } else {
            // Prompt renders at the page root; on grant it opens the app automatically.
            requestPerm(perm, 'open-app', app.id);
        }
    };

    return (
        <div className='h-full w-full text-white text-2xl bg-gradient-to-b from-blue-500 to-blue-700'>
            <div className="bg-gray-900 h-[4.5%] px-4.5 w-full flex justify-between items-center text-xs text-white sm:px-3.5">
                <span suppressHydrationWarning>
                    {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                </span>
                <span suppressHydrationWarning>
                    {speed && `${speed}📶`}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {currentApp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, borderRadius: '5rem' }}
                        animate={{ opacity: 1, scale: 1, borderRadius: '0rem' }}
                        exit={{ opacity: 0, scale: 0, borderRadius: '5rem' }}
                        transition={{ duration: 0.15 }}
                        key="app-screen"
                        className="h-[calc(100%-11.5%)] absolute z-1 w-full overflow-hidden"
                    >
                        {/* Phase 3: every app runs inside the sandbox. A crash
                            unmounts the app and returns here, not a white screen. */}
                        <AppSandbox appId={allApps[currentApp - 1].id} onCrash={backFromApp}>
                            {allApps[currentApp - 1].comp}
                        </AppSandbox>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                key="home-screen"
                className='h-[calc(100%-11.5%)] w-full grid grid-cols-4 gap-1 gap-y-0 p-2'
                style={{ alignItems: 'start' }}
            >
                {allApps.map((app) => (
                    <motion.button
                        key={app.name}
                        onClick={() => handleAppClick(app)}
                        whileTap={{ scale: 0.99 }}
                        whileHover={{ scale: 1.01 }}
                        className={`flex flex-col items-center ${!app.comp ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={!app.comp}
                    >
                        <Image
                            src={app.icon}
                            alt={app.name}
                            draggable={"false"}
                            width={44}
                            height={44}
                            className='w-11 h-11 object-cover rounded-xl mb-2 shadow-lg'
                        />

                        <span className='text-white drop-shadow-md' style={{
                            fontSize: '0.6rem'
                        }}>{app.name}</span>
                    </motion.button>
                ))}
            </motion.div>

            <div className="bg-gray-900 h-[7%] px-4.5 w-full flex justify-around items-center text-base text-white sm:px-3.5 absolute z-5">
                <span className='cursor-pointer rounded-full px-6 py-2 relative overflow-hidden w-1/3 h-4/5'>
                    <AnimatePresence>
                        {anim == 1 && (
                            <motion.div
                                key={key}
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50/30 rounded-full w-full h-full"
                            />
                        )}
                    </AnimatePresence>

                    <span
                        className='cursor-pointer rounded-full h-full w-full absolute left-0 top-0 grid place-items-center z-10'
                        onClick={() => {
                            setAnim(1);
                            toggleQs();
                            setKey(k => k + 1);
                            setTimeout(() => setAnim(0), 500);
                        }}
                    >
                        <FaBars />
                    </span>
                </span>

                <span className='cursor-pointer rounded-full px-6 py-2 relative overflow-hidden w-1/3 h-4/5' onClick={backFromApp} onDoubleClick={toggleLock}>
                    <AnimatePresence>
                        {anim == 2 && (
                            <motion.div
                                key={key}
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50/30 rounded-full w-full h-full"
                            />
                        )}
                    </AnimatePresence>
                    <span
                        className='cursor-pointer rounded-full h-full w-full absolute left-0 top-0 grid place-items-center z-10'
                        onClick={() => {
                            setAnim(2);
                            setQs(false);
                            setKey(k => k + 1);
                            setTimeout(() => setAnim(0), 500);
                        }}
                    >
                        <FaRegCircleDot />
                    </span>
                </span>

                <span className='cursor-pointer rounded-full px-6 py-2 relative overflow-hidden w-1/3 h-4/5'>
                    <AnimatePresence>
                        {anim == 3 && (
                            <motion.div
                                key={key}
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50/30 rounded-full w-full h-full"
                            />
                        )}
                    </AnimatePresence>

                    <span
                        className='cursor-pointer rounded-full h-full w-full absolute left-0 top-0 grid place-items-center z-10'
                        onClick={() => {
                            setAnim(3);
                            setKey(k => k + 1);
                            setTimeout(() => setAnim(0), 500);
                        }}
                    >
                        <PiTriangleFill className='-rotate-90' />
                    </span>
                </span>
            </div>

            {/* <AnimatePresence>
                {qs
                    && <motion.div
                        key="quick-settings"
                        initial={{ opacity: 0, top: '0%' }}
                        animate={{ opacity: 1, top: '0%' }}
                        exit={{ opacity: 1, top: '-100%' }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full absolute z-10"
                    >
                        <Quicksettings unlock={toggleLock} />
                    </motion.div>
                }
                <HomeScreen />
            </AnimatePresence> */}
        </div>
    );
};

export default HomeScreen;
