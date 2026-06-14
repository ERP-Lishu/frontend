"use client";

import { Search, Globe, LayoutGrid, Bell, SunMoon } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-12 bg-white border-b border-[#efefef] flex items-center px-5 gap-3 flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-[#f7f7f7] border border-[#ebebeb] rounded-lg px-3 py-1.5 text-sm text-gray-400 w-72 cursor-text">
        <Search size={13} className="flex-shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-700 placeholder:text-gray-400"
          placeholder="Search or create anything..."
        />
        <kbd className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded ml-auto">⌘K</kbd>
      </div>

      {/* Right icons */}
      <div className="ml-auto flex items-center gap-2">
        {[Globe, LayoutGrid, Bell, SunMoon].map((Icon, i) => (
          <button
            key={i}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Icon size={16} />
          </button>
        ))}
        <div className="w-8 h-8 rounded-full bg-[#29ad82] text-white flex items-center justify-center text-[11px] font-bold">
          S
        </div>
        <span className="text-sm font-semibold text-[#1a1a1a]">Sailen</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </header>
  );
}
