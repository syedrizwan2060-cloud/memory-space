
import { NextRequest, NextResponse } from "next/server";
import { createGoogleDriveOAuthClient } from "@/lib/google-drive";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptRefreshToken } from "@/lib/google-drive-crypto";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const savedState = request.cookies.get("google_drive_oauth_state")?.value;
  const savedUserId = request.cookies.get("google_drive_oauth_user")?.value;

  const clearOAuthCookies = (response: NextResponse) => {
    response.cookies.set("google_drive_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("google_drive_oauth_user", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  };

  if (
    !code ||
    !returnedState ||
    !savedState ||
    returnedState !== savedState ||
    !savedUserId
  ) {
    return clearOAuthCookies(
      NextResponse.redirect(new URL("/auth?drive=verification_failed", origin))
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== savedUserId) {
      return clearOAuthCookies(
        NextResponse.redirect(new URL("/auth?drive=session_mismatch", origin))
      );
    }

    const oauth2Client = createGoogleDriveOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return clearOAuthCookies(
        NextResponse.redirect(new URL("/?drive=missing_refresh_token", origin))
      );
    }

    const admin = createAdminClient();
    const encryptedRefreshToken = encryptRefreshToken(tokens.refresh_token);

    const { error: saveError } = await admin
      .from("google_drive_connections")
      .upsert(
        {
          user_id: user.id,
          encrypted_refresh_token: encryptedRefreshToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      console.error("Google Drive token save failed:", saveError.message);
      return clearOAuthCookies(
        NextResponse.redirect(new URL("/?drive=save_failed", origin))
      );
    }

    return clearOAuthCookies(
      NextResponse.redirect(new URL("/?drive=connected", origin))
    );
  } catch (error) {
    console.error("Google Drive callback failed:", error);
    return clearOAuthCookies(
      NextResponse.redirect(new URL("/?drive=connection_failed", origin))
    );
  }
}
