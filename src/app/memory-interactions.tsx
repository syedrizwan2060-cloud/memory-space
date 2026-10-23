
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Reaction = {
  id: string;
  user_id: string;
  emoji: string;
};

type Props = {
  memoryId: string;
  spaceId: string;
  onNotice: (message: string) => void;
};

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍"];

export default function MemoryInteractions({
  memoryId,
  spaceId,
  onNotice,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userId, setUserId] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [busyEmoji, setBusyEmoji] = useState<string | null>(null);

  const loadInteractions = useCallback(async () => {
    setLoading(true);

    const [
      { data: authData },
      { data: commentData, error: commentError },
      { data: reactionData, error: reactionError },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("memory_comments")
        .select("id, user_id, content, created_at")
        .eq("memory_id", memoryId)
        .eq("space_id", spaceId)
        .order("created_at", { ascending: true }),
      supabase
        .from("memory_reactions")
        .select("id, user_id, emoji")
        .eq("memory_id", memoryId)
        .eq("space_id", spaceId),
    ]);

    setUserId(authData.user?.id ?? "");

    if (commentError) {
      onNotice("Couldn't load comments: " + commentError.message);
    } else {
      setComments((commentData ?? []) as Comment[]);
    }

    if (reactionError) {
      onNotice("Couldn't load reactions: " + reactionError.message);
    } else {
      setReactions((reactionData ?? []) as Reaction[]);
    }

    setLoading(false);
  }, [supabase, memoryId, spaceId, onNotice]);

  useEffect(() => {
    void loadInteractions();
  }, [loadInteractions]);

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed || sending) return;

    if (trimmed.length > 2000) {
      onNotice("Comments must be 2,000 characters or fewer.");
      return;
    }

    setSending(true);

    try {
      const { data, error: authError } = await supabase.auth.getUser();

      if (authError || !data.user) {
        onNotice("Please sign in again before commenting.");
        return;
      }

      const { error } = await supabase.from("memory_comments").insert({
        memory_id: memoryId,
        space_id: spaceId,
        user_id: data.user.id,
        content: trimmed,
      });

      if (error) {
        onNotice("Couldn't post comment: " + error.message);
        return;
      }

      setContent("");
      onNotice("Comment added! 💬");
      await loadInteractions();
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase
      .from("memory_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)
      .eq("space_id", spaceId);

    if (error) {
      onNotice("Couldn't delete comment: " + error.message);
      return;
    }

    onNotice("Comment deleted.");
    await loadInteractions();
  }

  async function toggleReaction(emoji: string) {
    if (busyEmoji) return;

    if (!userId) {
      onNotice("Please sign in to react to a memory.");
      return;
    }

    setBusyEmoji(emoji);

    try {
      const existing = reactions.find(
        (reaction) => reaction.user_id === userId
      );

      if (existing?.emoji === emoji) {
        const { error } = await supabase
          .from("memory_reactions")
          .delete()
          .eq("id", existing.id)
          .eq("user_id", userId)
          .eq("space_id", spaceId);

        if (error) throw error;
      } else {
        if (existing) {
          const { error } = await supabase
            .from("memory_reactions")
            .delete()
            .eq("id", existing.id)
            .eq("user_id", userId)
            .eq("space_id", spaceId);

          if (error) throw error;
        }

        const { error } = await supabase.from("memory_reactions").insert({
          memory_id: memoryId,
          space_id: spaceId,
          user_id: userId,
          emoji,
        });

        if (error) throw error;
      }

      await loadInteractions();
    } catch (error) {
      onNotice(
        "Couldn't update reaction: " +
          (error instanceof Error ? error.message : "Please try again.")
      );
    } finally {
      setBusyEmoji(null);
    }
  }

  const counts = EMOJIS.map((emoji) => ({
    emoji,
    count: reactions.filter((reaction) => reaction.emoji === emoji).length,
    selected: reactions.some(
      (reaction) => reaction.user_id === userId && reaction.emoji === emoji
    ),
  }));

  return (
    <section className="mt-4 space-y-4 border-t border-purple-100 pt-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-purple-950">
          Reactions
        </p>

        <div className="flex flex-wrap gap-2">
          {counts.map(({ emoji, count, selected }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => void toggleReaction(emoji)}
              disabled={busyEmoji !== null}
              aria-pressed={selected}
              aria-label={`${emoji}, ${count} reactions`}
              className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                selected
                  ? "border-purple-400 bg-purple-100"
                  : "border-gray-200 bg-white hover:bg-purple-50"
              }`}
            >
              {emoji} <span>{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-purple-950">
          Comments ({comments.length})
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No comments yet. Be the first to share a thought! 💜
          </p>
        ) : (
          <div className="mb-4 space-y-3">
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-2xl bg-purple-50/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-purple-700">
                      {comment.user_id === userId
                        ? "You"
                        : `Member ${comment.user_id.slice(0, 8)}`}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                      {comment.content}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>

                  {comment.user_id === userId && (
                    <button
                      type="button"
                      onClick={() => void deleteComment(comment.id)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <form onSubmit={addComment} className="space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Write a comment..."
            aria-label="Write a comment"
            className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              {content.length}/2000
            </span>
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
