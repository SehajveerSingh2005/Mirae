"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import { useState, useEffect, useRef } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MoreVertical, Download, Upload, Trash2, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Undo2, Redo2, MoreHorizontal, Minus, Plus, Star, Loader2 } from "lucide-react";
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Image as ImageIcon, Table as TableIcon, ExternalLink } from "lucide-react";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, all } from "lowlight";
import QuickCommandMenu from './QuickCommandMenu';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import ImageDialog from './ImageDialog';
import ExportDialog from './ExportDialog';
import TurndownService from 'turndown';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';

function getProseFontSizeClass(fontSize?: number) {
  if (!fontSize) return 'prose-base';
  if (fontSize <= 14) return 'prose-sm';
  if (fontSize <= 18) return 'prose-base';
  if (fontSize <= 22) return 'prose-lg';
  if (fontSize <= 28) return 'prose-xl';
  return 'prose-2xl';
}

const lowlight = createLowlight(all);

const Tiptap = ({ onWordCountChange, page, onTitleChange, onSave, onDeletePage, autosave = true, onDirtyChange, onSavingChange }: {
  onWordCountChange: (wordCount: number, charCount: number) => void;
  page?: { id: string; title: string; content: string };
  onTitleChange?: (title: string) => void;
  onSave?: (page: { id: string; title: string; content: string }) => void;
  onDeletePage?: (id: string) => void;
  autosave?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}) => {
  const [title, setTitle] = useState(page?.title || "");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 200, left: 400 });
  const [slashFilter, setSlashFilter] = useState('');
  const lastSlashPosRef = useRef<number | null>(null);
  type CommandOption = { label: string; type: string; icon?: React.ReactNode; description?: string };
  const [slashMenuOptions, setSlashMenuOptions] = useState<CommandOption[]>([]);
  const [slashMenuFocus, setSlashMenuFocus] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [pendingImageInsert, setPendingImageInsert] = useState<null | ((src: string) => void)>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const titleDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'txt' | 'pdf' | 'docx'>('markdown');
  const [pdfExporting, setPdfExporting] = useState(false);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CharacterCount,
      Underline,
      Highlight,
      CodeBlockLowlight.configure({ lowlight: lowlight }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: page?.content || '',
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl w-full h-full",
      },
      handleKeyDown: (view, event) => {
        // If slash menu is open, handle Enter/Arrow keys
        if (showMenu && slashMenuOptions.length > 0) {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            handleMenuSelect(slashMenuOptions[slashMenuFocus].type);
            return true;
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSlashMenuFocus(prev => (prev + 1) % slashMenuOptions.length);
            return true;
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSlashMenuFocus(prev => (prev - 1 + slashMenuOptions.length) % slashMenuOptions.length);
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  const editorContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(page?.title || "");
    if (editor && page?.content !== undefined) {
      editor.commands.setContent(page.content);
    }
    setDirty(false);
    setSaving(false);
    if (onDirtyChange) onDirtyChange(false);
    if (onSavingChange) onSavingChange(false);
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
      setDirty(true);
      if (autosave && onSave) {
        setSaving(true);
        // Debounce actual save
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          onSave({ id: page?.id || '', title, content: editor.getHTML() });
          setDirty(false);
          setSaving(false);
        }, 800);
      }
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [editor, onWordCountChange, onSave, page?.id, title, autosave]);

  // Manual save handler
  const handleManualSave = () => {
    if (onSave && editor) {
      setSaving(true);
      onSave({ id: page?.id || '', title, content: editor.getHTML() });
      setTimeout(() => {
        setDirty(false);
        setSaving(false);
      }, 800);
    }
  };

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    if (autosave) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autosave, dirty, saving, handleManualSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (onTitleChange) {
      if (titleDebounceTimer.current) clearTimeout(titleDebounceTimer.current);
      titleDebounceTimer.current = setTimeout(() => {
        onTitleChange(e.target.value);
      }, 600);
    }
  };

  // Helper: get text before caret up to the start of the block
  function getTextBeforeCaret() {
    if (!editor) return '';
    const { state } = editor;
    const { from } = state.selection;
    // Get text from start of block to caret
    const $from = state.selection.$from;
    const blockStart = $from.start();
    return state.doc.textBetween(blockStart, from, '\0', '\0');
  }

  // Helper: get caret position in viewport
  function getCaretCoords() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      const span = document.createElement('span');
      span.textContent = '\u200b';
      span.style.display = 'inline-block';
      span.style.width = '1px';
      range.insertNode(span);
      const rect = span.getBoundingClientRect();
      const menuHeight = 240; // match your menu's maxHeight
      const spaceBelow = window.innerHeight - rect.bottom;
      let top;
      if (spaceBelow < menuHeight) {
        top = rect.top + window.scrollY - menuHeight + 2;
      } else {
        top = rect.bottom + window.scrollY + 2;
      }
      const coords = {
        top,
        left: rect.left + window.scrollX - 200
      };
      span.parentNode?.removeChild(span);
      return coords;
    }
    return { top: 200, left: 400 };
  }

  // Listen for input to trigger/close/filter the slash menu
  useEffect(() => {
    if (!editor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;
      // Only handle if editor is focused
      if (document.activeElement !== editor.options.element) return;
      if (showMenu && e.key === 'Escape') {
        setShowMenu(false);
        setSlashFilter('');
        lastSlashPosRef.current = null;
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMenu, editor]);

  useEffect(() => {
    if (!editor) return;
    const handleInput = () => {
      const text = getTextBeforeCaret();
      // Find last '/' in the text before caret
      const lastSlash = text.lastIndexOf('/');
      if (lastSlash !== -1) {
        // Show menu and filter
        setShowMenu(true);
        setSlashFilter(text.slice(lastSlash + 1));
        lastSlashPosRef.current = lastSlash;
        // Update menu position
        requestAnimationFrame(() => {
          const coords = getCaretCoords();
          setMenuPosition(coords);
        });
      } else {
        setShowMenu(false);
        setSlashFilter('');
        lastSlashPosRef.current = null;
      }
    };
    editor.on('selectionUpdate', handleInput);
    editor.on('transaction', handleInput);
    return () => {
      editor.off('selectionUpdate', handleInput);
      editor.off('transaction', handleInput);
    };
  }, [editor]);

  useEffect(() => {
    const COMMAND_OPTIONS = [
      { label: 'Bold', type: 'bold', icon: <Bold className="w-4 h-4 text-accent" />, description: 'Toggle bold text' },
      { label: 'Italic', type: 'italic', icon: <Italic className="w-4 h-4 text-accent" />, description: 'Toggle italic text' },
      { label: 'Underline', type: 'underline', icon: <UnderlineIcon className="w-4 h-4 text-accent" />, description: 'Toggle underline' },
      { label: 'Strikethrough', type: 'strike', icon: <Strikethrough className="w-4 h-4 text-accent" />, description: 'Toggle strikethrough' },
      { label: 'Heading 1', type: 'heading1', icon: <Heading1 className="w-4 h-4 text-accent" /> },
      { label: 'Heading 2', type: 'heading2', icon: <Heading2 className="w-4 h-4 text-accent" /> },
      { label: 'Heading 3', type: 'heading3', icon: <Heading3 className="w-4 h-4 text-accent" /> },
      { label: 'Bullet List', type: 'bulletList', icon: <List className="w-4 h-4 text-accent" /> },
      { label: 'Ordered List', type: 'orderedList', icon: <ListOrdered className="w-4 h-4 text-accent" /> },
      { label: 'Blockquote', type: 'blockquote', icon: <Quote className="w-4 h-4 text-accent" /> },
      { label: 'Code Block', type: 'codeBlock', icon: <Code className="w-4 h-4 text-accent" /> },
    ];
    const EXTENDED_COMMAND_OPTIONS: CommandOption[] = [
      ...COMMAND_OPTIONS,
      {
        label: 'Image',
        type: 'image',
        icon: <ImageIcon className="w-4 h-4 text-accent" />,
        description: 'Insert an image',
      },
      {
        label: 'Table',
        type: 'table',
        icon: <TableIcon className="w-4 h-4 text-accent" />,
        description: 'Insert a table',
      },
      {
        label: 'Embed',
        type: 'embed',
        icon: <ExternalLink className="w-4 h-4 text-accent" />,
        description: 'Embed external content',
      },
    ];
    const filtered = EXTENDED_COMMAND_OPTIONS.filter(option =>
      option.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
      option.type.toLowerCase().includes(slashFilter.toLowerCase())
    );
    setSlashMenuOptions(filtered);
    setSlashMenuFocus(0);
  }, [slashFilter]);

  const handleMenuSelect = (type: string) => {
    setShowMenu(false);
    setSlashFilter('');
    if (!editor) return;
    // Remove the '/' and filter text before the caret
    const state = editor.state;
    const { from } = state.selection;
    const text = getTextBeforeCaret();
    const lastSlash = text.lastIndexOf('/');
    if (lastSlash !== -1) {
      const blockStart = state.selection.$from.start();
      editor.commands.deleteRange({ from: blockStart + lastSlash, to: from });
    }

    switch (type) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
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
      case 'image': {
        setShowImageDialog(true);
        setPendingImageInsert(() => (src: string) => {
          editor.chain().focus().setImage({ src }).run();
        });
        break;
      }
      case 'table': {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      }
      case 'embed': {
        const url = window.prompt('Enter embed URL (YouTube, etc.):');
        if (url) {
          // Insert a simple iframe for now
          const html = `<iframe src="${url}" frameborder="0" allowfullscreen style="width:100%;min-height:300px;"></iframe>`;
          editor.chain().focus().insertContent(html).run();
        }
        break;
      }
      default:
        break;
    }
    setTimeout(() => { editor.chain().focus().run(); }, 0);
  };

  // Only keep blockquote/code block logic in handleEditorKeyDown
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

  // ImageDialog integration
  const handleImageInsert = (src: string) => {
    if (pendingImageInsert) {
      pendingImageInsert(src);
    }
    setShowImageDialog(false);
    setPendingImageInsert(null);
  };

  // Floating toolbar logic
  useEffect(() => {
    if (!editor) return;
    const updateToolbar = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setShowFloatingToolbar(false);
        return;
      }
      // Check if selection is inside the editor content
      const anchorNode = selection.anchorNode;
      const editorContent = editorContentRef.current;
      if (!editorContent || !anchorNode) {
        setShowFloatingToolbar(false);
        return;
      }
      // Traverse up from anchorNode to see if it's inside editorContent
      let node: Node | null = anchorNode;
      let inside = false;
      while (node) {
        if (node === editorContent) {
          inside = true;
          break;
        }
        node = node.parentNode;
      }
      if (!inside) {
        setShowFloatingToolbar(false);
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (!rect || (rect.top === 0 && rect.left === 0)) {
        setShowFloatingToolbar(false);
        return;
      }
      // Position above and to the left of selection, Notion-style
      const toolbarWidth = 180;
      const top = rect.top + window.scrollY + 32; // 8px gap, 36px toolbar height
      const left = rect.left + window.scrollX - 200; // 8px to the left of selection
      setToolbarPosition({ top: Math.max(top, 8), left: Math.max(left, 8) });
      setShowFloatingToolbar(true);
    };
    editor.on('selectionUpdate', updateToolbar);
    editor.on('focus', updateToolbar);
    editor.on('blur', () => setShowFloatingToolbar(false));
    window.addEventListener('scroll', updateToolbar, true);
    return () => {
      editor.off('selectionUpdate', updateToolbar);
      editor.off('focus', updateToolbar);
      editor.off('blur', () => setShowFloatingToolbar(false));
      window.removeEventListener('scroll', updateToolbar, true);
    };
  }, [editor]);

  // Notify parent of dirty/saving state changes
  useEffect(() => {
    if (onDirtyChange) onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (onSavingChange) onSavingChange(saving);
  }, [saving, onSavingChange]);

  // On unmount, reset dirty/saving in parent
  useEffect(() => {
    return () => {
      if (titleDebounceTimer.current) clearTimeout(titleDebounceTimer.current);
      if (onDirtyChange) onDirtyChange(false);
      if (onSavingChange) onSavingChange(false);
    };
  }, []);

  const turndownService = new TurndownService();
  // Fix for ES module/CommonJS import differences
  const vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.pdfMake?.vfs;
  if (vfs) {
    pdfMake.vfs = vfs;
  }

  return (
    <div className="h-full flex flex-col transition-all glass-editor group/editor-area"
      style={{ background: 'var(--editor-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
      {/* Sticky Page Title and Options */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-8 py-4"
        style={{ background: 'var(--editor-bg)', color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
        <input
          className="flex-1 bg-transparent border-none outline-none text-2xl font-extrabold px-2 py-1 rounded-lg transition"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Page"
          style={{fontFamily: 'Inter, Space Grotesk, sans-serif', color: 'var(--foreground)', background: 'transparent'}}/>
        {/* Save Indicator */}
        <div className="flex items-center gap-2 min-w-[140px]">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
              <span className="text-sm text-[var(--accent)]">Saving...</span>
            </>
          ) : dirty ? (
            <>
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
              <span className="text-sm text-yellow-500">Unsaved changes</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              <span className="text-sm text-green-600">All changes saved</span>
            </>
          )}
        </div>
        {/* Manual Save Button (only if autosave is off and dirty) */}
        {(!autosave && dirty) && (
          <button
            className="px-4 py-2 rounded-xl font-semibold shadow-sm transition text-base cursor-pointer flex items-center gap-2"
            style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
            onClick={handleManualSave}
            disabled={saving}
            title="Save (Ctrl+S)"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Save
          </button>
        )}
        <Menu as="div" className="relative inline-block text-left">
          <MenuButton
            className="p-2 rounded-full shadow-sm transition flex items-center justify-center"
            style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--button-hover-bg)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--button-bg)'}
          >
            <MoreVertical className="w-5 h-5" strokeWidth={2} />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto"
            style={{
              background: 'var(--dropdown-bg)',
              color: 'var(--foreground)',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.14)',
              backdropFilter: 'var(--glass-blur)',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div className="py-1">
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={`group flex w-full items-center px-4 py-2 text-sm rounded-xl transition ${focus ? 'menu-item-focus' : ''}`}
                    style={{ color: 'var(--foreground)' }}
                  >
                    <Upload className="mr-3 w-4 h-4" strokeWidth={2} /> Import
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={`group flex w-full items-center px-4 py-2 text-sm rounded-xl transition ${focus ? 'menu-item-focus' : ''}`}
                    style={{ color: 'var(--foreground)' }}
                    onClick={() => setExportDialogOpen(true)}
                  >
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
            ref={editorContentRef}
            editor={editor}
            className="flex-1 overflow-y-auto w-full h-full"
            style={{ color: 'var(--foreground)' }}
            onKeyDown={handleEditorKeyDown}
          />
        </div>
        <QuickCommandMenu
          visible={showMenu}
          position={menuPosition}
          onSelect={handleMenuSelect}
          onClose={() => { setShowMenu(false); setSlashFilter(''); }}
          filter={slashFilter}
          options={slashMenuOptions}
          focusedIndex={slashMenuFocus}
          onHoverIndexChange={setSlashMenuFocus}
        />
        <ImageDialog
          open={showImageDialog}
          onClose={() => { setShowImageDialog(false); setPendingImageInsert(null); }}
          onInsert={handleImageInsert}
        />
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          format={exportFormat}
          setFormat={setExportFormat}
          onExport={async () => {
            if (!editor) return;
            let data = '';
            let ext: string = exportFormat;
            let mime = 'text/plain';
            const html = editor.getHTML();
            const text = editor.getText();
            if (exportFormat === 'markdown') {
              data = turndownService.turndown(html);
              ext = 'md';
              mime = 'text/markdown';
            } else if (exportFormat === 'txt') {
              data = text;
              ext = 'txt';
              mime = 'text/plain';
            } else if (exportFormat === 'pdf') {
              setPdfExporting(true);
              setTimeout(() => {
                // Create a hidden div for rendering
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.left = '-9999px';
                container.style.top = '0';
                container.style.width = '800px';
                container.style.background = '#fff';
                container.style.color = '#222';
                container.style.padding = '40px';
                container.style.fontFamily = 'Inter, Arial, sans-serif';
                container.style.fontSize = '16px';
                container.innerHTML = html;
                document.body.appendChild(container);

                // Convert HTML to pdfmake document definition
                const pdfContent = htmlToPdfmake(container.innerHTML);
                const docDefinition = {
                  content: [
                    {
                      text: title || 'Untitled',
                      fontSize: 24,
                      bold: true,
                      marginBottom: 20
                    },
                    ...Array.isArray(pdfContent) ? pdfContent : [pdfContent]
                  ],
                  pageMargins: [40, 40, 40, 40],
                  defaultStyle: {
                    fontSize: 12,
                    color: '#222',
                  },
                };
                const filename = (title?.trim() ? title.trim().replace(/[^a-zA-Z0-9-_]/g, '_') : 'untitled') + '.pdf';
                pdfMake.createPdf(docDefinition).download(filename);
                document.body.removeChild(container);
                setPdfExporting(false);
                setExportDialogOpen(false);
              }, 100);
              return;
            } else {
              // DOCX: not implemented yet
              setExportDialogOpen(false);
              return;
            }
            const filename = (title?.trim() ? title.trim().replace(/[^a-zA-Z0-9-_]/g, '_') : 'untitled') + '.' + ext;
            const blob = new Blob([data], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
            setExportDialogOpen(false);
          }}
        />

        {/* Floating Formatting Toolbar */}
        {editor && showFloatingToolbar && (
          <div
            className="fixed z-40 flex gap-1 items-center px-2 py-1 rounded-xl shadow-xl border backdrop-blur-xl bg-[var(--dropdown-bg)] border-[var(--border)] text-[var(--foreground)] cursor-pointer"
            style={{
              top: toolbarPosition.top,
              left: toolbarPosition.left,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.14)',
              backdropFilter: 'var(--glass-blur)',
              minWidth: 180,
              minHeight: 36,
              transition: 'opacity 0.15s',
            }}
            onMouseDown={e => e.preventDefault()} // Prevent focus loss
          >
            <button onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)" className={`p-2 rounded transition ${editor.isActive('bold') ? 'bg-[var(--accent)] text-white' : ''}`}><Bold className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)" className={`p-2 rounded transition ${editor.isActive('italic') ? 'bg-[var(--accent)] text-white' : ''}`}><Italic className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)" className={`p-2 rounded transition ${editor.isActive('underline') ? 'bg-[var(--accent)] text-white' : ''}`}><UnderlineIcon className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough (Ctrl+Shift+S)" className={`p-2 rounded transition ${editor.isActive('strike') ? 'bg-[var(--accent)] text-white' : ''}`}><Strikethrough className="w-4 h-4" /></button>
            {/* AI Button Placeholder */}
            <button title="AI" className="p-2 rounded transition"><Star className="w-4 h-4" /></button>
          </div>
        )}
        {/* Persistent Minimal Toolbar (bottom center) */}
        {editor && (
          <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-30 flex gap-1 items-center px-3 py-1.5 rounded-xl shadow-xl border backdrop-blur-xl bg-[var(--dropdown-bg)] border-[var(--border)] text-[var(--foreground)] cursor-pointer" style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.14)', backdropFilter: 'var(--glass-blur)' }}>
            <button onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)" className={`p-2 rounded transition ${editor.isActive('bold') ? 'bg-[var(--accent)] text-white' : ''}`}><Bold className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)" className={`p-2 rounded transition ${editor.isActive('italic') ? 'bg-[var(--accent)] text-white' : ''}`}><Italic className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)" className={`p-2 rounded transition ${editor.isActive('underline') ? 'bg-[var(--accent)] text-white' : ''}`}><UnderlineIcon className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough (Ctrl+Shift+S)" className={`p-2 rounded transition ${editor.isActive('strike') ? 'bg-[var(--accent)] text-white' : ''}`}><Strikethrough className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List" className={`p-2 rounded transition ${editor.isActive('bulletList') ? 'bg-[var(--accent)] text-white' : ''}`}><List className="w-4 h-4" /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List" className={`p-2 rounded transition ${editor.isActive('orderedList') ? 'bg-[var(--accent)] text-white' : ''}`}><ListOrdered className="w-4 h-4" /></button>
            {/* AI Button Placeholder */}
            <button title="AI" className="p-2 rounded transition"><Star className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tiptap;