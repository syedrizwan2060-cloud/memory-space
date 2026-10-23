
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import CalendarView from "./calendar-view";
import TimelineView from "./timeline-view";
import MemoryDiscovery from "./memory-discovery";
import FuturePlans from "./future-plans";
import AlbumsView from "./albums-view";
import DailyPrompts from "./daily-prompts";
import TimeCapsules from "./time-capsules";
import GratitudeJar from "./gratitude-jar";
import GroupPolls from "./group-polls";
import VoiceMemories from "./voice-memories";
import LinkedVoicePlayer from "./linked-voice-player";
import MemoryInteractions from "./memory-interactions";
import YearbookExport from "./yearbook-export";
import ScrapbookDesigner from "./scrapbook-designer";
import StorageDashboard from "./storage/storage-dashboard";
import NotificationsView from "./notifications-view";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ArrowRight,
  House,
  Layers3,
  Heart,
  Archive,
  Images,
  CalendarDays,
  Sparkles,
  PencilLine,
  Mail,
  Mic,
  BookOpen,
  MapPin,
  PartyPopper,
  Plus,
  Ellipsis,
  Search,
  X,
  LogOut,
  UserRound,
  ShieldCheck,
  Users,
  Palette,
  Sun,
  Moon,
  RotateCcw,
  Check,
  Cloud,
  Leaf,
  Flower2,
  Bell,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";
const MemoryMap = dynamic(() => import("./memory-map"), { ssr: false, loading: () => <p className="p-6 text-sm text-[#8d8379]">Loading memory map…</p> });

type SpaceThemeKey =
  | "default"
  | "sakura"
  | "cloud-heaven"
  | "lavender"
  | "secret-garden"
  | "moonlight"
  | "golden-sunset"
  | "cozy-memories"
  | "midnight-velvet";

type ThemePermission = "owner" | "members";
type AppAppearance = "light" | "dark";

type SpaceThemeSetting = {
  space_id: string;
  theme_key: SpaceThemeKey;
  theme_permission: ThemePermission;
  updated_by: string;
  updated_at: string;
};

const SPACE_THEMES: {
  key: SpaceThemeKey;
  name: string;
  description: string;
  preview: string;
  icon: LucideIcon;
}[] = [
  { key: "default", name: "Memory Space Classic", description: "The original warm cream and purple look", preview: "linear-gradient(135deg,#faf8f5,#eadde8)", icon: Sparkles },
  { key: "sakura", name: "Flower Garden", description: "Blush petals, soft pinks and a gentle garden mood", preview: "linear-gradient(135deg,#fff0f5,#f5c9dd 55%,#fffafc)", icon: Flower2 },
  { key: "cloud-heaven", name: "Sky Blue", description: "Open blue skies and fluffy clouds", preview: "linear-gradient(135deg,#e6f5ff,#b9e0fa 55%,#fff)", icon: Cloud },
  { key: "lavender", name: "Lavender Dreams", description: "Gentle lilac with a dreamy glow", preview: "linear-gradient(135deg,#f4efff,#d9c8f3 55%,#fffaff)", icon: Sparkles },
  { key: "secret-garden", name: "Secret Garden", description: "Fresh botanical greens and leaves", preview: "linear-gradient(135deg,#eef7e9,#c9dfbf 55%,#fffdf4)", icon: Leaf },
  { key: "moonlight", name: "Moonlight", description: "A calm midnight-blue celestial mood", preview: "linear-gradient(135deg,#18213e,#354c78 60%,#a4b7dd)", icon: Moon },
  { key: "golden-sunset", name: "Sunset Glow", description: "Warm peach, amber and sunset light", preview: "linear-gradient(135deg,#fff0d7,#f4b78c 55%,#e9a3a9)", icon: Sun },
  { key: "cozy-memories", name: "Cream & Cozy", description: "Warm paper, cocoa and soft candlelight", preview: "linear-gradient(135deg,#f8eee0,#e7d0b3 55%,#fffaf1)", icon: Heart },
  { key: "midnight-velvet", name: "Midnight Velvet", description: "Elegant plum with a velvet-dark finish", preview: "linear-gradient(135deg,#21172d,#4b3156 55%,#87658e)", icon: Moon },
];

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
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
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
  const [showMore, setShowMore] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [helpSearch, setHelpSearch] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileAvatarPath, setProfileAvatarPath] = useState("");
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  type PersonResult = {
    user_id: string;
    username: string;
    display_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    relationship_status: "friends" | "request_sent" | "request_received" | "not_connected";
  };
  type PersonConnection = {
    user_id: string;
    username: string | null;
    display_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    request_id: string;
    request_status: "pending" | "accepted";
    direction: "incoming" | "outgoing" | "friend";
    relationship_label: string | null;
  };
  type FollowRequest = {
    request_id: string;
    user_id: string;
    username: string | null;
    display_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    direction: "incoming" | "outgoing";
    request_status: "pending";
  };
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [peopleSearchLoading, setPeopleSearchLoading] = useState(false);
  const [peopleConnections, setPeopleConnections] = useState<PersonConnection[]>([]);
  const [peopleConnectionsLoading, setPeopleConnectionsLoading] = useState(false);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);
  const [peopleActionId, setPeopleActionId] = useState<string | null>(null);
  const [relationshipLabels, setRelationshipLabels] = useState<Record<string, string>>({});

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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) {
      setUnreadNotificationCount(0);
      return;
    }

    let cancelled = false;

    async function loadUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUserId)
        .is("read_at", null);

      if (!cancelled && !error) {
        setUnreadNotificationCount(count ?? 0);
      }
    }

    void loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);
  const [spaceThemeSettings, setSpaceThemeSettings] = useState<Record<string, SpaceThemeSetting>>({});
  const [spaceRoles, setSpaceRoles] = useState<Record<string, string>>({});
  const [appearance, setAppearance] = useState<AppAppearance>("light");
  const [previewTheme, setPreviewTheme] = useState<SpaceThemeKey | null>(null);
  const [themeSaving, setThemeSaving] = useState(false);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [themePermissionDraft, setThemePermissionDraft] = useState<ThemePermission>("owner");
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
  const [memoryPlaceName, setMemoryPlaceName] = useState("");
const [memoryLatitude, setMemoryLatitude] = useState("");
const [memoryLongitude, setMemoryLongitude] = useState("");
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

  const currentThemeSetting = selectedSpaceId ? spaceThemeSettings[selectedSpaceId] : undefined;
  const currentSpaceTheme: SpaceThemeKey = currentThemeSetting?.theme_key ?? "default";
  const displayedSpaceTheme: SpaceThemeKey =
    active === "Account Settings" && previewTheme ? previewTheme : currentSpaceTheme;
  const selectedSpaceRole = selectedSpaceId ? spaceRoles[selectedSpaceId] ?? "" : "";
  const canEditSpaceTheme =
    selectedSpaceRole === "owner" || currentThemeSetting?.theme_permission === "members";

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

    // Load shared theme settings and the signed-in user's role without changing
    // the existing spaces/memories access flow.
    if (loadedSpaces.length > 0) {
      const spaceIds = loadedSpaces.map((space) => space.id);
      const [{ data: themeRows, error: themeError }, { data: roleRows }] = await Promise.all([
        supabase
          .from("space_theme_settings")
          .select("space_id, theme_key, theme_permission, updated_by, updated_at")
          .in("space_id", spaceIds),
        supabase
          .from("space_members")
          .select("space_id, role")
          .eq("user_id", user.id)
          .in("space_id", spaceIds),
      ]);

      if (!themeError && themeRows) {
        const nextThemes: Record<string, SpaceThemeSetting> = {};
        for (const row of themeRows) {
          nextThemes[row.space_id] = row as SpaceThemeSetting;
        }
        setSpaceThemeSettings(nextThemes);
      }

      if (roleRows) {
        const nextRoles: Record<string, string> = {};
        for (const row of roleRows) nextRoles[row.space_id] = row.role;
        setSpaceRoles(nextRoles);
      }
    } else {
      setSpaceThemeSettings({});
      setSpaceRoles({});
    }

    const { data: appearanceRow } = await supabase
      .from("memory_space_appearance_settings")
      .select("appearance")
      .eq("user_id", user.id)
      .maybeSingle();
    if (appearanceRow?.appearance === "dark" || appearanceRow?.appearance === "light") {
      setAppearance(appearanceRow.appearance);
    }

    if (
      !selectedSpaceId ||
      !loadedSpaces.some((space) => space.id === selectedSpaceId)
    ) {
      setSelectedSpaceId(loadedSpaces[0]?.id ?? "");
    }


