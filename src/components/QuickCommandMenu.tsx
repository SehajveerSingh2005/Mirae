import React, { useEffect, useRef, useState } from 'react';
import { Type, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3 } from 'lucide-react';

interface QuickCommandMenuProps {
  visible: boolean;
  position?: { top: number; left: number };
  onSelect: (type: string) => void;
  onClose: () => void;
  filter?: string;
  focusedIndex: number;
  onHoverIndexChange: (idx: number) => void;
  options: Array<{ label: string; type: string; icon?: React.ReactNode; description?: string }>;
}

const QuickCommandMenu: React.FC<QuickCommandMenuProps> = ({ visible, position, onSelect, onClose, filter = '', focusedIndex, onHoverIndexChange, options }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex, filter, options.length]);

  // Click outside to close
  useEffect(() => {
    if (!visible) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible, onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const active = menuRef.current.querySelector('.slash-menu-active');
      if (active) (active as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex, filter]);

  if (!visible) return null;
  return (
    <div
      ref={menuRef}
      className="fixed z-50 shadow-xl outline-none slash-menu-scroll"
      tabIndex={0}
      style={{
        top: position?.top ?? '50%',
        left: position?.left ?? '50%',
        background: 'var(--dropdown-bg)',
        color: 'var(--foreground)',
        border: '1.5px solid var(--border)',
        borderRadius: 10,
        minWidth: 180,
        maxWidth: 260,
        maxHeight: 240,
        padding: '2px 0',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.14)',
        backdropFilter: 'var(--glass-blur)',
        overflowY: 'auto',
        fontSize: '0.97rem',
        display: 'block',
      }}
    >
      {options.length === 0 ? (
        <div className="px-4 py-2 text-gray-400">No commands found</div>
      ) : (
        options.map((option, idx) => (
          <button
            key={option.type}
            ref={el => { itemRefs.current[idx] = el; }}
            className={`w-full flex items-center gap-2 px-3 py-1 transition rounded-md ${focusedIndex === idx ? 'slash-menu-active glass-focus' : 'hover:glass-focus'}`}
            style={{
              background: focusedIndex === idx ? 'rgba(123,93,255,0.18)' : 'none',
              color: focusedIndex === idx ? 'var(--foreground, #fff)' : 'inherit',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              minHeight: 32,
              fontSize: '0.97rem',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseDown={e => { e.preventDefault(); onSelect(option.type); }}
            onMouseEnter={() => onHoverIndexChange(idx)}
            title={focusedIndex === idx ? option.description : ''}
          >
            <span className="flex items-center justify-center w-6 h-6 mr-1 opacity-80">{option.icon}</span>
            <span className="text-[1rem] font-medium">{option.label}</span>
          </button>
        ))
      )}
    </div>
  );
};

export default QuickCommandMenu;

<style jsx global>{`
.slash-menu-scroll::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}
.slash-menu-scroll::-webkit-scrollbar-thumb {
  background: var(--border, #232326);
  border-radius: 6px;
}
`}</style> 