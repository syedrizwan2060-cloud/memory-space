
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Poll = {
  id: string;
  space_id: string;
  created_by: string;
  question: string;
  options: string[];
  created_at: string;
  ends_at: string | null;
};

type PollVote = {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
};

type Props = {
  spaceId: string | null;
  spaceName: string;
  onNotice: (message: string) => void;
};

export default function GroupPolls({
  spaceId,
  spaceName,
  onNotice,
}: Props) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function loadPolls() {
    if (!spaceId) {
      setPolls([]);
      setVotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    setUserId(authData.user?.id ?? "");

    const { data: pollData, error: pollError } = await supabase
      .from("group_polls")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });

    if (pollError) {
      onNotice(pollError.message);
      setPolls([]);
      setVotes([]);
      setLoading(false);
      return;
    }

    const parsedPolls = (pollData ?? []).map((poll) => ({
      ...poll,
      options: Array.isArray(poll.options)
        ? poll.options.filter((item: unknown) => typeof item === "string")
        : [],
    })) as Poll[];

    setPolls(parsedPolls);

    if (parsedPolls.length > 0) {
      const { data: voteData, error: voteError } = await supabase
        .from("group_poll_votes")
        .select("id,poll_id,user_id,option_index")
        .in(
          "poll_id",
          parsedPolls.map((poll) => poll.id)
        );

      if (voteError) {
        onNotice(voteError.message);
        setVotes([]);
      } else {
        setVotes((voteData ?? []) as PollVote[]);
      }
    } else {
      setVotes([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadPolls();
  }, [spaceId]);

  async function createPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!spaceId) return;

    const cleanQuestion = question.trim();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2) {
      onNotice("Add a question and at least two non-empty options.");
      return;
    }

    if (new Set(cleanOptions.map((option) => option.toLowerCase())).size !== cleanOptions.length) {
      onNotice("Please remove duplicate options.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user;

    if (!currentUser) {
      onNotice("Please sign in to create a poll.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("group_polls").insert({
      space_id: spaceId,
      created_by: currentUser.id,
      question: cleanQuestion,
      options: cleanOptions,
    });

    if (error) {
      onNotice(error.message);
    } else {
      setQuestion("");
      setOptions(["", ""]);
      onNotice("Your group poll is ready!");
      await loadPolls();
    }

    setSaving(false);
  }

  async function castVote(poll: Poll, optionIndex: number) {
    if (!userId) {
      onNotice("Please sign in to vote.");
      return;
    }

    if (
      optionIndex < 0 ||
      optionIndex >= poll.options.length ||
      !Number.isInteger(optionIndex)
    ) {
      onNotice("That poll option is not valid.");
      return;
    }

    if (poll.ends_at && new Date(poll.ends_at).getTime() <= Date.now()) {
      onNotice("This poll has ended.");
      return;
    }

    if (votes.some((vote) => vote.poll_id === poll.id && vote.user_id === userId)) {
      onNotice("You've already voted in this poll.");
      return;
    }

    const { error } = await supabase.from("group_poll_votes").insert({
      poll_id: poll.id,
      space_id: poll.space_id,
      user_id: userId,
      option_index: optionIndex,
    });

    if (error) {
      onNotice(
        error.code === "23505"
          ? "You've already voted in this poll."
          : error.message
      );
    } else {
      onNotice("Your vote has been counted!");
      await loadPolls();
    }
  }

  return (
    <section className="mx-auto max-w-4xl pb-24">
      <div className="mb-8 rounded-3xl bg-[#eee5ed] p-7 sm:p-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#86657f]">
          DECIDE TOGETHER
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#493b49] sm:text-4xl">
          Group Polls
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#776779]">
          Movie night, dinner plans, or your next little adventure. Let
          everyone in {spaceName || "your space"} have a say.
        </p>
      </div>

      {!spaceId ? (
        <p className="rounded-2xl border border-[#ebe5df] bg-white p-6 text-sm text-[#817970]">
          Choose or create a space before making a poll.
        </p>
      ) : (
        <>
          <form
            onSubmit={createPoll}
            className="mb-8 space-y-4 rounded-3xl border border-[#ebe5df] bg-white p-6"
          >
            <h2 className="text-lg font-semibold">Start a new poll</h2>

            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={300}
              required
              placeholder="What should we decide together?"
              className="w-full rounded-xl border border-[#e7dfe6] px-4 py-3 text-sm outline-none focus:border-[#b99bb6]"
            />

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={option}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((item, i) =>
                          i === index ? event.target.value : item
                        )
                      )
                    }
                    maxLength={150}
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-[#e7dfe6] px-4 py-3 text-sm outline-none focus:border-[#b99bb6]"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((current) =>
                          current.filter((_, i) => i !== index)
                        )
                      }
                      className="rounded-xl px-3 text-sm text-[#a45f62] hover:bg-[#faf2f2]"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={options.length >= 8}
                onClick={() => setOptions((current) => [...current, ""])}
                className="rounded-xl border border-[#d9c8d8] px-4 py-3 text-sm text-[#816780] hover:bg-[#f8f1f7] disabled:opacity-50"
              >
                + Add option
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create poll"}
              </button>
            </div>
          </form>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Polls in your space</h2>
            <span className="text-sm text-[#a49a90]">
              {polls.length} {polls.length === 1 ? "poll" : "polls"}
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-sm text-[#8d8379]">Loading your polls...</p>
          ) : polls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8d8] p-8 text-center">
              <p className="text-lg">✳</p>
              <p className="mt-2 font-medium">No polls yet</p>
              <p className="mt-1 text-sm text-[#8d8379]">
                Create the first poll and decide something together.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {polls.map((poll) => {
                const pollVotes = votes.filter((vote) => vote.poll_id === poll.id);
                const myVote = pollVotes.find((vote) => vote.user_id === userId);
                const ended = Boolean(
                  poll.ends_at && new Date(poll.ends_at).getTime() <= Date.now()
                );

                return (
                  <article
                    key={poll.id}
                    className="rounded-3xl border border-[#ebe5df] bg-white p-6"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{poll.question}</h3>
                      <span className="rounded-full bg-[#f4edf3] px-3 py-1 text-xs text-[#816780]">
                        {ended ? "Ended" : myVote ? "Voted" : "Open"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((option, index) => {
                        const count = pollVotes.filter(
                          (vote) => vote.option_index === index
                        ).length;
                        const percent = pollVotes.length
                          ? Math.round((count / pollVotes.length) * 100)
                          : 0;

                        return (
                          <div key={`${poll.id}-${index}`}>
                            <button
                              type="button"
                              disabled={Boolean(myVote) || ended}
                              onClick={() => void castVote(poll, index)}
                              className={`relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm ${
                                myVote?.option_index === index
                                  ? "border-[#a98ba7] bg-[#f4edf3]"
                                  : "border-[#eee5ed] bg-[#fffdfa]"
                              } disabled:cursor-default`}
                            >
                              <span
                                className="absolute inset-y-0 left-0 bg-[#eee5ed]"
                                style={{ width: `${percent}%` }}
                              />
                              <span className="relative flex items-center justify-between gap-3">
                                <span>{option}</span>
                                <span className="shrink-0 text-xs text-[#817970]">
                                  {count} · {percent}%
                                </span>
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-xs text-[#a49a90]">
                      {pollVotes.length} {pollVotes.length === 1 ? "vote" : "votes"}
                      {myVote ? " · Your vote is recorded" : ""}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
