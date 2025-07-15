import { Dialog, Tab } from "@headlessui/react";
import { Sun, Moon, GlassWater } from "lucide-react";
import { useEffect, useState } from "react";

function SettingsModal({ open, onClose, theme, setTheme, onSettingsChange, startupPosition, autosave, timeFormat }: {
  open: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (theme: 'light' | 'dark' | 'glass') => void;
  onSettingsChange?: (settings: { startupPosition: 'last' | 'home'; autosave: boolean; timeFormat: '12h' | '24h'; }) => void;
  startupPosition: 'last' | 'home';
  autosave: boolean;
  timeFormat: '12h' | '24h';
}) {
  // Use the same background logic as the floating toolbar
  let modalBg = 'var(--dropdown-bg)';
  if (theme === 'light') modalBg = 'var(--dropdown-bg, rgba(255,255,255,0.85))';
  if (theme === 'dark') modalBg = 'var(--dropdown-bg, rgba(30,30,40,0.85))';
  // glass theme uses var(--dropdown-bg)

  // Remove all local state and use props directly

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[8px] w-full h-full transition-all duration-200" />
      <Dialog.Panel
        className="relative rounded-2xl shadow-2xl p-8 w-full max-w-lg border flex flex-col gap-4 transition-all duration-200"
        style={{
          background: modalBg,
          color: 'var(--foreground)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          backdropFilter: 'var(--glass-blur)',
        }}
      >
        {/* TODO: Replace Dialog.Title and Tab.Group with new primitives when stable */}
        <Dialog.Title className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Settings</Dialog.Title>
        <Tab.Group>
          <Tab.List className="flex gap-2 border-b border-[var(--border)] mb-4">
            <Tab className={({ selected }) => `px-4 py-2 rounded-t transition font-semibold outline-none ${selected ? 'bg-[var(--card-bg)] text-[var(--accent)]' : 'bg-transparent text-[var(--muted)]'}`}>General</Tab>
            <Tab className={({ selected }) => `px-4 py-2 rounded-t transition font-semibold outline-none ${selected ? 'bg-[var(--card-bg)] text-[var(--accent)]' : 'bg-transparent text-[var(--muted)]'}`}>Appearance</Tab>
            <Tab className={({ selected }) => `px-4 py-2 rounded-t transition font-semibold outline-none ${selected ? 'bg-[var(--card-bg)] text-[var(--accent)]' : 'bg-transparent text-[var(--muted)]'}`}>Shortcuts</Tab>
            <Tab className={({ selected }) => `px-4 py-2 rounded-t transition font-semibold outline-none ${selected ? 'bg-[var(--card-bg)] text-[var(--accent)]' : 'bg-transparent text-[var(--muted)]'}`}>About</Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="py-2">
              <div className="text-base font-semibold mb-2">General</div>
              <div className="flex flex-col gap-4 mt-2">
                {/* Startup Position Setting */}
                <div className="mb-6">
                  <div className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Startup Position</div>
                  <div className="flex gap-4">
                    {['last', 'home'].map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`px-5 py-2 rounded-xl font-semibold transition-all duration-200 border text-base ${startupPosition === option ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)] shadow-lg' : 'bg-[var(--dropdown-bg)] border-[var(--border)] text-[var(--muted)]'}`}
                        style={{backdropFilter: 'var(--glass-blur)', minWidth: 100}}
                        onClick={() => onSettingsChange && onSettingsChange({ startupPosition: option as 'last' | 'home', autosave, timeFormat })}
                        tabIndex={0}
                        aria-pressed={startupPosition === option}
                      >
                        {option === 'last' ? 'Last Opened' : 'Home'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Time Format Setting */}
                <div className="mb-6">
                  <div className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Time Format</div>
                  <div className="flex gap-4">
                    {['24h', '12h'].map(option => (
                      <button
                        key={option}
                        type="button"
                        className={`px-5 py-2 rounded-xl font-semibold transition-all duration-200 border text-base ${timeFormat === option ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)] shadow-lg' : 'bg-[var(--dropdown-bg)] border-[var(--border)] text-[var(--muted)]'}`}
                        style={{backdropFilter: 'var(--glass-blur)', minWidth: 100}}
                        onClick={() => onSettingsChange && onSettingsChange({ startupPosition, autosave, timeFormat: option as '12h' | '24h' })}
                        tabIndex={0}
                        aria-pressed={timeFormat === option}
                      >
                        {option === '24h' ? '24-Hour' : '12-Hour'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Autosave Setting */}
                <div className="mb-2">
                  <div className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Autosave</div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group px-5 py-2 rounded-xl border transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--accent)]" style={{ background: 'var(--dropdown-bg)', borderColor: 'var(--border)', backdropFilter: 'var(--glass-blur)' }}>
                      <span className="text-base font-semibold" style={{ color: autosave ? 'var(--accent)' : 'var(--muted)' }}>
                        Enable autosave
                      </span>
                      <span className="relative inline-block w-10 h-6">
                        <input
                          type="checkbox"
                          checked={autosave}
                          onChange={e => onSettingsChange && onSettingsChange({
                            startupPosition,
                            autosave: e.target.checked,
                            timeFormat
                          })}
                          className="peer opacity-0 w-10 h-6 absolute left-0 top-0 cursor-pointer"
                        />
                        <span className="absolute left-0 top-0 w-10 h-6 rounded-full transition bg-[var(--input-bg)] border border-[var(--border)] peer-checked:bg-[var(--accent)]" />
                        <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-[var(--foreground)] transition peer-checked:translate-x-4" />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </Tab.Panel>
            <Tab.Panel className="py-2">
              <div className="text-base font-semibold mb-2">Appearance</div>
              <div className="flex gap-4 items-center mt-2">
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition font-semibold cursor-pointer ${theme === 'light' ? 'border-[var(--accent)] bg-[var(--button-bg)]' : 'border-transparent bg-transparent hover:bg-[var(--button-hover-bg)]'}`}
                  onClick={() => setTheme('light')}
                  aria-label="Light Theme"
                >
                  <Sun className="w-6 h-6 mb-1" />
                  <span className="text-xs">Light</span>
                </button>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition font-semibold cursor-pointer ${theme === 'dark' ? 'border-[var(--accent)] bg-[var(--button-bg)]' : 'border-transparent bg-transparent hover:bg-[var(--button-hover-bg)]'}`}
                  onClick={() => setTheme('dark')}
                  aria-label="Dark Theme"
                >
                  <Moon className="w-6 h-6 mb-1" />
                  <span className="text-xs">Dark</span>
                </button>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition font-semibold cursor-pointer ${theme === 'glass' ? 'border-[var(--accent)] bg-[var(--button-bg)]' : 'border-transparent bg-transparent hover:bg-[var(--button-hover-bg)]'}`}
                  onClick={() => setTheme('glass')}
                  aria-label="Glass Theme"
                >
                  <GlassWater className="w-6 h-6 mb-1" />
                  <span className="text-xs">Glass</span>
                </button>
              </div>
            </Tab.Panel>
            <Tab.Panel className="py-2">
              <div className="text-base font-semibold mb-2">Shortcuts</div>
              <div className="text-sm text-[var(--muted)]">Keyboard shortcuts and productivity tips will go here.</div>
            </Tab.Panel>
            <Tab.Panel className="py-2">
              <div className="text-base font-semibold mb-2">About</div>
              <div className="text-sm text-[var(--muted)]">App version, credits, and links will go here.</div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        <div className="flex gap-2 justify-end mt-6">
          <button className="px-4 py-2 rounded transition font-semibold" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }} onClick={onClose}>
            Close
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

export default SettingsModal; 