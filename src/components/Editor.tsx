"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import { useState, useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MoreVertical, Download, Upload, Trash2, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Undo2, Redo2, MoreHorizontal, Minus, Plus } from "lucide-react";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";
import QuickCommandMenu from './QuickCommandMenu';

function getProseFontSizeClass(fontSize?: number) {
  if (!fontSize) return 'prose-base';
  if (fontSize <= 14) return 'prose-sm';
  if (fontSize <= 18) return 'prose-base';
  if (fontSize <= 22) return 'prose-lg';
  if (fontSize <= 28) return 'prose-xl';
  return 'prose-2xl';
}

const lowlight = createLowlight(all);

const Tiptap = ({ onWordCountChange, page, onTitleChange, onSave, onDeletePage }: {
  onWordCountChange: (wordCount: number, charCount: number) => void;
  page?: { id: string; title: string; content: string };
  onTitleChange?: (title: string) => void;
  onSave?: (page: { id: string; title: string; content: string }) => void;
  onDeletePage?: (id: string) => void;
}) => {
  const [title, setTitle] = useState(page?.title || "");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState("● Synced");
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 200, left: 400 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CharacterCount,
      Underline,
      Highlight,
      CodeBlockLowlight.configure({ lowlight: lowlight }),
    ],
    content: page?.content || '',
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl w-full h-full",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setTitle(page?.title || "");
    if (editor && page?.content !== undefined) {
      editor.commands.setContent(page.content);
    }
    // eslint-disable-next-line
  }, [page?.id]);

  useEffect(() => {
    if (!editor) {
      return undefined;
    }

    const handleUpdate = () => {
      const words = editor.storage.characterCount.words();
      const chars = editor.storage.characterCount.characters();
      setWordCount(words);
      setCharCount(chars);
      onWordCountChange(words, chars);
      if (onSave) {
        onSave({ id: page?.id || '', title, content: editor.getHTML() });
      }
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, onWordCountChange, onSave, page?.id, title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (onTitleChange) onTitleChange(e.target.value);
  };

  const handleMenuSelect = (type: string) => {
    setShowMenu(false);
    if (!editor) return;

    // Remove the '/' before the cursor only if a command is selected
    const state = editor.state;
    const { from } = state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from, '\0', '\0');
    if (textBefore === '/') {
      editor.commands.deleteRange({ from: from - 1, to: from });
    }

    switch (type) {
      case 'heading1':
        editor.chain().focus().setNode('heading', { level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().setNode('heading', { level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().setNode('heading', { level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      default:
        break;
    }
    setTimeout(() => { editor.chain().focus().run(); }, 0);
  };

  // Handle Enter and Shift+Enter for blockquote and code block
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (!editor) return;
    const { state } = editor;
    const { $from } = state.selection;
    const parentType = $from.parent.type.name;
    const isEmpty = $from.parent.content.size === 0;
    if ((parentType === 'blockquote' || parentType === 'codeBlock')) {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (isEmpty) {
          // Exit blockquote or code block
          e.preventDefault();
          editor.chain().focus().liftEmptyBlock().run();
        }
      } else if (e.key === 'Enter' && e.shiftKey) {
        // Insert hard break (newline)
        e.preventDefault();
        editor.chain().focus().setHardBreak().run();
      }
    }
  };

  return (
    <div className="h-full flex flex-col transition-all glass-editor group/editor-area"
      style={{ background: 'var(--editor-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
      {/* Sticky Page Title and Options */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4"
        style={{ background: 'var(--editor-bg)', color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
        <input
          className="flex-1 bg-transparent border-none outline-none text-2xl font-extrabold px-2 py-1 rounded-lg transition"
          placeholder="Untitled Page"
          value={title}
          onChange={handleTitleChange}
          style={{fontFamily: 'Inter, Space Grotesk, sans-serif', color: 'var(--foreground)', background: 'transparent'}}/>
        <Menu as="div" className="relative inline-block text-left">
          <MenuButton
            className="p-2 rounded-full shadow-sm transition flex items-center justify-center"
            style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--button-hover-bg)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--button-bg)'}
          >
            <MoreVertical className="w-5 h-5" strokeWidth={2} />
          </MenuButton>
          <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto"
            style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
            <div className="py-1">
              <MenuItem>
                {({ focus }) => (
                  <button className={`group flex w-full items-center px-4 py-2 text-sm rounded-xl transition ${focus ? 'menu-item-focus' : ''}`}
                    style={{ color: 'var(--foreground)' }}>
                    <Upload className="mr-3 w-4 h-4" strokeWidth={2} /> Import
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button className={`group flex w-full items-center px-4 py-2 text-sm rounded-xl transition ${focus ? 'menu-item-focus' : ''}`}
                    style={{ color: 'var(--foreground)' }}>
                    <Download className="mr-3 w-4 h-4" strokeWidth={2} /> Export
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={`group flex w-full items-center px-4 py-2 text-sm text-red-500 rounded-xl transition ${focus ? 'menu-item-focus' : ''}`}
                    onClick={() => onDeletePage && page?.id && onDeletePage(page.id)}
                  >
                    <Trash2 className="mr-3 w-4 h-4" strokeWidth={2} /> Delete Page
                  </button>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        </Menu>
      </div>
      {/* Editor Content */}
      <div className="flex-1 flex flex-col px-8 pb-8 pt-4 relative" >
        <div className="notion-editor-content flex-1 overflow-y-auto w-full h-full">
          <EditorContent
            editor={editor}
            className="flex-1 overflow-y-auto w-full h-full"
            style={{ color: 'var(--foreground)' }}
            onKeyDown={e => {
              if (e.key === '/' && editor && !showMenu) {
                e.preventDefault();
                // Insert a temporary span at the caret to get its position
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0).cloneRange();
                  const span = document.createElement('span');
                  span.textContent = '\u200b'; // zero-width space
                  span.style.display = 'inline-block';
                  span.style.width = '1px';
                  range.insertNode(span);
                  const rect = span.getBoundingClientRect();
                  setMenuPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX + 2
                  });
                  span.parentNode?.removeChild(span);
                }
                setShowMenu(true);
              } else {
                handleEditorKeyDown(e);
              }
            }}
          />
        </div>
        <QuickCommandMenu
          visible={showMenu}
          position={menuPosition}
          onSelect={handleMenuSelect}
          onClose={() => setShowMenu(false)}
        />
        {/* Floating Toolbar (bottom center, show on hover/focus) */}
        {editor && (
          <div
            className="fixed left-1/2 bottom-8 -translate-x-1/2 z-30 opacity-0 group-hover/editor-area:opacity-100 group-focus-within/editor-area:opacity-100 transition-opacity pointer-events-auto"
          >
            <div className="flex gap-1 items-center px-4 py-2 rounded-2xl shadow-2xl border backdrop-blur-xl"
              style={{ background: 'var(--dropdown-bg)', border: '1.5px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)', backdropFilter: 'var(--glass-blur)' }}>
              <button onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)" className={`p-2 rounded transition ${editor.isActive('bold') ? 'bg-[var(--accent)] text-white' : ''}`}><Bold className="w-4 h-4" /></button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)" className={`p-2 rounded transition ${editor.isActive('italic') ? 'bg-[var(--accent)] text-white' : ''}`}><Italic className="w-4 h-4" /></button>
              <button onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)" className={`p-2 rounded transition ${editor.isActive('underline') ? 'bg-[var(--accent)] text-white' : ''}`}><UnderlineIcon className="w-4 h-4" /></button>
              <button onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough (Ctrl+Shift+S)" className={`p-2 rounded transition ${editor.isActive('strike') ? 'bg-[var(--accent)] text-white' : ''}`}><Strikethrough className="w-4 h-4" /></button>
              {/* Remove font size controls */}
              <button onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" className="p-2 rounded transition"><Undo2 className="w-4 h-4" /></button>
              <button onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)" className="p-2 rounded transition"><Redo2 className="w-4 h-4" /></button>
              {/* More button for advanced tools */}
              <button title="More" className="p-2 rounded transition"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tiptap;