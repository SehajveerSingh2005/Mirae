"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
// import StatusBar from "@/components/StatusBar";
import { v4 as uuidv4 } from 'uuid';
import Home from '@/components/Home';
import { useAuth } from "@/contexts/AuthContext";
import { databaseService, type Page, type Folder } from "@/services/database";
import { checkDatabaseSetup } from "@/utils/databaseCheck";
import AuthPanel from "@/components/AuthPanel";
import SettingsModal from "@/components/SettingsModal";
import QuickSearchOverlay from '@/components/QuickSearchOverlay';

const Tiptap = dynamic(() => import("@/components/Editor"), { ssr: false });

// Types are now imported from database service

function UnsavedChangesModal({ open, onConfirm, onCancel }: { open: boolean, onConfirm: () => Promise<void>, onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[6px]">
      <div
        className="rounded-2xl shadow-2xl p-8 w-full max-w-sm border flex flex-col gap-4"
        style={{
          background: 'var(--dropdown-bg)',
          color: 'var(--foreground)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)',
          backdropFilter: 'var(--glass-blur)',
        }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Unsaved Changes</h2>
        <div className="text-base" style={{ color: 'var(--foreground)' }}>
          You have unsaved changes. Discard them and continue?
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button
            className="px-4 py-2 rounded-xl font-semibold transition cursor-pointer shadow-sm"
            style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
            onClick={onConfirm}
          >
            Discard & Continue
          </button>
          <button
            className="px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
            style={{ background: 'transparent', color: 'var (--muted)' }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditorPageClient() {
  const { user, loading: authLoading, signOutAndClear } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState('');
  const [isHomeSelected, setIsHomeSelected] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'dark' | 'glass'>('light');
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Settings state
  const [startupPosition, setStartupPosition] = useState<'last' | 'home'>('last');
  const [autosave, setAutosave] = useState(true);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [editorDirty, setEditorDirty] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [deletingPageIds, setDeletingPageIds] = useState<string[]>([]);
  const [pendingNavigation, setPendingNavigation] = useState<null | { type: 'home' } | { type: 'page', id: string }>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [intendedNav, setIntendedNav] = useState<{ type: 'home' } | { type: 'page', id: string } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  // Helper: persist navigation state in sessionStorage
  const persistSessionNav = (nav: { type: 'home' } | { type: 'page', id: string }) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mirae-session-nav', JSON.stringify(nav));
    }
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadUserData();
    } else if (!user && !authLoading) {
      // Clear data when user is not authenticated
      setPages([]);
      setFolders([]);
      setCurrentPageId('');
      setIsHomeSelected(true);
    }
  }, [user, authLoading]);

  // On mount, determine intended navigation (before data loads)
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mirae-theme');
    if (stored) setTheme(stored as 'light' | 'dark' | 'glass');
    checkDatabaseSetup();
    if (typeof window !== 'undefined') {
      const startup = localStorage.getItem('mirae-startup-position') as 'last' | 'home' || 'last';
      setStartupPosition(startup);
      setAutosave(localStorage.getItem('mirae-autosave') !== 'false');
      setTimeFormat(localStorage.getItem('mirae-time-format') as '12h' | '24h' || '24h');
      // Determine intended nav
      const sessionNav = sessionStorage.getItem('mirae-session-nav');
      if (sessionNav) {
        try {
          const nav = JSON.parse(sessionNav);
          if (nav.type === 'home') setIntendedNav({ type: 'home' });
          else if (nav.type === 'page' && nav.id) setIntendedNav({ type: 'page', id: nav.id });
          else setIntendedNav(null);
        } catch { setIntendedNav(null); }
      } else if (startup === 'home') {
        setIntendedNav({ type: 'home' });
      } else if (startup === 'last') {
        const lastPageId = localStorage.getItem('mirae-last-page-id');
        if (lastPageId) setIntendedNav({ type: 'page', id: lastPageId });
        else setIntendedNav({ type: 'home' });
      }
    }
  }, []);

  // After user/pages load, resolve navigation
  useEffect(() => {
    if (!user || authLoading || !mounted) return;
    if (pages.length === 0) return; // Wait for pages to load
    if (creatingPage) return; // Prevent flicker: don't run nav effect while creating a page
    // If currentPageId is set and exists in pages, do nothing
    if (currentPageId && pages.some(p => p.id === currentPageId)) return;
    // If intendedNav is set, use it
    if (intendedNav) {
      if (intendedNav.type === 'home') {
        setIsHomeSelected(true);
        setCurrentPageId('');
        setInitializing(false);
      } else if (intendedNav.type === 'page') {
        if (pages.some(p => p.id === intendedNav.id)) {
          setCurrentPageId(intendedNav.id);
          setIsHomeSelected(false);
          setInitializing(false);
        } else {
          // Fallback: open home if page not found
          setIsHomeSelected(true);
          setCurrentPageId('');
          setInitializing(false);
        }
      }
    } else if (!currentPageId && pages.length > 0) {
      // If no current page, default to first page
      setCurrentPageId(pages[0].id);
      setIsHomeSelected(false);
      setInitializing(false);
    }
  }, [user, authLoading, mounted, intendedNav, pages, creatingPage, currentPageId]);

  // Persist last opened page on navigation
  useEffect(() => {
    if (!isHomeSelected && currentPageId) {
      localStorage.setItem('mirae-last-page-id', currentPageId);
      persistSessionNav({ type: 'page', id: currentPageId });
    }
  }, [isHomeSelected, currentPageId]);

  // Only sync theme to localStorage
  useEffect(() => {
    if (!mounted) return;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mirae-theme', theme);
  }, [theme, mounted]);

  // Show browser warning if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editorDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editorDirty]);

  // Global Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Helper to delete untitled/empty page
  const maybeDeleteUntitledEmptyPage = async () => {
    const current = pages.find(p => p.id === currentPageId);
    // Treat empty title or default placeholder as untitled
    if (current && (!current.title.trim()) && !current.content.trim()) {
      await handleDeletePage(currentPageId);
    }
  };

  // Navigation handlers with unsaved check
  const confirmNavigation = async (nav: { type: 'home' } | { type: 'page', id: string }) => {
    await maybeDeleteUntitledEmptyPage();
    if (nav.type === 'home') {
      setIsHomeSelected(true);
      setCurrentPageId('');
    } else if (nav.type === 'page') {
      setCurrentPageId(nav.id);
      setIsHomeSelected(false);
    }
    setPendingNavigation(null);
    setShowUnsavedModal(false);
  };

  const handleSelectPage = async (id: string) => {
    if (id !== currentPageId) {
      if (editorDirty) {
        setPendingNavigation({ type: 'page', id });
        setShowUnsavedModal(true);
        return;
      }
      await maybeDeleteUntitledEmptyPage();
    }
    setCurrentPageId(id);
    setIsHomeSelected(false);
    persistSessionNav({ type: 'page', id });
  };

  const handleSelectHome = async () => {
    if (editorDirty) {
      setPendingNavigation({ type: 'home' });
      setShowUnsavedModal(true);
      return;
    }
    await maybeDeleteUntitledEmptyPage();
    setIsHomeSelected(true);
    setCurrentPageId('');
    setIntendedNav({ type: 'home' });
    persistSessionNav({ type: 'home' });
  };

  const handleTitleChange = async (title: string) => {
    if (!user || !currentPageId) return;
    try {
      await databaseService.updatePage(currentPageId, user.id, { title });
      setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, title } : p));
    } catch (error) {
      alert('Failed to update title. Please check your connection and try again.');
      console.error('Error updating title:', error);
    }
  };

  const handleSave = async (page: Page) => {
    if (!user) return;
    try {
      await databaseService.updatePage(page.id, user.id, {
        title: page.title,
        content: page.content,
      });
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, title: page.title, content: page.content } : p));
    } catch (error) {
      alert('Failed to save page. Please check your connection and try again.');
      console.error('Error saving page:', error);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!user) return;
    setDeletingPageIds(prev => [...prev, id]);
    // Optimistically remove page
    setPages(prev => prev.filter(p => p.id !== id));
    if (currentPageId === id) {
      const remainingPages = pages.filter(p => p.id !== id);
      if (remainingPages.length > 0) {
        setCurrentPageId(remainingPages[0].id);
        setIsHomeSelected(false);
      } else {
        setCurrentPageId('');
        setIsHomeSelected(true);
      }
    }
    try {
      // Only call backend if not a temp page
      if (!id.startsWith('temp-')) {
        await databaseService.deletePage(id, user.id);
      }
    } catch (error) {
      alert('Failed to delete page. Please refresh.');
    } finally {
      setDeletingPageIds(prev => prev.filter(pid => pid !== id));
    }
  };

  const handleZoom = (delta: number) => {
    setEditorFontSize(f => Math.max(14, Math.min(32, f + delta)));
  };

  // Folder CRUD
  const handleNewFolder = async (name: string, id: string) => {
    if (!user) return;
    
    try {
      const newFolder = await databaseService.createFolder(user.id, { name });
      setFolders(prev => [...prev, newFolder]);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleRenameFolder = async (id: string) => {
    if (!user) return;
    
    const name = prompt('New folder name?');
    if (!name) return;
    
    try {
      await databaseService.updateFolder(id, user.id, { name });
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!user) return;
    
    if (!window.confirm('Delete this folder and keep its pages unsorted?')) return;
    
    try {
      await databaseService.deleteFolder(id, user.id);
      setFolders(prev => prev.filter(f => f.id !== id));
      setPages(prev => prev.map(p => p.folder_id === id ? { ...p, folder_id: undefined } : p));
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  // Move page to folder
  const handleMovePage = async (pageId: string, folderId?: string) => {
    if (!user) return;
    
    try {
      await databaseService.movePageToFolder(pageId, user.id, folderId || null);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, folder_id: folderId } : p));
    } catch (error) {
      console.error('Error moving page:', error);
    }
  };

  const handleToggleFavourite = async (pageId: string) => {
    if (!user) return;
    
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    
    try {
      const updatedPage = await databaseService.toggleFavorite(pageId, user.id, !page.is_favorite);
      setPages(prev => prev.map(p => p.id === pageId ? updatedPage : p));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAndClear();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handler for settings change from modal
  const handleSettingsChange = (settings: { startupPosition: 'last' | 'home'; autosave: boolean; timeFormat: '12h' | '24h'; }) => {
    setStartupPosition(settings.startupPosition);
    setAutosave(settings.autosave);
    setTimeFormat(settings.timeFormat);
    localStorage.setItem('mirae-startup-position', settings.startupPosition);
    localStorage.setItem('mirae-autosave', settings.autosave ? 'true' : 'false');
    localStorage.setItem('mirae-time-format', settings.timeFormat);
  };

  // Restore loadUserData
  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pagesData, foldersData] = await Promise.all([
        databaseService.getPages(user.id),
        databaseService.getFolders(user.id)
      ]);
      setPages(pagesData);
      setFolders(foldersData);
      // Do not set currentPageId or isHomeSelected here. Navigation will be handled by the intendedNav effect.
    } catch (error) {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  // Restore handleNewPage
  const handleNewPage = async () => {
    if (!user) {
      return;
    }
    setCreatingPage(true);
    const tempId = 'temp-' + uuidv4();
    const optimisticPage = {
      id: tempId,
      title: '', // Use empty string, not 'Untitled Page'
      content: '',
      user_id: user.id,
      folder_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
    };
    setPages(prev => [optimisticPage, ...prev]);
    setCurrentPageId(tempId);
    setIsHomeSelected(false);
    try {
      const newPage = await databaseService.createPage(user.id, {
        title: '',
        content: '',
      });
      setPages(prev => prev.map(p => p.id === tempId ? newPage : p));
      setCurrentPageId(newPage.id);
      persistSessionNav({ type: 'page', id: newPage.id });
      setIntendedNav({ type: 'page', id: newPage.id });
    } catch (error) {
      setPages(prev => prev.filter(p => p.id !== tempId));
      setCurrentPageId('');
      setIsHomeSelected(true);
      alert('Failed to create page. Please check your connection and try again.');
    } finally {
      setCreatingPage(false);
    }
  };

  const currentPage = pages.find(p => p.id === currentPageId);

  if (!mounted || authLoading || initializing) {
    // Show a full-page loading spinner (glassmorphic)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[6px] z-50">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen min-w-0 min-h-0 overflow-hidden">
      {/* Quick Search Overlay */}
      <QuickSearchOverlay
        open={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        pages={pages}
        folders={folders}
        user={user}
        onSelectPage={handleSelectPage}
        onSelectHome={handleSelectHome}
        theme={theme}
      />
      {/* Auth Modal */}
      <AuthPanel open={showAuth} onClose={() => setShowAuth(false)} theme={theme} />
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
        onToggleFavourite={handleToggleFavourite}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        user={user}
        onShowAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        startupPosition={startupPosition}
        autosave={autosave}
        timeFormat={timeFormat}
        onSettingsChange={handleSettingsChange}
        creatingPage={creatingPage}
        deletingPageIds={deletingPageIds}
        // Add quick search trigger
        onOpenQuickSearch={() => setQuickSearchOpen(true)}
      />
      {/* Main Content Area */}
      <main className={`flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative transition-all duration-200 ${isSidebarCollapsed ? 'ml-0' : ''}`}>
        {/* Global loading overlay */}
        {/* {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )} */}
        <UnsavedChangesModal
          open={showUnsavedModal}
          onConfirm={async () => { if (pendingNavigation) await confirmNavigation(pendingNavigation); }}
          onCancel={() => { setPendingNavigation(null); setShowUnsavedModal(false); }}
        />
        <div className="flex-1 overflow-y-auto relative">
          {isHomeSelected ? (
            <Home 
              onNewPage={handleNewPage}
              pages={pages}
              onOpenPage={handleSelectPage}
              user={user}
              onShowAuth={() => setShowAuth(true)}
              timeFormat={timeFormat}
            />
          ) : (
            <div className="h-full flex flex-col relative group/editor-area">
              <Tiptap
                page={currentPage}
                onTitleChange={handleTitleChange}
                onSave={page => currentPage && handleSave({ ...currentPage, ...page })}
                onWordCountChange={() => {}}
                onDeletePage={handleDeletePage}
                autosave={autosave}
                onDirtyChange={setEditorDirty}
                onSavingChange={setEditorSaving}
              />
            </div>
          )}
        </div>
        {/* Status Bar */}
        {/* <StatusBar wordCount={wordCount} /> */}
      </main>
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} setTheme={setTheme} 
        onSettingsChange={handleSettingsChange}
        startupPosition={startupPosition}
        autosave={autosave}
        timeFormat={timeFormat}
      />
    </div>
  );
}