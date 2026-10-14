
"use client";

import { useState } from "react";

const memories = [
  {
    title: "That beautiful evening",
    space: "Our Little World",
    date: "October 12, 2026",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85",
    size: "large",
  },
  {
    title: "Little moments, big smiles",
    space: "Best Friends",
    date: "October 8, 2026",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=85",
    size: "small",
  },
  {
    title: "A place to remember",
    space: "Travel Diaries",
    date: "September 24, 2026",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=85",
    size: "small",
  },
];

const spaces = [
  { emoji: "♡", name: "Our Little World", people: "2 members", color: "rose" },
  { emoji: "✳", name: "Best Friends", people: "5 members", color: "lavender" },
  { emoji: "⌁", name: "Travel Diaries", people: "3 members", color: "sage" },
];

export default function Home() {
  const [active, setActive] = useState("Home");
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState("");

  const navItems = [
    { label: "Home", icon: "⌂" },
    { label: "My spaces", icon: "▧" },
    { label: "Memories", icon: "♡" },
    { label: "Calendar", icon: "▦" },
    { label: "Future plans", icon: "✧" },
  ];

  function chooseNav(label: string) {
    setActive(label);
    if (label !== "Home") {
      setNotice(
        `${label} will become a dedicated page as we build the next features.`
      );
    } else {
      setNotice("");
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#39352f]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[245px] shrink-0 border-r border-[#ebe5df] bg-[#fffdfa] px-6 py-8 lg:flex lg:flex-col">
          <a href="#" className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eadde8] text-2xl text-[#86657f]">
              ♡
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">
                memory space
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#9b9086]">
                Your world, together
              </div>
            </div>
          </a>

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a39a91]">
            YOUR CORNER
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => chooseNav(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  active === item.label
                    ? "bg-[#eee5ed] font-medium text-[#775b75]"
                    : "text-[#817970] hover:bg-[#f5f0eb]"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mb-3 mt-10 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a39a91]">
              YOUR SPACES
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xl text-[#8c7288] hover:text-[#60485e]"
              aria-label="Create a space"
            >
              +
            </button>
          </div>

          <div className="space-y-2">
            {spaces.map((space) => (
              <button
                key={space.name}
                onClick={() => {
                  setActive("My spaces");
                  setNotice(`You selected ${space.name}. Space details will be connected next.`);
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[#f5f0eb]"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                    space.color === "rose"
                      ? "bg-[#f4e2df] text-[#a86f72]"
                      : space.color === "lavender"
                        ? "bg-[#eae4f3] text-[#8171a3]"
                        : "bg-[#e4ebe0] text-[#6f8969]"
                  }`}
                >
                  {space.emoji}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{space.name}</p>
                  <p className="mt-1 text-[10px] text-[#a39a91]">
                    {space.people}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-auto rounded-2xl border border-[#eee4e8] bg-[#f8f0f3] p-4">
            <div className="mb-2 text-xl">☁</div>
            <p className="text-sm font-medium">Your memories, safe</p>
            <p className="mt-1 text-xs leading-5 text-[#897b84]">
              Your private corner of the world is being built.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e9dce4]">
              <div className="h-full w-[12%] rounded-full bg-[#bd9db5]" />
            </div>
            <p className="mt-2 text-[10px] text-[#968692]">
              Storage details coming soon
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#eee8e2] bg-[#faf8f5]/95 px-5 py-4 backdrop-blur-md sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eadde8] text-xl text-[#86657f]">
                ♡
              </div>
              <span className="font-semibold tracking-tight">memory space</span>
            </div>
            <div className="hidden text-sm text-[#92877d] lg:block">
              Thursday, October 15, 2026
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setNotice("Notifications will be available when reminders are connected.")
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#eae2da] bg-white text-lg hover:bg-[#f5efea]"
                aria-label="Notifications"
              >
                ♧
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#bd8b9e]" />
              </button>
              <button
                onClick={() =>
                  setNotice("Your profile and account settings will be added with sign-in.")
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfe7dc] text-sm font-semibold text-[#5e765b]"
                aria-label="Profile"
              >
                Y
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            {notice && (
              <div
                role="status"
                className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-[#e7dbe6] bg-[#f4edf4] p-4 text-sm text-[#775b75]"
              >
                <span>{notice}</span>
                <button
                  onClick={() => setNotice("")}
                  className="text-lg leading-none"
                  aria-label="Dismiss message"
                >
                  ×
                </button>
              </div>
            )}

            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
                  A LITTLE SPACE FOR WHAT MATTERS
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your memories live here<span className="text-[#bd91ad]">.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#8d8379] sm:text-base">
                  A place for your people, your little moments, and all the
                  things you never want to forget.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#70556f]"
              >
                <span className="text-lg">+</span> Create a memory
              </button>
            </div>

            <div className="relative mb-10 overflow-hidden rounded-[28px] bg-[#e8dfe9]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#e9dfe9] via-[#e9dfe9]/95 to-[#e9dfe9]/10 sm:to-transparent" />
              <div className="relative flex min-h-[250px] items-center p-7 sm:min-h-[290px] sm:p-10 lg:p-12">
                <div className="max-w-lg">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1.5 text-xs text-[#7d647d]">
                    <span>✧</span> A gentle reminder
                  </div>
                  <h2 className="max-w-md text-3xl font-medium leading-tight tracking-tight text-[#514451] sm:text-4xl">
                    Someday, these little things will be the big things.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-[#796b78]">
                    Save a moment today. Thank yourself tomorrow.
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-6 rounded-xl border border-[#b9a6bb] bg-white/65 px-4 py-2.5 text-sm font-medium text-[#735d75] transition hover:bg-white"
                  >
                    Save a little moment ↗
                  </button>
                </div>
                <div className="absolute bottom-5 right-5 hidden rotate-6 text-7xl text-white/80 sm:block lg:right-16 lg:text-8xl">
                  ♡
                </div>
              </div>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e3e1] text-xl text-[#a96f75]">
                  ♡
                </div>
                <p className="text-2xl font-semibold">03</p>
                <p className="mt-1 text-sm text-[#93877e]">Little spaces</p>
              </div>
              <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eae4f3] text-xl text-[#8171a3]">
                  ▧
                </div>
                <p className="text-2xl font-semibold">03</p>
                <p className="mt-1 text-sm text-[#93877e]">Featured moments</p>
              </div>
              <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e4ebe0] text-xl text-[#6f8969]">
                  ✧
                </div>
                <p className="text-2xl font-semibold">∞</p>
                <p className="mt-1 text-sm text-[#93877e]">Moments still to make</p>
              </div>
            </div>

            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a18a9e]">
                  YOUR LITTLE TIME CAPSULE
                </p>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Moments to keep
                </h2>
              </div>
              <button
                onClick={() => chooseNav("Memories")}
                className="shrink-0 text-sm text-[#856b83] hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {memories.map((memory) => (
                <article
                  key={memory.title}
                  className="group overflow-hidden rounded-2xl border border-[#eee6df] bg-white transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#5c4b3d]/5"
                >
                  <div className="relative h-52 overflow-hidden bg-[#eee5e9]">
                    <img
                      src={memory.image}
                      alt={memory.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs text-[#806780]">
                      ♡ Keep this
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#a18a9e]">
                      {memory.space}
                    </p>
                    <h3 className="mt-2 text-base font-semibold">
                      {memory.title}
                    </h3>
                    <p className="mt-2 text-xs text-[#a1978d]">
                      {memory.date}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[#e8e6dc] bg-[#f0f1e8] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#7d8b73]">
                    FOR THE DAYS AHEAD
                  </p>
                  <h2 className="text-xl font-semibold">
                    There is still so much to do together.
                  </h2>
                  <p className="mt-2 text-sm text-[#818778]">
                    Keep your little plans somewhere special.
                  </p>
                </div>
                <button
                  onClick={() => chooseNav("Future plans")}
                  className="shrink-0 self-start rounded-xl border border-[#c8d0be] bg-white/70 px-4 py-3 text-sm font-medium text-[#687b61] hover:bg-white sm:self-auto"
                >
                  Explore future plans →
                </button>
              </div>
            </div>

            <footer className="pb-4 pt-10 text-center text-xs text-[#aaa097]">
              Made for the moments that matter ♡
            </footer>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#ebe5df] bg-[#fffdfa]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg lg:hidden">
        {[
          { label: "Home", icon: "⌂" },
          { label: "Spaces", icon: "▧" },
          { label: "Create", icon: "+" },
          { label: "Calendar", icon: "▦" },
          { label: "More", icon: "•••" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() =>
              item.label === "Create"
                ? setShowCreate(true)
                : chooseNav(item.label === "Spaces" ? "My spaces" : item.label)
            }
            className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
              active === item.label ||
              (item.label === "Spaces" && active === "My spaces")
                ? "text-[#816780]"
                : "text-[#a49a90]"
            }`}
          >
            <span
              className={`flex h-7 w-8 items-center justify-center rounded-xl text-xl ${
                item.label === "Create"
                  ? "bg-[#816780] text-white"
                  : ""
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#29232b]/40 p-4 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            className="w-full max-w-md rounded-3xl border border-[#eee4e9] bg-[#fffdfa] p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee4ed] text-2xl text-[#816780]">
                ♡
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-2xl text-[#a49a90]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <h2 id="create-title" className="text-2xl font-semibold">
              Save a little moment
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#91867d]">
              Every beautiful memory begins somewhere. Choose what you would
              like to create first.
            </p>
            <div className="mt-6 space-y-3">
              {[
                ["♡", "A memory", "Keep a moment, a story, or a photo."],
                ["▧", "A private space", "Create a corner for your people."],
                ["✧", "A future plan", "Dream up something to do together."],
              ].map(([icon, title, description]) => (
                <button
                  key={title}
                  onClick={() => {
                    setShowCreate(false);
                    setNotice(
                      `${title} is our next feature to build. Your data will not be saved until we connect the backend.`
                    );
                  }}
                  className="flex w-full items-center gap-4 rounded-2xl border border-[#eee6df] p-4 text-left transition hover:border-[#cbb7ca] hover:bg-[#f8f1f7]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eee4ed] text-xl text-[#816780]">
                    {icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#93877e]">
                      {description}
                    </span>
                  </span>
                  <span className="ml-auto text-[#b0a1ae]">→</span>
                </button>
              ))}
            </div>
            <p className="mt-5 text-center text-[11px] text-[#aaa097]">
              Your space, your people, your memories.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
