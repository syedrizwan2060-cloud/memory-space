
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  Database,
  HardDrive,
  Image as ImageIcon,
  Mic,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

type StorageReport = {
  generatedAt: string;
  files: {
    photos: { count: number; bytes: number };
    voice: { count: number; bytes: number };
    total: { count: number; bytes: number };
  };
  drive: { connected: boolean };
  personalQuota: {
    known: boolean;
    limitBytes: number | null;
    usedBytes: number | null;
    reservedBytes: number | null;
    remainingBytes: number | null;
    objectCount: number | null;
  };
  projectStorage: {
    known: boolean;
    usedBytes: number | null;
    objectCount: number | null;
    source: string;
  };
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${units[unit]}`;
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Database;
}) {
  return (
    <article className="rounded-3xl border border-[#eee6df] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#817486]">{title}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4edf4] text-[#816780]">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-5 break-words text-2xl font-semibold tracking-tight text-[#514451]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#92877d]">{detail}</p>
    </article>
  );
}

export default function StorageDashboard() {
  const [report, setReport] = useState<StorageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch("/api/storage/usage", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Could not load storage information."
        );
      }

      setReport(result as StorageReport);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load storage information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const personalQuota = report?.personalQuota;

  const personalCommittedBytes =
    personalQuota?.usedBytes !== null &&
    personalQuota?.usedBytes !== undefined
      ? personalQuota.usedBytes + (personalQuota.reservedBytes ?? 0)
      : null;

  const quotaPercent =
    personalQuota?.known &&
    personalQuota.limitBytes !== null &&
    personalQuota.limitBytes > 0 &&
    personalCommittedBytes !== null
      ? Math.min(
          100,
          (personalCommittedBytes / personalQuota.limitBytes) * 100
        )
      : null;

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
            YOUR SPACE, SAFELY STORED
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#514451] sm:text-4xl">
            Storage
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">
            Check your personal storage, media records, and connected storage
            services. Your private files stay private.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReport(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#d9c8d8] bg-white px-4 py-3 text-sm font-medium text-[#816780] transition hover:bg-[#f8f1f7] disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#f0d2ca] bg-[#fff6f2] p-4 text-sm leading-6 text-[#9a5147]"
        >
          <p className="font-semibold">Storage information unavailable</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void loadReport(true)}
            className="mt-3 rounded-lg border border-[#e8bdb4] px-3 py-2 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !report ? (
        <div
          className="rounded-3xl border border-[#eee6df] bg-white p-8 text-sm text-[#8d8379]"
          role="status"
        >
          Loading your storage report…
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Tracked media"
              value={formatBytes(report.files.total.bytes)}
              detail={`${report.files.total.count} photo and voice recording files represented in the report`}
              icon={Database}
            />
            <MetricCard
              title="Photos"
              value={formatBytes(report.files.photos.bytes)}
              detail={`${report.files.photos.count} photo records`}
              icon={ImageIcon}
            />
            <MetricCard
              title="Voice memories"
              value={formatBytes(report.files.voice.bytes)}
              detail={`${report.files.voice.count} recording records`}
              icon={Mic}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#687b61]">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h2 className="font-semibold text-[#514451]">
                    Your personal storage
                  </h2>
                  <p className="mt-1 text-xs text-[#92877d]">
                    Your own storage allowance
                  </p>
                </div>
              </div>

              {personalQuota?.known &&
              personalQuota.limitBytes !== null &&
              personalQuota.usedBytes !== null ? (
                <>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold text-[#514451]">
                        {formatBytes(
                          personalCommittedBytes ?? personalQuota.usedBytes
                        )}
                      </p>
                      <p className="mt-1 text-sm text-[#817486]">
                        of {formatBytes(personalQuota.limitBytes)} used or
                        reserved
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#816780]">
                      {Math.round(quotaPercent ?? 0)}%
                    </p>
                  </div>

                  <div
                    className="mt-4 h-3 overflow-hidden rounded-full bg-[#e9dce4]"
                    role="progressbar"
                    aria-label="Personal storage usage"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(quotaPercent ?? 0)}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        (quotaPercent ?? 0) >= 95
                          ? "bg-[#b75d64]"
                          : (quotaPercent ?? 0) >= 80
                            ? "bg-[#c69a54]"
                            : "bg-[#816780]"
                      }`}
                      style={{ width: `${quotaPercent ?? 0}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#faf7f3] p-3">
                      <p className="text-xs text-[#92877d]">Uploaded files</p>
                      <p className="mt-1 font-semibold text-[#514451]">
                        {formatBytes(personalQuota.usedBytes)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#faf7f3] p-3">
                      <p className="text-xs text-[#92877d]">Still available</p>
                      <p className="mt-1 font-semibold text-[#514451]">
                        {formatBytes(personalQuota.remainingBytes ?? 0)}
                      </p>
                    </div>
                  </div>

                  {(quotaPercent ?? 0) >= 95 ? (
                    <div className="mt-4 rounded-2xl border border-[#f0d2ca] bg-[#fff6f2] p-4">
                      <p className="flex items-start gap-2 text-sm font-semibold text-[#a34d55]">
                        <TriangleAlert
                          size={17}
                          className="mt-0.5 shrink-0"
                        />
                        Your storage is almost full.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#9a5147]">
                        Google Drive is connected to your account, but automatic storage fallback is not active yet. You can free up space before uploading more files.
                      </p>
                    </div>
                  ) : (quotaPercent ?? 0) >= 80 ? (
                    <div className="mt-4 rounded-2xl border border-[#eadfc8] bg-[#fffaf0] p-4">
                      <p className="flex items-start gap-2 text-sm font-semibold text-[#96713c]">
                        <TriangleAlert
                          size={17}
                          className="mt-0.5 shrink-0"
                        />
                        You&apos;re getting close to your storage limit.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#817486]">
                        Google Drive is connected, but automatic routing of new uploads to Drive is still being developed.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-5 text-sm leading-6 text-[#817486]">
                  Your personal storage usage could not be calculated. Refresh
                  the report and try again.
                </p>
              )}

              <div className="mt-5 border-t border-[#eee6df] pt-4">
                <h3 className="text-sm font-semibold text-[#514451]">
                  Project storage information
                </h3>
                {report.projectStorage.known &&
                report.projectStorage.usedBytes !== null ? (
                  <>
                    <p className="mt-2 text-sm text-[#817486]">
                      {formatBytes(report.projectStorage.usedBytes)} across{" "}
                      {report.projectStorage.objectCount ?? 0} objects in this
                      project.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#92877d]">
                      {report.projectStorage.source}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-[#817486]">
                    Project object totals are currently unavailable. Your
                    personal quota is tracked separately.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf3fa] text-[#557d9a]">
                  <HardDrive size={22} />
                </span>
                <div>
                  <h2 className="font-semibold text-[#514451]">
                    Google Drive
                  </h2>
                  <p className="mt-1 text-xs text-[#92877d]">
                    Larger media storage
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#faf7f3] p-4">
                <p className="text-sm font-semibold text-[#514451]">
                  {report.drive.connected ? "Connected" : "Not connected"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#817486]">
                  {report.drive.connected
                    ? "Your Google Drive account is linked. We still need to verify file access before enabling uploads and downloads through Drive."
                    : "Connect your Google Drive account to prepare for larger media storage. Your existing media workflow remains unchanged."}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#8d8379]">
                <Cloud size={18} className="mt-1 shrink-0 text-[#816780]" />
                <p>
                  Your connection is stored securely on the server. Actual Drive uploads, previews, downloads, and automatic storage fallback are not enabled yet.
                </p>
              </div>
            </article>
          </div>

          <p className="text-xs leading-5 text-[#a0958c]">
            Last refreshed: {new Date(report.generatedAt).toLocaleString()}
          </p>
        </>
      ) : null}
    </section>
  );
}
