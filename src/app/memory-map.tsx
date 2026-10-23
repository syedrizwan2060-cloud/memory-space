"use client";

import { useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MapMemory = {
  id: string;
  title: string;
  content: string;
  memory_date: string;
  space_id: string;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type MemoryMapProps = {
  memories: MapMemory[];
  spaceName: string;
};

const memoryIcon = L.divIcon({
  className: "",
  html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#816780;border:3px solid white;box-shadow:0 2px 8px #0003;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-size:15px;">♥</span></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export default function MemoryMap({
  memories,
  spaceName,
}: MemoryMapProps) {
  const locatedMemories = useMemo(
    () =>
      memories.filter(
        (memory) =>
          memory.latitude !== null &&
          memory.longitude !== null &&
          Number.isFinite(Number(memory.latitude)) &&
          Number.isFinite(Number(memory.longitude)) &&
          Number(memory.latitude) >= -90 &&
          Number(memory.latitude) <= 90 &&
          Number(memory.longitude) >= -180 &&
          Number(memory.longitude) <= 180
      ),
    [memories]
  );

  const center: [number, number] =
    locatedMemories.length > 0
      ? [
          Number(locatedMemories[0].latitude),
          Number(locatedMemories[0].longitude),
        ]
      : [20, 0];

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
          YOUR MEMORIES, ON THE MAP
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Memory Map
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#8d8379]">
          Explore the places connected to your memories in {spaceName}.
        </p>
      </div>

      {locatedMemories.length === 0 ? (
        <div className="rounded-2xl border border-[#ebe5df] bg-white p-8 text-center">
          <div className="mb-3 text-4xl">📍</div>
          <h3 className="text-lg font-medium">Your map is waiting</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8d8379]">
            No memories in this space have coordinates yet. Create a memory
            and add its place name, latitude, and longitude to see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-[#ebe5df] bg-white p-2">
            <MapContainer
              center={center}
              zoom={locatedMemories.length === 1 ? 12 : 3}
              scrollWheelZoom
              style={{
                height: "460px",
                width: "100%",
                borderRadius: "12px",
                zIndex: 0,
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {locatedMemories.map((memory) => (
                <Marker
                  key={memory.id}
                  position={[
                    Number(memory.latitude),
                    Number(memory.longitude),
                  ]}
                  icon={memoryIcon}
                >
                  <Popup>
                    <div style={{ maxWidth: "220px" }}>
                      <strong>{memory.title}</strong>
                      <p style={{ margin: "5px 0", color: "#816780" }}>
                        {memory.place_name || "Saved memory location"}
                      </p>
                      <p style={{ margin: "5px 0", fontSize: "12px" }}>
                        {memory.memory_date || ""}
                      </p>
                      {memory.content && (
                        <p style={{ margin: "5px 0", fontSize: "13px" }}>
                          {memory.content}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <p className="text-sm text-[#8d8379]">
            {locatedMemories.length}{" "}
            {locatedMemories.length === 1 ? "memory" : "memories"} mapped.
            Select a heart marker to view its details.
          </p>
        </>
      )}
    </section>
  );
}
