import { connection, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "node:stream";
import { createGoogleDriveOAuthClient } from "@/lib/google-drive";
import { decryptRefreshToken } from "@/lib/google-drive-crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
  "audio/aac",
]);

export async function POST(request: Request) {
  await connection();

  try {
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { success: false, error: "Request origin is not allowed." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Please sign in first." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const spaceId = formData.get("spaceId");

    if (typeof spaceId !== "string" || !spaceId.trim()) {
      return NextResponse.json(
        { success: false, error: "A valid space is required." },
        { status: 400 }
      );
    }

    // Verify that the signed-in user belongs to this space.
    const { data: membership, error: membershipError } = await supabase
      .from("space_members")
      .select("space_id")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this space." },
        { status: 403 }
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No audio file was provided." },
        { status: 400 }
      );
    }

    if (file.size < 1 || file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { success: false, error: "Audio must be between 1 byte and 25 MB." },
        { status: 400 }
      );
    }

    const mimeType = file.type.split(";")[0].toLowerCase();

    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: "This audio format is not supported." },
        { status: 415 }
      );
    }

    const admin = createAdminClient();

    const { data: savedConnection, error: connectionError } = await admin
      .from("google_drive_connections")
      .select("encrypted_refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      throw new Error("Could not read the saved Drive connection.");
    }

    if (!savedConnection?.encrypted_refresh_token) {
      return NextResponse.json(
        { success: false, error: "Connect Google Drive first." },
        { status: 404 }
      );
    }

    const { data: folders, error: folderError } = await admin
      .from("google_drive_folders")
      .select("voice_notes_folder_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (folderError) {
      throw new Error("Could not read your Drive folder settings.");
    }

    if (!folders?.voice_notes_folder_id) {
      return NextResponse.json(
        { success: false, error: "Set up your Drive folders first." },
        { status: 404 }
      );
    }

    const refreshToken = decryptRefreshToken(
      savedConnection.encrypted_refresh_token
    );

    const oauthClient = createGoogleDriveOAuthClient();

    oauthClient.setCredentials({
      refresh_token: refreshToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauthClient,
    });

    const bytes = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || "voice-memory";

    const extension =
      originalName.match(/\.(webm|ogg|m4a|mp4|mp3|wav|aac)$/i)?.[0] ??
      (mimeType === "audio/ogg"
        ? ".ogg"
        : mimeType === "audio/mp4" || mimeType === "audio/x-m4a"
          ? ".m4a"
          : mimeType === "audio/mpeg"
            ? ".mp3"
            : mimeType === "audio/wav"
              ? ".wav"
              : mimeType === "audio/aac"
                ? ".aac"
                : ".webm");

    const safeName =
      originalName
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9._ -]/g, "_")
        .slice(0, 140) || "voice-memory";

    const uploaded = await drive.files.create({
      requestBody: {
        name: `${safeName}${extension}`,
        mimeType,
        parents: [folders.voice_notes_folder_id],
      },
      media: {
        mimeType,
        body: Readable.from(bytes),
      },
      fields: "id,name,mimeType,size",
    });

    if (!uploaded.data.id) {
      throw new Error("Google Drive did not return a file ID.");
    }

    return NextResponse.json({
      success: true,
      file: {
        id: uploaded.data.id,
        name: uploaded.data.name,
        mimeType: uploaded.data.mimeType || mimeType,
        sizeBytes: file.size,
      },
    });
  } catch (error) {
    console.error(
      "Google Drive voice upload failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Voice upload failed. Check your Drive connection and try again.",
      },
      { status: 502 }
    );
  }
}