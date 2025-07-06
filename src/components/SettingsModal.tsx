import { Dialog, Tab } from "@headlessui/react";

function SettingsModal({ open, onClose, theme }: { open: boolean; onClose: () => void; theme: string }) {
  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px] w-full h-full transition-all duration-200" />
      <Dialog.Panel
        className="relative rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-[var(--border)] flex flex-col gap-4 transition-all duration-200"
        style={{
          background: theme === 'glass' ? 'var(--dropdown-bg)' : theme === 'dark' ? '#232326' : '#fff',
          color: 'var(--foreground)',
          boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)'
        }}
      >
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
              <div className="text-sm text-[var(--muted)]">Preferences for startup, behaviour, and more will go here.</div>
            </Tab.Panel>
            <Tab.Panel className="py-2">
              <div className="text-base font-semibold mb-2">Appearance</div>
              <div className="text-sm text-[var(--muted)]">Theme, font, and UI customization options will go here.</div>
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