
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }

      setSignedIn(true);
      setLoading(false);
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function acceptInvitation() {
    if (!token) {
      setError("This invitation link is missing its token.");
      return;
    }

    setAccepting(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Please sign in before accepting this invitation.");
        setAccepting(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "accept_space_invitation",
        { p_token: token }
      );

      if (rpcError) {
        throw rpcError;
      }

      if (!data || typeof data !== "string") {
        throw new Error(
          "The invitation could not be accepted. Please try again."
        );
      }

      setMessage("Invitation accepted! Opening your space...");

      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      const details =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      setError(
        `${details} If the invitation is expired or revoked, ask the space owner for a new link.`
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] p-6">
        <p className="text-sm text-[#6f6480]">
          Checking your sign-in status...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] p-6">
      <section className="w-full max-w-md rounded-3xl border border-[#e9e0ef] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8fa] text-3xl">
          ♡
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8b78a8]">
          Memory Space
        </p>

        <h1 className="mb-3 text-2xl font-semibold text-[#302640]">
          You’re invited!
        </h1>

        <p className="mb-6 text-sm leading-6 text-[#756b80]">
          Someone has invited you to share memories in a private space.
          Sign in to your account to accept the invitation.
        </p>

        {!token && (
          <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            This invitation link is missing its token. Please use the complete
            link shared with you.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-3 text-left text-sm leading-5 text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl bg-green-50 p-3 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        {!signedIn ? (
          <Link
            href={`/auth?next=${encodeURIComponent(
              `/invite?token=${token ?? ""}`
            )}`}
            className="block w-full rounded-xl bg-[#72558f] px-5 py-3 font-medium text-white transition hover:bg-[#60447c]"
          >
            Sign in to continue
          </Link>
        ) : (
          <button
            type="button"
            onClick={acceptInvitation}
            disabled={!token || accepting}
            className="w-full rounded-xl bg-[#72558f] px-5 py-3 font-medium text-white transition hover:bg-[#60447c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accepting ? "Accepting invitation..." : "Accept invitation"}
          </button>
        )}

        <Link
          href="/"
          className="mt-4 inline-block text-sm text-[#81748f] underline underline-offset-4"
        >
          Back to Memory Space
        </Link>
      </section>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] p-6">
          <p className="text-sm text-[#6f6480]">
            Loading invitation...
          </p>
        </main>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}
