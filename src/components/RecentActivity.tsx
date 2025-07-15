import { Plus } from "lucide-react";

const RecentActivity = ({ showEmpty, filteredPages, onNewPage, onOpenPage }: {
  showEmpty: boolean,
  filteredPages: Array<{ id: string, title: string, content: string }>;
  onNewPage: () => void;
  onOpenPage: (id: string) => void;
}) => (
  <div className="w-full max-w-4xl mx-auto mt-8 flex-1 flex flex-col">
    {showEmpty ? (
      <div className="flex-1 flex flex-col items-center justify-center opacity-80">
        <span className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No pages yet</span>
        <span className="text-base mb-4" style={{ color: 'var(--muted)' }}>Create your first page to get started!</span>
        <button
          className="px-6 py-2 flex flex-row items-center justify-center rounded-xl font-semibold shadow-sm transition text-base"
          style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
          onClick={async () => await onNewPage()}
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={3} /> New Page
        </button>
      </div>
    ) : (
      <>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Recent Activity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredPages.map(page => (
            <div
              key={page.id}
              className="rounded-2xl shadow-sm p-6 flex flex-col gap-2 transition cursor-pointer hover:shadow-lg hover:border-[var(--accent)]"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              onClick={async () => await onOpenPage(page.id)}
              tabIndex={0}
              role="button"
              aria-label={`Open page: ${page.title || 'Untitled Page'}`}
            >
              <span className="text-lg font-semibold truncate" style={{fontFamily: 'Inter, Space Grotesk, sans-serif', color: 'var(--foreground)'}}>{page.title || 'Untitled Page'}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

export default RecentActivity; 