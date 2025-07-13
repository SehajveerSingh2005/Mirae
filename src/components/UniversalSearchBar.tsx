import { Sparkles } from "lucide-react";

const UniversalSearchBar = ({ search, setSearch, user }: { search: string, setSearch: (v: string) => void, user?: any }) => (
  <div className="relative w-full flex flex-col items-center">
    <input
      type="text"
      value={search}
      onChange={e => user && setSearch(e.target.value)}
      placeholder={user ? "Search pages or ask Mirae AI…" : "Login to search or ask Mirae AI…"}
      className="w-full text-lg px-6 py-4 rounded-2xl border outline-none shadow-md transition placeholder:opacity-60"
      style={{ background: 'var(--input-bg)', color: 'var(--input-fg)', borderColor: 'var(--border)', fontWeight: 500 }}
      disabled={!user}
    />
    <button
      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[var(--button-bg)] text-[var(--button-fg)] shadow disabled:opacity-60"
      style={{ background: 'var(--button-bg)', color: 'var(--button-fg)' }}
      title="Ask Mirae AI"
      disabled={!user}
    >
      <Sparkles className="w-5 h-5" />
    </button>
  </div>
);

export default UniversalSearchBar; 