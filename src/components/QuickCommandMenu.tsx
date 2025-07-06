import React, { useEffect, useRef, useState } from 'react';

const COMMAND_OPTIONS = [
  { label: 'Heading 1', type: 'heading1' },
  { label: 'Heading 2', type: 'heading2' },
  { label: 'Heading 3', type: 'heading3' },
  { label: 'Bullet List', type: 'bulletList' },
  { label: 'Ordered List', type: 'orderedList' },
  { label: 'Blockquote', type: 'blockquote' },
  { label: 'Code Block', type: 'codeBlock' },
];

interface QuickCommandMenuProps {
  visible: boolean;
  position?: { top: number; left: number };
  onSelect: (type: string) => void;
  onClose: () => void;
}

const QuickCommandMenu: React.FC<QuickCommandMenuProps> = ({ visible, position, onSelect, onClose }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus the menu when it appears
  useEffect(() => {
    if (visible && menuRef.current) {
      menuRef.current.focus();
      setFocusedIndex(0);
    }
  }, [visible]);

  // Keyboard navigation only when menu is focused
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!visible) return;
    if (e.key === 'ArrowDown') {
      setFocusedIndex(i => (i + 1) % COMMAND_OPTIONS.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex(i => (i - 1 + COMMAND_OPTIONS.length) % COMMAND_OPTIONS.length);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      onSelect(COMMAND_OPTIONS[focusedIndex].type);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      onClose();
      e.preventDefault();
    }
  };

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
  }, [focusedIndex]);

  if (!visible) return null;
  return (
    <div
      ref={menuRef}
      className="fixed z-50 shadow-xl outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
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
        padding: '4px 0',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.14)',
        backdropFilter: 'var(--glass-blur)',
        overflowY: 'auto',
        fontSize: '0.97rem',
      }}
    >
      {COMMAND_OPTIONS.map((option, idx) => (
        <button
          key={option.type}
          className={`w-full text-left px-4 py-1.5 transition rounded-md ${focusedIndex === idx ? 'slash-menu-active glass-focus' : 'hover:glass-focus'}`}
          style={{
            background: focusedIndex === idx ? 'rgba(123,93,255,0.18)' : 'none',
            color: focusedIndex === idx ? 'var(--foreground, #fff)' : 'inherit',
            border: focusedIndex === idx ? '1.5px solid var(--accent)' : 'none',
            outline: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseDown={e => { e.preventDefault(); onSelect(option.type); }}
          onMouseEnter={() => setFocusedIndex(idx)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default QuickCommandMenu; 