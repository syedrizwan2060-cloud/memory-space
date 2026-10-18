
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import CalendarView from "./calendar-view";
import FuturePlans from "./future-plans";

type Space = {
  id: string;
  name: string;
  created_at: string;
};

type Memory = {
  id: string;
  title: string;
  content: string;
  memory_date: string;
  space_id: string;
};

type MemoryJarNote = {
  id: string;
  space_id: string;
  created_by: string;
  message: string;
  open_on: string | null;
  opened_at: string | null;
  created_at: string;
};

type CreatedInvitation = {
  invitation_id: string;
  invitation_token: string;
  expires_at: string;
  invitation_type: "email" | "link";
  invited_email: string | null;
  status: "pending" | "revoked";
};

type MemoryPhoto = {
  id: string;
  memory_id: string;
  space_id: string;
  uploaded_by: string;
  object_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  caption: string;
  created_at: string;
  signedUrl: string;
};

const supabase = createClient();

export default function Home() {
  const [active, setActive] = useState("Home");
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [detailMemory, setDetailMemory] = useState<Memory | null>(null);
  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const [editMemory, setEditMemory] = useState<Memory | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [jarNotes, setJarNotes] = useState<MemoryJarNote[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [jarMessage, setJarMessage] = useState("");
  const [jarOpenOn, setJarOpenOn] = useState("");
  const [loadingJar, setLoadingJar] = useState(false);
  const [savingJar, setSavingJar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [createMode, setCreateMode] = useState<
    "choice" | "space" | "memory"
  >("choice");

  const [spaceName, setSpaceName] = useState("");
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [today, setToday] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [invitationType, setInvitationType] = useState<"email" | "link">("link");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(null);
  const [createdInvitations, setCreatedInvitations] = useState<CreatedInvitation[]>([]);


  // Show memories only from the selected space.
  const selectedSpace = spaces.find(
    (space) => space.id === selectedSpaceId
  );

  const visibleMemories = selectedSpaceId
    ? memories.filter((memory) => memory.space_id === selectedSpaceId)
    : [];

  const filteredMemories = visibleMemories.filter((memory) => {
    const query = searchTerm.trim().toLocaleLowerCase();

    return (
      !query ||
      memory.title.toLocaleLowerCase().includes(query) ||
      memory.content.toLocaleLowerCase().includes(query)
    );
  });

  async function refreshData() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Your session could not be verified. Please sign in again.");
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data: spaceData, error: spaceError } = await supabase
      .from("spaces")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (spaceError) {
      setNotice(`Could not load spaces: ${spaceError.message}`);
      setLoading(false);
      return;
    }

    const loadedSpaces = (spaceData ?? []) as Space[];
    setSpaces(loadedSpaces);

    if (
      !selectedSpaceId ||
      !loadedSpaces.some((space) => space.id === selectedSpaceId)
    ) {
      setSelectedSpaceId(loadedSpaces[0]?.id ?? "");
    }

    const { data: memoryData, error: memoryError } = await supabase
      .from("memories")
      .select("id, title, content, memory_date, space_id")
      .order("memory_date", { ascending: false });

    if (memoryError) {
      setNotice(`Could not load memories: ${memoryError.message}`);
    } else {
      setMemories((memoryData ?? []) as Memory[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void refreshData();

    setToday(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    );

    setMemoryDate(
      new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      })
    );
  }, []);

  useEffect(() => {
    if (!detailMemory) {
      setPhotos([]);
      setPhotoFile(null);
      setPhotoCaption("");
      return;
    }

    void loadPhotos(detailMemory);
  }, [detailMemory?.id]);

  async function loadJarNotes() {
    if (!selectedSpaceId) {
      setJarNotes([]);
      return;
    }

    setLoadingJar(true);
    const { data, error } = await supabase
      .from("memory_jar")
      .select("id, space_id, created_by, message, open_on, opened_at, created_at")
      .eq("space_id", selectedSpaceId)
      .order("created_at", { ascending: false });

    if (error) {
      setNotice(`Could not load Memory Jar: ${error.message}`);
      setJarNotes([]);
    } else {
      setJarNotes((data ?? []) as MemoryJarNote[]);
    }
    setLoadingJar(false);
  }

  useEffect(() => {
    if (active === "Memory Jar") {
      void loadJarNotes();
    }
  }, [active, selectedSpaceId]);

  async function handleCreateJarNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSpaceId || !jarMessage.trim() || savingJar) return;

    setSavingJar(true);
    setNotice("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setNotice("Please sign in again before adding a Memory Jar note.");
      setSavingJar(false);
      return;
    }

    const { error } = await supabase.from("memory_jar").insert({
      space_id: selectedSpaceId,
      created_by: user.id,
      message: jarMessage.trim(),
      open_on: jarOpenOn || null,
    });

    if (error) {
      setNotice(`Could not save your Memory Jar note: ${error.message}`);
    } else {
      setJarMessage("");
      setJarOpenOn("");
      setNotice("Your little note has been tucked into the Memory Jar. ♡");
      await loadJarNotes();
    }
    setSavingJar(false);
  }

  async function handleDeleteJarNote(note: MemoryJarNote) {
    if (!window.confirm("Delete this Memory Jar note permanently?")) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.id !== note.created_by) {
      setNotice("You can only delete your own Memory Jar notes.");
      return;
    }

    const { error } = await supabase
      .from("memory_jar")
      .delete()
      .eq("id", note.id)
      .eq("created_by", user.id);

    if (error) {
      setNotice(`Could not delete the note: ${error.message}`);
    } else {
      setJarNotes((current) => current.filter((item) => item.id !== note.id));
      setNotice("Memory Jar note deleted.");
    }
  }

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId || creatingInvitation) {
      setNotice("Choose a space before creating an invitation.");
      return;
    }

    const email = invitedEmail.trim().toLowerCase();

    if (invitationType === "email" && !email) {
      setNotice("Enter the email address you want to invite.");
      return;
    }

    setCreatingInvitation(true);
    setNotice("");

    try {
      let created: {
        invitation_id?: string;
        invitation_token?: string;
        expires_at?: string;
      } | null = null;

      if (invitationType === "email") {
        // The Edge Function authenticates the current user, creates the
        // email-restricted invitation through the protected RPC, and sends it.
        const { data, error } = await supabase.functions.invoke(
          "send-space-invitation",
          {
            body: {
              space_id: selectedSpaceId,
              email,
              space_name: selectedSpace?.name ?? "Memory Space",
            },
          }
        );

        if (error) {
          let details = error.message;
          try {
            const response = error.context;
            if (response instanceof Response) {
              const body = await response.clone().json();
              if (typeof body?.error === "string") details = body.error;
            }
          } catch {
            // Keep the SDK's message if the response isn't JSON.
          }
          throw new Error(details);
        }

        if (data?.error) {
          throw new Error(String(data.error));
        }

        created = data;
      } else {
        // Keep the existing private-link flow unchanged.
        const { data, error } = await supabase.rpc("create_space_invitation", {
          p_space_id: selectedSpaceId,
          p_invitation_type: "link",
          p_invited_email: null,
          p_expires_in_hours: 168,
        });

        if (error) throw new Error(error.message);
        created = Array.isArray(data) ? data[0] : data;
      }

      if (
        !created?.invitation_id ||
        !created?.invitation_token ||
        !created?.expires_at
      ) {
        throw new Error(
          "The invitation response was incomplete. Check Supabase before retrying to avoid creating a duplicate invitation."
        );
      }

      const invitation: CreatedInvitation = {
        invitation_id: created.invitation_id,
        invitation_token: created.invitation_token,
        expires_at: created.expires_at,
        invitation_type: invitationType,
        invited_email: invitationType === "email" ? email : null,
        status: "pending",
      };

      setCreatedInvitations((current) => [invitation, ...current]);
      setInvitedEmail("");
      setNotice(
        invitationType === "email"
          ? `Invitation email sent to ${email}. Check the recipient's inbox (and spam folder).`
          : "Private invitation link created. Copy it and share it only with the people you trust."
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not ${invitationType === "email" ? "send invitation email" : "create invitation"}: ${error.message}`
          : "Could not complete the invitation."
      );
    } finally {
      setCreatingInvitation(false);
    }
  }

  async function copyInvitationLink(invitation: CreatedInvitation) {
    const link = `${window.location.origin}/invite?token=${encodeURIComponent(
      invitation.invitation_token
    )}`;

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Invitation link copied. Share it privately with the invited person.");
    } catch {
      setNotice(`Copy failed. You can copy this link manually: ${link}`);
    }
  }

  async function handleRevokeInvitation(invitation: CreatedInvitation) {
    if (invitation.status !== "pending" || revokingInvitationId) return;

    const shouldRevoke = window.confirm(
      "Revoke this invitation? Anyone holding this link will no longer be able to use it."
    );

    if (!shouldRevoke) return;

    setRevokingInvitationId(invitation.invitation_id);
    setNotice("");

    try {
      const { data, error } = await supabase.rpc("revoke_space_invitation", {
        p_invitation_id: invitation.invitation_id,
      });

      if (error) throw new Error(error.message);

      if (!data) {
        throw new Error("This invitation may already be expired, accepted, or revoked.");
      }

      setCreatedInvitations((current) =>
        current.map((item) =>
          item.invitation_id === invitation.invitation_id
            ? { ...item, status: "revoked" }
            : item
        )
      );
      setNotice("Invitation revoked successfully.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Could not revoke invitation: ${error.message}`
          : "Could not revoke the invitation."
      );
    } finally {
      setRevokingInvitationId(null);
    }
  }

  async function handleCreateSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = spaceName.trim();
    if (!name) return;

    setSaving(true);
    setNotice("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Please sign in again before creating a space.");
      setSaving(false);
      return;
    }

    const { data: newSpace, error: createError } = await supabase
      .from("spaces")
      .insert({ name, created_by: user.id })
      .select("id, name, created_at")
      .single();

    if (createError || !newSpace) {
      setNotice(
        `Could not create space: ${createError?.message ?? "Unknown error"}`
      );
      setSaving(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("space_members")
      .insert({
        space_id: newSpace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      setNotice(
        `The space was created, but owner setup failed: ${memberError.message}`
      );
      setSaving(false);
      await refreshData();
      return;
    }

    setSpaceName("");
    setSelectedSpaceId(newSpace.id);
    setCreateMode("choice");
    setShowCreate(false);
    setNotice(`Your private space "${name}" has been created!`);

    setSaving(false);
    await refreshData();
  }

  async function handleCreateMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpaceId) {
      setNotice("Create a private space first, then save a memory inside it.");
      return;
    }

    const title = memoryTitle.trim();
    if (!title) return;

    setSaving(true);
    setNotice("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Please sign in again before saving a memory.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from("memories").insert({
      space_id: selectedSpaceId,
      created_by: user.id,
      title,
      content: memoryContent.trim(),
      memory_date: memoryDate,
    });

    if (saveError) {
      setNotice(`Could not save memory: ${saveError.message}`);
      setSaving(false);
      return;
    }

    setMemoryTitle("");
    setMemoryContent("");
    setCreateMode("choice");
    setShowCreate(false);
    setNotice("Your memory has been saved. Keep this little moment forever. ♡");

    setSaving(false);
    await refreshData();
  }

  async function handleUpdateMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editMemory) return;

    const title = editTitle.trim();

    if (!title || !editDate) {
      setNotice("Please enter a title and date for this memory.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { data, error } = await supabase
      .from("memories")
      .update({
        title,
        content: editContent.trim(),
        memory_date: editDate,
      })
      .eq("id", editMemory.id)
      .select("id, title, content, memory_date, space_id")
      .single();

    if (error || !data) {
      setNotice(
        `Could not update memory: ${
          error?.message ??
          "Memory not found or you don't have permission to edit it."
        }`
      );
      setSaving(false);
      return;
    }

    const updatedMemory = data as Memory;

    setMemories((current) =>
      current.map((memory) =>
        memory.id === updatedMemory.id ? updatedMemory : memory
      )
    );

    setEditMemory(null);
    setDetailMemory(updatedMemory);
    setNotice("Your memory has been updated. ♡");
    setSaving(false);
  }

  async function handleDeleteMemory() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setNotice("");

    try {
      // Find all photo files attached to this memory.
      const { data: photoRecords, error: photosError } = await supabase
        .from("memory_media")
        .select("object_path")
        .eq("memory_id", deleteTarget.id);

      if (photosError) {
        throw new Error(
          `Could not check memory photos: ${photosError.message}`
        );
      }

      // Remove the storage files before deleting the memory.
      const objectPaths = (photoRecords ?? []).map(
        (photo) => photo.object_path
      );

      if (objectPaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("memory-media")
          .remove(objectPaths);

        if (storageError) {
          throw new Error(
            `Could not remove memory photos: ${storageError.message}`
          );
        }
      }

      // Delete the memory only after storage removal succeeds.
      const { error: memoryError } = await supabase
        .from("memories")
        .delete()
        .eq("id", deleteTarget.id);

      if (memoryError) {
        throw new Error(
          `Photos were removed, but the memory could not be deleted: ${memoryError.message}`
        );
      }

      setMemories((current) =>
        current.filter((memory) => memory.id !== deleteTarget.id)
      );

      if (detailMemory?.id === deleteTarget.id) {
        setDetailMemory(null);
      }

      if (editMemory?.id === deleteTarget.id) {
        setEditMemory(null);
      }

      setDeleteTarget(null);
      setNotice("Memory and its photos deleted successfully.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not delete the memory."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function loadPhotos(memory: Memory) {
    setLoadingPhotos(true);
    setPhotos([]);

    const { data, error } = await supabase
      .from("memory_media")
      .select(
        "id, memory_id, space_id, uploaded_by, object_path, original_filename, mime_type, size_bytes, caption, created_at"
      )
      .eq("memory_id", memory.id)
      .order("created_at", { ascending: false });

    if (error) {
      setNotice(`Could not load photos: ${error.message}`);
      setLoadingPhotos(false);
      return;
    }

    const rows = data ?? [];

    const results = await Promise.all(
      rows.map(async (photo) => {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("memory-media")
            .createSignedUrl(photo.object_path, 600);

        if (signedError || !signedData) {
          return null;
        }

        return {
          ...photo,
          signedUrl: signedData.signedUrl,
        } as MemoryPhoto;
      })
    );

    setPhotos(
      results.filter((photo): photo is MemoryPhoto => photo !== null)
    );
    setLoadingPhotos(false);
  }

  async function handleUploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detailMemory || !photoFile || uploadingPhoto) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 10 * 1024 * 1024;

    if (!allowedTypes.includes(photoFile.type)) {
      setNotice("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (photoFile.size <= 0 || photoFile.size > maxBytes) {
      setNotice("Your photo must be smaller than or equal to 10 MB.");
      return;
    }

    setUploadingPhoto(true);
    setNotice("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const spaceStillExists = spaces.some(
        (space) => space.id === detailMemory.space_id
      );

      if (!spaceStillExists) {
        throw new Error("This memory's space could not be verified.");
      }

      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const objectPath = [
        detailMemory.space_id,
        detailMemory.id,
        user.id,
        `${crypto.randomUUID()}.${extensionByType[photoFile.type]}`,
      ].join("/");

      const { error: uploadError } = await supabase.storage
        .from("memory-media")
        .upload(objectPath, photoFile, {
          contentType: photoFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }

      const { error: metadataError } = await supabase
        .from("memory_media")
        .insert({
          memory_id: detailMemory.id,
          space_id: detailMemory.space_id,
          uploaded_by: user.id,
          object_path: objectPath,
          original_filename: photoFile.name.slice(0, 255),
          mime_type: photoFile.type,
          size_bytes: photoFile.size,
          caption: photoCaption.trim().slice(0, 500),
        });

      if (metadataError) {
        const { error: cleanupError } = await supabase.storage
          .from("memory-media")
          .remove([objectPath]);

        if (cleanupError) {
          throw new Error(
            `Photo details could not be saved. The uploaded file may need cleanup: ${metadataError.message}`
          );
        }

        throw new Error(
          `Photo details could not be saved: ${metadataError.message}`
        );
      }

      setPhotoFile(null);
      setPhotoCaption("");
      setNotice("Photo added to your memory! ♡");

      await loadPhotos(detailMemory);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading the photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDeletePhoto(photo: MemoryPhoto) {
    if (deletingPhotoId) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice("Please sign in again to delete this photo.");
      return;
    }

    if (user.id !== photo.uploaded_by) {
      setNotice("Only the person who uploaded this photo can delete it.");
      return;
    }

    if (!window.confirm("Delete this photo permanently?")) {
      return;
    }

    setDeletingPhotoId(photo.id);
    setNotice("");

    try {
      // Remove the private storage object first.
      const { error: storageError } = await supabase.storage
        .from("memory-media")
        .remove([photo.object_path]);

      if (storageError) {
        throw new Error(`Could not delete photo: ${storageError.message}`);
      }

      // Then remove its database metadata.
      const { error: metadataError } = await supabase
        .from("memory_media")
        .delete()
        .eq("id", photo.id)
        .eq("uploaded_by", user.id);

      if (metadataError) {
        throw new Error(
          `The photo file was deleted, but its record could not be removed: ${metadataError.message}`
        );
      }

      setPhotos((current) =>
        current.filter((item) => item.id !== photo.id)
      );

      setNotice("Photo deleted successfully.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not delete this photo."
      );
    } finally {
      setDeletingPhotoId(null);
    }
  }

  const navItems = [
    { label: "Home", icon: "⌂" },
    { label: "My spaces", icon: "▧" },
    { label: "Memories", icon: "♡" },
    { label: "Memory Jar", icon: "🫙" },
    { label: "Calendar", icon: "▦" },
    { label: "Future plans", icon: "✧" },
  ];

  function chooseNav(label: string) {
    setActive(label);
    setNotice("");
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#39352f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[245px] shrink-0 border-r border-[#ebe5df] bg-[#fffdfa] px-6 py-8 lg:flex lg:flex-col">
          <a href="#" className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eadde8] text-2xl text-[#86657f]">
              ♡
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">
                memory space
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#9b9086]">
                Your world, together
              </div>
            </div>
          </a>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a39a91]">
            YOUR CORNER
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => chooseNav(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  active === item.label
                    ? "bg-[#eee5ed] font-medium text-[#775b75]"
                    : "text-[#817970] hover:bg-[#f5f0eb]"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mb-3 mt-10 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a39a91]">
              YOUR SPACES
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xl text-[#8c7288] hover:text-[#60485e]"
              aria-label="Create a space"
            >
              +
            </button>
          </div>

          <div className="space-y-2">
            {spaces.map((space, index) => (
              <button
                key={space.id}
                onClick={() => {
                  setSelectedSpaceId(space.id);
                  setActive("My spaces");
                  setNotice(`You selected ${space.name}.`);
                }}
                aria-current={
                  selectedSpaceId === space.id ? "page" : undefined
                }
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                  selectedSpaceId === space.id
                    ? "bg-[#eee5ed] text-[#775b75]"
                    : "hover:bg-[#f5f0eb]"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                    index % 3 === 0
                      ? "bg-[#f4e2df] text-[#a86f72]"
                      : index % 3 === 1
                        ? "bg-[#eae4f3] text-[#8171a3]"
                        : "bg-[#e4ebe0] text-[#6f8969]"
                  }`}
                >
                  {index % 3 === 0 ? "♡" : index % 3 === 1 ? "✳" : "⌁"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{space.name}</p>
                  <p className="mt-1 text-[10px] text-[#a39a91]">
                    Private space
                  </p>
                </div>
              </button>
            ))}

            {spaces.length === 0 && (
              <p className="px-2 py-3 text-xs leading-5 text-[#a39a91]">
                Your first little space is waiting to be created. ♡
              </p>
            )}
          </div>

          <div className="mt-auto rounded-2xl border border-[#eee4e8] bg-[#f8f0f3] p-4">
            <div className="mb-2 text-xl">☁</div>
            <p className="text-sm font-medium">Your memories, safe</p>
            <p className="mt-1 text-xs leading-5 text-[#897b84]">
              Your private corner of the world is being built.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e9dce4]">
              <div className="h-full w-[12%] rounded-full bg-[#bd9db5]" />
            </div>
            <p className="mt-2 text-[10px] text-[#968692]">
              Storage details coming soon
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#eee8e2] bg-[#faf8f5]/95 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eadde8] text-xl text-[#86657f]">
                ♡
              </div>
              <span className="font-semibold tracking-tight">
                memory space
              </span>
            </div>

            <div className="hidden text-sm text-[#92877d] lg:block">
              {today || "\u00A0"}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setNotice(
                    "Notifications will be available when reminders are connected."
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#eae2da] bg-white text-lg hover:bg-[#f5efea]"
                aria-label="Notifications"
              >
                ♧
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#bd8b9e]" />
              </button>

              <button
                onClick={() =>
                  setNotice(
                    "Your profile and account settings will be added with sign-in."
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfe7dc] text-sm font-semibold text-[#5e765b]"
                aria-label="Profile"
              >
                Y
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            {notice && (
              <div
                role="status"
                className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-[#e7dbe6] bg-[#f4edf4] p-4 text-sm text-[#775b75]"
              >
                <span>{notice}</span>
                <button
                  onClick={() => setNotice("")}
                  className="text-lg leading-none"
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            )}

                       {active === "Memory Jar" ? (
              <section className="space-y-8">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
                    LITTLE NOTES FOR LATER
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Memory Jar <span className="text-[#bd91ad]">♡</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">
                    Save a thought, a hope, or a message for your future self or your space.
                    Choose a date if you want to keep it sealed until later.
                  </p>
                </div>

                {!selectedSpaceId ? (
                  <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white p-8">
                    Create or select a space first to start your Memory Jar.
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleCreateJarNote} className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
                      <h2 className="text-xl font-semibold text-[#514451]">Tuck in a little note</h2>
                      <label className="mt-5 block text-sm font-medium">
                        Your note
                        <textarea
                          required
                          maxLength={5000}
                          rows={5}
                          value={jarMessage}
                          onChange={(event) => setJarMessage(event.target.value)}
                          placeholder="A moment, a hope, a message to your future self…"
                          className="mt-2 w-full resize-y rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-4 py-3 text-sm leading-6 outline-none focus:border-[#a98ca7]"
                        />
                      </label>
                      <label className="mt-4 block text-sm font-medium">
                        Open on (optional)
                        <input
                          type="date"
                          min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}
                          value={jarOpenOn}
                          onChange={(event) => setJarOpenOn(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-4 py-3 text-sm outline-none focus:border-[#a98ca7] sm:max-w-xs"
                        />
                      </label>
                      <p className="mt-2 text-xs leading-5 text-[#93877e]">
                        Leave the date empty to make the note available immediately.
                      </p>
                      <button
                        type="submit"
                        disabled={savingJar || !jarMessage.trim()}
                        className="mt-5 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingJar ? "Saving your note…" : "Tuck into the jar ♡"}
                      </button>
                    </form>

                    <div>
                      <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">
  {selectedSpace?.name ?? "Your space"}
</p>
                          <h2 className="mt-1 text-xl font-semibold">Notes in your jar</h2>
                        </div>
                        <button type="button" onClick={() => void loadJarNotes()} className="text-sm text-[#856b83] hover:underline">
                          Refresh
                        </button>
                      </div>

                      {loadingJar ? (
                        <p className="text-sm text-[#93877e]">Checking your jar…</p>
                      ) : jarNotes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8">
                          <p className="text-lg font-medium">Your jar is waiting for its first note. ♡</p>
                          <p className="mt-2 text-sm text-[#93877e]">Add a note above and it will appear here.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {jarNotes.map((note, index) => {
                            const isSealed = Boolean(note.open_on && note.open_on > new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
                            return (
                              <article key={note.id} className={`rounded-2xl border p-5 ${index % 3 === 0 ? "border-[#f0deda] bg-[#fff8f6]" : index % 3 === 1 ? "border-[#e7dff0] bg-[#fbf8ff]" : "border-[#e0e8dc] bg-[#f8fbf6]"}`}>
                                <div className="text-2xl">{isSealed ? "🔒" : "💌"}</div>
                                <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[#9b8798]">
                                  {isSealed ? `Sealed until ${new Date(`${note.open_on}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : "Ready to read"}
                                </p>
                                {isSealed ? (
                                  <p className="mt-3 text-sm leading-6 text-[#817970]">This note is tucked away until its opening date. ♡</p>
                                ) : (
                                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#62575f]">{note.message}</p>
                                )}
                                <p className="mt-4 text-[10px] text-[#a1978d]">
                                  Added {new Date(note.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                                {note.created_by === currentUserId && (
                                  <button type="button" onClick={() => void handleDeleteJarNote(note)} className="mt-4 rounded-lg border border-[#e7dce5] px-3 py-2 text-xs text-[#a45f62] hover:bg-white">
                                    Delete note
                                  </button>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            ) : active === "Calendar" ? (
              <CalendarView
                spaceId={selectedSpaceId}
                spaceName={selectedSpace?.name ?? ""}
                memories={visibleMemories}
                onNotice={setNotice}
              />
            ) : active === "Future plans" ? (
              <FuturePlans
                spaceId={selectedSpaceId}
                spaceName={selectedSpace?.name ?? ""}
                onNotice={setNotice}
              />
            ) : (
              <>
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
                      A LITTLE SPACE FOR WHAT MATTERS
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      Your memories live here
                      <span className="text-[#bd91ad]">.</span>
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#8d8379] sm:text-base">
                      A place for your people, your little moments, and all the
                      things you never want to forget.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedSpaceId) {
                          setNotice("Choose or create a space before sharing it.");
                          return;
                        }
                        setShowShare(true);
                      }}
                      disabled={!selectedSpaceId}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d9c8d8] bg-white px-5 py-3 text-sm font-medium text-[#816780] shadow-sm transition hover:bg-[#f8f1f7] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ↗ Share space
                    </button>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#70556f]"
                    >
                      <span className="text-lg">+</span> Create a memory
                    </button>
                  </div>
                </div>

                <div className="relative mb-10 overflow-hidden rounded-[28px] bg-[#e8dfe9]">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e9dfe9] via-[#e9dfe9]/95 to-[#e9dfe9]/10 sm:to-transparent" />
                  <div className="relative flex min-h-[250px] items-center p-7 sm:min-h-[290px] sm:p-10 lg:p-12">
                    <div className="max-w-lg">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1.5 text-xs text-[#7d647d]">
                        <span>✧</span> A gentle reminder
                      </div>
                      <h2 className="max-w-md text-3xl font-medium leading-tight tracking-tight text-[#514451] sm:text-4xl">
                        Someday, these little things will be the big things.
                      </h2>
                      <p className="mt-4 text-sm leading-6 text-[#796b78]">
                        Save a moment today. Thank yourself tomorrow.
                      </p>
                      <button
                        onClick={() => setShowCreate(true)}
                        className="mt-6 rounded-xl border border-[#b9a6bb] bg-white/65 px-4 py-2.5 text-sm font-medium text-[#735d75] transition hover:bg-white"
                      >
                        Save a little moment ↗
                      </button>
                    </div>
                    <div className="absolute bottom-5 right-5 hidden rotate-6 text-7xl text-white/80 sm:block lg:right-16 lg:text-8xl">
                      ♡
                    </div>
                  </div>
                </div>

                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e3e1] text-xl text-[#a96f75]">
                      ♡
                    </div>
                    <p className="text-2xl font-semibold">
                      {spaces.length.toString().padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-sm text-[#93877e]">Little spaces</p>
                  </div>

                  <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eae4f3] text-xl text-[#8171a3]">
                      ▧
                    </div>
                    <p className="text-2xl font-semibold">
                      {visibleMemories.length.toString().padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-sm text-[#93877e]">
                      Featured moments
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e4ebe0] text-xl text-[#6f8969]">
                      ✧
                    </div>
                    <p className="text-2xl font-semibold">∞</p>
                    <p className="mt-1 text-sm text-[#93877e]">
                      Moments still to make
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a18a9e]">
                      YOUR LITTLE TIME CAPSULE
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      {selectedSpace
                        ? `Moments in ${selectedSpace.name}`
                        : "Choose a space to begin"}
                    </h2>
                  </div>
                  <button
                    onClick={() => chooseNav("Memories")}
                    className="shrink-0 text-sm text-[#856b83] hover:underline"
                  >
                    View all →
                  </button>
                </div>

                <div className="mb-5 max-w-md">
                  <label
                    htmlFor="memory-search"
                    className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#a18a9e]"
                  >
                    Find a little moment
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a18a9e]"
                    >
                      ⌕
                    </span>
                    <input
                      id="memory-search"
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search titles and stories in this space…"
                      className="w-full rounded-xl border border-[#eee6df] bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#b0a69e] focus:border-[#b9a6bb]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {loading ? (
                    <p className="text-sm text-[#93877e]">
                      Gathering your little moments…
                    </p>
                  ) : filteredMemories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 md:col-span-2 xl:col-span-3">
                      <p className="text-lg font-medium">
                        {visibleMemories.length > 0
                          ? "No memories match your search. ♡"
                          : selectedSpace
                            ? `Nothing saved in ${selectedSpace.name} yet. ♡`
                            : "Your story starts here. ♡"}
                      </p>
                      <p className="mt-2 text-sm text-[#93877e]">
                        {visibleMemories.length > 0
                          ? "Try another word, or clear your search to see every memory in this space."
                          : selectedSpace
                            ? "Create a memory while this space is selected, and it will appear here."
                            : "Create a private space first, then save your first written memory."}
                      </p>
                      {visibleMemories.length === 0 && (
                        <button
                          onClick={() => {
                            setCreateMode("memory");
                            setShowCreate(true);
                          }}
                          className="mt-4 rounded-xl bg-[#816780] px-4 py-2.5 text-sm text-white hover:bg-[#70556f]"
                        >
                          Write your first memory
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredMemories.map((memory, index) => {
                      const space = spaces.find(
                        (item) => item.id === memory.space_id
                      );

                      return (
                        <article
                          key={memory.id}
                          className="group overflow-hidden rounded-2xl border border-[#eee6df] bg-white transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#5c4b3d]/5"
                        >
                          <div
                            className={`relative flex h-52 items-center justify-center p-6 ${
                              index % 3 === 0
                                ? "bg-[#f4e3e1]"
                                : index % 3 === 1
                                  ? "bg-[#eae4f3]"
                                  : "bg-[#e4ebe0]"
                            }`}
                          >
                            <div className="w-full max-w-xs rotate-[-2deg] rounded-xl border border-white/80 bg-white/75 p-5 shadow-sm">
                              <p className="mb-3 text-2xl text-[#9c8198]">♡</p>
                              <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#62575f]">
                                {memory.content || memory.title}
                              </p>
                            </div>
                            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs text-[#806780]">
                              ♡ Keep this
                            </span>
                          </div>

                          <div className="p-5">
                            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#a18a9e]">
                              {space?.name ?? "Your space"}
                            </p>
                            <h3 className="mt-2 break-words text-base font-semibold">
                              {memory.title}
                            </h3>
                            <p className="mt-2 text-xs text-[#a1978d]">
                              {new Date(
                                `${memory.memory_date}T12:00:00`
                              ).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                timeZone: "Asia/Kolkata",
                              })}
                            </p>
                            <button
                              type="button"
                              onClick={() => setDetailMemory(memory)}
                              className="mt-4 rounded-xl border border-[#e7dce5] px-3 py-2 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7]"
                            >
                              Read memory →
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <div className="mt-10 rounded-2xl border border-[#e8e6dc] bg-[#f0f1e8] p-6 sm:p-8">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#7d8b73]">
                        FOR THE DAYS AHEAD
                      </p>
                      <h2 className="text-xl font-semibold">
                        There is still so much to do together.
                      </h2>
                      <p className="mt-2 text-sm text-[#818778]">
                        Keep your little plans somewhere special.
                      </p>
                    </div>
                    <button
                      onClick={() => chooseNav("Future plans")}
                      className="shrink-0 self-start rounded-xl border border-[#c8d0be] bg-white/70 px-4 py-3 text-sm font-medium text-[#687b61] hover:bg-white sm:self-auto"
                    >
                      Explore future plans →
                    </button>
                  </div>
                </div>

                <footer className="pb-4 pt-10 text-center text-xs text-[#aaa097]">
                  Made for the moments that matter ♡
                </footer>
              </>
            )}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#ebe5df] bg-[#fffdfa]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg lg:hidden">
        {[
          { label: "Home", icon: "⌂" },
          { label: "Spaces", icon: "▧" },
          { label: "Create", icon: "+" },
          { label: "Jar", icon: "🫙" },
          { label: "Calendar", icon: "▦" },
          { label: "More", icon: "•••" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() =>
              item.label === "Create"
                ? setShowCreate(true)
                : chooseNav(item.label === "Spaces" ? "My spaces" : item.label === "Jar" ? "Memory Jar" : item.label)
            }
            className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
              active === item.label ||
              (item.label === "Spaces" && active === "My spaces")
                ? "text-[#816780]"
                : "text-[#a49a90]"
            }`}
          >
            <span
              className={`flex h-7 w-8 items-center justify-center rounded-xl text-xl ${
                item.label === "Create" ? "bg-[#816780] text-white" : ""
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {showShare && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#29232b]/45 p-4 backdrop-blur-sm"
          onClick={() => setShowShare(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-space-title"
            className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">
                  YOUR PEOPLE, YOUR SPACE
                </p>
                <h2 id="share-space-title" className="mt-2 text-2xl font-semibold text-[#514451]">
                  Share {selectedSpace?.name ?? "your space"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#91867d]">
                  Invite someone as a member. Only space owners and admins can create or revoke invitations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShare(false)}
                aria-label="Close share space"
                className="rounded-full px-3 py-1 text-2xl text-[#a49a90] hover:bg-[#f5eef4]"
              >
                ×
              </button>
            </div>

            <p className="rounded-xl bg-[#f8f1f7] p-4 text-sm leading-6 text-[#775b75]">
              Create a private link and share it yourself through WhatsApp, Instagram, or another app. Anyone with the link can sign in and accept it before it expires, so share it only with people you trust.
            </p>

            <form onSubmit={handleCreateInvitation} className="mt-5 space-y-4">
              <p className="text-xs leading-5 text-[#93877e]">
                Invitations expire in 7 days. Email delivery is not used; you control where the private link is shared.
              </p>
              <button
                type="submit"
                disabled={creatingInvitation || !selectedSpaceId}
                className="w-full rounded-xl bg-[#816780] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingInvitation ? "Creating link…" : "Create private link"}
              </button>
            </form>

            {createdInvitations.length > 0 && (
              <div className="mt-7">
                <h3 className="text-sm font-semibold text-[#514451]">Invitations created in this session</h3>
                <p className="mt-1 text-xs leading-5 text-[#93877e]">
                  For security, this list is only kept in this browser session. If you close or refresh the page, these invitation tokens will no longer be shown here.
                </p>
                <div className="mt-3 space-y-3">
                  {createdInvitations.map((invitation) => (
                    <div
                      key={invitation.invitation_id}
                      className="rounded-xl border border-[#eee6df] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-[#62575f]">
                            {invitation.invitation_type === "email"
                              ? invitation.invited_email
                              : "Private invitation link"}
                          </p>
                          <p className="mt-1 text-xs text-[#93877e]">
                            Expires {new Date(invitation.expires_at).toLocaleString("en-IN")}
                          </p>
                          <p className={`mt-1 text-xs ${invitation.status === "pending" ? "text-[#6f8969]" : "text-[#a45f62]"}`}>
                            {invitation.status === "pending" ? "Pending" : "Revoked"}
                          </p>
                        </div>
                        {invitation.status === "pending" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void copyInvitationLink(invitation)}
                              className="rounded-lg border border-[#d9c8d8] px-3 py-2 text-xs font-medium text-[#816780] hover:bg-[#f8f1f7]"
                            >
                              Copy link
                            </button>
                            <button
                              type="button"
                              disabled={revokingInvitationId !== null}
                              onClick={() => void handleRevokeInvitation(invitation)}
                              className="rounded-lg border border-[#ecd4d2] px-3 py-2 text-xs font-medium text-[#a45f62] hover:bg-[#fff3f1] disabled:opacity-50"
                            >
                              {revokingInvitationId === invitation.invitation_id ? "Revoking…" : "Revoke"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="mt-6 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm text-[#817970] hover:bg-[#faf6fa]"
            >
              Done
            </button>
          </section>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#29232b]/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowCreate(false);
            setCreateMode("choice");
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            className="w-full max-w-md rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee4ed] text-2xl text-[#816780]">
                ♡
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreateMode("choice");
                }}
                className="text-2xl text-[#a49a90]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {createMode === "choice" ? (
              <>
                <h2 id="create-title" className="text-2xl font-semibold">
                  Save a little moment
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#91867d]">
                  Every beautiful memory begins somewhere. What would you like
                  to create?
                </p>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => setCreateMode("memory")}
                    className="flex w-full items-center gap-4 rounded-2xl border border-[#eee6df] p-4 text-left transition hover:border-[#cbb7ca] hover:bg-[#f8f1f7]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eee4ed] text-xl text-[#816780]">
                      ♡
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        A memory
                      </span>
                      <span className="mt-1 block text-xs text-[#93877e]">
                        Save a story or a little moment.
                      </span>
                    </span>
                    <span className="ml-auto text-[#b0a1ae]">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateMode("space")}
                    className="flex w-full items-center gap-4 rounded-2xl border border-[#eee6df] p-4 text-left transition hover:border-[#cbb7ca] hover:bg-[#f8f1f7]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eee4ed] text-xl text-[#816780]">
                      ▧
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        A private space
                      </span>
                      <span className="mt-1 block text-xs text-[#93877e]">
                        Create a corner for your people.
                      </span>
                    </span>
                    <span className="ml-auto text-[#b0a1ae]">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
  setShowCreate(false);
  setCreateMode("choice");
  setActive("Future plans");
  setNotice("");
}}
                    className="flex w-full items-center gap-4 rounded-2xl border border-[#eee6df] p-4 text-left transition hover:border-[#cbb7ca] hover:bg-[#f8f1f7]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4ebe0] text-xl text-[#6f8969]">
                      ✧
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        A future plan
                      </span>
                      <span className="mt-1 block text-xs text-[#93877e]">
                        Dream up something to do together.
                      </span>
                    </span>
                    <span className="ml-auto text-[#b0a1ae]">→</span>
                  </button>
                </div>
              </>
            ) : createMode === "space" ? (
              <>
                <h2 id="create-title" className="text-2xl font-semibold">
                  Create your space
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#91867d]">
                  Give this little corner a name.
                </p>
                <form onSubmit={handleCreateSpace} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium">
                    Space name
                    <input
                      required
                      maxLength={100}
                      value={spaceName}
                      onChange={(event) => setSpaceName(event.target.value)}
                      placeholder="e.g. Best Friends"
                      className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving || !spaceName.trim()}
                    className="w-full rounded-xl bg-[#816780] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Creating your space…" : "Create private space"}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setCreateMode("choice")}
                  className="mt-4 text-sm text-[#856b83] hover:underline"
                >
                  ← Back
                </button>
              </>
            ) : (
              <>
                <h2 id="create-title" className="text-2xl font-semibold">
                  Keep a memory
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#91867d]">
                  Write it down now, so you can come back to it someday.
                </p>

                {spaces.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-[#f8f1f7] p-5">
                    <p className="text-sm leading-6 text-[#775b75]">
                      You need a private space before saving your first memory.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCreateMode("space")}
                      className="mt-4 rounded-xl bg-[#816780] px-4 py-3 text-sm text-white hover:bg-[#70556f]"
                    >
                      Create a space first
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCreateMemory}
                    className="mt-6 space-y-4"
                  >
                    <label className="block text-sm font-medium">
                      Save in
                      <select
                        required
                        value={selectedSpaceId}
                        onChange={(event) =>
                          setSelectedSpaceId(event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                      >
                        <option value="" disabled>
                          Choose a space
                        </option>
                        {spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-medium">
                      Memory title
                      <input
                        required
                        maxLength={150}
                        value={memoryTitle}
                        onChange={(event) =>
                          setMemoryTitle(event.target.value)
                        }
                        placeholder="A day worth remembering"
                        className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Your story
                      <textarea
                        rows={4}
                        value={memoryContent}
                        onChange={(event) =>
                          setMemoryContent(event.target.value)
                        }
                        placeholder="What do you want to remember about this moment?"
                        className="mt-2 w-full resize-y rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#a98ca7]"
                      />
                    </label>

                    <label className="block text-sm font-medium">
                      Memory date
                      <input
                        required
                        type="date"
                        value={memoryDate}
                        onChange={(event) => setMemoryDate(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={
                        saving || !selectedSpaceId || !memoryTitle.trim()
                      }
                      className="w-full rounded-xl bg-[#816780] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving your memory…" : "Save this memory ♡"}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => setCreateMode("choice")}
                  className="mt-4 text-sm text-[#856b83] hover:underline"
                >
                  ← Back
                </button>
              </>
            )}

            <p className="mt-5 text-center text-[11px] text-[#aaa097]">
              Your space, your people, your memories.
            </p>
          </div>
        </div>
      )}

      {detailMemory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#29232b]/45 p-4 backdrop-blur-sm"
          onClick={() => setDetailMemory(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-detail-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-9"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">
                  {spaces.find(
                    (space) => space.id === detailMemory.space_id
                  )?.name ?? "Your space"}
                </p>
                <h2
                  id="memory-detail-title"
                  className="mt-3 break-words text-2xl font-semibold tracking-tight text-[#514451] sm:text-3xl"
                >
                  {detailMemory.title}
                </h2>
                <p className="mt-2 text-sm text-[#a1978d]">
                  {new Date(
                    `${detailMemory.memory_date}T12:00:00`
                  ).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailMemory(null)}
                aria-label="Close memory"
                className="rounded-full px-3 py-1 text-2xl text-[#a49a90] hover:bg-[#f5eef4]"
              >
                ×
              </button>
            </div>

            <div className="rounded-2xl bg-[#f8f1f7] p-5 sm:p-7">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#62575f]">
                {detailMemory.content ||
                  "A little moment saved, even if the story is still waiting to be written. ♡"}
              </p>
            </div>

            <section className="mt-7">
              <h3 className="text-lg font-semibold text-[#514451]">
                Photos from this moment ♡
              </h3>

              <p className="mt-1 text-sm text-[#91867d]">
                Keep your favourite pictures alongside this memory.
              </p>

              <form
                onSubmit={handleUploadPhoto}
                className="mt-4 space-y-3 rounded-2xl border border-[#eee4e9] bg-white p-4"
              >
                <label className="block text-sm font-medium">
                  Choose a photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setPhotoFile(event.target.files?.[0] ?? null)
                    }
                    className="mt-2 block w-full text-sm text-[#817970] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eee4ed] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#816780]"
                  />
                </label>

                <p className="text-xs text-[#a1978d]">
                  JPG, PNG, or WebP · Maximum 10 MB per photo.
                </p>

                {photoFile && (
                  <p className="break-all text-xs text-[#817970]">
                    Selected: {photoFile.name}
                  </p>
                )}

                <label className="block text-sm font-medium">
                  Caption (optional)
                  <input
                    type="text"
                    maxLength={500}
                    value={photoCaption}
                    onChange={(event) => setPhotoCaption(event.target.value)}
                    placeholder="A little detail about this photo..."
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] px-3 py-2.5 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!photoFile || uploadingPhoto}
                  className="rounded-xl bg-[#816780] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPhoto ? "Uploading photo..." : "Upload photo ♡"}
                </button>
              </form>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {loadingPhotos ? (
                  <p className="text-sm text-[#91867d]">
                    Loading your photos...
                  </p>
                ) : photos.length === 0 ? (
                  <p className="text-sm text-[#91867d]">
                    No photos here yet. Add your first picture above.
                  </p>
                ) : (
                  photos.map((photo) => (
                    <figure
                      key={photo.id}
                      className="overflow-hidden rounded-2xl border border-[#eee6df] bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.signedUrl}
                        alt={photo.caption || photo.original_filename}
                        className="h-56 w-full object-cover"
                      />

                      <figcaption className="p-3">
                        <p className="break-words text-sm text-[#62575f]">
                          {photo.caption || photo.original_filename}
                        </p>
                        <p className="mt-1 text-xs text-[#a1978d]">
                          {(photo.size_bytes / (1024 * 1024)).toFixed(2)} MB
                        </p>

                        <button
                          type="button"
                          disabled={
                            deletingPhotoId !== null ||
                            photo.uploaded_by === ""
                          }
                          onClick={() => void handleDeletePhoto(photo)}
                          className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingPhotoId === photo.id
                            ? "Deleting..."
                            : deletingPhotoId
                              ? "Please wait..."
                              : "Delete photo"}
                        </button>
                      </figcaption>
                    </figure>
                  ))
                )}
              </div>
            </section>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(detailMemory.title);
                    setEditContent(detailMemory.content);
                    setEditDate(detailMemory.memory_date);
                    setEditMemory(detailMemory);
                    setDetailMemory(null);
                  }}
                  className="rounded-xl border border-[#d9c8d8] px-4 py-3 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7]"
                >
                  ✎ Edit memory
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(detailMemory)}
                  className="rounded-xl border border-[#ecd4d2] px-4 py-3 text-sm font-medium text-[#a45f62] transition hover:bg-[#fff3f1]"
                >
                  Delete
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDetailMemory(null)}
                className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f]"
              >
                Close memory
              </button>
            </div>
          </section>
        </div>
      )}

      {editMemory && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#29232b]/45 p-4 backdrop-blur-sm"
          onClick={() => !saving && setEditMemory(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-memory-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">
                  A little update
                </p>
                <h2
                  id="edit-memory-title"
                  className="mt-2 text-2xl font-semibold text-[#514451]"
                >
                  Edit your memory
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#91867d]">
                  Change the details and save your updated moment.
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditMemory(null)}
                aria-label="Close edit memory"
                className="rounded-full px-3 py-1 text-2xl text-[#a49a90] hover:bg-[#f5eef4] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateMemory} className="space-y-4">
              <label className="block text-sm font-medium">
                Memory title
                <input
                  required
                  maxLength={150}
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                />
              </label>

              <label className="block text-sm font-medium">
                Your story
                <textarea
                  rows={6}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  placeholder="What do you want to remember?"
                  className="mt-2 w-full resize-y rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#a98ca7]"
                />
              </label>

              <label className="block text-sm font-medium">
                Memory date
                <input
                  required
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditMemory(null)}
                  className="rounded-xl border border-[#e7dce5] px-4 py-3 text-sm text-[#817970] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !editTitle.trim() || !editDate}
                  className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving changes…" : "Save changes ♡"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#29232b]/45 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-memory-title"
            className="w-full max-w-md rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0ee] text-xl text-[#a45f62]">
              ♡
            </div>
            <h2
              id="delete-memory-title"
              className="mt-5 text-2xl font-semibold text-[#514451]"
            >
              Delete this memory?
            </h2>
            <p className="mt-3 break-words text-sm leading-6 text-[#817970]">
              <span className="font-medium text-[#62575f]">
                “{deleteTarget.title}”
              </span>{" "}
              will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#e7dce5] px-4 py-3 text-sm text-[#817970] disabled:opacity-50"
              >
                Keep memory
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteMemory}
                className="rounded-xl bg-[#a45f62] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#8e4e52] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
