import React, { useState, useEffect } from "react";
import { Theme } from "../types";

interface IPhoneFrameProps {
  children: React.ReactNode;
  theme: Theme;
}

export function IPhoneFrame({ children, theme }: IPhoneFrameProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "" : ""; // iOS uses 24h format by default in many regions, we'll do 24h style
      setTime(`${hours.toString().padStart(2, "0")}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-stone-950 text-stone-100" 
        : "bg-slate-100 text-slate-900"
    }`}>
      {/* Container holding the physical simulator or full mobile view */}
      <div className="relative w-full max-w-full md:max-w-[410px] h-screen md:h-[860px] md:my-4 md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] md:border-[10px] md:border-neutral-800 bg-neutral-900 overflow-hidden flex flex-col transition-all duration-300">
        
        {/* iOS Top Notch / Dynamic Island (Only visible on desktop/simulated frame) */}
        <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 w-32 h-[26px] bg-black rounded-full z-50 items-center justify-center">
          <div className="w-3 h-3 bg-neutral-900 rounded-full border border-neutral-800 ml-1"></div>
        </div>

        {/* Simulated iOS Status Bar (Visible on all screens with relative adjustments) */}
        <div className="flex justify-between items-center px-6 pt-3 pb-2 text-[11px] font-semibold tracking-wide select-none z-40 bg-transparent shrink-0">
          <span className="opacity-90">{time}</span>
          
          <div className="flex items-center gap-1.5 opacity-90">
            {/* Cellular Signal Icons */}
            <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="16" width="3" height="5" rx="0.5" />
              <rect x="7" y="12" width="3" height="9" rx="0.5" />
              <rect x="12" y="8" width="3" height="13" rx="0.5" />
              <rect x="17" y="3" width="3" height="18" rx="0.5" />
            </svg>
            
            {/* Wi-Fi Icon */}
            <svg className="w-3.5 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75a6.002 6.002 0 0111.5 0M4.5 12a11.25 11.25 0 0115 0M1.5 8.25a15.75 15.75 0 0121 0M12 18.75h.008v.008H12v-.008z" />
            </svg>

            {/* Battery Body */}
            <div className="w-5 h-2.5 border-[1.5px] border-current rounded-[4px] p-[0.5px] flex items-center">
              <div className="h-full w-4 bg-current rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Outer body view representing native application */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-transparent">
          {children}
        </div>

        {/* iOS Physical Swipe Bar indicator (Only on desktop simulator bottom) */}
        <div className="hidden md:flex absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-[5px] bg-neutral-700/60 rounded-full z-40"></div>
      </div>
    </div>
  );
}
