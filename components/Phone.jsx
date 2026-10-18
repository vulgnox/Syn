"use client";

import Contacts from './Contacts';
import NewContact from './NewContact';
import React, { useState } from 'react';
import { MdCall } from "react-icons/md";
import { MdDialpad } from "react-icons/md";
import { FaBackspace } from "react-icons/fa";
import { useSwipeable } from 'react-swipeable';
import { FaRegCircleUser } from "react-icons/fa6";
import { AnimatePresence, motion } from "motion/react";
import { useSandbox } from '@/lib/sandbox/AppSandbox';

const Phone = () => {
    const [dialerOpen, setDialerOpen] = useState(false);
    const [tab, setTab] = useState(true);
    const [newTab, setNewTab] = useState(false);
    const [mob, setMob] = useState("");

    // Phase 3 sandbox: per-app namespaced storage (syn.app.<id>.contacts)
    const { storage } = useSandbox();

    const handler = useSwipeable({
        onSwipedLeft: () => {
            setTab(false);
        },
        onSwipedRight: () => {
            setTab(true);
        },
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    return (
        newTab
            ? <NewContact
                onSave={(contact) => {
                    const contacts = storage.get('contacts', []);
                    contacts.push(contact);
                    storage.set('contacts', contacts);
                    setNewTab(false);
                }}
            />
            : <div className='dark:bg-gray-950 bg-white h-full relative'>
                <div className="w-full h-10 bg-gray-200 dark:bg-gray-800 flex justify-evenly items-center text-lg">
                    <div className="size-6 rounded-full border-2 dark:border-white grid place-items-center">
                        <MdCall className="size-4" />
                    </div>

                    <FaRegCircleUser className="size-5.5" />
                </div>

                <AnimatePresence initial={false}>
                    <motion.div
                        key="tabs"
                        initial={{ translateX: tab ? "0%" : "-50%" }}
                        animate={{ translateX: tab ? "0%" : "-50%" }}
                        transition={{ duration: 0.3 }}
                        className="flex w-[200%] justify-stretch bg-gray-300 dark:bg-gray-700 text-lg overflow-scroll"
                        style={{ height: "calc(100% - 40px)" }}
                        {...handler}
                    >
                        <div className="w-full flex-1 bg-amber-200 overflow-y-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <div key={i} className="w-full h-20 flex justify-between items-center px-4">
                                    <div className="flex items-center gap-x-4">
                                        <div className="size-12 rounded-full bg-gray-400 dark:bg-gray-700 grid place-items-center text-2xl text-white">
                                            {i}
                                        </div>
                                        <div className="text-lg">Contact {i}</div>
                                    </div>
                                    <MdCall className="size-6 text-green-600 cursor-pointer" />
                                </div>
                            ))}
                        </div>

                        <Contacts openNewTab={() => setNewTab(true)} />
                    </motion.div>
                </AnimatePresence>

                {tab &&
                    <>
                        <AnimatePresence initial={false}>
                            {dialerOpen && (
                                <motion.div
                                    key="phone-screen"
                                    initial={{ opacity: 0, y: '100%' }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 1, y: '100%' }}
                                    transition={{ duration: 0.3 }}
                                    className="h-[calc(100%-8.5rem)] w-full absolute bottom-0 overflow-hidden bg-amber-400 z-10 flex flex-col justify-between"
                                >
                                    <div className="w-full !h-16 flex items-center pr-2 text-2xl gap-x-1 bg-blue-500" hidden={!mob.length}>
                                        <input type="tel" className="w-full h-16 focus:outline-none border-none text-center text-xl" value={mob} onChange={e => setMob(e.target.value)} disabled />

                                        {(() => {
                                            let tm;

                                            return <FaBackspace
                                                className='cursor-pointer'
                                                onMouseDown={() => {
                                                    tm = setTimeout(() => {
                                                        setMob("");
                                                        clearTimeout(tm);
                                                    }, 300);
                                                }}
                                                onMouseUp={() => {
                                                    clearTimeout(tm);
                                                    setMob(mob.slice(0, -1));
                                                }}
                                            />
                                        })()}
                                    </div>

                                    <div className="w-full !h-16" hidden={mob.length}></div>

                                    <div className="w-full h-full flex flex-wrap justify-evenly items-center bg-gray-950 mt-auto">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                                            <button key={num} className={"mb-0 h-[25%] w-[30%] rounded-lg flex justify-center items-center text-2xl active:bg-gray-900 " + "bg-red-" + num.toString() + "00"} onClick={() => {
                                                if (mob.length < 13) {
                                                    setMob(mob + num);
                                                }
                                            }}>
                                                {num}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="w-full !h-24 bg-gray-800 flex justify-center items-center text-white text-2xl">
                                        <div className="!absolute size-12 rounded-full !bottom-2 !z-50 grid place-items-center cursor-pointer">
                                            <MdCall className="size-6 text-white absolute z-50" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className='absolute bottom-1.5 z-10 right-3 grid place-items-center h-12 w-12'>
                            <div className="absolute size-12 rounded-full z-20 cursor-pointer" onClick={() => setDialerOpen(!dialerOpen)}>
                                <MdDialpad className='absolute z-20 size-6 top-[52%] left-[52%] transform -translate-x-1/2 -translate-y-1/2' />
                            </div>

                            <AnimatePresence initial={false}>
                                <div className="absolute z-10 grid place-items-center h-12 w-12">
                                    {/* Blue background circle that moves */}
                                    <motion.div
                                        initial={{ left: 0 }}
                                        animate={{ left: dialerOpen ? "-5rem" : 0, zIndex: dialerOpen ? 10 : 5, backgroundColor: dialerOpen ? "oklch(62.7% 0.194 149.214)" : "#155dfc" }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute size-12 rounded-full cursor-pointer"
                                    />
                                </div>
                            </AnimatePresence>
                        </div>
                    </>
                }
            </div>
    )
}

export default Phone;
