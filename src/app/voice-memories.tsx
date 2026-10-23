"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mic, Square, Pause, Play, RotateCcw, Trash2, Headphones, Volume2, AudioLines } from "lucide-react";

type MemoryOption = { id: string; title: string; memory_date?: string };
type VoiceMemory = {
  id: string;
  space_id: string;
  memory_id: string | null;
  created_by: string;
  title: string;
  description: string;
  recorded_on: string;
  object_path: string;
  mime_type: string;
  storage_provider: "supabase" | "google_drive";
  google_drive_file_id: string | null;
  size_bytes: number;
  duration_seconds: number;
  created_at: string;
  signedUrl?: string;
};

type Props = {
  spaceId: string | null;
  spaceName: string;
  memories: MemoryOption[];
  onNotice: (message: string) => void;
};

const supabase = createClient();
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_RECORDING_SECONDS = 300;

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}



type LinkedVoiceMemory = Pick<VoiceMemory, "id" | "object_path" | "mime_type" | "storage_provider" | "google_drive_file_id"> & { signedUrl: string };

/** Minimal playback controls for a voice recording attached to a specific Read Memory screen. */
export function MemoryVoicePlayback({ memoryId, spaceId, onNotice }: { memoryId: string; spaceId: string; onNotice: (message: string) => void }) {
  const [item, setItem] = useState<LinkedVoiceMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadLinkedRecording = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("voice_memories")
        .select("id,object_path,mime_type,storage_provider,google_drive_file_id")
        .eq("memory_id", memoryId)
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = data?.[0];
      if (!row) { setItem(null); return; }
      let playbackUrl = "";
      if (row.storage_provider === "google_drive" && row.google_drive_file_id) {
        playbackUrl = `/api/google-drive/voice/${encodeURIComponent(row.google_drive_file_id)}`;
      } else {
        const { data: signed, error: signedError } = await supabase.storage
          .from("voice-memories")
          .createSignedUrl(row.object_path, 600);
        if (signedError || !signed?.signedUrl) throw new Error(signedError?.message || "Could not prepare audio playback.");
        playbackUrl = signed.signedUrl;
      }
      setItem({ ...row, signedUrl: playbackUrl } as LinkedVoiceMemory);
    } catch (error) {
      onNotice(`Could not load the voice recording: ${error instanceof Error ? error.message : "Unknown error"}`);
      setItem(null);
    } finally { setLoading(false); }
  }, [memoryId, spaceId, onNotice]);

  useEffect(() => { void loadLinkedRecording(); }, [loadLinkedRecording]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume, item]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); }
      catch { onNotice("Could not play this recording. Please try again."); }
    } else { audio.pause(); setPlaying(false); }
  }

  async function deleteLinkedRecording() {
    if (!item || deleting) return;
    if (!window.confirm("Delete this voice recording? The written memory and its photos will stay safe.")) return;
    setDeleting(true);
    try {
      audioRef.current?.pause();
      const { error: storageError } = await supabase.storage.from("voice-memories").remove([item.object_path]);
      if (storageError) throw new Error(`Could not delete the audio file: ${storageError.message}`);
      const { error: rowError } = await supabase.from("voice_memories").delete().eq("id", item.id).eq("memory_id", memoryId).eq("space_id", spaceId);
      if (rowError) throw new Error(`Audio file deleted, but its record could not be removed: ${rowError.message}`);
      setItem(null);
      onNotice("Voice recording deleted. The memory itself was kept.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not delete this recording.");
      await loadLinkedRecording();
    } finally { setDeleting(false); setPlaying(false); }
  }

  if (loading || !item) return null;
  return (
    <section aria-label="Voice recording attached to this memory" className="mt-6 rounded-2xl border border-[#e9dfea] bg-[#fbf7fc] p-4">
      <audio ref={audioRef} src={item.signedUrl} preload="metadata" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} className="hidden" />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? "Pause voice recording" : "Play voice recording"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#816780] text-white transition hover:bg-[#70556f]">
          {playing ? <Pause size={19} /> : <Play size={19} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#514451]">Voice recording</p>
          <p className="mt-1 text-xs text-[#92877d]">Attached to this memory</p>
        </div>
        <label className="flex items-center gap-2" title="Volume">
          <span className="sr-only">Volume</span><Volume2 size={18} className="text-[#816780]" />
          <input aria-label="Recording volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-16 accent-[#816780] sm:w-20" />
        </label>
        <button type="button" onClick={() => void deleteLinkedRecording()} disabled={deleting} aria-label="Delete voice recording" title="Delete recording" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#b45d68] transition hover:bg-[#f8e9eb] disabled:opacity-50">
          <Trash2 size={18} />
        </button>
      </div>
    </section>
  );
}

