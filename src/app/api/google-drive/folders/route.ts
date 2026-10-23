
import { connection, NextResponse } from "next/server";
import { google, type drive_v3 } from "googleapis";
import { createGoogleDriveOAuthClient } from "@/lib/google-drive";
import { decryptRefreshToken } from "@/lib/google-drive-crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const CATEGORIES = [
  { key: "photos_videos_folder_id", name: "Photos & Videos" },
  { key: "voice_notes_folder_id", name: "Voice Notes" },
  { key: "letters_text_folder_id", name: "Letters & Text" },
  { key: "memory_jars_folder_id", name: "Memory Jars" },
  {
    key: "scrapbooks_yearbooks_folder_id",
    name: "Scrapbooks & Yearbooks",
  },
] as const;

async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string> {
  const escapedName = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const conditions = [
    `name = '${escapedName}'`,
    `mimeType = '${FOLDER_MIME}'`,
    "trashed = false",
  ];

  if (parentId) {
    conditions.push(`'${parentId}' in parents`);
  } else {
    conditions.push("'root' in parents");
  }

  const existing = await drive.files.list({
    q: conditions.join(" and "),
    pageSize: 100,
    fields: "files(id,name)",
  });

  const matching = existing.data.files?.find((file) => file.id);

  if (matching?.id) {
    return matching.id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id,name",
  });

  if (!created.data.id) {
    throw new Error(`Google Drive did not return an ID for ${name}.`);
  }

  return created.data.id;
}

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

    const admin = createAdminClient();

    const { data: connectionRow, error: lookupError } = await admin
      .from("google_drive_connections")
      .select("encrypted_refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Drive folder setup: connection lookup failed.");
      return NextResponse.json(
        { success: false, error: "Could not check your Drive connection." },
        { status: 500 }
      );
    }

    if (!connectionRow?.encrypted_refresh_token) {
      return NextResponse.json(
        { success: false, error: "Connect Google Drive first." },
        { status: 404 }
      );
    }

    const refreshToken = decryptRefreshToken(
      connectionRow.encrypted_refresh_token
    );

    const oauthClient = createGoogleDriveOAuthClient();
    oauthClient.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({
      version: "v3",
      auth: oauthClient,
    });

    const rootId = await findOrCreateFolder(drive, "Memory Space");

    const folderIds: Record<string, string> = {
      root_folder_id: rootId,
    };

    for (const category of CATEGORIES) {
      folderIds[category.key] = await findOrCreateFolder(
        drive,
        category.name,
        rootId
      );
    }

    const { error: saveError } = await admin
      .from("google_drive_folders")
      .upsert(
        {
          user_id: user.id,
          ...folderIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      console.error("Drive folder setup: folder IDs could not be saved.");
      return NextResponse.json(
        {
          success: false,
          error:
            "Folders were created or found, but their IDs could not be saved. You can safely retry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Google Drive folders are ready.",
      folders: [
        "Memory Space",
        ...CATEGORIES.map((category) => category.name),
      ],
    });
  } catch (error) {
    console.error(
      "Google Drive folder setup failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "Folder setup failed. Check the server logs for details.",
      },
      { status: 502 }
    );
  }
}
