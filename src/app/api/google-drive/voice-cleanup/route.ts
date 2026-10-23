import { connection, NextResponse } from "next/server";
import { google } from "googleapis";
import { createGoogleDriveOAuthClient } from "@/lib/google-drive";
import { decryptRefreshToken } from "@/lib/google-drive-crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request) {
  await connection();

  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return NextResponse.json(
      { success: false, error: "Invalid request origin." },
      { status: 403 }
    );
  }

  let body: { fileId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const fileId = body.fileId;

  if (typeof fileId !== "string" || !fileId.trim() || fileId.length > 200) {
    return NextResponse.json(
      { success: false, error: "Invalid Drive file ID." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Please sign in again." },
      { status: 401 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: savedConnection, error: connectionError } = await admin
      .from("google_drive_connections")
      .select("encrypted_refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      throw new Error("Could not read the saved Drive connection.");
    }

    const { data: folders, error: folderError } = await admin
      .from("google_drive_folders")
      .select("voice_notes_folder_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (folderError) {
      throw new Error("Could not read your Drive folder settings.");
    }

    if (!savedConnection?.encrypted_refresh_token || !folders?.voice_notes_folder_id) {
      return NextResponse.json(
        { success: false, error: "Your Drive connection or Voice Notes folder is unavailable." },
        { status: 404 }
      );
    }

    const oauthClient = createGoogleDriveOAuthClient();
    oauthClient.setCredentials({
      refresh_token: decryptRefreshToken(savedConnection.encrypted_refresh_token),
    });

    const drive = google.drive({ version: "v3", auth: oauthClient });

    const { data: file } = await drive.files.get({
      fileId: fileId.trim(),
      fields: "id,parents,trashed",
      supportsAllDrives: false,
    });

    if (
      file.trashed ||
      !file.parents?.includes(folders.voice_notes_folder_id)
    ) {
      return NextResponse.json(
        { success: false, error: "This file is not in your Voice Notes folder." },
        { status: 403 }
      );
    }

    await drive.files.delete({ fileId: fileId.trim() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Drive voice cleanup failed:", error);

    return NextResponse.json(
      { success: false, error: "Could not clean up the temporary Drive recording." },
      { status: 500 }
    );
  }
}
