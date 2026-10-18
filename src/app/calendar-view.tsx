
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Memory = {
  id: string;
  title: string;
  content: string;
  memory_date: string;
  space_id: string;
};

type CalendarEvent = {
  id: string;
  space_id: string;
  created_by: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
};

type Props = {
  spaceId: string;
  spaceName: string;
  memories: Memory[];
  onNotice: (message: string) => void;
};

const supabase = createClient();

const eventTypes = [
  { value: "birthday", label: "Birthday", icon: "🎂" },
  { value: "anniversary", label: "Anniversary", icon: "♡" },
  { value: "meeting", label: "Meeting", icon: "☕" },
  { value: "celebration", label: "Celebration", icon: "✧" },
  { value: "other", label: "Other", icon: "▦" },
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function eventIcon(type: string) {
  return eventTypes.find((item) => item.value === type)?.icon ?? "✧";
}

export default function CalendarView({
  spaceId,
  spaceName,
  memories,
  onNotice,
}: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(() => dateKey(new Date()));
  const [eventType, setEventType] = useState("other");

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setEvents([]);

      if (!spaceId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .select(
          "id, space_id, created_by, title, description, event_date, event_type"
        )
        .eq("space_id", spaceId)
        .order("event_date", { ascending: true });

      if (cancelled) return;

      if (error) {
        onNotice(`Could not load calendar events: ${error.message}`);
        setLoading(false);
        return;
      }

      setEvents((data ?? []) as CalendarEvent[]);
      setLoading(false);
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const memoriesByDate = useMemo(() => {
    const grouped = new Map<string, Memory[]>();

    for (const memory of memories) {
      if (memory.space_id !== spaceId) continue;

      const existing = grouped.get(memory.memory_date) ?? [];
      existing.push(memory);
      grouped.set(memory.memory_date, existing);
    }

    return grouped;
  }, [memories, spaceId]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const existing = grouped.get(event.event_date) ?? [];
      existing.push(event);
      grouped.set(event.event_date, existing);
    }

    return grouped;
  }, [events]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;

      if (dayNumber < 1 || dayNumber > daysInMonth) return null;

      return new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        dayNumber
      );
    });
  }, [currentMonth]);

  const selectedMonthEvents = events
    .filter((event) => {
      const date = new Date(`${event.event_date}T12:00:00`);

      return (
        date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth()
      );
    })
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const selectedMonthMemories = memories
    .filter((memory) => {
      if (memory.space_id !== spaceId) return false;

      const date = new Date(`${memory.memory_date}T12:00:00`);

      return (
        date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth()
      );
    })
    .sort((a, b) => a.memory_date.localeCompare(b.memory_date));

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!spaceId) {
      onNotice("Select a space before creating an event.");
      return;
    }

    if (!cleanTitle || !eventDate || saving) return;

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again before creating an event.");
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          space_id: spaceId,
          created_by: user.id,
          title: cleanTitle,
          description: description.trim(),
          event_date: eventDate,
          event_type: eventType,
        })
        .select(
          "id, space_id, created_by, title, description, event_date, event_type"
        )
        .single();

      if (error) throw new Error(error.message);

      setEvents((current) =>
        [...current, data as CalendarEvent].sort((a, b) =>
          a.event_date.localeCompare(b.event_date)
        )
      );

      setCurrentMonth(
        new Date(
          Number(eventDate.slice(0, 4)),
          Number(eventDate.slice(5, 7)) - 1,
          1
        )
      );

      setTitle("");
      setDescription("");
      setEventDate(dateKey(new Date()));
      setEventType("other");
      setShowForm(false);

      onNotice("Your important date has been saved. ♡");
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Could not save event: ${error.message}`
          : "Could not save the event."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(event: CalendarEvent) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${event.title}" from your important dates?`
    );

    if (!confirmed) return;

    setDeletingId(event.id);

    try {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", event.id)
        .eq("space_id", spaceId);

      if (error) throw new Error(error.message);

      setEvents((current) =>
        current.filter((item) => item.id !== event.id)
      );

      onNotice("The important date has been deleted.");
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Could not delete event: ${error.message}`
          : "Could not delete the event."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function changeMonth(amount: number) {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + amount,
          1
        )
    );
  }

  const monthLabel = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const todayKey = dateKey(new Date());

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
            YOUR MOMENTS, PAST AND FUTURE
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your little calendar<span className="text-[#bd91ad]">.</span>
          </h1>
          <p className="mt-3 text-sm text-[#8d8379]">
            Memories and important dates in {spaceName || "your space"}.
          </p>
        </div>

        <button
          type="button"
          disabled={!spaceId}
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:opacity-50"
        >
          {showForm ? "Close form" : "+ Add important date"}
        </button>
      </header>

      {!spaceId ? (
        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white p-8 text-sm text-[#817970]">
          Create or select a space first to use its calendar.
        </div>
      ) : (
        <>
          {showForm && (
            <form
              onSubmit={handleCreateEvent}
              className="rounded-2xl border border-[#eee6df] bg-white p-5 sm:p-7"
            >
              <h2 className="text-lg font-semibold">Save an important date ♡</h2>
              <p className="mt-1 text-sm text-[#91867d]">
                This date will belong to {spaceName}.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Event title
                  <input
                    required
                    maxLength={150}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Sara's birthday"
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Date
                  <input
                    required
                    type="date"
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <label className="block text-sm font-medium sm:col-span-2">
                  Type of event
                  <select
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  >
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium sm:col-span-2">
                  Notes (optional)
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Add a little detail about this day..."
                    className="mt-2 w-full resize-y rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving || !title.trim() || !eventDate}
                className="mt-5 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving date..." : "Save important date ♡"}
              </button>
            </form>
          )}

          <section className="rounded-3xl border border-[#eee6df] bg-white p-4 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee6df] text-xl text-[#816780] hover:bg-[#f8f1f7]"
              >
                ‹
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-[#514451]">
                  {monthLabel}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonth(
                      new Date(now.getFullYear(), now.getMonth(), 1)
                    );
                  }}
                  className="mt-1 text-xs text-[#856b83] hover:underline"
                >
                  Today
                </button>
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee6df] text-xl text-[#816780] hover:bg-[#f8f1f7]"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#a1978d] sm:text-xs"
                  >
                    {day}
                  </div>
                )
              )}

              {calendarDays.map((date, index) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[62px] rounded-lg bg-[#fcfaf8] sm:min-h-[90px]"
                    />
                  );
                }

                const key = dateKey(date);
                const dayMemories = memoriesByDate.get(key) ?? [];
                const dayEvents = eventsByDate.get(key) ?? [];
                const hasItems =
                  dayMemories.length > 0 || dayEvents.length > 0;

                return (
                  <div
                    key={key}
                    className={`min-h-[62px] overflow-hidden rounded-lg border p-1.5 sm:min-h-[90px] sm:p-2 ${
                      key === todayKey
                        ? "border-[#b99ab6] bg-[#f8f0f7]"
                        : hasItems
                          ? "border-[#eee1ed] bg-[#fffdfa]"
                          : "border-transparent bg-[#fcfaf8]"
                    }`}
                  >
                    <p
                      className={`text-xs font-medium sm:text-sm ${
                        key === todayKey
                          ? "text-[#816780]"
                          : "text-[#62575f]"
                      }`}
                    >
                      {date.getDate()}
                    </p>

                    {dayMemories.length > 0 && (
                      <p className="mt-1 truncate rounded bg-[#eae4f3] px-1 py-0.5 text-[9px] text-[#6f628f] sm:text-[10px]">
                        ♡ {dayMemories.length}{" "}
                        <span className="hidden sm:inline">
                          {dayMemories.length === 1 ? "memory" : "memories"}
                        </span>
                      </p>
                    )}

                    {dayEvents.length > 0 && (
                      <p className="mt-1 truncate rounded bg-[#e4ebe0] px-1 py-0.5 text-[9px] text-[#61795b] sm:text-[10px]">
                        ✧ {dayEvents.length}{" "}
                        <span className="hidden sm:inline">
                          {dayEvents.length === 1 ? "event" : "events"}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-xs text-[#817970]">
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#eae4f3]" />
                Memories
              </span>
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#e4ebe0]" />
                Important dates
              </span>
              <span>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-[#b99ab6] bg-[#f8f0f7]" />
                Today
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#a18a9e]">
                YOUR TIME CAPSULE
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {monthLabel}'s moments
              </h2>
            </div>

            {loading ? (
              <p className="text-sm text-[#91867d]">Loading important dates...</p>
            ) : selectedMonthEvents.length === 0 &&
              selectedMonthMemories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white p-7 text-sm text-[#91867d]">
                Nothing saved for this month yet. Add an important date or
                save a memory to see it here. ♡
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMonthMemories.map((memory) => (
                  <article
                    key={`memory-${memory.id}`}
                    className="flex items-start gap-4 rounded-2xl border border-[#eee6df] bg-white p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eae4f3] text-xl text-[#816780]">
                      ♡
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#a18a9e]">
                        Memory · {formatDate(memory.memory_date)}
                      </p>
                      <h3 className="mt-1 break-words font-semibold">
                        {memory.title}
                      </h3>
                      {memory.content && (
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm text-[#91867d]">
                          {memory.content}
                        </p>
                      )}
                    </div>
                  </article>
                ))}

                {selectedMonthEvents.map((event) => (
                  <article
                    key={`event-${event.id}`}
                    className="flex items-start gap-4 rounded-2xl border border-[#eee6df] bg-white p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e4ebe0] text-xl">
                      {eventIcon(event.event_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#7d8b73]">
                        {eventTypes.find(
                          (type) => type.value === event.event_type
                        )?.label ?? "Important date"}{" "}
                        · {formatDate(event.event_date)}
                      </p>
                      <h3 className="mt-1 break-words font-semibold">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#91867d]">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() => void handleDeleteEvent(event)}
                      className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === event.id ? "Deleting..." : "Delete"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
