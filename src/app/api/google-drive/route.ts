
import { connection, NextResponse } from "next/server";
import { createGoogleDriveOAuthClient } from "@/lib/google-drive";
import { createClient } from "@/lib/supabase/server";


export async function GET() {
  await connection();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(
        new URL(
          "/auth",
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        )
      );
    }

    const oauth2Client = createGoogleDriveOAuthClient();
    const state = crypto.randomUUID();

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      state,
    });

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set("google_drive_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    response.cookies.set("google_drive_oauth_user", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error("Google Drive OAuth start failed:", error);

    return NextResponse.json(
      { error: "Unable to start Google Drive connection." },
      { status: 500 }
    );
  }
}
