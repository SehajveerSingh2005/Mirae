"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type ShortcutAction =
  | "newPage"
  | "nextPage"
  | "prevPage"
  | "goHome"
  | "openSearch"
  | "openSettings"
  | "deletePage";

export interface ShortcutConfig {
  label: string;
  default: string;
  current: string;
  handler: () => void;
}

type ShortcutsMap = Record<ShortcutAction, ShortcutConfig>;

// List of browser-reserved shortcuts that cannot be reliably overridden
export const reservedShortcuts = [
  "Ctrl+N", "Ctrl+T", "Ctrl+W", "Ctrl+Shift+N", "Ctrl+Tab", "Ctrl+Shift+Tab"
];

export function isReservedShortcut(shortcut: string) {
  return reservedShortcuts.includes(shortcut);
}

// Updated defaults to avoid browser-reserved shortcuts
const defaultShortcuts: ShortcutsMap = {
  newPage:      { label: "New Page",      default: "Ctrl+Alt+N",      current: "Ctrl+Alt+N",      handler: () => {} },
  nextPage:     { label: "Next Page",     default: "Ctrl+ArrowDown", current: "Ctrl+ArrowDown", handler: () => {} },
  prevPage:     { label: "Previous Page", default: "Ctrl+ArrowUp",   current: "Ctrl+ArrowUp",   handler: () => {} },
  goHome:       { label: "Go Home",       default: "Ctrl+H",      current: "Ctrl+H",      handler: () => {} },
  openSearch:   { label: "Quick Search",  default: "Ctrl+K",      current: "Ctrl+K",      handler: () => {} },
  openSettings: { label: "Settings",      default: "Ctrl+Alt+,",      current: "Ctrl+Alt+,",      handler: () => {} },
  deletePage:   { label: "Delete Page",   default: "Ctrl+Backspace", current: "Ctrl+Backspace", handler: () => {} },
};

const KeyboardShortcutsContext = createContext<{
  shortcuts: ShortcutsMap;
  setShortcut: (action: ShortcutAction, shortcut: string) => void;
  setHandler: (action: ShortcutAction, handler: () => void) => void;
  resetShortcuts: () => void;
} | null>(null);

export const useKeyboardShortcuts = () => useContext(KeyboardShortcutsContext)!;

export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutsMap>(() => {
    // Load from localStorage or use defaults
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("mirae-shortcuts");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all actions are present
        return { ...defaultShortcuts, ...parsed };
      }
    }
    return { ...defaultShortcuts };
  });

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("mirae-shortcuts", JSON.stringify(shortcuts));
    }
  }, [shortcuts]);

  // Global keydown handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      console.log("[Shortcuts] Keydown event:", e.key, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey);
      for (const action in shortcuts) {
        const shortcut = shortcuts[action as ShortcutAction].current;
        const isMatch = matchesShortcut(e, shortcut);
        console.log(`[Shortcuts] Checking action '${action}' with shortcut '${shortcut}': match =`, isMatch);
        if (isMatch) {
          e.preventDefault();
          console.log(`[Shortcuts] Handler called for action '${action}'`);
          shortcuts[action as ShortcutAction].handler();
          break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);

  const setShortcut = useCallback((action: ShortcutAction, shortcut: string) => {
    setShortcuts(prev => ({
      ...prev,
      [action]: { ...prev[action], current: shortcut }
    }));
  }, []);

  const setHandler = useCallback((action: ShortcutAction, handler: () => void) => {
    setShortcuts(prev => ({
      ...prev,
      [action]: { ...prev[action], handler }
    }));
  }, []);

  const resetShortcuts = useCallback(() => {
    setShortcuts({ ...defaultShortcuts });
  }, []);

  const contextValue = useMemo(() => ({
    shortcuts,
    setShortcut,
    setHandler,
    resetShortcuts
  }), [shortcuts, setShortcut, setHandler, resetShortcuts]);

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

// Utility to check if a KeyboardEvent matches a shortcut string like "Ctrl+N"
function matchesShortcut(e: KeyboardEvent, shortcut: string) {
  const parts = shortcut.toLowerCase().split("+");
  const required = {
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta"),
  };
  // The main key is the last part that is not a modifier
  const mainKey = [...parts].reverse().find(
    p => !["ctrl", "alt", "shift", "meta"].includes(p)
  );

  // Check modifiers
  if (required.ctrl !== e.ctrlKey) return false;
  if (required.alt !== e.altKey) return false;
  if (required.shift !== e.shiftKey) return false;
  if (required.meta !== e.metaKey) return false;

  // Check main key (case-insensitive)
  if (!mainKey) return false;
  if (
    mainKey === e.key.toLowerCase() ||
    (mainKey === "arrowup" && e.key === "ArrowUp") ||
    (mainKey === "arrowdown" && e.key === "ArrowDown") ||
    (mainKey === "," && e.key === ",") ||
    (mainKey === "backspace" && e.key === "Backspace")
  ) {
    return true;
  }
  return false;
}

// In your settings UI, use isReservedShortcut(shortcut) to warn users if they pick a reserved shortcut. 