
import { connection, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "node:stream";
import { createGoogleDriveOAuthClient } from "@/lib/google-drive";
import { decryptRefreshToken } from "@/lib/google-drive-crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAuthorizedRecording(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      ),
    };
  }

  // RLS must authorize access to the recording before Drive is accessed.
  const { data: recording, error: recordingError } = await supabase
    .from("voice_memories")
    .select("id,google_drive_file_id,mime_type,created_by")
    .eq("google_drive_file_id", id)
    .eq("storage_provider", "google_drive")
    .maybeSingle();

  if (recordingError || !recording) {
    return {
      error: NextResponse.json(
        { error: "Recording not found or access denied." },
        { status: 404 }
      ),
    };
  }

  const admin = createAdminClient();
  const { data: savedConnection, error: connectionError } = await admin
    .from("google_drive_connections")
    .select("encrypted_refresh_token")
    .eq("user_id", recording.created_by)
    .maybeSingle();

  if (connectionError || !savedConnection?.encrypted_refresh_token) {
    return {
      error: NextResponse.json(
        { error: "Drive connection unavailable." },
        { status: 503 }
      ),
    };
  }

  const oauthClient = createGoogleDriveOAuthClient();
  oauthClient.setCredentials({
    refresh_token: decryptRefreshToken(
      savedConnection.encrypted_refresh_token
    ),
  });

  return {
    supabase,
    recording,
    drive: google.drive({ version: "v3", auth: oauthClient }),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connection();

  try {
    const { id } = await context.params;

    if (!id || id.length > 200) {
      return NextResponse.json(
        { error: "Invalid file ID." },
        { status: 400 }
      );
    }

    const authorized = await getAuthorizedRecording(id);
    if ("error" in authorized) return authorized.error;

    const { drive, recording } = authorized;

    const result = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "stream" }
    );

    const stream = result.data as unknown as NodeJS.ReadableStream;
    const webStream = Readable.toWeb(stream as Readable) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": recording.mime_type || "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error(
      "Private Drive voice playback failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Could not play this recording." },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connection();

  try {
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id || id.length > 200) {
      return NextResponse.json(
        { error: "Invalid file ID." },
        { status: 400 }
      );
    }

    const authorized = await getAuthorizedRecording(id);
    if ("error" in authorized) return authorized.error;

    const { drive, recording, supabase } = authorized;

    // Delete the Drive file first. Keep the database row if Drive deletion fails.
    await drive.files.delete({ fileId: id });

    const { error: deleteError } = await supabase
      .from("voice_memories")
      .delete()
      .eq("id", recording.id)
      .eq("google_drive_file_id", id)
      .eq("storage_provider", "google_drive");

    if (deleteError) {
      console.error(
        "Drive file deleted but recording row cleanup failed:",
        deleteError.message
      );

      return NextResponse.json(
        {
          error:
            "The Drive file was deleted, but its database record could not be removed. Please refresh and contact support if it remains.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Private Drive voice deletion failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Could not delete this Drive recording." },
      { status: 502 }
    );
  }
}
