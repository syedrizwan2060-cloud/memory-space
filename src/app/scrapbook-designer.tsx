"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/client";

type Memory = {
  id: string;
  title: string;
  content: string;
  memory_date: string;
  space_id: string;
};

type Photo = {
  memory_id: string;
  object_path: string;
  caption: string | null;
  mime_type: string;
};

type PageDesign = {
  memoryId: string;
  note: string;
  layout: "classic" | "photo-focus" | "minimal";
};

const supabase = createClient();

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read a photo."));
    reader.readAsDataURL(blob);
  });
}

function formatDate(value: string) {
  if (!value) return "A moment worth remembering";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "A moment worth remembering"
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export default function ScrapbookDesigner({
  spaceId,
  spaceName,
  memories,
  onNotice,
}: {
  spaceId: string;
  spaceName: string;
  memories: Memory[];
  onNotice: (message: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverTitle, setCoverTitle] = useState(spaceName || "Our Little Scrapbook");
  const [subtitle, setSubtitle] = useState("Little moments, forever memories");
  const [theme, setTheme] = useState<"blush" | "lavender" | "sage">("blush");
  const [designs, setDesigns] = useState<Record<string, PageDesign>>({});
  const [exporting, setExporting] = useState(false);

  const selectedMemories = useMemo(
    () => selectedIds.map((id) => memories.find((memory) => memory.id === id)).filter((m): m is Memory => Boolean(m)),
    [selectedIds, memories]
  );

  function toggleMemory(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
    setDesigns((current) => ({
      ...current,
      [id]: current[id] ?? { memoryId: id, note: "", layout: "classic" },
    }));
  }

  function moveMemory(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateDesign(id: string, patch: Partial<PageDesign>) {
    setDesigns((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { memoryId: id, note: "", layout: "classic" }),
        ...patch,
      },
    }));
  }

  async function exportScrapbook() {
    if (!spaceId) {
      onNotice("Choose a space before designing its scrapbook.");
      return;
    }
    if (!selectedMemories.length) {
      onNotice("Select at least one memory for your scrapbook.");
      return;
    }

    setExporting(true);
    onNotice("");
    try {
      const { data: photoRows, error: photoError } = await supabase
        .from("memory_media")
        .select("memory_id, object_path, caption, mime_type")
        .eq("space_id", spaceId);

      if (photoError) throw new Error(`Could not load scrapbook photos: ${photoError.message}`);

      const photosByMemory = new Map<string, Photo[]>();
      for (const photo of (photoRows ?? []) as Photo[]) {
        const list = photosByMemory.get(photo.memory_id) ?? [];
        list.push(photo);
        photosByMemory.set(photo.memory_id, list);
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 17;
      const textWidth = pageWidth - margin * 2;
      const palettes = {
        blush: { bg: [255, 246, 246] as [number, number, number], accent: [160, 103, 130] as [number, number, number], ink: [66, 54, 60] as [number, number, number] },
        lavender: { bg: [248, 245, 255] as [number, number, number], accent: [120, 103, 164] as [number, number, number], ink: [55, 49, 69] as [number, number, number] },
        sage: { bg: [245, 250, 244] as [number, number, number], accent: [91, 128, 101] as [number, number, number], ink: [48, 61, 51] as [number, number, number] },
      };
      const colors = palettes[theme];

      // Cover
      pdf.setFillColor(...colors.bg);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setDrawColor(...colors.accent);
      pdf.setLineWidth(0.7);
      pdf.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 5, 5, "S");
      pdf.setTextColor(...colors.accent);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("MEMORY SPACE  •  SCRAPBOOK", pageWidth / 2, 58, { align: "center" });
      pdf.setTextColor(...colors.ink);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(27);
      const titleLines = pdf.splitTextToSize(coverTitle.trim() || "Our Little Scrapbook", textWidth - 10);
      pdf.text(titleLines, pageWidth / 2, 88, { align: "center" });
      pdf.setDrawColor(...colors.accent);
      pdf.line(pageWidth / 2 - 23, 111, pageWidth / 2 + 23, 111);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(13);
      pdf.setTextColor(...colors.accent);
      pdf.text(pdf.splitTextToSize(subtitle.trim() || "Little moments, forever memories", textWidth - 14), pageWidth / 2, 126, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.ink);
      pdf.text(`${selectedMemories.length} ${selectedMemories.length === 1 ? "memory" : "memories"} · ${spaceName || "Our space"}`, pageWidth / 2, 150, { align: "center" });
      pdf.setFontSize(9);
      pdf.text(`Made on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 30, { align: "center" });

      for (const memory of selectedMemories) {
        pdf.addPage();
        pdf.setFillColor(...colors.bg);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        pdf.setDrawColor(...colors.accent);
        pdf.setLineWidth(0.35);
        pdf.roundedRect(9, 9, pageWidth - 18, pageHeight - 18, 4, 4, "S");

        const design = designs[memory.id] ?? { memoryId: memory.id, note: "", layout: "classic" as const };
        let y = 23;
        pdf.setTextColor(...colors.accent);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(formatDate(memory.memory_date), margin, y);
        y += 10;

        pdf.setTextColor(...colors.ink);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(design.layout === "minimal" ? 18 : 22);
        const title = pdf.splitTextToSize(memory.title || "Untitled memory", textWidth);
        pdf.text(title, margin, y);
        y += title.length * (design.layout === "minimal" ? 7 : 9) + 4;

        if (design.layout !== "photo-focus") {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10.5);
          const story = memory.content?.trim() || "";
          const lines = pdf.splitTextToSize(story, textWidth);
          for (const line of lines.slice(0, 20)) {
            if (y > pageHeight - 48) break;
            pdf.setTextColor(...colors.ink);
            pdf.text(line, margin, y);
            y += 5;
          }
          y += 4;
        }

        const photos = photosByMemory.get(memory.id) ?? [];
        let photoCount = 0;
        for (const photo of photos) {
          if (photoCount >= (design.layout === "photo-focus" ? 3 : 2)) break;
          try {
            const { data: blob, error } = await supabase.storage.from("memory-media").download(photo.object_path);
            if (error || !blob) continue;
            const dataUrl = await blobToDataUrl(blob);
            const imageType = photo.mime_type === "image/png" ? "PNG" : "JPEG";
            const props = pdf.getImageProperties(dataUrl);
            const maxWidth = design.layout === "photo-focus" ? textWidth : textWidth * 0.88;
            const maxHeight = design.layout === "photo-focus" ? 95 : 67;
            const scale = Math.min(maxWidth / props.width, maxHeight / props.height, 1);
            const w = props.width * scale;
            const h = props.height * scale;
            if (y + h > pageHeight - 32) {
              pdf.addPage();
              pdf.setFillColor(...colors.bg);
              pdf.rect(0, 0, pageWidth, pageHeight, "F");
              y = 23;
            }
            const x = (pageWidth - w) / 2;
            pdf.setDrawColor(...colors.accent);
            pdf.roundedRect(x - 1.5, y - 1.5, w + 3, h + 3, 2, 2, "S");
            pdf.addImage(dataUrl, imageType, x, y, w, h);
            y += h + 5;
            if (photo.caption?.trim() && y < pageHeight - 25) {
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(9);
              pdf.setTextColor(...colors.accent);
              pdf.text(pdf.splitTextToSize(photo.caption, textWidth).slice(0, 2), pageWidth / 2, y, { align: "center" });
              y += 9;
            }
            photoCount++;
          } catch {
            // Continue the scrapbook if a photo is unavailable or unsupported.
          }
        }

        if (design.note.trim()) {
          if (y > pageHeight - 30) {
            pdf.addPage();
            pdf.setFillColor(...colors.bg);
            pdf.rect(0, 0, pageWidth, pageHeight, "F");
            y = 25;
          }
          y = Math.min(y + 3, pageHeight - 25);
          pdf.setDrawColor(...colors.accent);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 8;
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(10);
          pdf.setTextColor(...colors.accent);
          pdf.text(pdf.splitTextToSize(`A note to keep: ${design.note}`, textWidth).slice(0, 5), margin, y);
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.accent);
        pdf.text("Memory Space · Scrapbook", pageWidth / 2, pageHeight - 13, { align: "center" });
      }

      const safeName = (coverTitle || spaceName || "memory-space-scrapbook")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 70);
      pdf.save(`${safeName || "memory-space-scrapbook"}.pdf`);
      onNotice("Your scrapbook PDF is ready!");
    } catch (error) {
      onNotice(error instanceof Error ? `Could not export scrapbook: ${error.message}` : "Could not export scrapbook.");
    } finally {
      setExporting(false);
    }
  }

  const themeClasses = {
    blush: "border-[#ead1db] bg-[#fff7f8] text-[#85586d]",
    lavender: "border-[#ddd4f2] bg-[#faf8ff] text-[#74619b]",
    sage: "border-[#d2e2d2] bg-[#f6fbf5] text-[#567b60]",
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="rounded-3xl border border-[#eadfe6] bg-[#fffdfa] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a27c98]">Make something to keep</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#443943]">Scrapbook Designer</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#796d76]">
          Pick the memories you love, arrange their order, add little notes, and export a themed scrapbook PDF.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-[#62545f]">
            Scrapbook title
            <input value={coverTitle} onChange={(event) => setCoverTitle(event.target.value)} maxLength={100}
              className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 outline-none focus:border-[#b68da8]" />
          </label>
          <label className="block text-sm font-medium text-[#62545f]">
            Cover subtitle
            <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} maxLength={140}
              className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 outline-none focus:border-[#b68da8]" />
          </label>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-[#62545f]">Choose a theme</p>
          <div className="flex flex-wrap gap-2">
            {([
              ["blush", "Blush paper"],
              ["lavender", "Lavender dreams"],
              ["sage", "Sage garden"],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setTheme(value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${themeClasses[value]} ${theme === value ? "ring-2 ring-offset-2 ring-[#b68da8]" : "opacity-75"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-[#eadfe6] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#443943]">1. Choose your memories</h3>
              <p className="mt-1 text-xs text-[#8b7e87]">{memories.length} available in {spaceName || "this space"}</p>
            </div>
            <span className="rounded-full bg-[#f5edf3] px-3 py-1 text-xs font-semibold text-[#8d6c85]">{selectedIds.length} selected</span>
          </div>
          {!spaceId ? (
            <p className="mt-5 rounded-xl bg-[#faf6f9] p-4 text-sm text-[#796d76]">Choose a space first.</p>
          ) : memories.length === 0 ? (
            <p className="mt-5 rounded-xl bg-[#faf6f9] p-4 text-sm text-[#796d76]">Add a memory to this space before creating a scrapbook.</p>
          ) : (
            <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {memories.map((memory) => {
                const selected = selectedIds.includes(memory.id);
                return (
                  <label key={memory.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition ${selected ? "border-[#c7a4bb] bg-[#fff8fc]" : "border-[#eee7ed] hover:bg-[#fdfafd]"}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleMemory(memory.id)} className="mt-1 h-4 w-4 accent-[#98728f]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#514550]">{memory.title || "Untitled memory"}</span>
                      <span className="mt-1 block text-xs text-[#9b8e98]">{formatDate(memory.memory_date)}</span>
                      <span className="mt-1 block line-clamp-2 text-sm leading-5 text-[#827680]">{memory.content || "No story added yet."}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#eadfe6] bg-white p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-[#443943]">2. Arrange and personalize</h3>
          <p className="mt-1 text-xs text-[#8b7e87]">Use the arrows to change page order. Notes are included in your exported PDF.</p>
          {selectedMemories.length === 0 ? (
            <div className={`mt-5 rounded-2xl border p-5 ${themeClasses[theme]}`}>
              <p className="text-xs font-semibold uppercase tracking-widest">Cover preview</p>
              <h4 className="mt-5 text-2xl font-semibold">{coverTitle || "Our Little Scrapbook"}</h4>
              <p className="mt-2 text-sm italic">{subtitle || "Little moments, forever memories"}</p>
              <p className="mt-8 text-xs">{spaceName || "Your space"} · 0 memories</p>
              <p className="mt-4 text-xs opacity-75">Select memories to start building pages.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedMemories.map((memory, index) => {
                const design = designs[memory.id] ?? { memoryId: memory.id, note: "", layout: "classic" as const };
                return (
                  <article key={memory.id} className="rounded-2xl border border-[#eee4ec] p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold ${themeClasses[theme]}`}>{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-[#514550]">{memory.title || "Untitled memory"}</h4>
                        <p className="mt-1 text-xs text-[#9b8e98]">{formatDate(memory.memory_date)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" aria-label="Move memory up" disabled={index === 0} onClick={() => moveMemory(memory.id, -1)}
                          className="rounded-lg border border-[#e8dfe7] px-2 py-1 text-sm disabled:opacity-30">↑</button>
                        <button type="button" aria-label="Move memory down" disabled={index === selectedMemories.length - 1} onClick={() => moveMemory(memory.id, 1)}
                          className="rounded-lg border border-[#e8dfe7] px-2 py-1 text-sm disabled:opacity-30">↓</button>
                        <button type="button" aria-label="Remove memory" onClick={() => toggleMemory(memory.id)}
                          className="rounded-lg border border-[#ead8dc] px-2 py-1 text-xs text-[#a45f62]">Remove</button>
                      </div>
                    </div>
                    <label className="mt-4 block text-xs font-medium text-[#796d76]">
                      Page layout
                      <select value={design.layout} onChange={(event) => updateDesign(memory.id, { layout: event.target.value as PageDesign["layout"] })}
                        className="mt-1 w-full rounded-xl border border-[#e7dce5] bg-white px-3 py-2 text-sm text-[#514550]">
                        <option value="classic">Story + photos</option>
                        <option value="photo-focus">Photo focus</option>
                        <option value="minimal">Minimal story</option>
                      </select>
                    </label>
                    <label className="mt-3 block text-xs font-medium text-[#796d76]">
                      Personal note (optional)
                      <textarea value={design.note} onChange={(event) => updateDesign(memory.id, { note: event.target.value })}
                        rows={2} maxLength={500} placeholder="A little note you want to remember…"
                        className="mt-1 w-full resize-y rounded-xl border border-[#e7dce5] bg-white px-3 py-2 text-sm text-[#514550] outline-none focus:border-[#b68da8]" />
                    </label>
                  </article>
                );
              })}
            </div>
          )}
          <button type="button" onClick={() => void exportScrapbook()} disabled={exporting || !selectedMemories.length}
            className="mt-5 w-full rounded-2xl bg-[#8e6c88] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#795873] disabled:cursor-not-allowed disabled:opacity-50">
            {exporting ? "Creating your scrapbook…" : `Export scrapbook PDF · ${selectedMemories.length} ${selectedMemories.length === 1 ? "memory" : "memories"}`}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-[#9b8e98]">Your scrapbook is generated from the selected memories in this space. Your original memories and photos are not changed.</p>
        </div>
      </div>
    </section>
  );
}
