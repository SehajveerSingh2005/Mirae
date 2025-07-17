"use client";

import { Plus } from "lucide-react";
import { useState, useRef } from "react";
import CalendarWidget from "./widgets/CalendarWidget";
import ClockWidget from "./widgets/ClockWidget";
import UniversalSearchBar from "./UniversalSearchBar";
import RecentActivity from "./RecentActivity";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 18) return "Good afternoon!";
  return "Good evening!";
};

// Helper to get/set recent pages in localStorage (copy from QuickSearchOverlay)
type PageType = { id: string; title: string; content: string };
function getRecentPages(pages: PageType[]): PageType[] {
  if (typeof window === 'undefined') return [];
  const ids: string[] = JSON.parse(localStorage.getItem('mirae-recent-pages') || '[]');
  return ids
    .map((id: string) => pages.find((p: PageType) => p.id === id))
    .filter(Boolean) as PageType[];
}

const Home = ({ onNewPage, onOpenPage, pages, user, onShowAuth, timeFormat, onOpenQuickSearch, quickSearchOpen }: {
  onNewPage: () => void,
  onOpenPage: (id: string) => void,
  pages: Array<{ id: string, title: string, content: string }>,
  user: any,
  onShowAuth: () => void,
  timeFormat: '12h' | '24h',
  onOpenQuickSearch?: () => void,
  quickSearchOpen?: boolean
}) => {
  const searchBarRef = useRef<HTMLInputElement>(null);
  return (
    <div className="min-h-full w-full flex flex-col">
      {/* Top Bar: Logo and New Page only */}
      <header className="flex items-center justify-between px-8 py-6 border-b backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center select-none">
          <span className="text-3xl font-extrabold tracking-tight" style={{fontFamily: 'Inter, Space Grotesk, sans-serif', color: 'var(--foreground)'}}>Mirae</span>
          <span className="text-xl font-semibold tracking-wide ml-1 opacity-70" style={{fontFamily: 'Space Grotesk, Inter, sans-serif', color: 'var(--accent)'}}>미래</span>
        </div>
        <div className="flex items-center justify-center h-full">
          {user ? (
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold shadow-sm transition text-base cursor-pointer"
              style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
              onClick={async () => await onNewPage()}
            >
              <Plus className="w-5 h-5" strokeWidth={2} /> New Page
            </button>
          ) : null}
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 px-8 py-8 flex flex-col items-center" style={{ background: 'var(--background)' }}>
        <div className="mb-8 w-full max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl font-extrabold tracking-tight flex items-center gap-2 mb-4 text-center" style={{ color: 'var(--foreground)', lineHeight: 1.15 }}>
            {getGreeting()} <span className="text-2xl font-normal ml-2" style={{ color: 'var(--muted)' }}>Welcome to Mirae.</span>
          </h2>
          {!user && (
            <button
              className="mt-2 mb-4 px-6 py-3 rounded-xl font-semibold shadow-sm transition text-lg cursor-pointer"
              style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
              onClick={onShowAuth}
            >
              Login / Signup
            </button>
          )}
          {!quickSearchOpen && (
            <UniversalSearchBar ref={searchBarRef} search="" setSearch={() => {}} user={user} onTrigger={onOpenQuickSearch} shouldBlurOnTrigger={true} />
          )}
        </div>
        {/* Dashboard Widgets Grid */}
        <div className="w-full max-w-4xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <CalendarWidget />
          <ClockWidget timeFormat={timeFormat} />
        </div>
        {/* Recent Activity or Empty State */}
        {user && (
          <RecentActivity
            showEmpty={pages.length === 0}
            filteredPages={getRecentPages(pages)}
            onNewPage={async () => await onNewPage()}
            onOpenPage={async (id) => await onOpenPage(id)}
          />
        )}
      </main>
    </div>
  );
};

export default Home; 