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

type Album = {
  id: string;
  space_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type AlbumMemoryLink = {
  album_id: string;
  memory_id: string;
  added_by: string;
  added_at: string;
};

const supabase = createClient();

export default function AlbumsView({
  spaceId,
  spaceName,
  memories,
  onNotice,
}: {
  spaceId: string;
  spaceName: string;
  memories: Memory[];
  onNotice: (message: string) => void;
}) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [links, setLinks] = useState<AlbumMemoryLink[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [search, setSearch] = useState("");

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;
  const linkedMemoryIds = useMemo(
    () => new Set(links.filter((link) => link.album_id === selectedAlbumId).map((link) => link.memory_id)),
    [links, selectedAlbumId]
  );
  const filteredMemories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return memories.filter((memory) =>
      !query || memory.title.toLocaleLowerCase().includes(query) || memory.content.toLocaleLowerCase().includes(query)
    );
  }, [memories, search]);

  async function loadAlbums(preferredId?: string) {
    if (!spaceId) {
      setAlbums([]);
      setLinks([]);
      setSelectedAlbumId("");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("albums")
      .select("id, space_id, name, description, created_by, created_at, updated_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });
    if (error) {
      onNotice(`Could not load albums: ${error.message}`);
      setAlbums([]);
      setLinks([]);
      setSelectedAlbumId("");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Album[];
    setAlbums(rows);
    setSelectedAlbumId((current) => {
      const target = preferredId ?? current;
      return rows.some((album) => album.id === target) ? target : (rows[0]?.id ?? "");
    });
    setLoading(false);
  }

  async function loadAlbumLinks(albumId: string) {
    if (!albumId) {
      setLinks([]);
      return;
    }
    const { data, error } = await supabase
      .from("album_memories")
      .select("album_id, memory_id, added_by, added_at")
      .order("added_at", { ascending: false });
    if (error) {
      onNotice(`Could not load album memories: ${error.message}`);
      setLinks([]);
      return;
    }
    setLinks((data ?? []) as AlbumMemoryLink[]);
  }

  useEffect(() => {
    void loadAlbums();
    // Re-fetch whenever the user switches spaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  useEffect(() => {
    void loadAlbumLinks(selectedAlbumId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlbumId]);

  async function handleCreateAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = albumName.trim();
    if (!spaceId || !name || saving) return;
    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      onNotice("Please sign in again before creating an album.");
      setSaving(false);
      return;
    }
    const { data, error } = await supabase
      .from("albums")
      .insert({
        space_id: spaceId,
        name,
        description: albumDescription.trim() || null,
        created_by: user.id,
      })
      .select("id, space_id, name, description, created_by, created_at, updated_at")
      .single();
    if (error || !data) {
      onNotice(`Could not create album: ${error?.message ?? "No album was returned."}`);
      setSaving(false);
      return;
    }
    setAlbumName("");
    setAlbumDescription("");
    onNotice(`Album “${name}” created. Add some memories to it!`);
    await loadAlbums(data.id);
    setSaving(false);
  }

  function startEditing() {
    if (!selectedAlbum) return;
    setEditName(selectedAlbum.name);
    setEditDescription(selectedAlbum.description ?? "");
    setEditing(true);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAlbum || !editName.trim() || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("albums")
      .update({ name: editName.trim(), description: editDescription.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", selectedAlbum.id)
      .select("id, space_id, name, description, created_by, created_at, updated_at")
      .single();
    if (error || !data) {
      onNotice(`Could not update album: ${error?.message ?? "No album was returned."}`);
    } else {
      setAlbums((current) => current.map((album) => album.id === data.id ? data as Album : album));
      setEditing(false);
      onNotice("Album details updated. ♡");
    }
    setSaving(false);
  }

  async function handleDeleteAlbum() {
    if (!selectedAlbum || saving) return;
    if (!window.confirm(`Delete the album “${selectedAlbum.name}”? Its original memories and photos will remain safe.`)) return;
    setSaving(true);
    const { error } = await supabase.from("albums").delete().eq("id", selectedAlbum.id);
    if (error) {
      onNotice(`Could not delete album: ${error.message}`);
    } else {
      const removedName = selectedAlbum.name;
      setEditing(false);
      onNotice(`Album “${removedName}” deleted. The original memories were kept.`);
      await loadAlbums();
    }
    setSaving(false);
  }

  async function addMemory(memory: Memory) {
    if (!selectedAlbum || saving) return;
    setSaving(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      onNotice("Please sign in again before adding a memory to an album.");
      setSaving(false);
      return;
    }
    const { data, error } = await supabase
      .from("album_memories")
      .insert({ album_id: selectedAlbum.id, memory_id: memory.id, added_by: user.id })
      .select("album_id, memory_id, added_by, added_at")
      .single();
    if (error) {
      onNotice(error.code === "23505" ? "That memory is already in this album." : `Could not add memory: ${error.message}`);
    } else if (data) {
      setLinks((current) => [...current, data as AlbumMemoryLink]);
      onNotice(`“${memory.title}” added to ${selectedAlbum.name}.`);
    }
    setSaving(false);
  }

  async function removeMemory(memory: Memory) {
    if (!selectedAlbum || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("album_memories")
      .delete()
      .eq("album_id", selectedAlbum.id)
      .eq("memory_id", memory.id);
    if (error) {
      onNotice(`Could not remove memory from album: ${error.message}`);
    } else {
      setLinks((current) => current.filter((link) => !(link.album_id === selectedAlbum.id && link.memory_id === memory.id)));
      onNotice(`“${memory.title}” removed from the album. The original memory remains safe.`);
    }
    setSaving(false);
  }

  if (!spaceId) {
    return (
      <section className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">COLLECT THE LITTLE MOMENTS</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Albums & Collections <span className="text-[#bd91ad]">♡</span></h1>
        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white p-8">Create or select a space first to start an album.</div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">COLLECT THE LITTLE MOMENTS</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Albums & Collections <span className="text-[#bd91ad]">♡</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">Gather memories into little collections in <span className="font-medium text-[#775b75]">{spaceName || "your space"}</span>. Albums link to your existing memories, so nothing is duplicated.</p>
      </div>

      <form onSubmit={handleCreateAlbum} className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-[#514451]">Create a new album</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Album name
            <input required maxLength={100} value={albumName} onChange={(event) => setAlbumName(event.target.value)} placeholder="e.g. Summer together" className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]" />
          </label>
          <label className="block text-sm font-medium">Description (optional)
            <input maxLength={500} value={albumDescription} onChange={(event) => setAlbumDescription(event.target.value)} placeholder="What brings these moments together?" className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]" />
          </label>
        </div>
        <button type="submit" disabled={saving || !albumName.trim()} className="mt-5 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving…" : "＋ Create album"}</button>
      </form>

      {loading ? <p className="text-sm text-[#93877e]">Gathering your albums…</p> : albums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8"><p className="text-lg font-medium">Your first collection is waiting. ♡</p><p className="mt-2 text-sm text-[#93877e]">Create an album above, then add the memories that belong together.</p></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <h2 className="px-1 text-sm font-semibold text-[#62575f]">Your albums ({albums.length})</h2>
            {albums.map((album, index) => (
              <button key={album.id} type="button" onClick={() => { setSelectedAlbumId(album.id); setEditing(false); }} className={`w-full rounded-2xl border p-4 text-left transition ${selectedAlbumId === album.id ? "border-[#cbb7ca] bg-[#f8f1f7] shadow-sm" : "border-[#eee6df] bg-white hover:border-[#d9c8d8]"}`}>
                <div className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${index % 3 === 0 ? "bg-[#f4e3e1]" : index % 3 === 1 ? "bg-[#eae4f3]" : "bg-[#e4ebe0]"}`}>▤</span><span className="min-w-0"><span className="block break-words text-sm font-semibold text-[#514451]">{album.name}</span><span className="mt-1 block text-xs text-[#93877e]">{links.filter((link) => link.album_id === album.id).length} memories</span></span></div>
              </button>
            ))}
          </aside>

          {selectedAlbum && (
            <div className="min-w-0 rounded-3xl border border-[#eee6df] bg-white p-5 shadow-sm sm:p-7">
              {editing ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#514451]">Edit album</h2>
                  <label className="block text-sm font-medium">Album name<input required maxLength={100} value={editName} onChange={(event) => setEditName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]" /></label>
                  <label className="block text-sm font-medium">Description<textarea rows={3} maxLength={500} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]" /></label>
                  <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving || !editName.trim()} className="rounded-xl bg-[#816780] px-4 py-3 text-sm text-white disabled:opacity-60">Save changes</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-[#e7dce5] px-4 py-3 text-sm">Cancel</button></div>
                </form>
              ) : (
                <>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">YOUR COLLECTION</p><h2 className="mt-2 break-words text-2xl font-semibold text-[#514451]">{selectedAlbum.name}</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#91867d]">{selectedAlbum.description || "A little collection of moments worth keeping."}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={startEditing} className="rounded-xl border border-[#d9c8d8] px-3 py-2 text-sm text-[#816780] hover:bg-[#f8f1f7]">✎ Edit</button><button type="button" disabled={saving} onClick={() => void handleDeleteAlbum()} className="rounded-xl border border-[#ecd4d2] px-3 py-2 text-sm text-[#a45f62] hover:bg-[#fff3f1] disabled:opacity-50">Delete album</button></div></div>
                  <div className="mt-7 border-t border-[#f0e9e3] pt-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h3 className="text-lg font-semibold text-[#514451]">Memories in this album</h3><p className="mt-1 text-xs text-[#93877e]">Add or remove memories without copying the original.</p></div><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a memory…" className="w-full rounded-xl border border-[#e7dce5] px-4 py-2.5 text-sm outline-none focus:border-[#a98ca7] sm:max-w-xs" /></div>
                    {memories.length === 0 ? <div className="mt-5 rounded-2xl bg-[#faf8f5] p-5 text-sm leading-6 text-[#93877e]">There are no memories in this space yet. Create a memory first, then come back here to add it.</div> : filteredMemories.length === 0 ? <p className="mt-5 text-sm text-[#93877e]">No memories match your search.</p> : (
                      <div className="mt-4 space-y-3">{filteredMemories.map((memory) => { const isLinked = linkedMemoryIds.has(memory.id); return <article key={memory.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[#eee6df] p-4 sm:flex-row sm:items-center"><div className="min-w-0"><h4 className="break-words text-sm font-semibold text-[#514451]">{memory.title}</h4><p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#93877e]">{memory.content || "A moment saved in your space."}</p><p className="mt-2 text-[10px] uppercase tracking-wide text-[#a1978d]">{new Date(`${memory.memory_date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p></div>{isLinked ? <button type="button" disabled={saving} onClick={() => void removeMemory(memory)} className="shrink-0 rounded-xl border border-[#ecd4d2] px-3 py-2 text-xs font-medium text-[#a45f62] hover:bg-[#fff3f1] disabled:opacity-50">{saving ? "Please wait…" : "− Remove"}</button> : <button type="button" disabled={saving} onClick={() => void addMemory(memory)} className="shrink-0 rounded-xl border border-[#d9c8d8] px-3 py-2 text-xs font-medium text-[#816780] hover:bg-[#f8f1f7] disabled:opacity-50">{saving ? "Please wait…" : "+ Add to album"}</button>}</article>; })}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
