
"use client";

import { useState } from "react";
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

const supabase = createClient();

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read a photo."));
    reader.readAsDataURL(blob);
  });
}

export default function YearbookExport({
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
  const [exporting, setExporting] = useState(false);

  async function exportYearbook() {
    if (!spaceId) {
      onNotice("Choose a space before creating its yearbook.");
      return;
    }

    if (memories.length === 0) {
      onNotice("Add at least one memory before exporting a yearbook.");
      return;
    }

    setExporting(true);
    onNotice("");

    try {
      const { data: photoRows, error: photoError } = await supabase
        .from("memory_media")
        .select("memory_id, object_path, caption, mime_type")
        .eq("space_id", spaceId);

      if (photoError) {
        throw new Error(`Could not load yearbook photos: ${photoError.message}`);
      }

      const photosByMemory = new Map<string, Photo[]>();

      for (const photo of (photoRows ?? []) as Photo[]) {
        const current = photosByMemory.get(photo.memory_id) ?? [];
        current.push(photo);
        photosByMemory.set(photo.memory_id, current);
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const textWidth = pageWidth - margin * 2;

      // Cover page
      pdf.setFillColor(250, 248, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setTextColor(129, 103, 128);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text("MEMORY SPACE", pageWidth / 2, 65, { align: "center" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);

      const coverTitle = pdf.splitTextToSize(spaceName || "Our Memories", textWidth);
      pdf.text(coverTitle, pageWidth / 2, 90, { align: "center" });

      pdf.setDrawColor(189, 145, 173);
      pdf.line(pageWidth / 2 - 25, 110, pageWidth / 2 + 25, 110);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.setTextColor(100, 92, 96);
      pdf.text("A collection of moments worth keeping", pageWidth / 2, 125, {
        align: "center",
      });
      pdf.setFontSize(11);
      pdf.text(`${memories.length} ${memories.length === 1 ? "memory" : "memories"}`, pageWidth / 2, 140, {
        align: "center",
      });
      pdf.setFontSize(9);
      pdf.text(
        `Created ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 22,
        { align: "center" }
      );

      const sortedMemories = [...memories].sort(
        (a, b) => new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
      );

      let pageNumber = 1;

      for (const memory of sortedMemories) {
        pdf.addPage();
        pageNumber++;

        let y = 22;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(129, 103, 128);

        const dateText = memory.memory_date
          ? new Date(`${memory.memory_date}T12:00:00`).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Date not set";

        pdf.text(dateText, margin, y);
        y += 10;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.setTextColor(57, 53, 47);

        const titleLines = pdf.splitTextToSize(memory.title || "Untitled memory", textWidth);
        pdf.text(titleLines, margin, y);
        y += titleLines.length * 9 + 5;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(80, 75, 70);

        const story = memory.content?.trim() || "A moment worth remembering.";
        const storyLines = pdf.splitTextToSize(story, textWidth);

        for (const line of storyLines) {
          if (y > pageHeight - 22) {
            pdf.addPage();
            pageNumber++;
            y = 22;
          }
          pdf.text(line, margin, y);
          y += 5.5;
        }

        y += 5;

        const memoryPhotos = photosByMemory.get(memory.id) ?? [];

        for (const photo of memoryPhotos) {
          try {
            const { data: imageBlob, error: imageError } = await supabase.storage
              .from("memory-media")
              .download(photo.object_path);

            if (imageError || !imageBlob) continue;

            const dataUrl = await blobToDataUrl(imageBlob);
            const imageType = photo.mime_type === "image/png" ? "PNG" : "JPEG";

            const imageProps = pdf.getImageProperties(dataUrl);
            const maxWidth = textWidth;
            const maxHeight = 82;
            const scale = Math.min(
              maxWidth / imageProps.width,
              maxHeight / imageProps.height,
              1
            );

            const imageWidth = imageProps.width * scale;
            const imageHeight = imageProps.height * scale;

            const captionHeight = photo.caption?.trim() ? 12 : 0;

            if (y + imageHeight + captionHeight > pageHeight - 18) {
              pdf.addPage();
              pageNumber++;
              y = 22;
            }

            pdf.addImage(
              dataUrl,
              imageType,
              margin,
              y,
              imageWidth,
              imageHeight
            );
            y += imageHeight + 4;

            if (photo.caption?.trim()) {
              pdf.setFont("helvetica", "italic");
              pdf.setFontSize(9);
              pdf.setTextColor(100, 92, 96);

              const captionLines = pdf.splitTextToSize(photo.caption, textWidth);
              for (const line of captionLines) {
                if (y > pageHeight - 15) {
                  pdf.addPage();
                  pageNumber++;
                  y = 22;
                }
                pdf.text(line, margin, y);
                y += 4.5;
              }
              y += 4;
            }

            y += 5;
          } catch {
            // Keep exporting if one photo is unavailable or unsupported.
          }
        }
      }

      // Add page numbers after the content has been created.
      const totalPages = pdf.getNumberOfPages();
      for (let page = 2; page <= totalPages; page++) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(150, 140, 145);
        pdf.text(
          `${page - 1} / ${totalPages - 1}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: "right" }
        );
      }

      const safeName = (spaceName || "memory-space")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 70);

      pdf.save(`${safeName || "memory-space"}-yearbook.pdf`);
      onNotice("Your yearbook PDF has been created. ♡");
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Yearbook export failed: ${error.message}`
          : "Yearbook export failed. Please try again."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
          YOUR STORY, KEPT FOREVER
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Yearbook <span className="text-[#bd91ad]">♡</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8d8379]">
          Turn the memories in your selected space into a keepsake PDF, complete
          with dates, stories, photos, and captions.
        </p>
      </div>

      {!spaceId ? (
        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white p-8">
          Choose or create a space first to make its yearbook.
        </div>
      ) : (
        <div className="rounded-3xl border border-[#eee6df] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5edf4] text-2xl">
            📖
          </div>
          <h2 className="text-xl font-semibold text-[#514451]">
            {spaceName || "Your space"} yearbook
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#8d8379]">
            {memories.length} {memories.length === 1 ? "memory" : "memories"} will
            be included. Photos are added when they are available. Videos are
            not included in this PDF version.
          </p>

          <button
            type="button"
            onClick={() => void exportYearbook()}
            disabled={exporting || memories.length === 0}
            className="mt-6 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? "Creating your yearbook…" : "Download yearbook PDF"}
          </button>

          {exporting && (
            <p className="mt-3 text-xs text-[#8d8379]">
              Larger spaces with many photos may take a little longer.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
