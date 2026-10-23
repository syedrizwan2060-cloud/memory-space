
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Capsule = {
  id: string;
  space_id: string;
  title: string;
  recipient_name: string;
  unlock_at: string;
  created_by: string;
  created_at: string;
};

type Props = {
  spaceId: string | null;
  spaceName: string;
  onNotice: (message: string) => void;
};

export default function TimeCapsules({
  spaceId,
  spaceName,
  onNotice,
}: Props) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("My future self");
  const [unlockDate, setUnlockDate] = useState("");
  const [letter, setLetter] = useState("");
  const [saving, setSaving] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [openedLetter, setOpenedLetter] = useState("");
  const [opening, setOpening] = useState(false);

  const supabase = createClient();

  const loadCapsules = useCallback(async () => {
    if (!spaceId) {
      setCapsules([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("time_capsules")
      .select(
        "id, space_id, title, recipient_name, unlock_at, created_by, created_at"
      )
      .eq("space_id", spaceId)
      .order("unlock_at", { ascending: true });

    if (error) {
      onNotice("Could not load Time Capsules: " + error.message);
    } else {
      setCapsules((data ?? []) as Capsule[]);
    }

    setLoading(false);
  }, [spaceId, onNotice, supabase]);

  useEffect(() => {
    void loadCapsules();
  }, [loadCapsules]);

  async function createCapsule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceId) {
      onNotice("Select a space first.");
      return;
    }

    if (!title.trim() || !letter.trim() || !unlockDate) {
      onNotice("Please complete all required fields.");
      return;
    }

    const unlockAt = new Date(unlockDate);

    if (Number.isNaN(unlockAt.getTime()) || unlockAt <= new Date()) {
      onNotice("Choose a future date and time.");
      return;
    }

    if (letter.trim().length > 10000) {
      onNotice("Your letter must be 10,000 characters or fewer.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        onNotice("Please sign in again to create a letter.");
        return;
      }

      const { data: capsule, error: capsuleError } = await supabase
        .from("time_capsules")
        .insert({
          space_id: spaceId,
          title: title.trim(),
          recipient_name: recipient.trim() || "My future self",
          unlock_at: unlockAt.toISOString(),
          created_by: user.id,
        })
        .select(
          "id, space_id, title, recipient_name, unlock_at, created_by, created_at"
        )
        .single();

      if (capsuleError || !capsule) {
        throw new Error(capsuleError?.message ?? "Could not create capsule.");
      }

      const { error: letterError } = await supabase
        .from("time_capsule_letters")
        .insert({
          capsule_id: capsule.id,
          letter_content: letter.trim(),
        });

      if (letterError) {
        // Clean up the capsule if saving its letter fails.
        await supabase.from("time_capsules").delete().eq("id", capsule.id);
        throw new Error(letterError.message);
      }

      setTitle("");
      setRecipient("My future self");
      setUnlockDate("");
      setLetter("");
      setShowForm(false);

      onNotice("Your Time Capsule has been sealed! 💌");
      await loadCapsules();
    } catch (error) {
      onNotice(
        error instanceof Error
          ? "Could not save your letter: " + error.message
          : "Something went wrong while saving your letter."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openCapsule(capsule: Capsule) {
    if (new Date(capsule.unlock_at).getTime() > Date.now()) {
      onNotice("This letter is still sealed. Come back when it unlocks! 🔒");
      return;
    }

    setOpening(true);
    setOpenedId(capsule.id);
    setOpenedLetter("");

    const { data, error } = await supabase
      .from("time_capsule_letters")
      .select("letter_content")
      .eq("capsule_id", capsule.id)
      .single();

    if (error) {
      onNotice(
        "Could not open the letter. Please try again: " + error.message
      );
      setOpenedId(null);
    } else {
      setOpenedLetter(data.letter_content);
    }

    setOpening(false);
  }

  const dateLabel = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (!spaceId) {
    return (
      <section className="rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">💌</div>
        <h2 className="mt-3 text-xl font-semibold text-purple-950">
          Time Capsule Letters
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose a space to create and view its letters.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-rose-50 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">
              A little message for later
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-purple-950 sm:text-3xl">
              Time Capsule Letters 💌
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Write something meaningful today. Choose a future date, seal your
              letter, and return when the time is right.
            </p>
            <p className="mt-3 text-xs text-purple-700">
              Current space: {spaceName || "Your space"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 rounded-2xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800"
          >
            {showForm ? "Cancel" : "+ Write a letter"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={createCapsule}
          className="space-y-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <h3 className="text-xl font-semibold text-purple-950">
              Seal a new letter
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The letter content will only be readable through the app after
              its unlock date.
            </p>
          </div>

          <div>
            <label
              htmlFor="capsule-title"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Letter title
            </label>
            <input
              id="capsule-title"
              required
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="To the person I'll become..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <label
              htmlFor="capsule-recipient"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              To whom?
            </label>
            <input
              id="capsule-recipient"
              maxLength={150}
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="My future self, a friend, or family..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <label
              htmlFor="capsule-date"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Unlock date and time
            </label>
            <input
              id="capsule-date"
              type="datetime-local"
              required
              min={new Date(Date.now() + 60000)
                .toISOString()
                .slice(0, 16)}
              value={unlockDate}
              onChange={(event) => setUnlockDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <label
              htmlFor="capsule-letter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Your letter
            </label>
            <textarea
              id="capsule-letter"
              required
              maxLength={10000}
              rows={7}
              value={letter}
              onChange={(event) => setLetter(event.target.value)}
              placeholder="Write your hopes, memories, advice, or something you want to say later..."
              className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {letter.length}/10,000
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-purple-700 px-5 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Sealing your letter..." : "🔒 Seal Time Capsule"}
          </button>
        </form>
      )}

      {openedId && (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-rose-700">
                Your moment has arrived
              </p>
              <h3 className="mt-1 text-xl font-semibold text-purple-950">
                {capsules.find((item) => item.id === openedId)?.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpenedId(null);
                setOpenedLetter("");
              }}
              className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-white"
            >
              Close
            </button>
          </div>

          {opening ? (
            <p className="mt-4 text-sm text-gray-500">Opening your letter...</p>
          ) : (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
              {openedLetter}
            </p>
          )}
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-purple-950">
            Your sealed letters
          </h3>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            {capsules.length} {capsules.length === 1 ? "letter" : "letters"}
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Loading your capsules...
          </p>
        ) : capsules.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-purple-200 bg-white p-8 text-center">
            <div className="text-4xl">📨</div>
            <h4 className="mt-3 font-semibold text-purple-950">
              Nothing sealed yet
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              Your first letter can become a beautiful surprise for the future.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {capsules.map((capsule) => {
              const unlocked =
                new Date(capsule.unlock_at).getTime() <= Date.now();

              return (
                <article
                  key={capsule.id}
                  className="flex flex-col rounded-3xl border border-purple-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl">
                      {unlocked ? "💌" : "🔒"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        unlocked
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {unlocked ? "Ready to open" : "Sealed"}
                    </span>
                  </div>

                  <h4 className="mt-4 break-words text-lg font-semibold text-purple-950">
                    {capsule.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    To: {capsule.recipient_name}
                  </p>

                  <div className="mt-4 rounded-2xl bg-purple-50/70 p-3">
                    <p className="text-xs text-gray-500">
                      {unlocked ? "Unlocked on" : "Opens on"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-purple-900">
                      {dateLabel(capsule.unlock_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openCapsule(capsule)}
                    disabled={opening && openedId === capsule.id}
                    className="mt-4 w-full rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-800 transition hover:bg-purple-50 disabled:opacity-60"
                  >
                    {unlocked ? "💌 Open letter" : "🔒 Still sealed"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
