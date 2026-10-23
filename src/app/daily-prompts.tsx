"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { DAILY_PROMPTS, DAILY_PROMPT_CATEGORIES, type DailyPrompt } from "./daily-prompt-questions";

type AnswerRow = {
  id: string;
  space_id: string;
  prompt_id: number;
  prompt_text: string;
  answer: string;
  answered_by: string;
  created_at: string;
  updated_at: string;
};

type Props = {
  spaceId: string | null;
  spaceName: string;
  onNotice: (message: string) => void;
};

function dailyPromptId(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return ((day - 1) % DAILY_PROMPTS.length) + 1;
}

export default function DailyPrompts({ spaceId, spaceName, onNotice }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All categories");
  const [selectedPromptId, setSelectedPromptId] = useState<number>(dailyPromptId());
  const [draft, setDraft] = useState("");

  const selectedPrompt = DAILY_PROMPTS.find((prompt) => prompt.id === selectedPromptId) ?? DAILY_PROMPTS[0];
  const existingAnswer = answers.find((answer) => answer.prompt_id === selectedPrompt.id && answer.answered_by === userId);

  const loadAnswers = useCallback(async () => {
    if (!spaceId) {
      setAnswers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setUserId(null);
      setAnswers([]);
      setLoading(false);
      onNotice("Please sign in again to use Daily Prompts.");
      return;
    }
    setUserId(userData.user.id);
    const { data, error } = await supabase
      .from("daily_prompt_answers")
      .select("id,space_id,prompt_id,prompt_text,answer,answered_by,created_at,updated_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });
    if (error) {
      onNotice(`Could not load Daily Prompts: ${error.message}`);
      setAnswers([]);
    } else {
      setAnswers((data ?? []) as AnswerRow[]);
    }
    setLoading(false);
  }, [spaceId, supabase, onNotice]);

  useEffect(() => {
    void loadAnswers();
  }, [loadAnswers]);

  useEffect(() => {
    setDraft(existingAnswer?.answer ?? "");
  }, [selectedPromptId, existingAnswer?.answer]);

  const visiblePrompts = useMemo(() => {
    const prompts = selectedCategory === "All categories"
      ? DAILY_PROMPTS
      : DAILY_PROMPTS.filter((prompt) => prompt.category === selectedCategory);
    return prompts;
  }, [selectedCategory]);

  const answeredPromptIds = useMemo(
    () => new Set(answers.filter((answer) => answer.answered_by === userId).map((answer) => answer.prompt_id)),
    [answers, userId]
  );

  function chooseRandomPrompt() {
    const choices = visiblePrompts.filter((prompt) => prompt.id !== selectedPromptId);
    const pool = choices.length ? choices : visiblePrompts;
    if (pool.length) setSelectedPromptId(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function chooseDailyPrompt() {
    setSelectedCategory("All categories");
    setSelectedPromptId(dailyPromptId());
  }

  async function saveAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!spaceId) {
      onNotice("Choose a space before answering a prompt.");
      return;
    }
    if (!userId) {
      onNotice("Please sign in again before saving your answer.");
      return;
    }
    const cleanAnswer = draft.trim();
    if (!cleanAnswer) {
      onNotice("Write an answer before saving.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("daily_prompt_answers")
      .upsert({
        space_id: spaceId,
        prompt_id: selectedPrompt.id,
        prompt_text: selectedPrompt.question,
        answer: cleanAnswer,
        answered_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "space_id,prompt_id,answered_by" });
    setSaving(false);
    if (error) {
      onNotice(`Could not save your answer: ${error.message}`);
      return;
    }
    onNotice("Your answer has been saved to this space.");
    await loadAnswers();
  }

  async function deleteAnswer(answer: AnswerRow) {
    const { error } = await supabase
      .from("daily_prompt_answers")
      .delete()
      .eq("id", answer.id)
      .eq("answered_by", userId);
    if (error) {
      onNotice(`Could not delete that answer: ${error.message}`);
      return;
    }
    onNotice("Answer deleted.");
    await loadAnswers();
  }

  function openAnswer(answer: AnswerRow) {
    setSelectedPromptId(answer.prompt_id);
    setSelectedCategory("All categories");
    setDraft(answer.answer);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="space-y-6 pb-24">
      <header className="rounded-3xl border border-[#e8dce8] bg-gradient-to-br from-[#fff8fc] via-white to-[#f4effa] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b7b98]">A little question, a lasting memory</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#39352f] sm:text-4xl">Daily Memory Prompts<span className="text-[#bd91ad]">.</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#817970]">
              Explore 400 conversation starters, save your answers, and revisit the stories you share in {spaceName || "your space"}.
            </p>
          </div>
          <button type="button" onClick={chooseDailyPrompt} className="rounded-xl border border-[#d9c8d8] bg-white px-4 py-3 text-sm font-medium text-[#816780] hover:bg-[#f8f1f7]">
            Question of the day
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs text-[#816780]">{DAILY_PROMPTS.length} questions</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs text-[#816780]">{answeredPromptIds.size} answered by you</span>
        </div>
      </header>

      {!spaceId ? (
        <div className="rounded-2xl border border-[#e8dce8] bg-white p-6 text-sm text-[#817970]">Choose or create a space to start answering prompts.</div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="rounded-3xl border border-[#e8dce8] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-[#f5edf5] px-3 py-1.5 text-xs font-medium text-[#816780]">{selectedPrompt.category}</span>
                <button type="button" onClick={chooseRandomPrompt} className="rounded-xl bg-[#816780] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#70566f]">Surprise me ↗</button>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#a18a9e]">Prompt #{selectedPrompt.id}</p>
              <h2 className="mt-3 text-2xl font-semibold leading-snug text-[#39352f] sm:text-3xl">{selectedPrompt.question}</h2>
              <form onSubmit={saveAnswer} className="mt-6 space-y-3">
                <label htmlFor="daily-prompt-answer" className="block text-sm font-medium text-[#62575f]">Your answer</label>
                <textarea id="daily-prompt-answer" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={10000} rows={5} placeholder="Write a story, a thought, or a little detail you want to remember..." className="w-full resize-y rounded-2xl border border-[#e8dce8] bg-[#fffdfa] p-4 text-sm leading-6 text-[#39352f] outline-none transition focus:border-[#b79ab5] focus:ring-2 focus:ring-[#eadde8]" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#a1978d]">{draft.length}/10,000 characters</span>
                  <button type="submit" disabled={saving || !draft.trim()} className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#70566f] disabled:cursor-not-allowed disabled:opacity-50">
                    {saving ? "Saving..." : existingAnswer ? "Update answer" : "Save answer"}
                  </button>
                </div>
              </form>
            </article>

            <aside className="rounded-3xl border border-[#e8dce8] bg-white p-5">
              <h3 className="text-lg font-semibold text-[#39352f]">Browse questions</h3>
              <p className="mt-1 text-sm text-[#817970]">Choose a category or open a past answer.</p>
              <label htmlFor="daily-prompt-category" className="mt-4 block text-xs font-medium uppercase tracking-wide text-[#9b8798]">Category</label>
              <select id="daily-prompt-category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e8dce8] bg-[#fffdfa] px-3 py-3 text-sm text-[#39352f]">
                {DAILY_PROMPT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {visiblePrompts.map((prompt: DailyPrompt) => (
                  <button key={prompt.id} type="button" onClick={() => setSelectedPromptId(prompt.id)} className={`block w-full rounded-xl border px-3 py-3 text-left transition ${selectedPromptId === prompt.id ? "border-[#b79ab5] bg-[#f8f1f7]" : "border-[#f0e9ef] bg-white hover:bg-[#fff8fc]"}`}>
                    <span className="block text-[10px] uppercase tracking-wide text-[#a18a9e]">#{prompt.id} · {prompt.category}</span>
                    <span className="mt-1 block text-sm leading-5 text-[#62575f]">{prompt.question}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>

          <section className="rounded-3xl border border-[#e8dce8] bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a18a9e]">Your saved stories</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#39352f]">Answer history</h2>
              </div>
              <span className="text-sm text-[#817970]">{answers.length} answers in this space</span>
            </div>
            {loading ? (
              <p className="mt-5 text-sm text-[#817970]">Loading answers...</p>
            ) : answers.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-[#faf7fa] p-5 text-sm text-[#817970]">No answers yet. Choose a question above and start your first story.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {answers.map((answer) => (
                  <article key={answer.id} className="rounded-2xl border border-[#eee5ed] bg-[#fffdfa] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a18a9e]">Question #{answer.prompt_id} · {DAILY_PROMPTS.find((p) => p.id === answer.prompt_id)?.category ?? "Memory prompt"}</p>
                    <h3 className="mt-2 font-medium leading-6 text-[#39352f]">{answer.prompt_text}</h3>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#62575f]">{answer.answer}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-xs text-[#a1978d]">{new Date(answer.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openAnswer(answer)} className="rounded-lg border border-[#e7dce5] px-3 py-2 text-xs text-[#816780] hover:bg-white">Edit</button>
                        {answer.answered_by === userId && <button type="button" onClick={() => void deleteAnswer(answer)} className="rounded-lg border border-[#e7dce5] px-3 py-2 text-xs text-[#a45f62] hover:bg-white">Delete</button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
