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

const Tiptap = dynamic(() => import("@/components/Editor"), { ssr: false });

// Types are now imported from database service

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

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mirae-theme');
    if (stored) setTheme(stored as 'light' | 'dark' | 'glass');
    // Check database setup on app load
    checkDatabaseSetup();
    // Load settings from localStorage (client only)
    if (typeof window !== 'undefined') {
      const startup = localStorage.getItem('mirae-startup-position') as 'last' | 'home' || 'last';
      setStartupPosition(startup);
      if (startup === 'home') {
        setIsHomeSelected(true);
        setCurrentPageId('');
      }
      setAutosave(localStorage.getItem('mirae-autosave') !== 'false');
      setTimeFormat(localStorage.getItem('mirae-time-format') as '12h' | '24h' || '24h');
    }
  }, []);

  // Only sync theme to localStorage
  useEffect(() => {
    if (!mounted) return;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mirae-theme', theme);
  }, [theme, mounted]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading data for user:', user.id);
      const [pagesData, foldersData] = await Promise.all([
        databaseService.getPages(user.id),
        databaseService.getFolders(user.id)
      ]);
      
      console.log('Loaded pages:', pagesData.length);
      console.log('Loaded folders:', foldersData.length);
      
      setPages(pagesData);
      setFolders(foldersData);
      
      // Set current page to first page if available
      if (pagesData.length > 0 && !currentPageId) {
        setCurrentPageId(pagesData[0].id);
        setIsHomeSelected(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Show a more user-friendly error message
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPage = async () => {
    if (!user) {
      console.error('No user found, cannot create page');
      return;
    }
    
    console.log('Creating new page for user:', user.id);
    
    try {
      const newPage = await databaseService.createPage(user.id, {
        title: "Untitled Page",
        content: "",
      });
      
      console.log('Page created successfully:', newPage);
      setPages(prev => [newPage, ...prev]);
      setCurrentPageId(newPage.id);
      setIsHomeSelected(false);
    } catch (error) {
      console.error('Error creating page:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // You might want to show a user-friendly error message here
      alert('Failed to create page. Please check your connection and try again.');
    }
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

  const handleTitleChange = async (title: string) => {
    if (!user || !currentPageId) return;
    
    try {
      await databaseService.updatePage(currentPageId, user.id, { title });
      setPages(prev => prev.map(p => p.id === currentPageId ? { ...p, title } : p));
    } catch (error) {
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
      setPages(prev => prev.map(p => p.id === page.id ? page : p));
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!user) return;
    
    try {
      await databaseService.deletePage(id, user.id);
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
    } catch (error) {
      console.error('Error deleting page:', error);
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

  const currentPage = pages.find(p => p.id === currentPageId);

  if (!mounted || authLoading) return null;

  return (
    <div className="flex w-screen h-screen min-w-0 min-h-0 overflow-hidden">
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
                onSave={page => currentPage && handleSave({ ...currentPage, ...page })}
                onWordCountChange={() => {}}
                onDeletePage={handleDeletePage}
                autosave={autosave}
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