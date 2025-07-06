"use client";

import { Search, Plus } from "lucide-react";

const recentPages = [
  { id: 1, title: "Welcome to Mirae", date: "2024-06-01" },
  { id: 2, title: "Ideas for the Future", date: "2024-06-02" },
  { id: 3, title: "Korean Design Notes", date: "2024-06-03" },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 18) return "Good afternoon!";
  return "Good evening!";
};

const Home = ({ onNewPage }: { onNewPage: () => void }) => (
  <div className="min-h-full w-full flex flex-col">
    {/* Top Bar */}
    <header className="flex items-center justify-between px-8 py-6 border-b border-[#e4e4e7] dark:border-[#232326] backdrop-blur-md">
      <div className="flex items-center select-none">
        <span className="text-2xl font-extrabold tracking-tight" style={{fontFamily: 'Inter, Space Grotesk, sans-serif', color: 'var(--foreground)'}}>Mirae</span>
        <span className="text-base font-semibold tracking-wide ml-1 opacity-70" style={{fontFamily: 'Space Grotesk, Inter, sans-serif', color: 'var(--accent)'}}>미래</span>
      </div>
      <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)', opacity: 0.5 }} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search pages, activity..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border outline-none transition placeholder:opacity-50"
            style={{ color: 'var(--input-fg)', background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
        </div>
      </div>
      <div className="flex items-center justify-center h-full">
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold shadow-sm transition text-base"
          style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
          onClick={onNewPage}
        >
          <Plus className="w-5 h-5" strokeWidth={2} /> New Page
        </button>
      </div>
    </header>
    {/* Main Content */}
    <main className="flex-1 px-8 py-8" style={{ background: 'var(--background)' }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          {getGreeting()} <span className="text-base font-normal ml-2" style={{ color: 'var(--muted)' }}>Welcome to Mirae.</span>
        </h2>
      </div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Recent Activity</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recentPages.map(page => (
          <div key={page.id} className="rounded-2xl shadow-sm p-6 flex flex-col gap-2 transition cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <span className="text-lg font-semibold truncate" style={{fontFamily: 'Inter, Space Grotesk, sans-serif', color: 'var(--foreground)'}}>{page.title}</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{page.date}</span>
          </div>
        ))}
      </div>
      {/* Add more dashboard widgets or sections here as needed */}
    </main>
  </div>
);

export default Home; 