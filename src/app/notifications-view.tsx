"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCheck, Clock3, RefreshCw, Settings2 } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type Preferences = {
  in_app_enabled: boolean;
  memory_activity_enabled: boolean;
  event_reminders_enabled: boolean;
  reminder_days_before: number[];
  browser_push_enabled: boolean;
  email_enabled: boolean;
  timezone: string;
};

const defaults: Preferences = {
  in_app_enabled: true,
  memory_activity_enabled: true,
  event_reminders_enabled: true,
  reminder_days_before: [1, 0],
  browser_push_enabled: false,
  email_enabled: false,
  timezone: "Asia/Kolkata",
};

const supabase = createClient();

export default function NotificationsView({
  onNotice,
  onUnreadCountChange,
}: {
  onNotice: (message: string) => void;
  onUnreadCountChange: (count: number) => void;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setLoading(false);
      onNotice("Please sign in to view your notifications.");
      return;
    }

    const id = authData.user.id;
    setUserId(id);

    const [notificationResult, preferenceResult] = await Promise.all([
      supabase
        .from("notifications")
        .select("id,type,title,message,link,read_at,created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("notification_preferences")
        .select(
          "in_app_enabled,memory_activity_enabled,event_reminders_enabled,reminder_days_before,browser_push_enabled,email_enabled,timezone"
        )
        .eq("user_id", id)
        .maybeSingle(),
    ]);

    if (notificationResult.error) {
      onNotice("Couldn't load notifications: " + notificationResult.error.message);
    } else {
      setItems((notificationResult.data ?? []) as NotificationItem[]);
    }

    if (preferenceResult.error) {
      onNotice("Couldn't load notification preferences: " + preferenceResult.error.message);
    } else if (preferenceResult.data) {
      setPreferences({
        ...defaults,
        ...preferenceResult.data,
        reminder_days_before:
          preferenceResult.data.reminder_days_before ?? [1, 0],
      });
    }

    setLoading(false);
  }, [onNotice]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function markRead(item: NotificationItem) {
    if (!userId || item.read_at) return;

    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", item.id)
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      onNotice("Couldn't mark this notification as read: " + error.message);
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, read_at: readAt } : entry
      )
    );
  }

  async function markAllRead() {
    if (!userId) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      onNotice("Couldn't mark notifications as read: " + error.message);
      return;
    }

    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => item.read_at ? item : { ...item, read_at: now })
    );
    onNotice("All notifications marked as read.");
  }

  async function savePreferences(next: Preferences) {
    if (!userId || saving) return;

    const previous = preferences;
    setPreferences(next);
    setSaving(true);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: userId, ...next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (error) {
      setPreferences(previous);
      onNotice("Couldn't save preferences: " + error.message);
    } else {
      onNotice("Notification preferences saved.");
    }
  }

  const unreadCount = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    onUnreadCountChange(unreadCount);
  }, [unreadCount, onUnreadCountChange]);
  const visibleItems = unreadOnly
    ? items.filter((item) => !item.read_at)
    : items;

  function toggleReminderDay(day: number) {
    const current = preferences.reminder_days_before;
    const nextDays = current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day];

    void savePreferences({
      ...preferences,
      reminder_days_before: nextDays.sort((a, b) => b - a),
    });
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
          STAY IN THE LOOP
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#514451] sm:text-4xl">
          Notifications
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">
          Important moments and updates from your shared spaces, all in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
          <Bell className="text-[#816780]" size={21} />
          <p className="mt-3 text-sm text-[#8d8379]">Total loaded</p>
          <p className="mt-1 text-2xl font-semibold text-[#514451]">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
          <Clock3 className="text-[#816780]" size={21} />
          <p className="mt-3 text-sm text-[#8d8379]">Unread</p>
          <p className="mt-1 text-2xl font-semibold text-[#514451]">{unreadCount}</p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee6df] bg-white p-5">
          <div>
            <p className="text-sm text-[#8d8379]">Keep things up to date</p>
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#816780] disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7dce5] px-3 py-2 text-xs font-medium text-[#816780] disabled:opacity-40"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#eee6df] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#514451]">Your notifications</h2>
          <button
            type="button"
            onClick={() => setUnreadOnly((value) => !value)}
            className="rounded-xl border border-[#e7dce5] px-3 py-2 text-sm text-[#816780] hover:bg-[#f8f1f7]"
          >
            {unreadOnly ? "Show all" : "Show unread only"}
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-[#8d8379]">Loading your notifications…</p>
        ) : visibleItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]">
              <Bell size={22} />
            </div>
            <p className="mt-4 font-medium text-[#514451]">
              {unreadOnly ? "You're all caught up!" : "No notifications yet"}
            </p>
            <p className="mt-2 text-sm text-[#8d8379]">
              New shared memories and scheduled event reminders will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-[#f0e9e5]">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className={`py-4 ${item.read_at ? "opacity-75" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4edf4] text-[#816780]">
                    <Bell size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-[#514451]">{item.title}</h3>
                      {!item.read_at && (
                        <span className="rounded-full bg-[#f4edf4] px-2 py-0.5 text-xs text-[#816780]">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#8d8379]">{item.message}</p>
                    <p className="mt-2 text-xs text-[#a18a9e]">
                      {new Date(item.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {!item.read_at && (
                    <button
                      type="button"
                      onClick={() => void markRead(item)}
                      className="shrink-0 rounded-lg border border-[#e7dce5] px-3 py-2 text-xs font-medium text-[#816780] hover:bg-[#f8f1f7]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-[#eee6df] bg-white p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4edf4] text-[#816780]">
            <Settings2 size={19} />
          </div>
          <div>
            <h2 className="font-semibold text-[#514451]">Notification preferences</h2>
            <p className="text-sm text-[#8d8379]">Choose which in-app updates you want.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {([
            ["in_app_enabled", "In-app notifications", "Show alerts in Memory Space."],
            ["memory_activity_enabled", "Shared memory activity", "Alert me when someone adds a memory to my space."],
            ["event_reminders_enabled", "Calendar reminders", "Alert me about upcoming birthdays, anniversaries, and events."],
          ] as const).map(([key, label, description]) => (
            <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#faf7f3] p-4">
              <input
                type="checkbox"
                className="mt-1 accent-[#816780]"
                checked={preferences[key]}
                disabled={saving}
                onChange={(event) =>
                  void savePreferences({ ...preferences, [key]: event.target.checked })
                }
              />
              <span>
                <span className="block text-sm font-medium text-[#514451]">{label}</span>
                <span className="mt-1 block text-sm leading-5 text-[#8d8379]">{description}</span>
              </span>
            </label>
          ))}

          <div className="rounded-xl bg-[#faf7f3] p-4">
            <p className="text-sm font-medium text-[#514451]">Reminder timing</p>
            <p className="mt-1 text-sm text-[#8d8379]">Choose when to receive event reminders.</p>
            <div className="mt-3 flex flex-wrap gap-4">
              {([
                [7, "7 days before"],
                [3, "3 days before"],
                [1, "1 day before"],
                [0, "On the day"],
              ] as [number, string][]).map(([day, label]) => (
                <label key={day} className="flex items-center gap-2 text-sm text-[#514451]">
                  <input
                    type="checkbox"
                    className="accent-[#816780]"
                    checked={preferences.reminder_days_before.includes(day)}
                    disabled={saving}
                    onChange={() => toggleReminderDay(day)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#eee6df] p-4">
            <p className="text-sm font-medium text-[#514451]">Browser push</p>
            <p className="mt-1 text-sm text-[#8d8379]">
              Not connected yet. Push needs a service worker, browser permission, and VAPID server keys.
            </p>
            <p className="mt-2 text-xs text-[#a18a9e]">Push is off; no browser alerts will be sent.</p>
          </div>

          <div className="rounded-xl border border-[#eee6df] p-4">
            <p className="text-sm font-medium text-[#514451]">Email alerts</p>
            <p className="mt-1 text-sm text-[#8d8379]">
              Not connected yet. Email requires a configured provider and sender.
            </p>
            <p className="mt-2 text-xs text-[#a18a9e]">Email is off; no emails will be sent.</p>
          </div>

          {saving && <p className="text-xs text-[#8d8379]">Saving preferences…</p>}
        </div>
      </div>
    </section>
  );
}


