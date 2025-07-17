import React, { useEffect, useRef, useState } from 'react';
import UniversalSearchBar from './UniversalSearchBar';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { FileText, Folder as FolderIcon, Home as HomeIcon, X } from 'lucide-react';
import Fuse from 'fuse.js';

interface Page {
  id: string;
  title: string;
  is_favorite?: boolean;
  folder_id?: string;
  content?: string; // Added for fuzzy search
}
interface Folder {
  id: string;
  name: string;
}

interface QuickSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  pages: Page[];
  folders: Folder[];
  user: any;
  onSelectPage: (id: string) => void;
  onSelectHome: () => void;
  theme?: 'light' | 'dark' | 'glass';
}

// Helper to get/set recent pages in localStorage
function getRecentPages(pages: Page[]): Page[] {
  if (typeof window === 'undefined') return [];
  const ids = JSON.parse(localStorage.getItem('mirae-recent-pages') || '[]');
  return ids
    .map((id: string) => pages.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 5) as Page[];
}
function addRecentPage(id: string) {
  if (typeof window === 'undefined') return;
  let ids = JSON.parse(localStorage.getItem('mirae-recent-pages') || '[]');
  ids = [id, ...ids.filter((x: string) => x !== id)].slice(0, 10);
  localStorage.setItem('mirae-recent-pages', JSON.stringify(ids));
}
export { addRecentPage };

const QuickSearchOverlay: React.FC<QuickSearchOverlayProps> = ({ open, onClose, pages, folders, user, onSelectPage, onSelectHome, theme }) => {
  const [search, setSearch] = useState('');
  const searchBarRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100);
    } else {
      setSearch('');
    }
  }, [open]);

  // Fuzzy search setup
  const fuse = new Fuse(pages, {
    keys: [
      'title',
      ...(search.includes('in:content') ? ['content'] : [])
    ],
    threshold: 0.4,
    includeMatches: true,
    minMatchCharLength: 1, // Allow single-letter search
  });

  let filteredPages: Page[] = [];
  let contentMatches: Record<string, string[]> = {};
  if (search.trim() === '') {
    filteredPages = pages;
  } else if (search.includes('in:content')) {
    // Remove 'in:content' from search string
    const query = search.replace('in:content', '').trim();
    const results = fuse.search(query);
    filteredPages = results.map(r => r.item);
    // Collect matching lines from content
    contentMatches = {};
    results.forEach(r => {
      if (r.matches) {
        const contentMatch = r.matches.find(m => m.key === 'content');
        if (contentMatch && typeof contentMatch.value === 'string') {
          // Find matching lines
          const lines = contentMatch.value.split('\n');
          const matchedLines = lines.filter(line => line.toLowerCase().includes(query.toLowerCase()));
          if (matchedLines.length > 0) {
            contentMatches[r.item.id] = matchedLines;
          }
        }
      }
    });
  } else {
    const results = fuse.search(search);
    filteredPages = results.map(r => r.item);
  }

  const filteredFolders = folders.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation
  const [focusIdx, setFocusIdx] = useState(0);
  // Results: Home, folders, pages, and content matches
  let results: Array<{ type: string; id?: string; label: string; icon: React.ReactNode; sublabel?: string }> = [];
  if (search.trim() === '') {
    // Show Home and recent pages
    results = [
      { type: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
      ...getRecentPages(pages).map(p => ({ type: 'recent', id: p.id, label: p.title || 'Untitled Page', icon: <FileText className="w-5 h-5 opacity-80" /> }))
    ];
  } else {
    results = [
      ...filteredFolders.map(f => ({ type: 'folder', id: f.id, label: f.name, icon: <FolderIcon className="w-5 h-5" /> })),
      ...filteredPages.flatMap(p => {
        const base = [{ type: 'page', id: p.id, label: p.title || 'Untitled Page', icon: <FileText className="w-5 h-5" /> }];
        if (contentMatches[p.id]) {
          return base.concat(contentMatches[p.id].map(line => ({
            type: 'content',
            id: p.id,
            label: p.title || 'Untitled Page',
            icon: <FileText className="w-5 h-5 opacity-60" />,
            sublabel: line.trim()
          })));
        }
        return base;
      })
    ];
  }

  useEffect(() => {
    setFocusIdx(0);
  }, [search, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx(idx => Math.min(idx + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx(idx => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[focusIdx];
      if (item) {
        if (item.type === 'home') onSelectHome();
        else if ((item.type === 'page' || item.type === 'content' || item.type === 'recent') && item.id) {
          onSelectPage(item.id);
          addRecentPage(item.id);
        }
        else if (item.type === 'folder' && item.id) {
          const firstPage = pages.find(p => p.folder_id === item.id);
          if (firstPage) {
            onSelectPage(firstPage.id);
            addRecentPage(firstPage.id);
          }
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog as="div" className="fixed z-[100] inset-0 flex items-center justify-center" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[4px] transition-all duration-200" aria-hidden="true" />
        <div className="flex items-center justify-center min-h-screen w-full">
          <DialogPanel
            className="relative w-full max-w-lg mx-auto rounded-xl border border-[var(--border)] bg-[var(--dropdown-bg)] p-0 flex flex-col"
            style={{
              color: 'var(--foreground)',
              boxShadow: 'none',
              backdropFilter: 'blur(24px)'
            }}
          >
            {/* Removed close icon */}
            <div className="p-4 pb-1">
              <UniversalSearchBar
                ref={searchBarRef}
                search={search}
                setSearch={setSearch}
                user={user}
                shouldBlurOnTrigger={false}
                onKeyDown={handleKeyDown}
              />
            </div>
            {results.length === 0 ? (
              <div className="text-center text-[var(--muted)] py-6 text-sm">No results found.</div>
            ) : (
              <ul className="mx-4">
                {results.map((item, idx) => (
                  <li key={item.type + (item.id || '') + (item.sublabel || '')} className="my-1">
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition font-medium text-base text-left ${focusIdx === idx ? 'bg-[var(--button-bg)] text-white' : 'hover:bg-[var(--button-hover-bg)]'} minimal-search-result`}
                      style={{ outline: 'none', fontSize: '1rem', fontWeight: 500, marginLeft: 0, marginRight: 0 }}
                      onClick={() => {
                        if (item.type === 'home') onSelectHome();
                        else if ((item.type === 'page' || item.type === 'content' || item.type === 'recent') && item.id) {
                          onSelectPage(item.id);
                          addRecentPage(item.id);
                        }
                        else if (item.type === 'folder' && item.id) {
                          const firstPage = pages.find(p => p.folder_id === item.id);
                          if (firstPage) {
                            onSelectPage(firstPage.id);
                            addRecentPage(firstPage.id);
                          }
                        }
                        onClose();
                      }}
                      onMouseEnter={() => setFocusIdx(idx)}
                      tabIndex={0}
                    >
                      {item.icon}
                      <span className="truncate" style={{ fontSize: '0.98em', fontWeight: 500 }}>{item.label}</span>
                      {item.sublabel && (
                        <span className="ml-2 text-xs text-[var(--muted)] truncate" style={{ fontWeight: 400, fontSize: '0.93em' }}>{item.sublabel}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuickSearchOverlay; 