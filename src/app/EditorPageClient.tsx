"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
// import StatusBar from "@/components/StatusBar";
import { v4 as uuidv4 } from 'uuid';
import Home from '@/components/Home';
import { Moon, Sun, GlassWater } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import AuthPanel from "@/components/AuthPanel";

const Tiptap = dynamic(() => import("@/components/Editor"), { ssr: false });

type Folder = { id: string; name: string; pageIds: string[] };
type Page = { id: string; title: string; content: string; folderId?: string };

function loadFolders(): Folder[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('mirae-folders') || '[]');
  } catch {
    return [];
  }
}

function saveFolders(folders: Folder[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mirae-folders', JSON.stringify(folders));
}

function loadPages(): Page[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('mirae-pages') || '[]');
  } catch {
    return [];
  }
}

function savePages(pages: Page[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mirae-pages', JSON.stringify(pages));
}

function loadFavourites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('mirae-favourites') || '[]');
  } catch {
    return [];
  }
}

function saveFavourites(favourites: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mirae-favourites', JSON.stringify(favourites));
}

export default function EditorPageClient() {
  const [folders, setFolders] = useState<Folder[]>(() => loadFolders());
  const [pages, setPages] = useState<Page[]>(() => loadPages());
  const [currentPageId, setCurrentPageId] = useState(() => pages[0]?.id || '');
  const [isHomeSelected, setIsHomeSelected] = useState(pages.length === 0);
  const [editorFontSize, setEditorFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'dark' | 'glass'>('light');
  const [mounted, setMounted] = useState(false);
  const [favourites, setFavourites] = useState<string[]>(() => loadFavourites());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Keep localStorage in sync
  useEffect(() => { savePages(pages); }, [pages]);
  useEffect(() => { saveFolders(folders); }, [folders]);
  useEffect(() => { saveFavourites(favourites); }, [favourites]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mirae-theme');
    if (stored) setTheme(stored as 'light' | 'dark' | 'glass');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mirae-theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    // Get current user session instantly from localStorage
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthChecked(true);
    });
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleNewPage = () => {
    const newPage = { id: uuidv4(), title: '', content: '' };
    setPages(prev => [newPage, ...prev]);
    setCurrentPageId(newPage.id);
    setIsHomeSelected(false);
  };

  const handleSelectPage = (id: string) => {
    // Only delete the previous page if it is untitled and empty and you are navigating away from it
    if (id !== currentPageId) {
      const current = pages.find(p => p.id === currentPageId);
      if (current && !current.title.trim() && !current.content.trim()) {
        setPages(prev => prev.filter(p => p.id !== currentPageId));
      }
    }
    setCurrentPageId(id);
    setIsHomeSelected(false);
  };

  const handleSelectHome = () => {
    // If current page is untitled and empty, delete it
    const current = pages.find(p => p.id === currentPageId);
    if (current && !current.title.trim() && !current.content.trim()) {
      setPages(prev => prev.filter(p => p.id !== currentPageId));
    }
    setIsHomeSelected(true);
    setCurrentPageId(''); // Deselect any page when going home
  };

  const handleTitleChange = (title: string) => {
    setPages((prev: Page[]) => prev.map((p: Page) => p.id === currentPageId ? { ...p, title } : p));
  };

  const handleSave = (page: Page) => {
    setPages((prev: Page[]) => prev.map((p: Page) => p.id === page.id ? page : p));
  };

  const handleDeletePage = (id: string) => {
    setPages((prev: Page[]) => prev.filter((p: Page) => p.id !== id));
    if (id === currentPageId) {
      const idx = pages.findIndex(p => p.id === id);
      const nextPage = pages[idx + 1] || pages[idx - 1];
      setCurrentPageId(nextPage ? nextPage.id : '');
      if (!nextPage) setIsHomeSelected(true);
    }
  };

  const handleZoom = (delta: number) => {
    setEditorFontSize(f => Math.max(14, Math.min(32, f + delta)));
  };

  // Folder CRUD
  const handleNewFolder = (name: string, id: string) => {
    setFolders(prev => [...prev, { id, name, pageIds: [] }]);
  };

  const handleRenameFolder = (id: string) => {
    const name = prompt('New folder name?');
    if (!name) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const handleDeleteFolder = (id: string) => {
    if (!window.confirm('Delete this folder and keep its pages unsorted?')) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    setPages(prev => prev.map(p => p.folderId === id ? { ...p, folderId: undefined } : p));
  };

  // Move page to folder
  const handleMovePage = (pageId: string, folderId?: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, folderId } : p));
  };

  const handleToggleFavourite = (pageId: string) => {
    setFavourites(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const currentPage = pages.find(p => p.id === currentPageId);

  if (!mounted || !authChecked) return null;

  return (
    <div className="flex w-screen h-screen min-w-0 min-h-0 overflow-hidden">
      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--modal-overlay, rgba(0,0,0,0.18))', backdropFilter: 'var(--glass-blur)' }}>
          <div className="bg-[var(--dropdown-bg)] rounded-2xl shadow-2xl p-0 max-w-md w-full relative border border-[var(--border)]" style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)' }}>
            <button className="absolute top-2 right-2 p-2 text-xl cursor-pointer z-10 rounded-full hover:bg-[var(--button-hover-bg)] transition" style={{ color: 'var(--muted)' }} onClick={() => setShowAuth(false)}>&times;</button>
            <AuthPanel />
          </div>
        </div>
      )}
      {/* Sidebar */}
      <Sidebar
        pages={pages}
        folders={folders}
        currentPageId={currentPageId}
        onSelectPage={handleSelectPage}
        onNewPage={handleNewPage}
        onDeletePage={handleDeletePage}
        onSelectHome={handleSelectHome}
        isHomeSelected={isHomeSelected}
        theme={theme}
        setTheme={setTheme}
        onNewFolder={handleNewFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMovePage={handleMovePage}
        favourites={favourites}
        onToggleFavourite={handleToggleFavourite}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        user={user}
        onShowAuth={() => setShowAuth(true)}
      />
      {/* Main Content Area */}
      <main className={`flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative transition-all duration-200 ${isSidebarCollapsed ? 'ml-0' : ''}`}>
        <div className="flex-1 overflow-y-auto relative">
          {isHomeSelected ? (
            <Home 
              onNewPage={handleNewPage}
              pages={pages}
              onOpenPage={handleSelectPage}
              user={user}
              onShowAuth={() => setShowAuth(true)}
            />
          ) : (
            <div className="h-full flex flex-col relative group/editor-area">
              <Tiptap
                page={currentPage}
                onTitleChange={handleTitleChange}
                onSave={handleSave}
                onWordCountChange={() => {}}
                onDeletePage={handleDeletePage}
              />
            </div>
          )}
        </div>
        {/* Status Bar */}
        {/* <StatusBar wordCount={wordCount} /> */}
      </main>
    </div>
  );
}