"use client";

import { Plus, Settings, Trash2, Home as HomeIcon, Sun, Moon, GlassWater, Star, User, MoreVertical, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Dialog, Tab } from "@headlessui/react";
import { useState } from "react";
import SettingsModal from "./SettingsModal";
import { motion } from "framer-motion";

interface Folder {
  id: string;
  name: string;
  pageIds: string[];
}
interface Page {
  id: string;
  title: string;
  content: string;
  folderId?: string;
}
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
  favourites: string[];
  onToggleFavourite: (pageId: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const themeOrder = ['light', 'dark', 'glass'] as const;

const Sidebar = ({ pages, folders, currentPageId, onSelectPage, onNewPage, onDeletePage, onSelectHome, isHomeSelected, theme, setTheme, onNewFolder, onRenameFolder, onDeleteFolder, onMovePage, favourites, onToggleFavourite, isSidebarCollapsed, setIsSidebarCollapsed }: SidebarProps) => {
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
              className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition"
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
              onClick={onSelectHome}
              style={{ color: isHomeSelected ? 'var(--accent)' : 'var(--foreground)' }}
              className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition"
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <button
              title="Favourites"
              disabled={favourites.length === 0}
              style={{ color: (!isHomeSelected && favourites.includes(currentPageId || '')) ? 'var(--accent)' : 'var(--foreground)' }}
              className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition"
            >
              <Star className="w-5 h-5" />
            </button>
            {/* Page list: use a file/document icon for each page */}
            {pages.map(page => (
              <button
                key={page.id}
                title={page.title || 'Untitled Page'}
                onClick={() => onSelectPage(page.id)}
                style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition"
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
            <button title="New Page" onClick={onNewPage} style={{ color: 'var(--foreground)' }} className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition mt-2">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {/* Collapsed: Single settings/user icon at the bottom */}
          <div className="mt-auto mb-2 flex flex-col items-center">
            <button title="Settings" onClick={() => setIsSettingsOpen(true)} style={{ color: 'var(--foreground)' }} className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition">
              <Settings className="w-6 h-6" />
            </button>
          </div>
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
                className="p-2 rounded-full hover:bg-[var(--button-hover-bg)] transition flex items-center justify-center"
                style={{ color: 'var(--muted)' }}
                onClick={() => setIsSidebarCollapsed(true)}
                title="Collapse sidebar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Home */}
          <button
            className={`w-full text-left px-2 py-2 mb-4 rounded-xl transition font-semibold ${
              isHomeSelected
                ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm'
                : 'bg-transparent border border-transparent hover:bg-[#e4e4e7]/40 dark:hover:bg-[#232326]/40'
            } hover:opacity-90`}
            onClick={onSelectHome}
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
            {pages.filter(p => favourites.includes(p.id)).length === 0 ? (
              <div className="text-sm italic" style={{ color: 'var(--muted)' }}>No favourites yet.</div>
            ) : (
              pages.filter(p => favourites.includes(p.id)).map(page => (
                <div key={page.id} className={`group flex items-center justify-between px-2 py-1 rounded-xl transition ${page.id === currentPageId ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--card-bg)]'} hover:opacity-90`} style={{ color: 'var(--foreground)' }}>
                  <button
                    className={`flex-1 text-left font-medium truncate`}
                    style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                    onClick={() => onSelectPage(page.id)}
                  >
                    <Star className="inline w-4 h-4 mr-1 text-[var(--accent)]" fill="currentColor" />
                    {page.title || 'Untitled Page'}
                  </button>
                  <Menu as="div" className="relative ml-2">
                    <MenuButton className="p-1 rounded transition">
                      <MoreVertical className="w-4 h-4" />
                    </MenuButton>
                    <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto" style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
                      <div className="py-1">
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${focus ? 'menu-item-focus' : ''}`}
                              onClick={() => onToggleFavourite(page.id)}
                            >
                              <Star className="w-4 h-4" fill={favourites.includes(page.id) ? 'currentColor' : 'none'} /> Remove from favourites
                            </button>
                          )}
                        </MenuItem>
                        <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm text-red-500 ${focus ? 'menu-item-focus' : ''}`}
                              onClick={() => onDeletePage(page.id)}
                            >
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
          <div className="flex items-center justify-between mb-4">
            <span className="text-md font-bold" style={{ color: 'var(--foreground)' }}>Folders</span>
            <button
              className="p-2 rounded-full shadow-sm transition ml-2"
              style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
              onClick={onNewPage}
              title="New Page"
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {folders.map(folder => (
              <div key={folder.id} className="mb-2 group/folder">
                <div className="flex items-center gap-2 font-bold text-sm px-2 py-1 relative" style={{ color: 'var(--foreground)' }}>
                  {folder.name}
                  <Menu as="div" className="relative ml-auto">
                    <MenuButton className="p-1 text-xs opacity-0 group-hover/folder:opacity-100 transition rounded hover:bg-[#ececff] dark:hover:bg-[#232326]">
                      <MoreVertical className="w-4 h-4" />
                    </MenuButton>
                    <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-32 origin-top-right rounded-md shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto" style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
                      <div className="py-1">
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm ${focus ? 'menu-item-focus' : ''}`}
                              onClick={() => onRenameFolder(folder.id)}
                            >
                              Rename
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm text-red-500 ${focus ? 'menu-item-focus' : ''}`}
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
                  {pages.filter(p => p.folderId === folder.id).map(page => (
                    <div key={page.id} className={`group flex items-center justify-between px-2 py-1 rounded-xl transition ${page.id === currentPageId ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--card-bg)]'} hover:opacity-90`} style={{ color: 'var(--foreground)' }}>
                      <button
                        className={`flex-1 text-left font-medium truncate`}
                        style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                        onClick={() => onSelectPage(page.id)}
                      >
                        {page.title || 'Untitled Page'}
                      </button>
                      <select
                        className="ml-2 p-1 rounded text-xs bg-transparent border border-[#e4e4e7] dark:border-[#232326]"
                        value={folder.id}
                        onChange={e => onMovePage(page.id, e.target.value === 'unsorted' ? undefined : e.target.value)}
                      >
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <button
                        className="ml-2 p-1 rounded transition"
                        style={{ color: '#b0b0b0' }}
                        onMouseOver={e => e.currentTarget.style.color = 'red'}
                        onMouseOut={e => e.currentTarget.style.color = '#b0b0b0'}
                        onClick={() => onDeletePage(page.id)}
                        title="Delete Page"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* New Folder Icon Button at the bottom */}
            <button
              key="new-folder-btn"
              className="flex items-center gap-2 mt-2 p-2 rounded-xl transition text-sm font-semibold justify-center"
              style={{ background: 'transparent', color: 'var(--accent)' }}
              title="New Folder"
              onClick={() => handleOpenNewFolderDialog()}
            >
              <Plus className="w-4 h-4" strokeWidth={2} /> New Folder
            </button>
          </div>
          {/* Unsorted Pages Section */}
          <div className="flex items-center mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#b0b0b0' }}>Unsorted</div>
          <div className="flex flex-col gap-2">
            {pages.filter(p => !p.folderId).map(page => (
              <div key={page.id} className={`group flex items-center justify-between px-2 py-1 rounded-xl transition ${page.id === currentPageId ? 'bg-[#7b5dff]/10 border border-[#7b5dff] shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--card-bg)]'} hover:opacity-90`} style={{ color: 'var(--foreground)' }}>
                <button
                  className={`flex-1 text-left font-medium truncate`}
                  style={{ color: page.id === currentPageId ? 'var(--accent)' : 'var(--foreground)' }}
                  onClick={() => onSelectPage(page.id)}
                >
                  {page.title || 'Untitled Page'}
                </button>
                <Menu as="div" className="relative ml-2">
                  <MenuButton className="p-1 rounded transition">
                    <MoreVertical className="w-4 h-4" />
                  </MenuButton>
                  <MenuItems anchor="bottom end" className="absolute right-0 mt-2 w-50 origin-top-right rounded-xl shadow-lg ring-1 z-10 border max-h-60 overflow-y-auto" style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)] bg-[var(--card-bg)] rounded-t">Add to folder</div>
                      {folders.length === 0 && (
                        <div className="px-4 py-2 text-sm text-[var(--muted)] opacity-60 cursor-not-allowed select-none">No folders yet</div>
                      )}
                      {folders.map(f => (
                        <MenuItem key={f.id}>
                          {({ focus }) => (
                            <button
                              className={`w-full text-left px-4 py-2 text-sm ${focus ? 'menu-item-focus' : ''}`}
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
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${focus ? 'menu-item-focus' : ''}`}
                            style={{ color: 'var(--accent)', fontWeight: 600 }}
                            onClick={() => handleOpenNewFolderDialog(page.id)}
                          >
                            <Plus className="w-4 h-4" /> Create new folder…
                          </button>
                        )}
                      </MenuItem>
                      <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${focus ? 'menu-item-focus' : ''}`}
                            onClick={() => onToggleFavourite(page.id)}
                          >
                            <Star className="w-4 h-4" fill={favourites.includes(page.id) ? 'currentColor' : 'none'} />
                            {favourites.includes(page.id) ? 'Remove from favourites' : 'Add to favourites'}
                          </button>
                        )}
                      </MenuItem>
                      <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            className={`w-full text-left px-4 py-2 text-sm text-red-500 ${focus ? 'menu-item-focus' : ''}`}
                            onClick={() => onDeletePage(page.id)}
                          >
                            Delete
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            ))}
          </div>
          {/* Bottom User/Settings/Theme */}
          <div className="mt-auto flex flex-row items-center justify-between pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 select-none">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}><User className="w-5 h-5" /></span>
              <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Username</span>
            </div>
            <div className="flex flex-row items-center gap-1">
              <button className="p-2 rounded-full shadow-sm transition" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="w-5 h-5" strokeWidth={2} />
              </button>
              <Menu as="div" className="relative">
                <MenuButton className="p-2 rounded-full shadow-sm transition flex items-center justify-center" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}>
                  {theme === 'light' && <Sun className="w-5 h-5" />}
                  {theme === 'dark' && <Moon className="w-5 h-5" />}
                  {theme === 'glass' && <GlassWater className="w-5 h-5" />}
                </MenuButton>
                <MenuItems anchor="bottom end" className="absolute bottom-12 right-0 w-40 h-30 origin-bottom-right rounded-xl shadow-lg ring-1 z-20 border overflow-y-auto" style={{ background: 'var(--dropdown-bg)', color: 'var(--foreground)', backdropFilter: 'var(--glass-blur)' }}>
                  <div className="py-1">
                    <MenuItem>
                      {({ focus, close }) => (
                        <button
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${focus ? 'menu-item-focus' : ''}`}
                          style={{ color: 'var(--foreground)' }}
                          onClick={() => { setTheme('light'); close(); }}
                        >
                          <Sun className="w-4 h-4" /> Light
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus, close }) => (
                        <button
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${focus ? 'menu-item-focus' : ''}`}
                          style={{ color: 'var(--foreground)' }}
                          onClick={() => { setTheme('dark'); close(); }}
                        >
                          <Moon className="w-4 h-4" /> Dark
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus, close }) => (
                        <button
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${focus ? 'menu-item-focus' : ''}`}
                          style={{ color: 'var(--foreground)' }}
                          onClick={() => { setTheme('glass'); close(); }}
                        >
                          <GlassWater className="w-4 h-4" /> Glass
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </>
      )}
      {/* SettingsModal and Dialog always rendered so they work in both modes */}
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} />
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
            <button className="px-4 py-2 rounded transition font-semibold" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }} onClick={handleCreateNewFolder}>
              Create
            </button>
            <button className="px-4 py-2 rounded transition font-semibold" style={{ background: 'transparent', color: 'var(--muted)' }} onClick={() => setIsDialogOpen(false)}>
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
            <button className="px-4 py-2 rounded transition font-semibold" style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
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
            <button className="px-4 py-2 rounded transition font-semibold" style={{ background: 'transparent', color: 'var(--muted)' }}
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