import { Dialog } from '@headlessui/react';
import React from 'react';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  format: 'markdown' | 'txt' | 'pdf' | 'docx';
  setFormat: (f: 'markdown' | 'txt' | 'pdf' | 'docx') => void;
  onExport: () => void;
}

const formatOptions = [
  { label: 'Markdown', value: 'markdown', ext: '.md' },
  { label: 'Plain Text', value: 'txt', ext: '.txt' },
  { label: 'PDF', value: 'pdf', ext: '.pdf' },
  { label: 'Word', value: 'docx', ext: '.docx' },
];

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, format, setFormat, onExport }) => {
  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-[var(--dropdown-bg)] border border-[var(--border)] rounded-xl shadow-xl p-0 w-full max-w-2xl mx-auto flex flex-col z-50">
        <Dialog.Title className="text-lg font-bold px-8 pt-8 pb-2">Export Page</Dialog.Title>
        <div className="flex flex-row gap-0 px-8 pb-0 pt-2 min-h-[320px]">
          {/* Left: Format options */}
          <div className="flex flex-col gap-2 w-1/3 pr-6 border-r border-[var(--border)]">
            {formatOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`w-full px-4 py-3 rounded-xl font-semibold border text-base transition-all duration-200 flex flex-col items-start gap-0.5 text-left
                  ${format === opt.value
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] shadow-lg'
                    : 'bg-[var(--dropdown-bg)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--button-hover-bg)]'}
                `}
                style={{backdropFilter: 'var(--glass-blur)'}}
                onClick={() => setFormat(opt.value as any)}
                aria-pressed={format === opt.value}
              >
                <span className="font-bold text-base">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.ext}</span>
              </button>
            ))}
          </div>
          {/* Right: Preview placeholder */}
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            <div className="w-full h-48 flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] text-sm">
              Preview coming soon
            </div>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 justify-end px-8 py-6 border-t border-[var(--border)] bg-transparent">
          <button
            className="px-4 py-2 rounded bg-transparent border border-[var(--border)] text-[var(--foreground)] font-semibold hover:bg-[var(--border)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent)]/90 shadow"
            onClick={onExport}
          >
            Export
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ExportDialog; 