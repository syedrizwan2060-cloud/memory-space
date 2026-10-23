"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search, SlidersHorizontal, X, BookOpen, MapPin } from "lucide-react";

type Memory = {
  id: string;
  title: string;
  content: string;
  memory_date: string;
  space_id: string;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type SortMode = "newest" | "oldest" | "title";

type Props = {
  memories: Memory[];
  spaceName: string;
  loading: boolean;
  onReadMemory: (memory: Memory) => void;
};

function formatDate(value: string) {
  if (!value) return "Date not set";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Date not set";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function MemoryDiscovery({ memories, spaceName, loading, onReadMemory }: Props) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const hasFilters = Boolean(query.trim() || dateFrom || dateTo || sortMode !== "newest");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return memories
      .filter((memory) => {
        const searchableText = [memory.title, memory.content, memory.place_name ?? ""]
          .join(" ")
          .toLocaleLowerCase();
        if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;
        if (dateFrom && (!memory.memory_date || memory.memory_date < dateFrom)) return false;
        if (dateTo && (!memory.memory_date || memory.memory_date > dateTo)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === "title") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
        const dateComparison = (a.memory_date || "").localeCompare(b.memory_date || "");
        return sortMode === "oldest" ? dateComparison : -dateComparison;
      });
  }, [memories, query, dateFrom, dateTo, sortMode]);

  function resetFilters() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setSortMode("newest");
  }

  return (
    <section className="space-y-7">
      <header>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">FIND A MOMENT AGAIN</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Memory Discovery<span className="text-[#bd91ad]">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379] sm:text-base">
          Search the stories, dates, and places you saved{spaceName ? ` in ${spaceName}` : " in your selected space"}.
        </p>
      </header>

      {!spaceName ? (
        <div className="rounded-3xl border border-dashed border-[#d9cbd8] bg-white/70 p-8">
          <h2 className="text-lg font-semibold text-[#514451]">Choose a space first</h2>
          <p className="mt-2 text-sm leading-6 text-[#8d8379]">Select one of your spaces from the sidebar to discover its memories privately.</p>
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-[#eee6df] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#514451]">
              <SlidersHorizontal size={17} /> Search and refine
            </div>
            <div className="relative mt-4">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a18a9e]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, stories, or places..."
                aria-label="Search memories by title, story, or place"
                className="w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] py-3 pl-11 pr-4 text-sm text-[#514451] outline-none transition placeholder:text-[#a69a9f] focus:border-[#a98ca7]"
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block text-sm font-medium text-[#62575f]">
                <span className="mb-2 flex items-center gap-2"><CalendarDays size={15} /> From date</span>
                <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-3 py-3 text-sm text-[#514451] outline-none focus:border-[#a98ca7]" />
              </label>
              <label className="block text-sm font-medium text-[#62575f]">
                <span className="mb-2 flex items-center gap-2"><CalendarDays size={15} /> To date</span>
                <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-3 py-3 text-sm text-[#514451] outline-none focus:border-[#a98ca7]" />
              </label>
              <label className="block text-sm font-medium text-[#62575f]">
                <span className="mb-2 flex items-center gap-2"><SlidersHorizontal size={15} /> Sort results</span>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-3 py-3 text-sm text-[#514451] outline-none focus:border-[#a98ca7]">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e9ef] pt-4">
              <p className="text-sm text-[#8d8379]" aria-live="polite">{loading ? "Finding your memories…" : `${results.length} of ${memories.length} ${memories.length === 1 ? "memory" : "memories"}`}</p>
              {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-xl border border-[#e7dce5] px-3 py-2 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7]"><X size={15} /> Clear filters</button>}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 text-sm text-[#8d8379]">Gathering your little moments…</div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 text-center sm:p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]"><Search size={22} /></div>
              <h2 className="mt-4 text-lg font-semibold text-[#514451]">{memories.length ? "No memories match those filters" : "Your story starts here"}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8d8379]">{memories.length ? "Try a different search, widen the date range, or clear the filters to see every memory in this space." : "When you save memories in this space, you can find them here by searching their words, places, and dates."}</p>
              {memories.length > 0 && <button type="button" onClick={resetFilters} className="mt-5 rounded-xl bg-[#816780] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#70556f]">Clear all filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((memory, index) => (
                <article key={memory.id} className="flex min-w-0 flex-col rounded-2xl border border-[#eee6df] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index % 3 === 0 ? "bg-[#f4e3e1] text-[#a96f75]" : index % 3 === 1 ? "bg-[#eae4f3] text-[#8171a3]" : "bg-[#e4ebe0] text-[#6f8969]"}`}><BookOpen size={21} /></div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-[#a18a9e]">{formatDate(memory.memory_date)}</p>
                  <h2 className="mt-2 break-words text-lg font-semibold leading-snug text-[#514451]">{memory.title || "Untitled memory"}</h2>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#8d8379]">{memory.content || "A moment saved for later."}</p>
                  {memory.place_name && <p className="mt-3 flex items-start gap-1.5 text-xs text-[#8d8379]"><MapPin size={14} className="mt-0.5 shrink-0" /><span className="break-words">{memory.place_name}</span></p>}
                  <button type="button" onClick={() => onReadMemory(memory)} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#816780] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#70556f]">Read memory <BookOpen size={15} className="ml-2" /></button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
