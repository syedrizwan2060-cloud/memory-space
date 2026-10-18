import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

async function AuthenticatedDashboard() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth");
  }

  return <DashboardClient />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthenticatedDashboard />
    </Suspense>
  );
}


