
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 1000;

type MediaRow = {
  size_bytes: number | string;
};

type UsageRow = {
  limit_bytes: number | string;
  used_bytes: number | string;
  reserved_bytes: number | string;
  remaining_bytes: number | string;
  object_count: number | string;
};

async function readMediaTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "memory_media" | "voice_memories"
) {
  let count = 0;
  let bytes = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("size_bytes")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to read ${table} metadata.`);
    }

    const rows = (data ?? []) as MediaRow[];

    for (const row of rows) {
      const size = Number(row.size_bytes);

      if (Number.isFinite(size) && size >= 0) {
        count += 1;
        bytes += size;
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { count, bytes };
}

function toSafeNumber(value: unknown, label: string): number {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Storage usage returned an invalid ${label}.`);
  }

  return number;
}

export async function GET(request: Request) {
  // Read request-specific data so Next.js treats this as request-time work.
  const requestCookie = request.headers.get("cookie");
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to view storage information." },
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-store",
            Vary: "Cookie",
          },
        }
      );
    }

    // Personal quota: actual objects plus outstanding upload reservations.
    const { data: personalRows, error: personalError } = await supabase.rpc(
      "get_personal_storage_usage"
    );

    if (personalError) {
      console.error("Personal storage usage RPC failed:", personalError);
      return NextResponse.json(
        {
          error:
            "Could not load your personal storage usage. Please try again.",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "private, no-store",
            Vary: "Cookie",
          },
        }
      );
    }

    const personalRow = (
      Array.isArray(personalRows) ? personalRows[0] : personalRows
    ) as UsageRow | null;

    if (!personalRow) {
      throw new Error("Personal storage usage returned no result.");
    }

    const personalQuota = {
      known: true,
      limitBytes: toSafeNumber(personalRow.limit_bytes, "personal limit"),
      usedBytes: toSafeNumber(personalRow.used_bytes, "personal used bytes"),
      reservedBytes: toSafeNumber(
        personalRow.reserved_bytes,
        "reserved bytes"
      ),
      remainingBytes: toSafeNumber(
        personalRow.remaining_bytes,
        "remaining bytes"
      ),
      objectCount: toSafeNumber(personalRow.object_count, "personal file count"),
    };

    // These are separate project-object totals, not the organisation's
    // official billed storage usage or the user's personal quota.
    let projectStorage: {
      known: boolean;
      usedBytes: number | null;
      objectCount: number | null;
      source: string;
    } = {
      known: false,
      usedBytes: null,
      objectCount: null,
      source:
        "Project-level object totals are unavailable. These totals would not represent the organisation's complete billed usage.",
    };

    const { data: projectRows, error: projectError } = await supabase.rpc(
      "get_project_storage_usage"
    );

    if (!projectError) {
      const projectRow = (
        Array.isArray(projectRows) ? projectRows[0] : projectRows
      ) as {
        total_bytes?: number | string;
        object_count?: number | string;
      } | null;

      if (projectRow) {
        try {
          projectStorage = {
            known: true,
            usedBytes: toSafeNumber(
              projectRow.total_bytes,
              "project object bytes"
            ),
            objectCount: toSafeNumber(
              projectRow.object_count,
              "project object count"
            ),
            source:
              "Current project's object totals only. This is not the organisation's complete billed storage usage.",
          };
        } catch {
          // Keep project totals unavailable if their values are invalid.
        }
      }
    } else {
      console.warn("Project storage usage is unavailable:", projectError);
    }

    const [photos, voice] = await Promise.all([
      readMediaTotals(supabase, "memory_media"),
      readMediaTotals(supabase, "voice_memories"),
    ]);

    const admin = createAdminClient();
    const {
      data: driveConnection,
      error: driveConnectionError,
    } = await admin
      .from("google_drive_connections")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (driveConnectionError) {
      console.error("Google Drive status lookup failed:", driveConnectionError);
      throw new Error("Could not check Google Drive connection.");
    }

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        files: {
          photos,
          voice,
          total: {
            count: photos.count + voice.count,
            bytes: photos.bytes + voice.bytes,
          },
        },
        personalQuota,
        projectStorage,
        drive: {
          connected: Boolean(driveConnection),
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
          Vary: "Cookie",
        },
      }
    );
  } catch (error) {
    console.error("Storage usage report failed:", error);

    return NextResponse.json(
      {
        error: "Could not load storage information. Please try again.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
          Vary: "Cookie",
        },
      }
    );
  }
}