export default function VoiceMemories({ spaceId, spaceName, memories, onNotice }: Props) {
  const [items, setItems] = useState<VoiceMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memoryId, setMemoryId] = useState("");
  const [recordedOn, setRecordedOn] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMime, setPreviewMime] = useState("audio/webm");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef("");

  const cleanupPreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPreviewUrl("");
    setPreviewBlob(null);
  }, []);

  const loadVoiceMemories = useCallback(async () => {
    if (!spaceId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("voice_memories")
        .select("id,space_id,memory_id,created_by,title,description,recorded_on,object_path,mime_type,size_bytes,duration_seconds,created_at,storage_provider,google_drive_file_id")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as VoiceMemory[];
      const withUrls = await Promise.all(rows.map(async (item) => {
        if (item.storage_provider === "google_drive" && item.google_drive_file_id) {
          return {
            ...item,
            signedUrl: `/api/google-drive/voice/${encodeURIComponent(item.google_drive_file_id)}`,
          };
        }
        const { data: signed, error: signedError } = await supabase.storage
          .from("voice-memories")
          .createSignedUrl(item.object_path, 600);
        return { ...item, signedUrl: signedError ? "" : signed?.signedUrl ?? "" };
      }));
      setItems(withUrls);
    } catch (error) {
      onNotice(`Could not load voice memories: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [spaceId, onNotice]);

  useEffect(() => {
    void loadVoiceMemories();
  }, [loadVoiceMemories]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  async function startRecording() {
    if (!spaceId) {
      onNotice("Choose a space before recording a voice memory.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onNotice("Voice recording is not supported in this browser. Try the latest Chrome or Edge.");
      return;
    }
    try {
      cleanupPreview();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setElapsed(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setPreviewBlob(blob);
        setPreviewMime(blob.type || "audio/webm");
        setElapsed(Math.min(MAX_RECORDING_SECONDS, Math.round((Date.now() - startedAtRef.current) / 1000)));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= MAX_RECORDING_SECONDS && recorderRef.current?.state === "recording") recorderRef.current.stop();
        if (seconds >= MAX_RECORDING_SECONDS) {
          setRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 500);
      onNotice("Recording started. Your browser may ask for microphone permission.");
    } catch (error) {
      onNotice(`Could not access the microphone: ${error instanceof Error ? error.message : "Please allow microphone access."}`);
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  function retakeRecording() {
    cleanupPreview();
    setElapsed(0);
  }

  async function saveRecording(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!spaceId || !previewBlob || saving) return;

    if (!title.trim()) {
      onNotice("Add a title for this voice memory.");
      return;
    }

    if (previewBlob.size > MAX_AUDIO_BYTES) {
      onNotice("This recording is larger than 25 MB. Please record a shorter voice memory.");
      return;
    }

    setSaving(true);
    let reservationId: string | null = null;
    let uploadedSupabasePath: string | null = null;
    let uploadedDriveId: string | null = null;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Please sign in again before saving a recording.");
      }

      const extension = previewMime.includes("mp4")
        ? "m4a"
        : previewMime.includes("ogg")
          ? "ogg"
          : "webm";
      const storageMime = previewMime.split(";")[0] || "audio/webm";
      const objectPath = `${user.id}/${spaceId}/${crypto.randomUUID()}.${extension}`;

      let storageProvider: "supabase" | "google_drive" = "supabase";
      let driveFileId: string | null = null;

      const { data: reservationData, error: reservationError } =
        await supabase.rpc("reserve_storage_upload", {
          p_bucket_id: "voice-memories",
          p_object_path: objectPath,
          p_expected_bytes: previewBlob.size,
        });

      if (reservationError) {
        if (!reservationError.message.includes("PERSONAL_STORAGE_LIMIT")) {
          throw new Error(`Could not reserve storage: ${reservationError.message}`);
        }

        const formData = new FormData();
formData.append("spaceId", spaceId);
        formData.append(
          "file",
          new File([previewBlob], `${title.trim()}.${extension}`, {
            type: storageMime,
          })
        );

        const driveResponse = await fetch("/api/google-drive/voice-upload", {
          method: "POST",
          body: formData,
        });
        const driveResult = await driveResponse.json();

        if (!driveResponse.ok || !driveResult?.success || !driveResult?.file?.id) {
          throw new Error(
            driveResult?.error ||
            "Your personal storage is full. Connect Google Drive and try again."
          );
        }

        storageProvider = "google_drive";
        driveFileId = driveResult.file.id;
        uploadedDriveId = driveFileId;
      } else {
        const reservation = Array.isArray(reservationData)
          ? reservationData[0]
          : reservationData;

        if (!reservation?.reservation_id) {
          throw new Error("Storage could not reserve space for this recording. Please try again.");
        }

        reservationId = reservation.reservation_id;

        const { error: uploadError } = await supabase.storage
          .from("voice-memories")
          .upload(objectPath, previewBlob, {
            contentType: storageMime,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Audio upload failed: ${uploadError.message}`);
        }

        uploadedSupabasePath = objectPath;
      }

      const { error: insertError } = await supabase.from("voice_memories").insert({
        space_id: spaceId,
        memory_id: memoryId || null,
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        recorded_on: recordedOn || new Date().toISOString().slice(0, 10),
        object_path: storageProvider === "supabase" ? objectPath : `drive:${driveFileId}`,
        mime_type: storageMime,
        size_bytes: previewBlob.size,
        duration_seconds: elapsed,
        storage_provider: storageProvider,
        google_drive_file_id: driveFileId,
      });

      if (insertError) {
        if (uploadedSupabasePath) {
          const { error: cleanupError } = await supabase.storage
            .from("voice-memories")
            .remove([uploadedSupabasePath]);

          if (cleanupError) {
            throw new Error(
              `Recording details could not be saved and the uploaded file could not be removed. ${insertError.message}; cleanup: ${cleanupError.message}`
            );
          }

          uploadedSupabasePath = null;
        }

        throw new Error(
          storageProvider === "google_drive"
            ? `The recording reached Google Drive, but its details could not be saved. Drive file ID: ${driveFileId}. Error: ${insertError.message}`
            : `Audio uploaded, but its details could not be saved: ${insertError.message}`
        );
      }

      uploadedSupabasePath = null;
      uploadedDriveId = null;

      setTitle("");
      setDescription("");
      setMemoryId("");
      cleanupPreview();
      setElapsed(0);
      onNotice(
        storageProvider === "google_drive"
          ? "Voice memory saved to Google Drive because your personal storage is full."
          : "Voice memory saved successfully."
      );
      await loadVoiceMemories();
    } catch (error) {
      if (uploadedSupabasePath) {
        await supabase.storage.from("voice-memories").remove([uploadedSupabasePath]);
      }

      if (uploadedDriveId) {
        try {
          const cleanupResponse = await fetch("/api/google-drive/voice-cleanup", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: uploadedDriveId }),
          });

          if (!cleanupResponse.ok) {
            console.error("Could not clean up the uploaded Drive recording.");
          }
        } catch (cleanupError) {
          console.error("Drive recording cleanup failed:", cleanupError);
        }
      }

      onNotice(error instanceof Error ? error.message : "Could not save this voice memory.");
    } finally {
      if (reservationId) {
        await supabase.rpc("release_storage_upload", {
          p_reservation_id: reservationId,
        });
      }
      setSaving(false);
    }
  }
  async function deleteVoiceMemory(item: VoiceMemory) {
    if (deletingId) return;
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

    setDeletingId(item.id);
    try {
      if (item.storage_provider === "google_drive") {
        if (!item.google_drive_file_id) {
          throw new Error("This Drive recording is missing its file ID.");
        }
        const response = await fetch(
          `/api/google-drive/voice/${encodeURIComponent(item.google_drive_file_id)}`,
          { method: "DELETE" }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error || "Could not delete the Google Drive recording.");
        }
      } else {
        const { error: storageError } = await supabase.storage
          .from("voice-memories")
          .remove([item.object_path]);
        if (storageError) throw new Error(`Could not delete audio: ${storageError.message}`);

        const { error: rowError } = await supabase
          .from("voice_memories")
          .delete()
          .eq("id", item.id);
        if (rowError) throw new Error(`Audio was removed, but its details could not be deleted: ${rowError.message}`);
      }

      onNotice("Voice memory deleted.");
      await loadVoiceMemories();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not delete this voice memory.");
    } finally {
      setDeletingId(null);
    }
  }
  return (
    <section className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">LITTLE VOICES, KEPT FOREVER</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#514451] sm:text-4xl">Voice Memories <span className="text-[#bd91ad]">Ã¢â„¢Â¥</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">Save a laugh, a story, or a message in someone's own voice. Recordings stay in the selected private space.</p>
      </div>

      {!spaceId ? (
        <div className="rounded-3xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 text-center">
          <Headphones className="mx-auto mb-3 text-[#a18a9e]" size={32} />
          <h2 className="text-lg font-semibold text-[#514451]">Choose a space first</h2>
          <p className="mt-2 text-sm text-[#8d8379]">Select one of your spaces to record and listen to its voice memories.</p>
        </div>
      ) : (
        <>
          <section className="rounded-3xl border border-[#e9deeb] bg-gradient-to-br from-[#fbf6fc] via-white to-[#fff7f3] p-5 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee3f1] text-[#816780]"><Mic size={23} /></div>
              <div><h2 className="text-xl font-semibold text-[#514451]">Record a little moment</h2><p className="text-sm text-[#8d8379]">Space: {spaceName}</p></div>
            </div>
            <div className="rounded-2xl border border-[#e7dce5] bg-white/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${recording ? "animate-pulse bg-rose-100 text-rose-600" : "bg-[#f0e8f2] text-[#816780]"}`}><AudioLines size={20} /></span>
                  <div><p className="font-medium text-[#514451]">{recording ? "Recording in progressÃ¢â‚¬Â¦" : previewBlob ? "Your recording is ready" : "Ready when you are"}</p><p className="text-xs text-[#8d8379]">{formatDuration(elapsed)} / 5:00 maximum</p></div>
                </div>
                {!recording ? <button type="button" onClick={() => void startRecording()} className="inline-flex items-center gap-2 rounded-xl bg-[#816780] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#70566f]"><Mic size={16} /> {previewBlob ? "Record again" : "Start recording"}</button> : <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700"><Square size={15} /> Stop recording</button>}
              </div>
              {previewUrl && !recording && <div className="mt-4"><audio controls src={previewUrl} className="w-full" /></div>}
              {previewBlob && !recording && <button type="button" onClick={retakeRecording} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#816780] hover:underline"><RotateCcw size={15} /> Discard and retake</button>}
            </div>

            <form onSubmit={saveRecording} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[#514451]">Title *
                <input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Grandma telling her story" className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 outline-none focus:border-[#a98ca7]" />
              </label>
              <label className="text-sm font-medium text-[#514451]">Recording date
                <input type="date" value={recordedOn} onChange={(e) => setRecordedOn(e.target.value)} className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 outline-none focus:border-[#a98ca7]" />
              </label>
              <label className="text-sm font-medium text-[#514451] sm:col-span-2">Description (optional)
                <textarea maxLength={500} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this voice memory special?" className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 outline-none focus:border-[#a98ca7]" />
              </label>
              <label className="text-sm font-medium text-[#514451] sm:col-span-2">Attach to a written memory (optional)
                <select value={memoryId} onChange={(e) => setMemoryId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 outline-none focus:border-[#a98ca7]">
                  <option value="">No linked memory</option>
                  {memories.map((memory) => <option key={memory.id} value={memory.id}>{memory.title}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <p className="text-xs leading-5 text-[#8d8379]">Maximum 5 minutes and 25 MB per recording. Your browser must have microphone access.</p>
                <button type="submit" disabled={!previewBlob || recording || saving} className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70566f] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving voice memoryÃ¢â‚¬Â¦" : "Save voice memory"}</button>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">YOUR SAVED RECORDINGS</p><h2 className="mt-1 text-2xl font-semibold text-[#514451]">Little voices to revisit</h2></div><span className="rounded-full bg-[#f0e8f2] px-3 py-1 text-sm text-[#816780]">{items.length}</span></div>
            {loading ? <div className="rounded-2xl bg-white p-6 text-sm text-[#8d8379]">Loading voice memoriesÃ¢â‚¬Â¦</div> : items.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 text-center"><Headphones className="mx-auto mb-3 text-[#a18a9e]" size={30} /><p className="font-medium text-[#514451]">No voice memories yet</p><p className="mt-2 text-sm text-[#8d8379]">Your saved recordings will appear here.</p></div> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((item, index) => <article key={item.id} className={`rounded-2xl border p-5 ${index % 3 === 0 ? "border-[#f0deda] bg-[#fff8f6]" : index % 3 === 1 ? "border-[#e7dff0] bg-[#fbf8ff]" : "border-[#e0e8dc] bg-[#f8fbf6]"}`}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-lg font-semibold text-[#514451]">{item.title}</h3><p className="mt-1 text-xs text-[#8d8379]">{new Date(`${item.recorded_on}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} Ã‚Â· {formatDuration(item.duration_seconds)}</p></div><button type="button" onClick={() => void deleteVoiceMemory(item)} disabled={deletingId === item.id} aria-label={`Delete ${item.title}`} className="rounded-xl p-2 text-[#9a7479] hover:bg-white disabled:opacity-50"><Trash2 size={17} /></button></div>
                  {item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#796b78]">{item.description}</p>}
                  {item.memory_id && <p className="mt-2 text-xs text-[#816780]">Linked to a written memory</p>}
                  {item.signedUrl ? <audio controls preload="none" src={item.signedUrl} className="mt-4 w-full" onPlay={() => setPlayingId(item.id)} onPause={() => setPlayingId((current) => current === item.id ? null : current)} onEnded={() => setPlayingId(null)} /> : <p className="mt-4 text-sm text-[#9a7479]">Audio preview unavailable. Refresh to try again.</p>}
                  {playingId === item.id && <p className="mt-2 text-xs text-[#816780]"><Pause size={12} className="mr-1 inline" /> Playing now</p>}
                  <p className="mt-3 text-xs text-[#9b9086]">{(item.size_bytes / (1024 * 1024)).toFixed(1)} MB Ã‚Â· Private space recording</p>
                </article>)}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}




