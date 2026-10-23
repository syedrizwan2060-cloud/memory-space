"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Heart, Search, Sparkles } from "lucide-react";

type TimelineMemory = {
  id: string;
  title: string;
  content: string;
  memory_date: string;
  space_id: string;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  memories: TimelineMemory[];
  spaceName: string;
  onReadMemory: (memory: TimelineMemory) => void;
};

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { ...options, timeZone: "Asia/Kolkata" });
}

export default function TimelineView({ memories, spaceName, onReadMemory }: Props) {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [yearFilter, setYearFilter] = useState("all");

  const years = useMemo(() => [...new Set(memories.map((m) => m.memory_date.slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a)), [memories]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return memories.filter((m) => {
      const matchesQuery = !q || m.title.toLocaleLowerCase().includes(q) || m.content.toLocaleLowerCase().includes(q) || (m.place_name ?? "").toLocaleLowerCase().includes(q);
      const matchesYear = yearFilter === "all" || m.memory_date.startsWith(yearFilter);
      return matchesQuery && matchesYear;
    }).sort((a, b) => sortOrder === "newest" ? b.memory_date.localeCompare(a.memory_date) : a.memory_date.localeCompare(b.memory_date));
  }, [memories, query, sortOrder, yearFilter]);

  const groups = useMemo(() => {
    const result: { monthKey: string; monthLabel: string; items: TimelineMemory[] }[] = [];
    for (const memory of filtered) {
      const date = parseDate(memory.memory_date);
      const monthKey = memory.memory_date.slice(0, 7);
      let group = result.find((item) => item.monthKey === monthKey);
      if (!group) {
        group = { monthKey, monthLabel: Number.isNaN(date.getTime()) ? monthKey : date.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }), items: [] };
        result.push(group);
      }
      group.items.push(memory);
    }
    return result;
  }, [filtered]);

  const sharedDates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const memory of memories) counts.set(memory.memory_date, (counts.get(memory.memory_date) ?? 0) + 1);
    return counts;
  }, [memories]);

  return (
    <section className="space-y-7">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a18a9e]">YOUR STORY, IN ORDER</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Memory Timeline <span aria-hidden="true">✦</span></h1>
        <p className="max-w-2xl text-sm leading-6 text-[#8d8379]">Revisit the moments that shaped {spaceName ? spaceName : "your space"}, month by month. Memories from the same date stay connected together.</p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-[#e9e1e9] bg-white/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <label className="relative block">
          <span className="sr-only">Search timeline</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a18a9e]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a moment, story or place…" className="w-full rounded-xl border border-[#e7dce5] bg-white px-10 py-3 text-sm outline-none focus:border-[#b9a6bb]" />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#776a77]">Year
          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="rounded-xl border border-[#e7dce5] bg-white px-3 py-3 text-sm outline-none focus:border-[#b9a6bb]">
            <option value="all">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setSortOrder((current) => current === "newest" ? "oldest" : "newest")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm font-medium text-[#816780] hover:bg-[#f8f1f7]">
          {sortOrder === "newest" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}{sortOrder === "newest" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-[#f4edf4] px-3 py-1.5 text-[#816780]">{filtered.length} {filtered.length === 1 ? "moment" : "moments"}</span>
        <span className="rounded-full bg-[#edf3e9] px-3 py-1.5 text-[#63785d]">{new Set(filtered.map((m) => m.memory_date)).size} memorable {new Set(filtered.map((m) => m.memory_date)).size === 1 ? "date" : "dates"}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]"><CalendarDays size={25} /></div>
          <h2 className="mt-4 text-lg font-semibold">No moments found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8d8379]">{memories.length ? "Try a different search or year filter." : "When you add memories to this space, they will form your timeline here."}</p>
          {(query || yearFilter !== "all") && <button type="button" onClick={() => { setQuery(""); setYearFilter("all"); }} className="mt-4 rounded-xl border border-[#e7dce5] px-4 py-2 text-sm text-[#816780] hover:bg-[#f8f1f7]">Clear filters</button>}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.monthKey} aria-label={group.monthLabel} className="space-y-4">
              <div className="sticky top-2 z-[1] inline-flex rounded-full border border-[#e7dce5] bg-[var(--timeline-month-bg,#faf7fb)] px-4 py-2 text-sm font-semibold text-[#816780] shadow-sm"><CalendarDays size={16} className="mr-2" />{group.monthLabel}</div>
              <div className="relative ml-3 space-y-4 border-l-2 border-[#e7dce5] pl-5 sm:ml-5 sm:pl-7">
                {group.items.map((memory) => {
                  const count = sharedDates.get(memory.memory_date) ?? 0;
                  return (
                    <article key={memory.id} className="relative rounded-2xl border border-[#e9e1e9] bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                      <span aria-hidden="true" className="absolute -left-[29px] top-6 h-3 w-3 rounded-full border-2 border-white bg-[#b69bb8] shadow sm:-left-[37px]" />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a18a9e]">{formatDate(memory.memory_date, { weekday: "long", day: "numeric", month: "long" })}</p>
                          <h3 className="mt-2 break-words text-lg font-semibold">{memory.title || "Untitled memory"}</h3>
                        </div>
                        {count > 1 && <span className="inline-flex items-center gap-1 rounded-full bg-[#f4edf4] px-2.5 py-1 text-xs text-[#816780]"><Heart size={12} /> {count} moments this day</span>}
                      </div>
                      {memory.content && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#746976]">{memory.content.length > 260 ? `${memory.content.slice(0, 260).trimEnd()}…` : memory.content}</p>}
                      {memory.place_name && <p className="mt-3 text-xs text-[#8d8379]">⌖ {memory.place_name}</p>}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8f0] pt-3">
                        <span className="text-xs text-[#a197a3]">{formatDate(memory.memory_date, { year: "numeric" })}</span>
                        <button type="button" onClick={() => onReadMemory(memory)} className="rounded-xl border border-[#e7dce5] px-3 py-2 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7]">Read memory <span aria-hidden="true">→</span></button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-[#e9e1e9] bg-[#faf7fb] p-4 text-sm leading-6 text-[#776a77]"><Sparkles size={16} className="mr-2 inline" />Moments saved on the same date are highlighted together. The timeline uses your existing memory records and does not create duplicates or change your database.</div>
    </section>
  );
}