const { data: memoryData, error: memoryError } = await supabase
  .from("memories")
  .select(
    "id, title, content, memory_date, space_id, place_name, latitude, longitude"
  )
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
    setPreviewTheme(null);
    setThemePermissionDraft(currentThemeSetting?.theme_permission ?? "owner");
  }, [selectedSpaceId, currentThemeSetting?.theme_permission, currentThemeSetting?.theme_key]);

  useEffect(() => {
    if (!selectedSpaceId || !currentUserId) return;

    const channel = supabase
      .channel(`space-theme-${selectedSpaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "space_theme_settings",
          filter: `space_id=eq.${selectedSpaceId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setSpaceThemeSettings((current) => {
              const next = { ...current };
              delete next[selectedSpaceId];
              return next;
            });
            return;
          }
          const row = payload.new as SpaceThemeSetting;
          if (row?.space_id) {
            setSpaceThemeSettings((current) => ({ ...current, [row.space_id]: row }));
            setThemePermissionDraft(row.theme_permission ?? "owner");
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedSpaceId, currentUserId]);

  useEffect(() => {
    if (!selectedSpaceId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("space_theme_settings")
        .select("space_id, theme_key, theme_permission, updated_by, updated_at")
        .eq("space_id", selectedSpaceId)
        .maybeSingle();
      if (cancelled || error) return;
      if (data) {
        setSpaceThemeSettings((current) => ({ ...current, [selectedSpaceId]: data as SpaceThemeSetting }));
        setThemePermissionDraft(data.theme_permission ?? "owner");
      } else {
        setSpaceThemeSettings((current) => {
          const next = { ...current };
          delete next[selectedSpaceId];
          return next;
        });
        setThemePermissionDraft("owner");
      }
    })();
    return () => { cancelled = true; };
  }, [selectedSpaceId]);

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

  useEffect(() => {
    if (active === "People & Relationships" && currentUserId) {
      void loadPeopleConnections();
      void loadFollowRequests();
    }
  }, [active, currentUserId]);

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
      setNotice("Your little note has been tucked into the Memory Jar. *");
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

    const placeName = memoryPlaceName.trim() || null;
    const latitudeText = memoryLatitude.trim();
    const longitudeText = memoryLongitude.trim();

    if (Boolean(latitudeText) !== Boolean(longitudeText)) {
      setNotice("Please enter both latitude and longitude, or leave both empty.");
      return;
    }

    const latitude = latitudeText ? Number(latitudeText) : null;
    const longitude = longitudeText ? Number(longitudeText) : null;

    if (
      (latitude !== null &&
        (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setNotice("Please enter valid coordinates. Latitude must be -90 to 90 and longitude -180 to 180.");
      return;
    }

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
      place_name: placeName,
      latitude,
      longitude,
    });

    if (saveError) {
      setNotice(`Could not save memory: ${saveError.message}`);
      setSaving(false);
      return;
    }

    setMemoryTitle("");
    setMemoryContent("");
    setMemoryPlaceName("");
    setMemoryLatitude("");
    setMemoryLongitude("");
    setCreateMode("choice");
    setShowCreate(false);
    setNotice("Your memory has been saved. Keep this little moment forever. *");

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

.select(
  "id, title, content, memory_date, space_id, place_name, latitude, longitude"
)
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
    setNotice("Your memory has been updated. *");
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
    let reservationId: string | null = null;

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

      // Reserve this user's allowance before sending any bytes to Storage.
      const { data: reservationData, error: reservationError } = await supabase.rpc(
        "reserve_storage_upload",
        {
          p_bucket_id: "memory-media",
          p_object_path: objectPath,
          p_expected_bytes: photoFile.size,
        }
      );

      if (reservationError) {
        throw new Error(`Could not reserve storage: ${reservationError.message}`);
      }

      const reservation = Array.isArray(reservationData)
        ? reservationData[0]
        : reservationData;
      if (!reservation?.reservation_id) {
        throw new Error("Storage could not reserve space for this photo. Please try again.");
      }
      reservationId = reservation.reservation_id;

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
            `Photo details could not be saved and the uploaded file could not be removed. Storage will still count the file. Details: ${metadataError.message}; cleanup: ${cleanupError.message}`
          );
        }

        throw new Error(
          `Photo details could not be saved: ${metadataError.message}`
        );
      }

      setPhotoFile(null);
      setPhotoCaption("");
      setNotice("Photo added to your memory! *");

      await loadPhotos(detailMemory);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading the photo."
      );
    } finally {
      // Successful metadata inserts consume the reservation in the database
      // trigger; this release is harmless if it has already been consumed.
      if (reservationId) {
        await supabase.rpc("release_storage_upload", {
          p_reservation_id: reservationId,
        });
      }
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

  async function saveSpaceTheme(themeKey: SpaceThemeKey) {
    if (!selectedSpaceId) {
      setNotice("Create or select a space before choosing its theme.");
      return;
    }
    if (!canEditSpaceTheme) {
      setNotice("Only the space owner can change this theme unless theme editing is enabled for all members.");
      return;
    }

    setThemeSaving(true);
    setNotice("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in again before saving a theme.");

      const { data, error } = await supabase.rpc("save_space_theme", {
        p_space_id: selectedSpaceId,
        p_theme_key: themeKey,
        p_theme_permission: null,
      });
      if (error) throw error;
      const saved = (Array.isArray(data) ? data[0] : data) as SpaceThemeSetting | null;
      if (!saved?.space_id) throw new Error("The database did not return the saved theme.");
      setSpaceThemeSettings((current) => ({ ...current, [selectedSpaceId]: saved }));
      setPreviewTheme(null);
      setNotice(themeKey === "default" ? "Space theme reset to Memory Space Classic." : `${SPACE_THEMES.find((theme) => theme.key === themeKey)?.name ?? "Theme"} applied to ${selectedSpace?.name ?? "this space"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not save this space theme: ${error.message}` : "Could not save this space theme.");
    } finally {
      setThemeSaving(false);
    }
  }

  async function saveThemePermission() {
    if (!selectedSpaceId || selectedSpaceRole !== "owner") {
      setNotice("Only the space owner can change who may edit the shared theme.");
      return;
    }
    setThemeSaving(true);
    setNotice("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in again before saving theme permissions.");
      const { data, error } = await supabase.rpc("save_space_theme", {
        p_space_id: selectedSpaceId,
        p_theme_key: currentSpaceTheme,
        p_theme_permission: themePermissionDraft,
      });
      if (error) throw error;
      const saved = (Array.isArray(data) ? data[0] : data) as SpaceThemeSetting | null;
      if (!saved?.space_id) throw new Error("The database did not return the saved theme settings.");
      setSpaceThemeSettings((current) => ({ ...current, [selectedSpaceId]: saved }));
      setNotice(themePermissionDraft === "members" ? "All members of this space can now change its shared theme." : "Theme editing is now restricted to the space owner.");
    } catch (error) {
      setNotice(error instanceof Error ? `Could not save theme permissions: ${error.message}` : "Could not save theme permissions.");
    } finally {
      setThemeSaving(false);
    }
  }

  async function saveAppearance(nextAppearance: AppAppearance) {
    setAppearanceSaving(true);
    setNotice("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in again before saving appearance.");
      const { error } = await supabase
        .from("memory_space_appearance_settings")
        .upsert({
          user_id: user.id,
          appearance: nextAppearance,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) throw error;
      setAppearance(nextAppearance);
      setNotice(`App appearance set to ${nextAppearance}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not save appearance: ${error.message}` : "Could not save appearance.");
    } finally {
      setAppearanceSaving(false);
    }
  }

  async function handleLogout() {
    setNotice("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setNotice(`Could not log out: ${error.message}`);
      return;
    }

    window.location.assign("/auth");
  }


  async function searchPeople(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const query = peopleQuery.trim().toLowerCase();
    if (query.length < 3) {
      setPeopleResults([]);
      setNotice("Enter at least 3 characters to search usernames.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(query)) {
      setNotice("Search usernames using letters, numbers, and underscores only.");
      return;
    }
    setPeopleSearchLoading(true);
    setNotice("");
    try {
      const { data, error } = await supabase.rpc("search_people", {
        search_query: query,
      });
      if (error) throw error;
      setPeopleResults((data ?? []) as PersonResult[]);
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not search people: ${error.message}`
        : "Could not search people. Check the database setup.");
      setPeopleResults([]);
    } finally {
      setPeopleSearchLoading(false);
    }
  }

  async function loadPeopleConnections() {
    setPeopleConnectionsLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_people_connections");
      if (error) throw error;
      const rows = (data ?? []) as PersonConnection[];
      setPeopleConnections(rows);
      setRelationshipLabels((current) => {
        const next = { ...current };
        for (const row of rows) {
          if (row.direction === "friend") next[row.user_id] = row.relationship_label ?? "friend";
        }
        return next;
      });
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not load your people list: ${error.message}`
        : "Could not load your people list.");
    } finally {
      setPeopleConnectionsLoading(false);
    }
  }

  async function loadFollowRequests() {
    setFollowRequestsLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_follow_requests");
      if (error) throw error;
      setFollowRequests((data ?? []) as FollowRequest[]);
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not load follow requests: ${error.message}`
        : "Could not load follow requests.");
    } finally {
      setFollowRequestsLoading(false);
    }
  }

  async function sendFollowRequest(person: PersonResult) {
    setPeopleActionId(`follow-${person.user_id}`);
    setNotice("");
    try {
      const { error } = await supabase.rpc("send_follow_request", {
        target_user_id: person.user_id,
      });
      if (error) throw error;
      setNotice(`Follow request sent to @${person.username}.`);
      await loadFollowRequests();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not send follow request: ${error.message}`
        : "Could not send follow request.");
    } finally {
      setPeopleActionId(null);
    }
  }

  async function respondToFollowRequest(request: FollowRequest, accept: boolean) {
    setPeopleActionId(request.request_id);
    setNotice("");
    try {
      const { error } = await supabase.rpc("respond_follow_request", {
        request_id: request.request_id,
        accept_request: accept,
      });
      if (error) throw error;
      setNotice(accept ? "Follow request accepted!" : "Follow request declined.");
      await loadFollowRequests();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not update follow request: ${error.message}`
        : "Could not update follow request.");
    } finally {
      setPeopleActionId(null);
    }
  }

  async function sendFriendRequest(person: PersonResult) {
    setPeopleActionId(person.user_id);
    setNotice("");
    try {
      const { error } = await supabase.rpc("send_friend_request", {
        target_user_id: person.user_id,
      });
      if (error) throw error;
      setNotice(`Friend request sent to @${person.username}.`);
      await searchPeople();
      await loadPeopleConnections();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not send friend request: ${error.message}`
        : "Could not send friend request.");
    } finally {
      setPeopleActionId(null);
    }
  }

  async function respondToFriendRequest(connection: PersonConnection, accept: boolean) {
    setPeopleActionId(connection.request_id);
    setNotice("");
    try {
      const { error } = await supabase.rpc("respond_friend_request", {
        request_id: connection.request_id,
        accept_request: accept,
      });
      if (error) throw error;
      setNotice(accept ? "Friend request accepted!" : "Friend request declined.");
      await loadPeopleConnections();
      if (peopleQuery.trim().length >= 3) await searchPeople();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not update friend request: ${error.message}`
        : "Could not update friend request.");
    } finally {
      setPeopleActionId(null);
    }
  }

  async function cancelFriendRequest(connection: PersonConnection) {
    setPeopleActionId(connection.request_id);
    setNotice("");
    try {
      const { error } = await supabase.rpc("cancel_friend_request", {
        request_id: connection.request_id,
      });
      if (error) throw error;
      setNotice("Friend request cancelled.");
      await loadPeopleConnections();
      if (peopleQuery.trim().length >= 3) await searchPeople();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not cancel request: ${error.message}`
        : "Could not cancel request.");
    } finally {
      setPeopleActionId(null);
    }
  }

  async function saveRelationshipLabel(connection: PersonConnection) {
    const label = relationshipLabels[connection.user_id] ?? "friend";
    setPeopleActionId(connection.user_id);
    setNotice("");
    try {
      const { error } = await supabase.rpc("set_friend_relationship_label", {
        target_user_id: connection.user_id,
        new_label: label,
      });
      if (error) throw error;
      setNotice("Relationship label saved.");
      await loadPeopleConnections();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not save relationship label: ${error.message}`
        : "Could not save relationship label.");
    } finally {
      setPeopleActionId(null);
    }
  }

  async function removeFriend(connection: PersonConnection) {
    if (!window.confirm(`Remove @${connection.username ?? "this friend"} from your friends list?`)) return;
    setPeopleActionId(connection.request_id);
    setNotice("");
    try {
      const { error } = await supabase.rpc("remove_friend_connection", {
        target_user_id: connection.user_id,
      });
      if (error) throw error;
      setNotice("Friend removed. Their access to shared spaces has not changed.");
      await loadPeopleConnections();
      if (peopleQuery.trim().length >= 3) await searchPeople();
    } catch (error) {
      setNotice(error instanceof Error
        ? `Could not remove friend: ${error.message}`
        : "Could not remove friend.");
    } finally {
      setPeopleActionId(null);
    }
  }

  const memorySpaceTutorialSteps = [
  { title: "Welcome to Memory Space", description: "Your private shared home for memories, plans, photos, and moments together.", page: "Home" },
  { title: "Create your spaces", description: "Use My spaces to create separate spaces for different people, groups, or chapters of life.", page: "My spaces" },
  { title: "Save memories", description: "Use Memories and Timeline to keep stories and moments together in one place.", page: "Memories" },
  { title: "Keep meaningful messages", description: "Memory Jar and Voice Memories help you save messages and recordings for later.", page: "Memory Jar" },
  { title: "Plan your future", description: "Explore Calendar, Future plans, Daily Prompts, and Time Capsules to plan and reflect together.", page: "Future plans" },
  { title: "Explore your collection", description: "Albums, Yearbook, Scrapbook, and Memory Map help you revisit what you have saved.", page: "Albums" },
  { title: "Your shared activities", description: "Gratitude Jar and Group Polls give everyone a way to participate.", page: "Gratitude Jar" },
  { title: "Privacy and help", description: "Use Help & About for guidance. Only invite people you trust into a private space.", page: "Help & About" }
];

const memorySpaceHelpGuides = [
  { title: "Getting started", category: "Basics", keywords: "welcome start tutorial dashboard", body: "Start on Home, open My spaces, and select a space to explore its memories and activities. Use the tutorial to learn the main areas." },
  { title: "Spaces and members", category: "Sharing", keywords: "spaces members invitations private access", body: "Create separate spaces for different groups. Share invitation links only with people you trust and review who has access to each space." },
  { title: "Memories and timeline", category: "Memories", keywords: "save story date memory timeline", body: "Use Memories to save moments and Timeline to revisit them chronologically. Add clear titles and dates so memories are easier to find." },
  { title: "Memory Jar", category: "Memories", keywords: "messages notes open later jar", body: "Save notes in Memory Jar and use its available opening-date options to make messages meaningful to revisit later." },
  { title: "Voice Memories", category: "Memories", keywords: "audio recording voice playback", body: "Use Voice Memories for audio moments where available. Voice recordings may use more storage than text, so keep an eye on your available storage." },
  { title: "Albums and exports", category: "Memories", keywords: "albums photos yearbook scrapbook export", body: "Use Albums to browse collections. Yearbook and Scrapbook help you revisit or export memories using the options available in the app." },
  { title: "Calendar and future plans", category: "Planning", keywords: "events birthdays anniversaries plans", body: "Use Calendar for dated events and Future plans for things you want to do together." },
  { title: "Daily Prompts and Time Capsules", category: "Planning", keywords: "questions reflection future open date", body: "Daily Prompts give you ideas to reflect on. Time Capsules let you save something to revisit in the future using the options provided." },
  { title: "Memory Map", category: "Memories", keywords: "map place location coordinates", body: "Use Memory Map to explore location details associated with memories when location information is available." },
  { title: "Gratitude Jar and Group Polls", category: "Together", keywords: "gratitude thanks vote poll", body: "Use Gratitude Jar to share appreciation and Group Polls to gather votes from members." },
  { title: "Storage and media", category: "Storage", keywords: "storage upload photo audio limit google drive", body: "Media storage has limits. Check Storage for the current information shown by the app. Keep uploads within the displayed limits; external storage options should only be used when they are actually available in your setup." },
  { title: "Privacy and account safety", category: "Privacy", keywords: "security privacy login account invite", body: "Use a strong password, sign out on shared computers, and only share private-space invitation links with intended members. Do not share passwords or secret keys." },
  { title: "Troubleshooting", category: "Help", keywords: "error loading refresh problem sign in", body: "If something does not load, check your connection and sign-in status, then refresh the page. If an upload fails, check the file type and the limits shown by the app." }
];

function startMemorySpaceTutorial() {
  setTutorialStep(0);
  setShowTutorial(true);
  setNotice("");
}

function finishMemorySpaceTutorial() {
  if (currentUserId) {
    try {
      window.localStorage.setItem("memory-space-tutorial-complete-" + currentUserId, "yes");
    } catch {}
  }
  setShowTutorial(false);
  setTutorialStep(0);
}

const filteredMemorySpaceGuides = memorySpaceHelpGuides.filter((guide) => {
  const query = helpSearch.trim().toLowerCase();
  return !query || (guide.title + " " + guide.category + " " + guide.keywords + " " + guide.body).toLowerCase().includes(query);
});

useEffect(() => {
  if (loading || !currentUserId) return;
  try {
    const key = "memory-space-tutorial-complete-" + currentUserId;
    if (window.localStorage.getItem(key) !== "yes") {
      setTutorialStep(0);
      setShowTutorial(true);
    }
  } catch {
    // Keep the dashboard usable if browser storage is unavailable.
  }
}, [loading, currentUserId]);
const navItems: { label: string; icon: LucideIcon }[] = [
    { label: "Home", icon: House },
    { label: "My spaces", icon: Layers3 },
    { label: "Memories", icon: Heart },
    { label: "Timeline", icon: CalendarDays },
    { label: "Voice Memories", icon: Mic },
    { label: "Memory Jar", icon: Archive },
    { label: "Albums", icon: Images },
    { label: "Calendar", icon: CalendarDays },
    { label: "Future plans", icon: Sparkles },
    { label: "Daily Prompts", icon: PencilLine },
    { label: "Time Capsules", icon: Mail },
    { label: "Yearbook", icon: BookOpen },
    { label: "Scrapbook", icon: BookOpen },
    { label: "Memory Map", icon: MapPin },
    { label: "Gratitude Jar", icon: Heart },
{ label: "Group Polls", icon: Sparkles },
{ label: "Storage", icon: Cloud },
  ];

  function chooseNav(label: string) {
    setActive(label);
    setNotice("");
  }

  async function loadProfileSummary() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;
      setProfileEmail(user.email ?? "");
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username, nickname, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      setProfileDisplayName(data?.display_name ?? String(user.user_metadata?.full_name ?? ""));
      setProfileUsername(data?.username ?? "");
      setProfileNickname(data?.nickname ?? "");
      setProfileBio(data?.bio ?? "");
      const savedAvatar = data?.avatar_url ?? "";
      if (savedAvatar.startsWith(`${user.id}/`)) {
        const { data: signedAvatar } = await supabase.storage
          .from("avatars")
          .createSignedUrl(savedAvatar, 60 * 60 * 24);
        setProfileAvatarPath(savedAvatar);
        setProfileAvatarUrl(signedAvatar?.signedUrl ?? "");
      } else {
        setProfileAvatarPath("");
        setProfileAvatarUrl(savedAvatar);
      }
    } catch {
      // Keep the dashboard usable even if profile details are unavailable.
    }
  }

  async function openProfileEditor() {
    setShowProfileMenu(false);
    setShowProfileEditor(true);
    setProfileLoading(true);
    setNotice("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please sign in again to view your profile.");

      setProfileEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, username, nickname, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;

      setProfileDisplayName(data?.display_name ?? String(user.user_metadata?.full_name ?? ""));
      setProfileUsername(data?.username ?? "");
      setProfileNickname(data?.nickname ?? "");
      setProfileBio(data?.bio ?? "");
      const savedAvatar = data?.avatar_url ?? "";
      const isStoredAvatar = savedAvatar.startsWith(`${user.id}/`);
      setProfileAvatarPath(isStoredAvatar ? savedAvatar : "");
      setSelectedAvatarFile(null);
      setProfilePreviewUrl("");

      if (isStoredAvatar) {
        const { data: signedAvatar, error: signedError } = await supabase.storage
          .from("avatars")
          .createSignedUrl(savedAvatar, 60 * 60 * 24);
        if (signedError) throw signedError;
        setProfileAvatarUrl(signedAvatar?.signedUrl ?? "");
      } else {
        setProfileAvatarUrl(savedAvatar);
      }
    } catch (error) {
      setShowProfileEditor(false);
      setNotice(
        error instanceof Error
          ? `Could not load your profile: ${error.message}`
          : "Could not load your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = profileUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setNotice("Choose a username with 3–24 lowercase letters, numbers, or underscores.");
      return;
    }
    setProfileSaving(true);
    setNotice("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please sign in again to save your profile.");

      let savedAvatarPath = profileAvatarPath;
      if (selectedAvatarFile) {
        const safeName = selectedAvatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const filePath = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedAvatarFile, {
            upsert: true,
            contentType: selectedAvatarFile.type || "image/jpeg",
            cacheControl: "3600",
          });
        if (uploadError) throw new Error(`Could not upload profile photo: ${uploadError.message}`);
        savedAvatarPath = filePath;
      }

      const { error: saveError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: profileDisplayName.trim(),
        username: normalizedUsername,
        nickname: profileNickname.trim(),
        bio: profileBio.trim(),
        avatar_url: savedAvatarPath || profileAvatarUrl || "",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (saveError) throw saveError;

      setProfileUsername(normalizedUsername);
      setProfileAvatarPath(savedAvatarPath);
      setSelectedAvatarFile(null);
      setProfilePreviewUrl("");
      if (savedAvatarPath) {
        const { data: signedAvatar, error: signedError } = await supabase.storage
          .from("avatars")
          .createSignedUrl(savedAvatarPath, 60 * 60 * 24);
        if (signedError) throw signedError;
        setProfileAvatarUrl(signedAvatar?.signedUrl ?? "");
      }

      setShowProfileEditor(false);
      setNotice("Your profile has been saved.");
    } catch (error: unknown) {
      // Supabase/PostgREST errors are not always native Error instances.
      // Extract their message and useful database details so the UI does not
      // hide the real reason profile saving failed.
      const details =
        error && typeof error === "object"
          ? (error as {
              message?: unknown;
              details?: unknown;
              hint?: unknown;
              code?: unknown;
            })
          : null;

      const message =
        error instanceof Error
          ? error.message
          : typeof details?.message === "string"
            ? details.message
            : typeof error === "string"
              ? error
              : "Unknown error";

      const extra = [
        typeof details?.code === "string" ? `code ${details.code}` : "",
        typeof details?.details === "string" ? String(details.details) : "",
        typeof details?.hint === "string" ? `Hint: ${details.hint}` : "",
      ].filter(Boolean).join(" | ");

      console.error("Profile save failed:", error);
      setNotice(
        `Could not save your profile: ${message}${extra ? ` (${extra})` : ""}`
      );
    } finally {
      setProfileSaving(false);
    }
  }


  return (
    <main data-space-theme={displayedSpaceTheme} data-appearance={appearance} className="min-h-screen bg-[#faf8f5] text-[#39352f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[245px] shrink-0 border-r border-[#ebe5df] bg-[#fffdfa] px-6 py-8 lg:flex lg:flex-col">
          <a href="#" className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eadde8] text-2xl text-[#86657f]">
              *
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
            {navItems.map((item) => {
  const Icon = item.icon;
  return (
              <button
                key={item.label}
                onClick={() => chooseNav(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  active === item.label
                    ? "bg-[#eee5ed] font-medium text-[#775b75]"
                    : "text-[#817970] hover:bg-[#f5f0eb]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center">
  <Icon size={18} strokeWidth={1.8} />
</span>
                {item.label}
              </button>
            );
})}
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
                  <Sparkles size={22} strokeWidth={1.8} />
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
                Your first little space is waiting to be created. *
              </p>
            )}
          </div>

          <div className="mt-auto rounded-2xl border border-[#eee4e8] bg-[#f8f0f3] p-4">
            <div className="mb-2 text-xl">
              <Heart size={22} strokeWidth={1.8} />
            </div>
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

          <a id="memory-space-contact-support-menu" href="mailto:dangerofficial6578@gmail.com?subject=Memory%20Space%20Support" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">💌 Contact support</a>
<button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#817970] transition hover:bg-[#f5e8e8] hover:text-[#a34d55]"
          >
            <LogOut size={18} strokeWidth={1.8} />
            Log out
          </button>
        </aside>

        <section className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#eee8e2] bg-[#faf8f5]/95 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eadde8] text-xl text-[#86657f]">
                *
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
                onClick={() => {
                  chooseNav("Notifications");
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#eae2da] bg-white text-lg hover:bg-[#f5efea]"
                aria-label="Notifications"
              >
                <Heart size={18} strokeWidth={1.8} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#bd8b9e] px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowProfileMenu((open) => !open); void loadProfileSummary(); }}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#dfe7dc] text-sm font-semibold text-[#5e765b] transition hover:ring-2 hover:ring-[#b9c9b2]"
                  aria-label="Open profile menu"
                  aria-expanded={showProfileMenu}
                >
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (profileDisplayName || profileNickname || profileEmail || "Y")
                      .trim().split(/\s+/).slice(0, 2)
                      .map((part) => part[0]?.toUpperCase()).join("") || "Y"
                  )}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-[#eae2da] bg-white shadow-xl">
                    <div className="border-b border-[#eee8e2] bg-[#faf8f5] p-4">
                      <p className="text-sm font-semibold text-[#49413b]">{profileDisplayName || profileNickname || "My Profile"}</p>
                      <p className="mt-1 text-xs text-[#92877d]">{profileNickname ? `@${profileNickname}` : profileEmail || "Manage your Memory Space account"}</p>
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={() => { void openProfileEditor(); }} className="w-full rounded-xl px-3 py-3 text-left text-sm text-[#514451] transition hover:bg-[#f8f1f7]">
                        <span className="block font-medium">My Profile</span>
                        <span className="mt-1 block text-xs text-[#92877d]">Personal information and profile photo</span>
                      </button>
                      <button type="button" onClick={() => { setShowProfileMenu(false); setActive("Account Settings"); setNotice(""); void loadProfileSummary(); }} className="w-full rounded-xl px-3 py-3 text-left text-sm text-[#514451] transition hover:bg-[#f8f1f7]">
                        <span className="block font-medium">Account Settings</span>
                        <span className="mt-1 block text-xs text-[#92877d]">Preferences and account details</span>
                      </button>
                      <button type="button" onClick={() => { setShowProfileMenu(false); chooseNav("People & Relationships"); }} className="w-full rounded-xl px-3 py-3 text-left text-sm text-[#514451] transition hover:bg-[#f8f1f7]">
                        <span className="block font-medium">People &amp; Relationships</span>
                        <span className="mt-1 block text-xs text-[#92877d]">Manage connections through shared spaces</span>
                      </button>
                      <button type="button" onClick={() => { setShowProfileMenu(false); chooseNav("Notifications"); }} className="w-full rounded-xl px-3 py-3 text-left text-sm text-[#514451] transition hover:bg-[#f8f1f7]">
                        <span className="block font-medium">Notifications</span>
                        <span className="mt-1 block text-xs text-[#92877d]">Reminders and activity updates</span>
                      </button>
                      <button type="button" onClick={() => { setShowProfileMenu(false); chooseNav("Help & About"); }} className="w-full rounded-xl px-3 py-3 text-left text-sm text-[#514451] transition hover:bg-[#f8f1f7]">
                        <span className="block font-medium">Help &amp; About</span>
                        <span className="mt-1 block text-xs text-[#92877d]">How Memory Space works</span>
                      </button>
                      <button type="button" onClick={() => { setShowProfileMenu(false); chooseNav("My spaces"); }} className="w-full rounded-xl px-3 py-3 text-left text-sm text-[#514451] transition hover:bg-[#f8f1f7]">
                        <span className="block font-medium">Manage My Spaces</span>
                        <span className="mt-1 block text-xs text-[#92877d]">Open your spaces and sharing controls</span>
                      </button>
                      <div className="my-2 border-t border-[#eee8e2]" />
                      <button type="button" onClick={() => { setShowProfileMenu(false); void handleLogout(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm text-[#a45f62] transition hover:bg-[#fff3f1]">
                        <LogOut size={17} strokeWidth={1.8} /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                  x
                </button>
              </div>
            )}


{active === "Account Settings" ? (
  <section className="space-y-8">
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
        YOUR ACCOUNT, YOUR WAY
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Account Settings
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">
        Manage your profile and learn how your Memory Space account works.
      </p>
    </div>

    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]">
            <UserRound size={21} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#514451]">
              Personal information
            </h2>
            <p className="text-sm text-[#92877d]">
              Your name, nickname and bio
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-xs text-[#a1978d]">Display name</p>
            <p className="mt-1 font-medium text-[#514451]">
              {profileDisplayName || "Not set yet"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#a1978d]">Nickname</p>
            <p className="mt-1 font-medium text-[#514451]">
              {profileNickname || "Not set yet"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#a1978d]">Email</p>
            <p className="mt-1 break-all font-medium text-[#514451]">
              {profileEmail || "Open your profile to load account details"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void openProfileEditor();
          }}
          className="mt-6 w-full rounded-xl bg-[#816780] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#70566f]"
        >
          Edit my profile
        </button>
      </div>

      <div className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#687b61]">
            <ShieldCheck size={21} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#514451]">
              Security and privacy
            </h2>
            <p className="text-sm text-[#92877d]">
              Keep your account in mind
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-[#faf7f3] p-4">
            <p className="text-sm font-medium text-[#514451]">
              Sign-in details
            </p>
            <p className="mt-1 text-sm leading-6 text-[#8d8379]">
              Your account uses Memory Space sign-in. Password recovery and
              other sign-in changes depend on your authentication setup.
            </p>
          </div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">
            <p className="text-sm font-medium text-[#514451]">
              Shared spaces
            </p>
            <p className="mt-1 text-sm leading-6 text-[#8d8379]">
              Be mindful of who you invite to a space and what you share
              with its members.
            </p>
          </div>
          <div className="rounded-2xl bg-[#faf7f3] p-4">
            <p className="text-sm font-medium text-[#514451]">
              Account changes
            </p>
            <p className="mt-1 text-sm leading-6 text-[#8d8379]">
              You can update your profile details and profile photo using
              the profile editor.
            </p>
          </div>
        </div>
      </div>
    </div>

    <section className="space-y-6 rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]">
          <Palette size={23} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a18a9e]">MAKE IT FEEL LIKE YOURS</p>
          <h2 className="mt-1 text-xl font-semibold text-[#514451]">Appearance & space themes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8d8379]">
            App appearance is private to your account. A space theme is shared with that space’s members and does not change any other space.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eee6df] bg-[#faf7f3] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-[#514451]">App appearance</h3>
            <p className="mt-1 text-sm text-[#92877d]">Choose your personal default when a space is using the classic theme.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void saveAppearance("light")} disabled={appearanceSaving} aria-pressed={appearance === "light"} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${appearance === "light" ? "border-[#b99ab5] bg-[#eee5ed] text-[#775b75]" : "border-[#e7dce5] bg-white text-[#817970]"} disabled:opacity-50`}>
              <Sun size={17} /> Light
            </button>
            <button type="button" onClick={() => void saveAppearance("dark")} disabled={appearanceSaving} aria-pressed={appearance === "dark"} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${appearance === "dark" ? "border-[#b99ab5] bg-[#eee5ed] text-[#775b75]" : "border-[#e7dce5] bg-white text-[#817970]"} disabled:opacity-50`}>
              <Moon size={17} /> Dark
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#514451]">Full-space theme gallery</h3>
            <p className="mt-1 text-sm text-[#92877d]">
              {selectedSpace ? `Editing the look for “${selectedSpace.name}”.` : "Create or select a space first."}
              {" "}Preview changes the page temporarily; Apply saves it for the whole space.
            </p>
          </div>
          {selectedSpace && <span className="w-fit rounded-full bg-[#edf1e8] px-3 py-1.5 text-xs font-medium text-[#687b61]">Your role: {selectedSpaceRole || "member"}</span>}
        </div>

        {!selectedSpace ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#d9cbd8] p-6 text-sm text-[#8d8379]">
            No space selected. Create a space or choose one from the sidebar to set its theme.
            <button type="button" onClick={() => { setShowCreate(true); setCreateMode("space"); }} className="ml-2 font-semibold text-[#816780] underline">Create a space</button>
          </div>
        ) : (
          <>
            {!canEditSpaceTheme && (
              <p className="mt-4 rounded-xl border border-[#ead9bb] bg-[#fff8e9] p-3 text-sm text-[#80673e]">
                Theme editing is currently owner-only. You can preview themes; ask the space owner to enable editing for all members.
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {SPACE_THEMES.map((theme) => {
                const ThemeIcon = theme.icon;
                const isCurrent = currentSpaceTheme === theme.key;
                const isPreview = previewTheme === theme.key;
                return (
                  <article key={theme.key} className={`overflow-hidden rounded-2xl border bg-white transition ${isCurrent ? "border-[#b99ab5] ring-2 ring-[#b99ab5]/30" : "border-[#eee6df]"}`}>
                    <div className="relative h-24 overflow-hidden p-4" style={{ background: theme.preview }}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-[#60485e] shadow-sm">
                        <ThemeIcon size={21} />
                      </div>
                      {isCurrent && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#775b75]"><Check size={12} className="mr-1 inline" />Applied</span>}
                      {isPreview && <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#775b75]">Live preview</span>}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-[#514451]">{theme.name}</h4>
                      <p className="mt-1 min-h-10 text-xs leading-5 text-[#92877d]">{theme.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setPreviewTheme(theme.key)} className="rounded-lg border border-[#e7dce5] px-3 py-2 text-xs font-medium text-[#816780] hover:bg-[#f8f1f7]">Preview</button>
                        <button type="button" onClick={() => void saveSpaceTheme(theme.key)} disabled={themeSaving || !canEditSpaceTheme} className="rounded-lg bg-[#816780] px-3 py-2 text-xs font-medium text-white hover:bg-[#70566f] disabled:cursor-not-allowed disabled:opacity-50">{themeSaving ? "Saving…" : "Apply theme"}</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-[#eee6df] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-[#514451]">Who can change this space’s theme?</h3>
                  <p className="mt-1 text-sm leading-6 text-[#92877d]">Only affects theme editing. It does not change membership or access to private memories.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select aria-label="Theme editing permission" value={themePermissionDraft} onChange={(event) => setThemePermissionDraft(event.target.value as ThemePermission)} disabled={selectedSpaceRole !== "owner"} className="rounded-xl border border-[#e7dce5] bg-white px-3 py-3 text-sm text-[#514451] disabled:opacity-60">
                    <option value="owner">Owner only</option>
                    <option value="members">All space members</option>
                  </select>
                  <button type="button" onClick={() => void saveThemePermission()} disabled={themeSaving || selectedSpaceRole !== "owner"} className="rounded-xl border border-[#d9c8d8] px-4 py-3 text-sm font-medium text-[#816780] disabled:cursor-not-allowed disabled:opacity-50">{themeSaving ? "Saving…" : "Save permission"}</button>
                </div>
              </div>
              {selectedSpaceRole !== "owner" && <p className="mt-3 text-xs text-[#92877d]">Only the space owner can change this permission.</p>}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => setPreviewTheme(null)} className="inline-flex items-center gap-2 rounded-xl border border-[#e7dce5] px-4 py-3 text-sm text-[#817970]"><RotateCcw size={16} />Cancel preview</button>
              <button type="button" onClick={() => void saveSpaceTheme("default")} disabled={themeSaving || !canEditSpaceTheme} className="inline-flex items-center gap-2 rounded-xl border border-[#e7dce5] px-4 py-3 text-sm text-[#817970] disabled:opacity-50"><RotateCcw size={16} />Reset space to classic</button>
            </div>
          </>
        )}
      </div>
    </section>

    <button
      type="button"
      onClick={() => chooseNav("Home")}
      className="rounded-xl border border-[#e7dce5] bg-white px-5 py-3 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7]"
    >
      <ArrowRight size={16} className="mr-2 inline rotate-180" />
      Back to Home
    </button>
  </section>
  ) : active === "People & Relationships" ? (
  <section className="space-y-8">
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">YOUR CIRCLE, YOUR MEMORIES</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">People &amp; Relationships</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">Find people by username, send friend requests, and organize your circle. Friendships never grant access to private spaces automatically.</p>
    </div>

    <section className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]"><Search size={22} /></div>
        <div><h2 className="text-lg font-semibold text-[#514451]">Find people</h2><p className="text-sm text-[#92877d]">Search by their unique username.</p></div>
      </div>
      <form onSubmit={searchPeople} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[#e7dce5] bg-[#fffdfa] px-4 focus-within:border-[#a98ca7]">
          <span className="text-sm text-[#a1978d]">@</span>
          <input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} minLength={3} maxLength={24} placeholder="Search usernames (3+ characters)" className="w-full bg-transparent px-2 py-3 text-sm outline-none" aria-label="Search usernames" />
        </div>
        <button type="submit" disabled={peopleSearchLoading || peopleQuery.trim().length < 3} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70566f] disabled:cursor-not-allowed disabled:opacity-50">
          <Search size={16} /> {peopleSearchLoading ? "Searching…" : "Search"}
        </button>
      </form>
      <p className="mt-2 text-xs text-[#92877d]">You need a username in your profile to be discoverable. Emails and private memories are never shown in search.</p>
      <div className="mt-5 space-y-3">
        {peopleResults.map((person) => (
          <article key={person.user_id} className="flex flex-col gap-3 rounded-2xl border border-[#eee6df] p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0e7ef] text-sm font-semibold text-[#816780]">
                {person.avatar_url && /^https?:\/\//i.test(person.avatar_url) ? <img src={person.avatar_url} alt="" className="h-full w-full object-cover" /> : (person.display_name || person.nickname || person.username).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#514451]">{person.display_name || person.nickname || person.username}</p><p className="truncate text-xs text-[#92877d]">@{person.username}</p></div>
            </div>
            {person.relationship_status === "friends" ? (
              <span className="rounded-xl bg-[#edf1e8] px-4 py-2 text-center text-xs font-medium text-[#687b61]">Already friends</span>
            ) : person.relationship_status === "request_sent" ? (
              <span className="rounded-xl bg-[#f4edf4] px-4 py-2 text-center text-xs font-medium text-[#816780]">Request sent</span>
            ) : person.relationship_status === "request_received" ? (
              <span className="rounded-xl bg-[#faf1e6] px-4 py-2 text-center text-xs font-medium text-[#92724b]">They sent you a request below</span>
            ) : (
              <button type="button" onClick={() => void sendFriendRequest(person)} disabled={peopleActionId === person.user_id} className="rounded-xl border border-[#d9c8d8] px-4 py-2 text-sm font-medium text-[#816780] hover:bg-[#f8f1f7] disabled:opacity-50">{peopleActionId === person.user_id ? "Sending…" : "Add friend"}</button>
            )}
          </article>
        ))}
        {!peopleSearchLoading && peopleQuery.trim().length >= 3 && peopleResults.length === 0 && <p className="rounded-xl bg-[#faf7f3] p-4 text-sm text-[#8d8379]">No matching usernames found. Check the spelling or ask them to set a username in their profile.</p>}
      </div>
    </section>

    <section className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold text-[#514451]">Friend requests</h2><p className="mt-1 text-sm text-[#92877d]">Review requests you receive or cancel requests you have sent.</p></div>
        <button type="button" onClick={() => void loadPeopleConnections()} disabled={peopleConnectionsLoading} className="rounded-xl border border-[#e7dce5] px-4 py-2 text-sm text-[#816780] hover:bg-[#f8f1f7] disabled:opacity-50">{peopleConnectionsLoading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {peopleConnectionsLoading ? <p className="mt-5 text-sm text-[#92877d]">Loading your connections…</p> : (
        <div className="mt-5 space-y-3">
          {peopleConnections.filter((connection) => connection.direction === "incoming" || connection.direction === "outgoing").map((connection) => (
            <article key={connection.request_id} className="flex flex-col gap-3 rounded-2xl border border-[#eee6df] p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#514451]">{connection.display_name || connection.nickname || connection.username || "Memory Space member"}</p><p className="mt-1 text-xs text-[#92877d]">{connection.username ? `@${connection.username}` : "Username not set"} Â· {connection.direction === "incoming" ? "Incoming request" : "Request sent"}</p></div>
              {connection.direction === "incoming" ? (
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void respondToFriendRequest(connection, true)} disabled={peopleActionId === connection.request_id} className="rounded-xl bg-[#816780] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{peopleActionId === connection.request_id ? "Saving…" : "Accept"}</button><button type="button" onClick={() => void respondToFriendRequest(connection, false)} disabled={peopleActionId === connection.request_id} className="rounded-xl border border-[#e7dce5] px-4 py-2 text-sm text-[#817970] disabled:opacity-50">Decline</button></div>
              ) : <button type="button" onClick={() => void cancelFriendRequest(connection)} disabled={peopleActionId === connection.request_id} className="rounded-xl border border-[#e7dce5] px-4 py-2 text-sm text-[#a45f62] disabled:opacity-50">{peopleActionId === connection.request_id ? "Cancelling…" : "Cancel request"}</button>}
            </article>
          ))}
          {peopleConnections.filter((connection) => connection.direction === "incoming" || connection.direction === "outgoing").length === 0 && <p className="rounded-xl bg-[#faf7f3] p-4 text-sm text-[#8d8379]">No pending friend requests right now.</p>}
        </div>
      )}
    </section>

    <section className="rounded-3xl border border-[#e5d9e7] bg-[#fcf9fc] p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#514451]">Follow requests</h2>
          <p className="mt-1 text-sm text-[#92877d]">Separate from friend requests. Accepting lets the follow request be recorded without making you friends.</p>
        </div>
        <button type="button" onClick={() => void loadFollowRequests()} disabled={followRequestsLoading} className="rounded-xl border border-[#e7dce5] px-4 py-2 text-sm text-[#816780] hover:bg-[#f8f1f7] disabled:opacity-50">{followRequestsLoading ? "Refreshing…" : "Refresh"}</button>
      </div>

      {followRequestsLoading ? (
        <p className="mt-5 text-sm text-[#92877d]">Loading follow requests…</p>
      ) : (
        <div className="mt-5 space-y-3">
          {followRequests.map((request) => (
            <article key={request.request_id} className="flex flex-col gap-3 rounded-2xl border border-[#eee6df] bg-white p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#edf1e8] text-sm font-semibold text-[#687b61]">
                  {request.avatar_url && /^https?:\/\//i.test(request.avatar_url) ? <img src={request.avatar_url} alt="" className="h-full w-full object-cover" /> : (request.display_name || request.nickname || request.username || "M").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#514451]">{request.display_name || request.nickname || request.username || "Memory Space member"}</p>
                  <p className="mt-1 truncate text-xs text-[#92877d]">{request.username ? `@${request.username}` : "Username not set"} · {request.direction === "incoming" ? "Incoming follow request" : "Follow request sent"}</p>
                </div>
              </div>

              {request.direction === "incoming" ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void respondToFollowRequest(request, true)} disabled={peopleActionId === request.request_id} className="rounded-xl bg-[#687b61] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{peopleActionId === request.request_id ? "Saving…" : "Accept"}</button>
                  <button type="button" onClick={() => void respondToFollowRequest(request, false)} disabled={peopleActionId === request.request_id} className="rounded-xl border border-[#e7dce5] px-4 py-2 text-sm text-[#817970] disabled:opacity-50">Decline</button>
                </div>
              ) : (
                <span className="rounded-xl bg-[#f4edf4] px-4 py-2 text-center text-xs font-medium text-[#816780]">Request sent</span>
              )}
            </article>
          ))}
          {followRequests.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-[#8d8379]">No pending follow requests right now.</p>}
        </div>
      )}
    </section>

    <section className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
      <div><h2 className="text-lg font-semibold text-[#514451]">Your friends</h2><p className="mt-1 text-sm text-[#92877d]">Choose a relationship label for each accepted friend. Labels are private to your account.</p></div>
      <div className="mt-5 space-y-3">
        {peopleConnections.filter((connection) => connection.direction === "friend").map((connection) => (
          <article key={connection.request_id} className="flex flex-col gap-4 rounded-2xl border border-[#eee6df] p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#edf1e8] text-sm font-semibold text-[#687b61]">{connection.avatar_url && /^https?:\/\//i.test(connection.avatar_url) ? <img src={connection.avatar_url} alt="" className="h-full w-full object-cover" /> : (connection.display_name || connection.nickname || connection.username || "?").slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#514451]">{connection.display_name || connection.nickname || connection.username || "Memory Space member"}</p><p className="truncate text-xs text-[#92877d]">{connection.username ? `@${connection.username}` : "Username not set"}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label={`Relationship with ${connection.username ?? "friend"}`} value={relationshipLabels[connection.user_id] ?? connection.relationship_label ?? "friend"} onChange={(event) => setRelationshipLabels((current) => ({ ...current, [connection.user_id]: event.target.value }))} className="rounded-xl border border-[#e7dce5] bg-white px-3 py-2 text-sm text-[#514451]">
                <option value="friend">Friend</option><option value="partner">Partner</option><option value="family">Family</option><option value="best_friend">Best friend</option><option value="other">Other</option>
              </select>
              <button type="button" onClick={() => void saveRelationshipLabel(connection)} disabled={peopleActionId === connection.user_id} className="rounded-xl border border-[#d9c8d8] px-3 py-2 text-sm text-[#816780] disabled:opacity-50">{peopleActionId === connection.user_id ? "Saving…" : "Save label"}</button>
              <button type="button" onClick={() => void removeFriend(connection)} disabled={peopleActionId === connection.request_id} className="rounded-xl px-3 py-2 text-sm text-[#a45f62] hover:bg-[#fff3f1] disabled:opacity-50">Remove</button>
            </div>
          </article>
        ))}
        {peopleConnections.filter((connection) => connection.direction === "friend").length === 0 && <p className="rounded-xl bg-[#faf7f3] p-4 text-sm text-[#8d8379]">Your friends will appear here after you accept or receive an accepted request.</p>}
      </div>
    </section>

    <section className="rounded-2xl border border-[#e9e1d9] bg-[#faf7f3] p-5">
      <p className="text-sm font-semibold text-[#514451]">Your privacy matters</p>
      <p className="mt-1 text-sm leading-6 text-[#8d8379]">Friend connections and space membership are separate. Adding or removing a friend does not automatically add or remove them from any private space. Manage space access through each space’s sharing controls.</p>
    </section>
    <button type="button" onClick={() => chooseNav("Home")} className="rounded-xl border border-[#e7dce5] bg-white px-5 py-3 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7]"><ArrowRight size={16} className="mr-2 inline rotate-180" />Back to Home</button>
  </section>
) : active === "Notifications" ? (
  <NotificationsView onNotice={setNotice} onUnreadCountChange={setUnreadNotificationCount} />
) : active === "Help & About" ? (
  <section className="space-y-6">
    <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">Help & Guide</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-800">Find your way around</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Search guides for memories, spaces, planning, privacy, and storage. You can replay the welcome tutorial whenever you need it.</p>
      <button type="button" onClick={startMemorySpaceTutorial} className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700">
        Replay welcome tutorial <span aria-hidden="true">→</span>
      </button>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <label htmlFor="memory-space-help-search" className="mb-2 block text-sm font-semibold text-slate-700">Search the guide</label>
      <input
        id="memory-space-help-search"
        type="search"
        value={helpSearch}
        onChange={(event) => setHelpSearch(event.target.value)}
        placeholder="Try “storage”, “invite”, “photos”, or “privacy”…"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {filteredMemorySpaceGuides.map((guide) => (
        <article key={guide.title} className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">{guide.category}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-800">{guide.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{guide.body}</p>
        </article>
      ))}
      {filteredMemorySpaceGuides.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 md:col-span-2">
          No matching guides. Try a shorter search such as “memory”, “space”, or “storage”.
        </div>
      )}
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="font-semibold text-slate-800">Quick FAQs</h3>
      <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
        <div><p className="font-semibold text-slate-800">How do I start?</p><p>Open My spaces, select a space, and explore its memories and activities.</p></div>
        <div><p className="font-semibold text-slate-800">Who can see a private space?</p><p>Access depends on the space membership and permissions configured for your app. Only share its invitation link with intended people.</p></div>
        <div><p className="font-semibold text-slate-800">Why did an upload fail?</p><p>Check the displayed file type and size limits, your connection, and the available storage.</p></div>
        <div><p className="font-semibold text-slate-800">Can I see the tutorial again?</p><p>Yes. Select Replay welcome tutorial above at any time.</p></div>
      </div>
    </div>
      <div id="memory-space-contact-support" className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-amber-50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">💌</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-800">Need a little help?</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">Questions or something not working as expected? Contact the Memory Space support email.</p>
          <p className="mt-3 break-all text-sm font-semibold text-violet-700">dangerofficial6578@gmail.com</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="mailto:dangerofficial6578@gmail.com?subject=Memory%20Space%20Support" className="inline-flex items-center rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Email support ↗</a>
            <button type="button" onClick={() => { void navigator.clipboard.writeText("dangerofficial6578@gmail.com").then(() => setNotice("Support email copied!")).catch(() => setNotice("Please copy the support email shown above.")); }} className="rounded-full border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">Copy email</button>
          </div>
        </div>
      </div>
    </div>
</section>
) : active === "Storage" ? (
  <StorageDashboard />
) : active === "Memories" ? (
  <MemoryDiscovery
    memories={visibleMemories}
    spaceName={selectedSpace?.name ?? ""}
    loading={loading}
    onReadMemory={(memory) => setDetailMemory(memory)}
  />
 ) : active === "Timeline" ? (
  <TimelineView
    memories={visibleMemories}
    spaceName={selectedSpace?.name ?? ""}
    onReadMemory={(memory) => setDetailMemory(memory)}
  />
) : active === "Voice Memories" ? (
  <VoiceMemories
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    memories={visibleMemories.map((memory) => ({
      id: memory.id,
      title: memory.title,
      memory_date: memory.memory_date,
    }))}
    onNotice={setNotice}
  />
  ) : active === "Memory Jar" ? (

              <section className="space-y-8">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
                    LITTLE NOTES FOR LATER
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Memory Jar <span className="text-[#bd91ad]">*</span>
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
                          placeholder="A moment, a hope, a message to your future self..."
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
                        {savingJar ? "Saving your note..." : "Tuck into the jar *"}
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
                        <p className="text-sm text-[#93877e]">Checking your jar...</p>
                      ) : jarNotes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8">
                          <p className="text-lg font-medium">Your jar is waiting for its first note. *</p>
                          <p className="mt-2 text-sm text-[#93877e]">Add a note above and it will appear here.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {jarNotes.map((note, index) => {
                            const isSealed = Boolean(note.open_on && note.open_on > new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
                            return (
                              <article key={note.id} className={`rounded-2xl border p-5 ${index % 3 === 0 ? "border-[#f0deda] bg-[#fff8f6]" : index % 3 === 1 ? "border-[#e7dff0] bg-[#fbf8ff]" : "border-[#e0e8dc] bg-[#f8fbf6]"}`}>
                                <div className="text-2xl">{isSealed ? "[Locked]" : "[Letter]"}</div>
                                <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-[#9b8798]">
                                  {isSealed ? `Sealed until ${new Date(`${note.open_on}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : "Ready to read"}
                                </p>
                                {isSealed ? (
                                  <p className="mt-3 text-sm leading-6 text-[#817970]">This note is tucked away until its opening date. *</p>
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

) : active === "Albums" ? (
  <AlbumsView
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    memories={visibleMemories}
    onNotice={setNotice}
  />

  ) : active === "Scrapbook" ? (
  <ScrapbookDesigner
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    memories={visibleMemories}
    onNotice={setNotice}
  />


) : active === "Yearbook" ? (
  <YearbookExport
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    memories={visibleMemories}
    onNotice={setNotice}
  />
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
) : active === "Daily Prompts" ? (
  <DailyPrompts
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    onNotice={setNotice}
  />
) : active === "Daily Prompts" ? (
  <DailyPrompts
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    onNotice={setNotice}
  />
) : active === "Memory Map" ? (
  <MemoryMap memories={visibleMemories} spaceName={selectedSpace?.name ?? "your space"} />

) : active === "Time Capsules" ? (
  <TimeCapsules
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    onNotice={setNotice}
  />
) : active === "Gratitude Jar" ? (
  <GratitudeJar
    spaceId={selectedSpaceId}
    spaceName={selectedSpace?.name ?? ""}
    onNotice={setNotice}
  />
) : active === "Group Polls" ? (
  <GroupPolls
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
                      <ArrowUpRight size={16} /> Share space
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
                        <span>*</span> A gentle reminder
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
                        Save a little moment <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="absolute bottom-5 right-5 hidden rotate-6 text-7xl text-white/80 sm:block lg:right-16 lg:text-8xl">
                      *
                    </div>
                  </div>
                </div>

                <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e3e1] text-xl text-[#a96f75]">
                      *
                    </div>
                    <p className="text-2xl font-semibold">
                      {spaces.length.toString().padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-sm text-[#93877e]">Little spaces</p>
                  </div>

                  <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eae4f3] text-xl text-[#8171a3]">
                      <Layers3 size={22} strokeWidth={1.8} />
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
                      *
                    </div>
                    <p className="text-2xl font-semibold">&infin;</p>
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
                    View all <ArrowRight size={16} className="inline" />
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
                      <Search size={16} />
                    </span>
                    <input
                      id="memory-search"
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search titles and stories in this space..."
                      className="w-full rounded-xl border border-[#eee6df] bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#b0a69e] focus:border-[#b9a6bb]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {loading ? (
                    <p className="text-sm text-[#93877e]">
                      Gathering your little moments...
                    </p>
                  ) : filteredMemories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white/70 p-8 md:col-span-2 xl:col-span-3">
                      <p className="text-lg font-medium">
                        {visibleMemories.length > 0
                          ? "No memories match your search. *"
                          : selectedSpace
                            ? `Nothing saved in ${selectedSpace.name} yet. *`
                            : "Your story starts here. *"}
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
                              <p className="mb-3 text-2xl text-[#9c8198]">
  <Heart size={24} strokeWidth={1.6} />
</p>
                              <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#62575f]">
                                {memory.content || memory.title}
                              </p>
                            </div>
                            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs text-[#806780]">
                              <Heart size={12} className="mr-1 inline" /> Keep this
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
                              Read memory <ArrowRight size={16} className="ml-1 inline" />
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
                      <span className="ml-auto text-[#b0a1ae]">
  <ArrowRight size={16} />
</span>
                    </button>
                  </div>
                </div>

                <footer className="pb-4 pt-10 text-center text-xs text-[#aaa097]">
                  Made for the moments that matter *
                </footer>
              </>
            )}
          </div>
        </section>
      </div>

            {showMore && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute inset-0 bg-[#29232b]/20" />
          <section
            aria-label="More navigation options"
            className="absolute inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] max-h-[65dvh] overflow-y-auto rounded-3xl border border-[#ebe5df] bg-[#fffdfa] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#514451]">More features</h2>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="rounded-xl px-3 py-2 text-sm text-[#816780] hover:bg-[#f8f1f7]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {navItems
                .filter((item) => !["Home", "My spaces", "Memory Jar"].includes(item.label))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setShowMore(false);
                        chooseNav(item.label);
                      }}
                      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center text-xs transition ${
                        active === item.label
                          ? "border-[#cdb7ce] bg-[#f4edf4] text-[#816780]"
                          : "border-[#eee6df] text-[#716572] hover:bg-[#faf5fa]"
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#ebe5df] bg-[#fffdfa]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg lg:hidden"
      >
        {[
          { label: "Home", icon: House },
          { label: "Spaces", icon: Layers3 },
          { label: "Create", icon: Plus },
          { label: "Jar", icon: Archive },
          { label: "More", icon: Ellipsis },
        ].map((item) => {
          const Icon = item.icon;
          const isMore = item.label === "More";
          const isActive = isMore
            ? showMore || !["Home", "My spaces", "Memory Jar"].includes(active)
            : active === item.label ||
              (item.label === "Spaces" && active === "My spaces") ||
              (item.label === "Jar" && active === "Memory Jar");

          return (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              aria-expanded={isMore ? showMore : undefined}
              onClick={() => {
                if (item.label === "Create") {
                  setShowMore(false);
                  setShowCreate(true);
                } else if (isMore) {
                  setShowMore((current) => !current);
                } else {
                  setShowMore(false);
                  chooseNav(
                    item.label === "Spaces"
                      ? "My spaces"
                      : item.label === "Jar"
                        ? "Memory Jar"
                        : item.label
                  );
                }
              }}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] transition ${
                isActive ? "text-[#816780]" : "text-[#a49a90]"
              }`}
            >
              <span
                className={`flex h-7 w-9 items-center justify-center rounded-xl ${
                  item.label === "Create" ? "bg-[#816780] text-white" : ""
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
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
                x
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
                {creatingInvitation ? "Creating link..." : "Create private link"}
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
                              {revokingInvitationId === invitation.invitation_id ? "Revoking..." : "Revoke"}
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
                *
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
                x
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
                      *
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        A memory
                      </span>
                      <span className="mt-1 block text-xs text-[#93877e]">
                        Save a story or a little moment.
                      </span>
                    </span>
                    <span className="ml-auto text-[#b0a1ae]">
  <ArrowRight size={16} />
</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateMode("space")}
                    className="flex w-full items-center gap-4 rounded-2xl border border-[#eee6df] p-4 text-left transition hover:border-[#cbb7ca] hover:bg-[#f8f1f7]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eee4ed] text-[#816780]">
  <Layers3 size={22} strokeWidth={1.8} />
</span>
                    <span>
                      <span className="block text-sm font-semibold">
                        A private space
                      </span>
                      <span className="mt-1 block text-xs text-[#93877e]">
                        Create a corner for your people.
                      </span>
                    </span>
                    <span className="ml-auto text-[#b0a1ae]">
  <ArrowRight size={16} />
</span>
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
                      *
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        A future plan
                      </span>
                      <span className="mt-1 block text-xs text-[#93877e]">
                        Dream up something to do together.
                      </span>
                    </span>
                    <span className="ml-auto text-[#b0a1ae]">
  <ArrowRight size={16} />
</span>
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
                    {saving ? "Creating your space..." : "Create private space"}
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

                    <label className="mt-4 block text-sm font-medium">
                      Place name (optional)
                      <input
                        type="text"
                        value={memoryPlaceName}
                        onChange={(event) => setMemoryPlaceName(event.target.value)}
                        placeholder="e.g. Charminar, Hyderabad"
                        className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                      />
                    </label>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="block text-sm font-medium">
                        Latitude (optional)
                        <input
                          type="number"
                          step="any"
                          value={memoryLatitude}
                          onChange={(event) => setMemoryLatitude(event.target.value)}
                          placeholder="17.3616"
                          className="mt-2 w-full min-w-0 rounded-xl border border-[#e7dce5] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98ca7]"
                        />
                      </label>
                      <label className="block text-sm font-medium">
                        Longitude (optional)
                        <input
                          type="number"
                          step="any"
                          value={memoryLongitude}
                          onChange={(event) => setMemoryLongitude(event.target.value)}
                          placeholder="78.4747"
                          className="mt-2 w-full min-w-0 rounded-xl border border-[#e7dce5] bg-white px-3 py-3 text-sm outline-none focus:border-[#a98ca7]"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        saving || !selectedSpaceId || !memoryTitle.trim()
                      }
                      className="w-full rounded-xl bg-[#816780] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving your memory..." : "Save this memory *"}
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

      {detailMemory && typeof document !== "undefined" && createPortal((
        <div
          className="memory-detail-overlay fixed inset-0 z-[2147483000] flex items-center justify-center bg-[#29232b]/65 p-3 backdrop-blur-sm sm:p-5"
          data-space-theme={spaceThemeSettings[detailMemory.space_id]?.theme_key ?? "default"}
          data-appearance={appearance}
          onClick={() => setDetailMemory(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-detail-title"
            className="memory-detail-dialog max-h-[min(88dvh,900px)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-5 shadow-2xl sm:p-8"
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
                x
              </button>
            </div>

            <div className="rounded-2xl bg-[#f8f1f7] p-5 sm:p-7">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#62575f]">
                {detailMemory.content ||
                  "A little moment saved, even if the story is still waiting to be written. *"}
              </p>
            </div>
            <LinkedVoicePlayer
              memoryId={detailMemory.id}
              spaceId={detailMemory.space_id}
              onNotice={setNotice}
            />
<MemoryInteractions
  memoryId={detailMemory.id}
  spaceId={detailMemory.space_id}
  onNotice={setNotice}
/>
            <section className="mt-7">
              <h3 className="text-lg font-semibold text-[#514451]">
                Photos from this moment *
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
                  {uploadingPhoto ? "Uploading photo..." : "Upload photo *"}
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
                  [Edit] Edit memory
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
      ), document.body)}

      {showProfileEditor && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#29232b]/45 p-4 backdrop-blur-sm"
          onClick={() => !profileSaving && setShowProfileEditor(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-editor-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">A little about you</p>
                <h2 id="profile-editor-title" className="mt-2 text-2xl font-semibold text-[#514451]">Edit your profile</h2>
                <p className="mt-2 text-sm leading-6 text-[#91867d]">Update your name, nickname, bio, and profile photo.</p>
              </div>
              <button type="button" disabled={profileSaving} onClick={() => setShowProfileEditor(false)} aria-label="Close profile editor" className="rounded-full px-3 py-1 text-2xl text-[#a49a90] hover:bg-[#f5eef4] disabled:opacity-50"><X size={18} /></button>
            </div>

            {profileLoading ? (
              <p className="py-10 text-center text-sm text-[#92877d]">Loading your profile…</p>
            ) : (
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe7dc] text-xl font-semibold text-[#5e765b]">
                    {(profilePreviewUrl || profileAvatarUrl) ? (
                      <img src={profilePreviewUrl || profileAvatarUrl} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      (profileDisplayName || profileNickname || profileEmail || "Y").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "Y"
                    )}
                  </div>
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-[#514451]" htmlFor="profile-avatar">Profile photo</label>
                    <input id="profile-avatar" type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (!file) return;
                      if (!file.type.startsWith("image/")) { setNotice("Choose an image file for your profile photo."); return; }
                      if (file.size > 5 * 1024 * 1024) { setNotice("Profile photos must be 5 MB or smaller."); return; }
                      setSelectedAvatarFile(file);
                      setProfilePreviewUrl(URL.createObjectURL(file));
                      setNotice("");
                    }} className="mt-2 block w-full text-xs text-[#817970] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f4edf4] file:px-3 file:py-2 file:font-medium file:text-[#816780]" />
                    <p className="mt-1 text-xs text-[#92877d]">PNG, JPG, or another image type Â· up to 5 MB</p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-[#514451]">Display name
                  <input maxLength={80} value={profileDisplayName} onChange={(event) => setProfileDisplayName(event.target.value)} placeholder="Your name" className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]" />
                </label>
                <label className="block text-sm font-medium text-[#514451]">Username
                  <div className="mt-2 flex items-center rounded-xl border border-[#e7dce5] bg-white px-4 focus-within:border-[#a98ca7]">
                    <span className="text-sm text-[#a1978d]">@</span>
                    <input required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" value={profileUsername} onChange={(event) => setProfileUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="your_username" className="w-full border-0 bg-transparent px-2 py-3 text-sm outline-none" />
                  </div>
                  <span className="mt-1 block text-xs font-normal text-[#92877d]">People can search this username. Use 3–24 letters, numbers, or underscores.</span>
                </label>
                <label className="block text-sm font-medium text-[#514451]">Nickname
                  <input maxLength={40} value={profileNickname} onChange={(event) => setProfileNickname(event.target.value)} placeholder="How should people call you?" className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]" />
                </label>
                <label className="block text-sm font-medium text-[#514451]">Bio
                  <textarea rows={3} maxLength={240} value={profileBio} onChange={(event) => setProfileBio(event.target.value)} placeholder="A little about you…" className="mt-2 w-full resize-y rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#a98ca7]" />
                </label>
                <div className="rounded-xl bg-[#faf7f3] px-4 py-3">
                  <p className="text-xs text-[#a1978d]">Email address</p>
                  <p className="mt-1 break-all text-sm font-medium text-[#514451]">{profileEmail || "Not available"}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button type="button" disabled={profileSaving} onClick={() => setShowProfileEditor(false)} className="rounded-xl border border-[#e7dce5] px-4 py-3 text-sm text-[#817970] disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={profileSaving} className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-60">{profileSaving ? "Saving profile…" : "Save profile"}</button>
                </div>
              </form>
            )}
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
                x
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
                  {saving ? "Saving changes..." : "Save changes *"}
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
              *
            </div>
            <h2
              id="delete-memory-title"
              className="mt-5 text-2xl font-semibold text-[#514451]"
            >
              Delete this memory?
            </h2>
            <p className="mt-3 break-words text-sm leading-6 text-[#817970]">
              <span className="font-medium text-[#62575f]">
                &ldquo;{deleteTarget.title}&rdquo;
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
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    {showTutorial && (
      <div className="fixed inset-0 z-[2147483100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="memory-space-tutorial-title">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-7 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet-700">MEMORY SPACE TOUR</span>
              <button type="button" onClick={finishMemorySpaceTutorial} className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white" aria-label="Skip tutorial">Skip</button>
            </div>
            <p className="mt-5 text-sm font-medium text-violet-600">Step {tutorialStep + 1} of {memorySpaceTutorialSteps.length}</p>
            <h2 id="memory-space-tutorial-title" className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">{memorySpaceTutorialSteps[tutorialStep].title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{memorySpaceTutorialSteps[tutorialStep].description}</p>
          </div>
          <div className="px-6 py-5 sm:px-8">
            <div className="mb-6 flex gap-1.5" aria-label="Tutorial progress">
              {memorySpaceTutorialSteps.map((step, index) => (
                <span key={step.title} className={"h-1.5 flex-1 rounded-full " + (index <= tutorialStep ? "bg-violet-500" : "bg-slate-100")} />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setTutorialStep((step) => Math.max(0, step - 1))} disabled={tutorialStep === 0} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
              <button type="button" onClick={finishMemorySpaceTutorial} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Finish tour</button>
              {tutorialStep < memorySpaceTutorialSteps.length - 1 ? (
                <button type="button" onClick={() => setTutorialStep((step) => Math.min(memorySpaceTutorialSteps.length - 1, step + 1))} className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Next →</button>
              ) : (
                <button type="button" onClick={finishMemorySpaceTutorial} className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Finish ✓</button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </main>
  );
}












