
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type GratitudeNote = {
  id: string;
  space_id: string;
  created_by: string;
  recipient: string;
  message: string;
  created_at: string;
};

type Props = {
  spaceId: string | null;
  spaceName: string;
  onNotice: (message: string) => void;
};

export default function GratitudeJar({
  spaceId,
  spaceName,
  onNotice,
}: Props) {
  const [notes, setNotes] = useState<GratitudeNote[]>([]);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  async function loadNotes() {
    if (!spaceId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    setUserId(authData.user?.id ?? "");

    const { data, error } = await supabase
      .from("gratitude_notes")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });

    if (error) {
      onNotice(error.message);
      setNotes([]);
    } else {
      setNotes((data ?? []) as GratitudeNote[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadNotes();
  }, [spaceId]);

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceId || !message.trim()) return;

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user;

    if (!currentUser) {
      onNotice("Please sign in to add a gratitude note.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("gratitude_notes").insert({
      space_id: spaceId,
      created_by: currentUser.id,
      recipient: recipient.trim(),
      message: message.trim(),
    });

    if (error) {
      onNotice(error.message);
    } else {
      setRecipient("");
      setMessage("");
      onNotice("Your gratitude note has been added. ♡");
      await loadNotes();
    }

    setSaving(false);
  }

  async function deleteNote(id: string) {
    const { error } = await supabase
      .from("gratitude_notes")
      .delete()
      .eq("id", id);

    if (error) {
      onNotice(error.message);
    } else {
      setNotes((current) => current.filter((note) => note.id !== id));
      onNotice("Gratitude note deleted.");
    }
  }

  return (
    <section className="mx-auto max-w-4xl pb-24">
      <div className="mb-8 rounded-3xl bg-[#eee5ed] p-7 sm:p-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#86657f]">
          A LITTLE SPACE FOR APPRECIATION
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#493b49] sm:text-4xl">
          The Gratitude Jar ♡
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#776779]">
          Leave a little kindness for someone in {spaceName || "your space"}.
          The smallest words can mean the most.
        </p>
      </div>

      {!spaceId ? (
        <p className="rounded-2xl border border-[#ebe5df] bg-white p-6 text-sm text-[#817970]">
          Choose or create a space before adding gratitude notes.
        </p>
      ) : (
        <>
          <form
            onSubmit={addNote}
            className="mb-8 space-y-4 rounded-3xl border border-[#ebe5df] bg-white p-6"
          >
            <h2 className="text-lg font-semibold">Leave a little kindness</h2>

            <div>
              <label className="mb-2 block text-sm text-[#817970]">
                For someone (optional)
              </label>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                maxLength={100}
                placeholder="Their name"
                className="w-full rounded-xl border border-[#e7dfe6] px-4 py-3 text-sm outline-none focus:border-[#b99bb6]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#817970]">
                Your appreciation note
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                maxLength={2000}
                rows={4}
                placeholder="I'm grateful for you because..."
                className="w-full resize-y rounded-xl border border-[#e7dfe6] px-4 py-3 text-sm outline-none focus:border-[#b99bb6]"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !message.trim()}
              className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add to the jar ♡"}
            </button>
          </form>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Little things that matter</h2>
            <span className="text-sm text-[#a49a90]">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-sm text-[#8d8379]">Opening the jar...</p>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8d8] p-8 text-center">
              <p className="text-lg">♡</p>
              <p className="mt-2 font-medium">Your jar is waiting</p>
              <p className="mt-1 text-sm text-[#8d8379]">
                Add the first little note of appreciation.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-2xl border border-[#eee5ed] bg-[#fffdfa] p-5"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#a18a9e]">
                    {note.recipient
                      ? `A note for ${note.recipient}`
                      : "A little appreciation"}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#554c53]">
                    {note.message}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee5ed] pt-3">
                    <span className="text-xs text-[#a49a90]">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    {note.created_by === userId && (
                      <button
                        type="button"
                        onClick={() => void deleteNote(note.id)}
                        className="text-xs text-[#a45f62] hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
