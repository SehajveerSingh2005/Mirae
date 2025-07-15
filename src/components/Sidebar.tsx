"use client";

import { Plus, Settings, Trash2, Home as HomeIcon, Sun, Moon, GlassWater, Star, User, MoreVertical, FileText, ArrowLeft, ArrowRight, LogOut } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Dialog, Tab } from "@headlessui/react";
import { useState } from "react";
import SettingsModal from "./SettingsModal";
import { motion } from "framer-motion";

import { Page, Folder } from '@/services/database';

interface SidebarProps {
  pages: Page[];
  folders: Folder[];
  currentPageId?: string;
  onSelectPage: (id: string) => void;
  onNewPage: () => void;
  onDeletePage: (id: string) => void;
  onSelectHome: () => void;
  isHomeSelected: boolean;
  theme: 'light' | 'dark' | 'glass';
  setTheme: (theme: 'light' | 'dark' | 'glass') => void;
  onNewFolder: (name: string, id: string) => void;
  onRenameFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onMovePage: (pageId: string, folderId?: string) => void;
  onToggleFavourite: (pageId: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  user: any;
  onShowAuth: () => void;
  onLogout: () => void;
  startupPosition: 'last' | 'home';
  autosave: boolean;
  timeFormat: '12h' | '24h';
  onSettingsChange: (settings: { startupPosition: 'last' | 'home'; autosave: boolean; timeFormat: '12h' | '24h'; }) => void;
  creatingPage?: boolean;
  deletingPageIds?: string[];
}

const themeOrder = ['light', 'dark', 'glass'] as const;

const Sidebar = ({ pages, folders, currentPageId, onSelectPage, onNewPage, onDeletePage, onSelectHome, isHomeSelected, theme, setTheme, onNewFolder, onRenameFolder, onDeleteFolder, onMovePage, onToggleFavourite, isSidebarCollapsed, setIsSidebarCollapsed, user, onShowAuth, onLogout, startupPosition, autosave, timeFormat, onSettingsChange, creatingPage = false, deletingPageIds = [] }: SidebarProps) => {
  const nextTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };
  let ThemeIcon = Sun;
  if (theme === 'dark') ThemeIcon = Moon;
  if (theme === 'glass') ThemeIcon = GlassWater;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingPageId, setPendingPageId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null);

  const handleOpenNewFolderDialog = (pageId?: string) => {
    setIsDialogOpen(true);
    setPendingPageId(pageId || null);
    setNewFolderName("");
  };
  const handleCreateNewFolder = () => {
    if (!newFolderName.trim()) return;
    const id = crypto.randomUUID();
    onNewFolder && onNewFolder(newFolderName, id);
    if (pendingPageId) onMovePage(pendingPageId, id);
    setIsDialogOpen(false);
    setNewFolderName("");
    setPendingPageId(null);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 64 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`h-full flex flex-col shadow-sm glass-sidebar transition-colors duration-200 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}
      style={{ background: 'var(--sidebar-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      {isSidebarCollapsed ? (
        <div className="flex flex-col items-center gap-6 mt-4 h-full">
          {/* Collapsed: Vertical Korean logo, always centered */}
          <div className="mb-2 select-none flex flex-col items-center justify-center w-full" style={{height: '48px'}}>
            <span className="text-2xl font-semibold tracking-wide opacity-90 leading-none" style={{fontFamily: 'Space Grotesk, sans-serif', color: 'var(--accent)', letterSpacing: '0.1em'}}>
              <span style={{display: 'block'}}>미</span>
              <span style={{display: 'block'}}>래</span>
            </span>
          </div>
          <div className="flex w-full justify-center items-center mb-6">
            <button
              className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer"
              style={{ color: 'var(--muted)' }}
              onClick={() => setIsSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {/* Collapsed: Home, Favourites, then page list, then new page */}
          <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full">
            <button
              title="Home"
              onClick={async () => await onSelectHome()}
              style={{ color: isHomeSelected ? 'var(--accent)' : 'var(--foreground)' }}
              className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer"
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <button
              title="Favourites"
              disabled={pages.filter(p => p.is_favorite).length === 0}
              style={{ color: (!isHomeSelected && pages.find(p => p.id === currentPageId)?.is_favorite) ? 'var(--accent)' : 'var(--foreground)' }}
              className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer"
            >
              <Star className="w-5 h-5" />
            </button>
            {/* Page list: use a file/document icon for each page */}
            {pages.map(page => (
              <button
                key={page.id}
                title={page.title || 'Untitled Page'}
                onClick={async () => await onSelectPage(page.id)}
                style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer"
                onContextMenu={e => {
                  e.preventDefault();
                  setPendingDeletePageId(page.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <FileText className="w-5 h-5" />
              </button>
            ))}
            {/* New Page button */}
            {user && (
              <button title="New Page" onClick={onNewPage} style={{ color: 'var(--foreground)' }} className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition mt-2 cursor-pointer">
                {creatingPage ? (
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          {/* Collapsed: Single settings/user icon at the bottom */}
          {user && (
            <div className="mt-auto mb-2 flex flex-col items-center">
              <button title="Logout" onClick={onLogout} style={{ color: 'var(--foreground)' }} className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer mb-2">
                <LogOut className="w-5 h-5" />
              </button>
              <button title="Settings" onClick={() => setIsSettingsOpen(true)} style={{ color: 'var(--foreground)' }} className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Expanded: Logo and arrow in a row */}
          <div className="flex items-center mb-8 select-none justify-between w-full">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold tracking-tight" style={{fontFamily: 'Inter, sans-serif', color: 'var(--foreground)'}}>Mirae</span>
              {/* Korean logo horizontal in expanded mode */}
              <span className="text-base font-semibold tracking-wide ml-1 opacity-70" style={{fontFamily: 'Space Grotesk, sans-serif', color: 'var(--accent)'}}>미래</span>
            </div>
            <div className="flex items-center justify-center">
              <button
                className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition flex items-center justify-center cursor-pointer"
                style={{ color: 'var(--muted)' }}
                onClick={() => setIsSidebarCollapsed(true)}
                title="Collapse sidebar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Top: Home and New Page */}
          {user && (
            <button className="w-full flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm transition text-base mb-4 cursor-pointer"
              style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
              onClick={onNewPage}
              title="New Page"
            >
              {creatingPage ? (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Plus className="w-5 h-5" strokeWidth={2} />
              )} New Page
            </button>
          )}
          <button
            className={`w-full text-left px-2 py-2 mb-4 rounded-xl transition font-semibold ${
              isHomeSelected
                ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm'
                : 'bg-transparent border border-transparent hover:bg-[#e4e4e7]/40 dark:hover:bg-[#232326]/40'
            } hover:opacity-90 cursor-pointer`}
            onClick={async () => await onSelectHome()}
            style={{
              fontFamily: 'Inter, Space Grotesk, sans-serif',
              color: isHomeSelected ? 'var(--accent)' : 'var(--foreground)'
            }}
          >
            Home
          </button>
          {/* Favourites Section */}
          <div className="flex items-center mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}><Star className="w-4 h-4 mr-1" /> Favourites</div>
          <div className="flex flex-col gap-2 mb-4">
            {pages.filter(p => p.is_favorite).length === 0 ? (
              <div className="text-sm italic" style={{ color: 'var(--muted)' }}>No favourites yet.</div>
            ) : (
              pages.filter(p => p.is_favorite).map(page => (
                <div key={page.id} className={`group flex items-center justify-between px-2 py-1 rounded-xl transition ${page.id === currentPageId ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--card-bg)]'} hover:opacity-90`} style={{ color: 'var(--foreground)' }}>
                  <button
                    className={`flex-1 text-left font-medium truncate cursor-pointer`}
                    style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                    onClick={async () => await onSelectPage(page.id)}
                  >
                    <Star className="inline w-4 h-4 mr-1 text-[var(--accent)]" fill="currentColor" />
                    {page.title || 'Untitled Page'}
                  </button>
                  <Menu as="div" className="relative ml-2">
                    <MenuButton className="p-1 rounded transition cursor-pointer">
                      <MoreVertical className="w-4 h-4" />
                    </MenuButton>
                    <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto" style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
                      <div className="py-1">
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                              onClick={() => onToggleFavourite(page.id)}
                            >
                              <Star className="w-4 h-4" fill={page.is_favorite ? 'currentColor' : 'none'} /> Remove from favourites
                            </button>
                          )}
                        </MenuItem>
                        <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm text-red-500 ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                              onClick={() => onDeletePage(page.id)}
                              disabled={deletingPageIds.includes(page.id)}
                            >
                              {deletingPageIds.includes(page.id) ? (
                                <svg className="animate-spin h-4 w-4 text-red-500 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : null}
                              Delete
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Menu>
                </div>
              ))
            )}
          </div>
          {/* Folders Section */}
          <div className="flex items-center mb-2">
            <span className="text-md font-bold" style={{ color: 'var(--foreground)' }}>Folders</span>
          </div>
          <div className="flex flex-col gap-2 mb-2">
            {user ? (
              <>
                {folders.map(folder => (
                  <div key={folder.id} className="mb-2 group/folder">
                    <div className="flex items-center gap-2 font-bold text-sm px-2 py-1 relative" style={{ color: 'var(--foreground)' }}>
                      {folder.name}
                      <Menu as="div" className="relative ml-auto">
                        <MenuButton className="p-1 text-xs opacity-0 group-hover/folder:opacity-100 transition rounded hover:bg-[#ececff] dark:hover:bg-[#232326] cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </MenuButton>
                        <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-32 origin-top-right rounded-md shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto" style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
                          <div className="py-1">
                            <MenuItem>
                              {({ focus }) => (
                                <button
                                  className={`w-full text-left px-4 py-2 text-sm ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                                  onClick={() => onRenameFolder(folder.id)}
                                >
                                  Rename
                                </button>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ focus }) => (
                                <button
                                  className={`w-full text-left px-4 py-2 text-sm text-red-500 ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                                  onClick={() => onDeleteFolder(folder.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      {pages.filter(p => p.folder_id === folder.id).map(page => (
                        <div key={page.id} className={`group flex items-center justify-between px-2 py-1 rounded-xl transition ${page.id === currentPageId ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--card-bg)]'} hover:opacity-90`} style={{ color: 'var(--foreground)' }}>
                          <button
                            className={`flex-1 text-left font-medium truncate cursor-pointer`}
                            style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                            onClick={async () => await onSelectPage(page.id)}
                          >
                            {page.title || 'Untitled Page'}
                          </button>
                          <select
                            className="ml-2 p-1 rounded text-xs bg-transparent border border-[#e4e4e7] dark:border-[#232326] cursor-pointer"
                            value={folder.id}
                            onChange={e => onMovePage(page.id, e.target.value === 'unsorted' ? undefined : e.target.value)}
                          >
                            {folders.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <button
                            className="ml-2 p-1 rounded transition cursor-pointer"
                            style={{ color: '#b0b0b0' }}
                            onMouseOver={e => e.currentTarget.style.color = 'red'}
                            onMouseOut={e => e.currentTarget.style.color = '#b0b0b0'}
                            onClick={() => onDeletePage(page.id)}
                            title="Delete Page"
                            disabled={deletingPageIds.includes(page.id)}
                          >
                            {deletingPageIds.includes(page.id) ? (
                              <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <Trash2 className="w-4 h-4" strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* New Folder Icon Button at the bottom */}
                <button
                  className="flex items-center gap-2 text-sm text-[var(--accent)] px-2 py-1 rounded transition cursor-pointer hover:underline bg-transparent"
                  onClick={() => handleOpenNewFolderDialog()}
                  title="New Folder"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} /> New Folder
                </button>
              </>
            ) : (
              <div className="text-sm italic text-[var(--muted)] px-2 py-2">Login to create pages and folders.</div>
            )}
          </div>
          {/* Unsorted Pages Section */}
          <div className="flex items-center mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#b0b0b0' }}>All Pages</div>
          <div className="flex flex-col gap-2">
            {pages.filter(p => !p.folder_id).map(page => (
              <div key={page.id} className={`group flex items-center justify-between px-2 py-1 rounded-xl transition ${page.id === currentPageId ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--card-bg)]'} hover:opacity-90`} style={{ color: 'var(--foreground)' }}>
                <button
                  className={`flex-1 text-left font-medium truncate cursor-pointer`}
                  style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                  onClick={async () => await onSelectPage(page.id)}
                >
                  {page.title || 'Untitled Page'}
                </button>
                <Menu as="div" className="relative ml-2">
                  <MenuButton className="p-1 rounded transition cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </MenuButton>
                  <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-50 origin-top-right rounded-xl shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto" style={{
                    background: 'var(--dropdown-bg)',
                    color: 'var(--foreground)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 16,
                    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.14)',
                    backdropFilter: 'var(--glass-blur)',
                    overflow: 'hidden',
                    padding: 0,
                  }}>
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)] bg-[var(--card-bg)] rounded-t">Add to folder</div>
                    {folders.length === 0 && (
                      <div className="px-4 py-2 text-sm text-[var(--muted)] opacity-60 cursor-not-allowed select-none">No folders yet</div>
                    )}
                    {folders.map(f => (
                      <MenuItem key={f.id}>
                        {({ focus }) => (
                          <button
                            className={`w-full text-left px-4 py-2 text-sm ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                            onClick={() => onMovePage(page.id, f.id)}
                          >
                            {f.name}
                          </button>
                        )}
                      </MenuItem>
                    ))}
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                          style={{ color: 'var(--accent)', fontWeight: 600 }}
                          onClick={() => handleOpenNewFolderDialog(page.id)}
                        >
                          <Plus className="w-4 h-4" /> Create new folder…
                        </button>
                      )}
                    </MenuItem>
                    <div style={{ borderTop: '1px solid var(--border)', opacity: 0.5, margin: '8px 0' }} />
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                          onClick={() => onToggleFavourite(page.id)}
                        >
                          <Star className="w-4 h-4" fill={page.is_favorite ? 'currentColor' : 'none'} />
                          {page.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
                        </button>
                      )}
                    </MenuItem>
                    <div style={{ borderTop: '1px solid var(--border)', opacity: 0.5, margin: '8px 0' }} />
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-sm text-red-500 ${focus ? 'menu-item-focus' : ''} cursor-pointer`}
                          onClick={() => onDeletePage(page.id)}
                          disabled={deletingPageIds.includes(page.id)}
                        >
                          {deletingPageIds.includes(page.id) ? (
                            <svg className="animate-spin h-4 w-4 text-red-500 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Delete
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            ))}
          </div>
          {/* Bottom User/Settings/Theme */}
          <div className="mt-auto flex flex-row items-center justify-between pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            {user ? (
              <div className="flex items-center gap-2 w-full">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}><User className="w-5 h-5" /></span>
                <span className="font-semibold truncate overflow-hidden max-w-[60px]" style={{ color: 'var(--foreground)' }}>{user.email || 'User'}</span>
                <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                  <button
                    className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition cursor-pointer"
                    style={{ color: 'var(--foreground)' }}
                    onClick={onLogout}
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full shadow-sm transition cursor-pointer" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }} onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <button
                  className="px-4 py-2 rounded-xl font-semibold shadow-sm transition text-base cursor-pointer flex items-center justify-center"
                  style={{ background: 'var(--button-bg)', color: 'var(--button-fg)', minHeight: 44 }}
                  onClick={onShowAuth}
                >
                  Login / Signup
                </button>
                <button
                  className="p-3 rounded-full shadow-sm transition cursor-pointer flex items-center justify-center"
                  style={{ background: 'var(--button-bg)', color: 'var(--button-fg)', minWidth: 44, minHeight: 44 }}
                  onClick={() => setIsSettingsOpen(true)}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            )}
            <div className="flex flex-row items-center gap-1">
            </div>
          </div>
        </>
      )}
      {/* SettingsModal and Dialog always rendered so they work in both modes */}
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        startupPosition={startupPosition}
        autosave={autosave}
        timeFormat={timeFormat}
        onSettingsChange={onSettingsChange}
      />
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px] w-full h-full transition-all duration-200" />
        <Dialog.Panel
          className="relative rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-[var(--border)] flex flex-col gap-4 transition-all duration-200"
          style={{
            background: theme === 'glass' ? 'var(--dropdown-bg)' : theme === 'dark' ? '#232326' : '#fff',
            color: 'var(--foreground)',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)'
          }}
        >
          <Dialog.Title className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Create New Folder</Dialog.Title>
          <input
            className="w-full px-4 py-2 rounded border outline-none transition"
            style={{ background: 'var(--input-bg)', color: 'var(--input-fg)', borderColor: 'var(--border)' }}
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 justify-end mt-4">
            <button className="px-4 py-2 rounded transition font-semibold cursor-pointer" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }} onClick={handleCreateNewFolder}>
              Create
            </button>
            <button className="px-4 py-2 rounded transition font-semibold cursor-pointer" style={{ background: 'transparent', color: 'var(--muted)' }} onClick={() => setIsDialogOpen(false)}>
              Cancel
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
      {/* Delete Page Dialog for collapsed mode */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px] w-full h-full transition-all duration-200" />
        <Dialog.Panel
          className="relative rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-[var(--border)] flex flex-col gap-4 transition-all duration-200"
          style={{
            background: theme === 'glass' ? 'var(--dropdown-bg)' : theme === 'dark' ? '#232326' : '#fff',
            color: 'var(--foreground)',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)'
          }}
        >
          <Dialog.Title className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Delete Page</Dialog.Title>
          <div className="text-base" style={{ color: 'var(--foreground)' }}>
            Are you sure you want to delete this page?
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button className="px-4 py-2 rounded transition font-semibold cursor-pointer" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
              onClick={() => {
                if (pendingDeletePageId) {
                  onDeletePage(pendingDeletePageId);
                  if (pendingDeletePageId === currentPageId) onSelectHome();
                }
                setDeleteDialogOpen(false);
                setPendingDeletePageId(null);
              }}
            >
              Delete
            </button>
            <button className="px-4 py-2 rounded transition font-semibold cursor-pointer" style={{ background: 'transparent', color: 'var(--muted)' }}
              onClick={() => {
                setDeleteDialogOpen(false);
                setPendingDeletePageId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </motion.aside>
  );
};

export default Sidebar; 