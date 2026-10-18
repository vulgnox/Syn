"use client";

import HomeScreen from "@/components/HomeScreen";
import LockScreen from "@/components/LockScreen";
import Quicksettings from "@/components/Quicksettings";
import Bios from "@/components/Bios";
import PermissionPrompt from "@/components/PermissionPrompt";
import usePhoneStore from "@/store/usePhone";
import { AnimatePresence, motion } from "motion/react";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { locked, toggleLock, qs, bios, permRequest } = usePhoneStore();

  return (
    <div className={`${geistSans.className} ${geistMono.className} font-sans w-full flex items-center justify-center min-h-screen overflow-hidden`} style={{ userSelect: "none" }}>
      <div className="h-[85vh] w-fit bg-transparent block relative">
        <img src="/frame.png" alt="" className="h-[85vh] min-w-[42.827vh] absolute block pointer-events-none z-20" draggable={false} onContextMenu={(e) => e.preventDefault()} />

        <div className="flex justify-center items-center h-full w-[42.827vh]">
          <div className="w-[38vh] h-[95%] bg-transparent overflow-hidden relative">
            <div className="h-full w-full overflow-hidden bg-transparent">
              <AnimatePresence>
                {locked
                  && <motion.div
                    key="lock-screen"
                    initial={{ opacity: 1, top: '0%' }}
                    animate={{ opacity: 1, top: '0%' }}
                    exit={{ opacity: 0, top: '-100%' }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full absolute z-10"
                  >
                    <LockScreen unlock={toggleLock} />
                  </motion.div>
                }
                <HomeScreen />
              </AnimatePresence>

              {qs &&
                <Quicksettings />
              }

              {bios &&
                <div className="h-full w-full absolute z-30">
                  <Bios />
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Security layer renders OUTSIDE the phone frame so prompts
          (including PowerMenu-triggered ones) are always visible */}
      {permRequest &&
        <PermissionPrompt />
      }
    </div>
  );
}
