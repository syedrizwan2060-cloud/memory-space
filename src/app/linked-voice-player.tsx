"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Play, Pause, Volume2, Trash2 } from "lucide-react";

type LinkedVoice = {
  id: string;
  space_id: string;
  memory_id: string | null;
  title: string;
  object_path: string;
  duration_seconds: number | null;
  signedUrl: string;
};

type Props = {
  memoryId: string;
  spaceId: string;
  onNotice: (message: string) => void;
};

const supabase = createClient();

function formatTime(value: number) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function VoicePlayer({ item, onDelete, deleting, onNotice }: {
  item: LinkedVoice;
  onDelete: (item: LinkedVoice) => void;
  deleting: boolean;
  onNotice: (message: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration_seconds || 0);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        onNotice("Could not play this recording. Please try again.");
      }
    } else {
      audio.pause();
    }
  }, [onNotice]);

  return (
    <div className="rounded-2xl border border-[#eee4e9] bg-white p-4 sm:p-5">
      <audio
        ref={audioRef}
        src={item.signedUrl}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const actualDuration = event.currentTarget.duration;
          if (Number.isFinite(actualDuration)) setDuration(actualDuration);
        }}
        onDurationChange={(event) => {
          const actualDuration = event.currentTarget.duration;
          if (Number.isFinite(actualDuration)) setDuration(actualDuration);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
        onError={() => onNotice("This voice recording could not be loaded. Try refreshing the memory.")}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-label={playing ? "Pause voice recording" : "Play voice recording"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eee5f7] text-[#7653a4] transition hover:bg-[#e4d7f2] focus:outline-none focus:ring-2 focus:ring-[#a98ac4]"
        >
          {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#514451]">Voice recording</p>
          <input
            aria-label="Choose playback position"
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={(event) => {
              const audio = audioRef.current;
              const nextTime = Number(event.target.value);
              if (audio && Number.isFinite(nextTime)) {
                audio.currentTime = nextTime;
                setCurrentTime(nextTime);
              }
            }}
            className="mt-2 block h-2 w-full cursor-pointer accent-red-600"
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-[#93878f]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setShowVolume((value) => !value)}
            aria-label="Show volume control"
            aria-expanded={showVolume}
            className="rounded-lg p-2 text-[#806d80] transition hover:bg-[#f8f1f7]"
          >
            <Volume2 size={19} />
          </button>
          {showVolume && (
            <input
              aria-label="Playback volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="absolute right-0 top-10 z-10 w-24 accent-[#816780]"
            />
          )}
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={deleting}
            aria-label="Delete voice recording"
            title="Delete voice recording"
            className="rounded-lg p-2 text-[#b65c61] transition hover:bg-[#fff0f0] disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LinkedVoicePlayer({ memoryId, spaceId, onNotice }: Props) {
  const [items, setItems] = useState<LinkedVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLinkedVoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("voice_memories")
        .select("id,space_id,memory_id,title,object_path,duration_seconds")
        .eq("space_id", spaceId)
        .eq("memory_id", memoryId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Omit<LinkedVoice, "signedUrl">[];
      const signedRows = await Promise.all(rows.map(async (item) => {
        const { data: signed, error: signedError } = await supabase.storage
          .from("voice-memories")
          .createSignedUrl(item.object_path, 600);
        return { ...item, signedUrl: signedError ? "" : signed?.signedUrl ?? "" };
      }));
      setItems(signedRows.filter((item) => Boolean(item.signedUrl)));
      if (signedRows.some((item) => !item.signedUrl)) {
        onNotice("One linked recording could not be loaded. Try refreshing this memory.");
      }
    } catch (error) {
      setItems([]);
      onNotice(`Could not load the linked voice recording: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [memoryId, spaceId, onNotice]);

  useEffect(() => { void loadLinkedVoices(); }, [loadLinkedVoices]);

  async function deleteVoice(item: LinkedVoice) {
    if (!window.confirm("Delete only this voice recording? The memory and its photos will stay.")) return;
    setDeletingId(item.id);
    try {
      const { error: storageError } = await supabase.storage
        .from("voice-memories")
        .remove([item.object_path]);
      if (storageError) throw new Error(`Could not delete the audio file: ${storageError.message}`);
      const { error: rowError } = await supabase
        .from("voice_memories")
        .delete()
        .eq("id", item.id)
        .eq("space_id", spaceId)
        .eq("memory_id", memoryId);
      if (rowError) throw new Error(`Audio file deleted, but its record could not be removed: ${rowError.message}`);
      setItems((current) => current.filter((voice) => voice.id !== item.id));
      onNotice("Voice recording deleted. The memory and its photos are unchanged.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not delete this voice recording.");
      void loadLinkedVoices();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || items.length === 0) return null;

  return (
    <section className="mt-5 space-y-3" aria-label="Voice recordings attached to this memory">
      {items.map((item) => (
        <VoicePlayer
          key={item.id}
          item={item}
          onDelete={(voice) => void deleteVoice(voice)}
          deleting={deletingId === item.id}
          onNotice={onNotice}
        />
      ))}
    </section>
  );
}
