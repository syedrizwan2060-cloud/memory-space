
"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedNext = searchParams.get("next");
  // Only allow internal relative paths to prevent external redirects.
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.replace(nextPath);
          router.refresh();
        } else {
          setMessage(
            "Account created! Check your email for a confirmation link, then sign in. After signing in, you'll return to your invitation if you followed an invite link."
          );
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.replace(nextPath);
        router.refresh();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf6f0] px-4 py-10 text-[#453d43]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#eee3e2] bg-white p-7 shadow-xl shadow-[#6d5360]/10 sm:p-10">
        <a href="/" className="text-sm text-[#81717d] hover:text-[#a76f8a]">
          ← Back to Memory Space
        </a>

        <div className="mb-8 mt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f5e2e8] text-3xl">
            ♡
          </div>
          <p className="text-sm font-medium tracking-[0.2em] text-[#a76f8a]">
            YOUR LITTLE CORNER
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#81717d]">
            Keep the people, plans, and moments you love in one place.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#f7f2f0] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            className={`rounded-lg px-3 py-3 text-sm font-medium ${
              mode === "signup" ? "bg-white shadow-sm" : "text-[#81717d]"
            }`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setMessage("");
            }}
            className={`rounded-lg px-3 py-3 text-sm font-medium ${
              mode === "signin" ? "bg-white shadow-sm" : "text-[#81717d]"
            }`}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#e8dcdf] bg-white px-4 py-3 outline-none transition focus:border-[#bb8ba0] focus:ring-2 focus:ring-[#f5e2e8]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-[#e8dcdf] bg-white px-4 py-3 outline-none transition focus:border-[#bb8ba0] focus:ring-2 focus:ring-[#f5e2e8]"
            />
          </div>

          {message && (
            <p
              role="status"
              className="rounded-xl bg-[#f7f2f0] p-3 text-sm leading-6"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#a76f8a] px-4 py-3.5 font-semibold text-white transition hover:bg-[#8f5874] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Create my account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-[#81717d]">
          Your memories deserve a safe and thoughtful home.
        </p>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-6">
          <p className="text-sm text-[#81717d]">Loading...</p>
        </main>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
