import { Dialog } from '@headlessui/react';
import React, { useRef, useState } from 'react';

interface ImageDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (src: string) => void;
}

const ImageDialog: React.FC<ImageDialogProps> = ({ open, onClose, onInsert }) => {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleInsert = () => {
    if (file && preview) {
      onInsert(preview);
    } else if (url) {
      onInsert(url);
    }
    setUrl('');
    setFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-[var(--dropdown-bg)] border border-[var(--border)] rounded-xl shadow-xl p-6 w-full max-w-xs mx-auto flex flex-col gap-4 z-50">
        <Dialog.Title className="text-lg font-bold mb-2">Insert Image</Dialog.Title>
        <input
          type="text"
          placeholder="Paste image URL..."
          className="w-full px-3 py-2 rounded border bg-transparent outline-none border-[var(--border)] focus:border-[var(--accent)]"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="px-3 py-1 rounded bg-[var(--button-bg)] text-[var(--button-fg)] font-medium hover:bg-[var(--button-hover-bg)]"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </button>
          {file && <span className="text-xs text-muted">{file.name}</span>}
        </div>
        {preview && (
          <img src={preview} alt="Preview" className="rounded max-h-32 object-contain border border-[var(--border)]" />
        )}
        <div className="flex gap-2 mt-2 justify-end">
          <button
            className="px-3 py-1 rounded bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-[var(--button-bg)] text-[var(--button-fg)] font-semibold hover:bg-[var(--button-hover-bg)]"
            onClick={handleInsert}
            disabled={!url && !preview}
          >
            Insert
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ImageDialog; 