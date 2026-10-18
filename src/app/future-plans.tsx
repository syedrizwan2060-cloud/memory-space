
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type PlanType = "wishlist" | "goal" | "todo";
type Priority = "low" | "medium" | "high";
type StatusFilter = "all" | "pending" | "completed";

type FuturePlan = {
  id: string;
  space_id: string;
  created_by: string;
  plan_type: PlanType;
  title: string;
  description: string;
  category: string;
  target_date: string | null;
  priority: Priority;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  spaceId: string;
  spaceName: string;
  onNotice: (message: string) => void;
};

type PlanForm = {
  plan_type: PlanType;
  title: string;
  description: string;
  category: string;
  target_date: string;
  priority: Priority;
};

const supabase = createClient();

const initialForm: PlanForm = {
  plan_type: "todo",
  title: "",
  description: "",
  category: "General",
  target_date: "",
  priority: "medium",
};

const planTypes: {
  value: PlanType;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  {
    value: "wishlist",
    label: "Wishlist",
    subtitle: "Things to get and experiences to enjoy",
    icon: "♡",
  },
  {
    value: "goal",
    label: "Goals & dreams",
    subtitle: "Your bucket list and future ambitions",
    icon: "✧",
  },
  {
    value: "todo",
    label: "Things to do",
    subtitle: "Tasks and things to remember",
    icon: "✓",
  },
];

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function isOverdue(plan: FuturePlan) {
  if (!plan.target_date || plan.is_completed) return false;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return plan.target_date < todayKey;
}

function priorityLabel(priority: Priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export default function FuturePlans({
  spaceId,
  spaceName,
  onNotice,
}: Props) {
  const [plans, setPlans] = useState<FuturePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [activeType, setActiveType] = useState<PlanType>("todo");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FuturePlan | null>(null);
  const [form, setForm] = useState<PlanForm>(initialForm);

  const resetForm = useCallback(() => {
    setForm({ ...initialForm, plan_type: activeType });
    setEditingPlan(null);
    setShowForm(false);
  }, [activeType]);

  const loadPlans = useCallback(async () => {
    setLoading(true);

    if (!spaceId) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("future_plans")
      .select(
        "id, space_id, created_by, plan_type, title, description, category, target_date, priority, is_completed, created_at, updated_at"
      )
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });

    if (error) {
      setPlans([]);
      onNotice(`Could not load future plans: ${error.message}`);
      setLoading(false);
      return;
    }

    setPlans((data ?? []) as FuturePlan[]);
    setLoading(false);
  }, [spaceId, onNotice]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const typePlans = useMemo(
    () => plans.filter((plan) => plan.plan_type === activeType),
    [plans, activeType]
  );

  const visiblePlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return typePlans.filter((plan) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && plan.is_completed) ||
        (statusFilter === "pending" && !plan.is_completed);

      const matchesSearch =
        !query ||
        plan.title.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query) ||
        plan.category.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [typePlans, statusFilter, search]);

  const completedCount = typePlans.filter(
    (plan) => plan.is_completed
  ).length;

  const pendingCount = typePlans.length - completedCount;

  const progress =
    typePlans.length === 0
      ? 0
      : Math.round((completedCount / typePlans.length) * 100);

  function startCreate() {
    setEditingPlan(null);
    setForm({ ...initialForm, plan_type: activeType });
    setShowForm(true);
  }

  function startEdit(plan: FuturePlan) {
    setEditingPlan(plan);
    setForm({
      plan_type: plan.plan_type,
      title: plan.title,
      description: plan.description,
      category: plan.category,
      target_date: plan.target_date ?? "",
      priority: plan.priority,
    });
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();

    if (!spaceId) {
      onNotice("Select a space before saving a plan.");
      return;
    }

    if (!cleanTitle || saving) return;

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again before saving a plan.");
      }

      const payload = {
        plan_type: form.plan_type,
        title: cleanTitle,
        description: form.description.trim(),
        category: form.category.trim() || "General",
        target_date: form.target_date || null,
        priority: form.priority,
        updated_at: new Date().toISOString(),
      };

      if (editingPlan) {
        const { data, error } = await supabase
          .from("future_plans")
          .update(payload)
          .eq("id", editingPlan.id)
          .eq("space_id", spaceId)
          .select(
            "id, space_id, created_by, plan_type, title, description, category, target_date, priority, is_completed, created_at, updated_at"
          )
          .single();

        if (error) throw new Error(error.message);

        setPlans((current) =>
          current.map((plan) =>
            plan.id === editingPlan.id ? (data as FuturePlan) : plan
          )
        );

        onNotice("Your plan has been updated. ♡");
      } else {
        const { data, error } = await supabase
          .from("future_plans")
          .insert({
            ...payload,
            space_id: spaceId,
            created_by: user.id,
          })
          .select(
            "id, space_id, created_by, plan_type, title, description, category, target_date, priority, is_completed, created_at, updated_at"
          )
          .single();

        if (error) throw new Error(error.message);

        setPlans((current) => [data as FuturePlan, ...current]);
        onNotice("A new plan has been saved. ♡");
      }

      setActiveType(form.plan_type);
      setStatusFilter("all");
      setSearch("");
      setForm(initialForm);
      setEditingPlan(null);
      setShowForm(false);
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Could not save plan: ${error.message}`
          : "Could not save the plan."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCompleted(plan: FuturePlan) {
    if (updatingId) return;

    setUpdatingId(plan.id);

    const nextValue = !plan.is_completed;

    try {
      const { data, error } = await supabase
        .from("future_plans")
        .update({
          is_completed: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id)
        .eq("space_id", spaceId)
        .select(
          "id, space_id, created_by, plan_type, title, description, category, target_date, priority, is_completed, created_at, updated_at"
        )
        .single();

      if (error) throw new Error(error.message);

      setPlans((current) =>
        current.map((item) =>
          item.id === plan.id ? (data as FuturePlan) : item
        )
      );

      onNotice(
        nextValue
          ? "Beautiful! One more plan completed. ♡"
          : "This plan has been marked as pending."
      );
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Could not update plan: ${error.message}`
          : "Could not update the plan."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(plan: FuturePlan) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${plan.title}" permanently?`
    );

    if (!confirmed) return;

    setDeletingId(plan.id);

    try {
      const { error } = await supabase
        .from("future_plans")
        .delete()
        .eq("id", plan.id)
        .eq("space_id", spaceId);

      if (error) throw new Error(error.message);

      setPlans((current) =>
        current.filter((item) => item.id !== plan.id)
      );

      if (editingPlan?.id === plan.id) resetForm();

      onNotice("The plan has been deleted.");
    } catch (error) {
      onNotice(
        error instanceof Error
          ? `Could not delete plan: ${error.message}`
          : "Could not delete the plan."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeTypeInfo = planTypes.find(
    (type) => type.value === activeType
  )!;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#a18a9e]">
            YOUR DREAMS, YOUR NEXT CHAPTER
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#514451] sm:text-4xl">
            Future plans<span className="text-[#bd91ad]">.</span>
          </h1>
          <p className="mt-3 text-sm text-[#8d8379]">
            Little steps today, beautiful memories tomorrow — for{" "}
            {spaceName || "your space"}.
          </p>
        </div>

        <button
          type="button"
          disabled={!spaceId}
          onClick={startCreate}
          className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#70556f] disabled:opacity-50"
        >
          + Add a plan
        </button>
      </header>

      {!spaceId ? (
        <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white p-8 text-sm text-[#817970]">
          Create or select a space first to start planning your future.
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
              <p className="text-sm text-[#91867d]">All plans</p>
              <p className="mt-2 text-3xl font-semibold text-[#514451]">
                {plans.length}
              </p>
              <p className="mt-1 text-xs text-[#a1978d]">
                Across this space
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
              <p className="text-sm text-[#91867d]">Still to do</p>
              <p className="mt-2 text-3xl font-semibold text-[#816780]">
                {plans.filter((plan) => !plan.is_completed).length}
              </p>
              <p className="mt-1 text-xs text-[#a1978d]">
                Dreams in progress
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee6df] bg-white p-5">
              <p className="text-sm text-[#91867d]">Completed</p>
              <p className="mt-2 text-3xl font-semibold text-[#71846a]">
                {plans.filter((plan) => plan.is_completed).length}
              </p>
              <p className="mt-1 text-xs text-[#a1978d]">
                Things to be proud of ♡
              </p>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {planTypes.map((type) => {
              const count = plans.filter(
                (plan) => plan.plan_type === type.value
              ).length;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setActiveType(type.value);
                    setStatusFilter("all");
                    setSearch("");
                    setShowForm(false);
                    setEditingPlan(null);
                  }}
                  className={`rounded-2xl border p-4 text-left transition sm:p-5 ${
                    activeType === type.value
                      ? "border-[#b99ab6] bg-[#f8f0f7] shadow-sm"
                      : "border-[#eee6df] bg-white hover:border-[#d8c5d6]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl text-[#816780]">
                      {type.icon}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-[#816780]">
                      {count}
                    </span>
                  </div>
                  <h2 className="mt-4 font-semibold text-[#514451]">
                    {type.label}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#91867d]">
                    {type.subtitle}
                  </p>
                </button>
              );
            })}
          </section>

          <section className="rounded-2xl border border-[#eee6df] bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#a18a9e]">
                  YOUR PROGRESS
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#514451]">
                  {activeTypeInfo.label}
                </h2>
                <p className="mt-1 text-sm text-[#91867d]">
                  {completedCount} completed · {pendingCount} remaining
                </p>
              </div>
              <p className="text-2xl font-semibold text-[#816780]">
                {progress}%
              </p>
            </div>

            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0e9ef]"
              role="progressbar"
              aria-label={`${activeTypeInfo.label} completion`}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#a88ba5] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[#e8dbe7] bg-white p-5 sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a18a9e]">
                    {editingPlan ? "UPDATE YOUR PLAN" : "A LITTLE STEP FORWARD"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[#514451]">
                    {editingPlan ? "Edit your plan" : "Add something to your future ♡"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Close form"
                  className="rounded-lg px-3 py-1 text-xl text-[#91867d] hover:bg-[#f8f1f7]"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#514451]">
                  Plan type
                  <select
                    value={form.plan_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        plan_type: event.target.value as PlanType,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  >
                    {planTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-[#514451]">
                  Title
                  <input
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Visit the mountains"
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <label className="block text-sm font-medium text-[#514451]">
                  Category
                  <input
                    maxLength={60}
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    placeholder="e.g. Travel, Personal, Gifts"
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <label className="block text-sm font-medium text-[#514451]">
                  Target date (optional)
                  <input
                    type="date"
                    value={form.target_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target_date: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[#e7dce5] bg-white px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <label className="block text-sm font-medium text-[#514451] sm:col-span-2">
                  Description (optional)
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Add details, ideas, or why this matters to you..."
                    className="mt-2 w-full resize-y rounded-xl border border-[#e7dce5] px-4 py-3 text-sm outline-none focus:border-[#a98ca7]"
                  />
                </label>

                <fieldset className="sm:col-span-2">
                  <legend className="text-sm font-medium text-[#514451]">
                    Priority
                  </legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as Priority[]).map(
                      (priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              priority,
                            }))
                          }
                          className={`rounded-xl border px-3 py-3 text-sm transition ${
                            form.priority === priority
                              ? "border-[#a98ca7] bg-[#f8f0f7] text-[#70556f]"
                              : "border-[#e7dce5] text-[#91867d] hover:bg-[#fcfaf8]"
                          }`}
                        >
                          {priorityLabel(priority)}
                        </button>
                      )
                    )}
                  </div>
                </fieldset>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white hover:bg-[#70556f] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingPlan
                      ? "Save changes"
                      : "Save my plan ♡"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-[#e7dce5] px-5 py-3 text-sm text-[#817970] hover:bg-[#fcfaf8]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-[#514451]">
                  {activeTypeInfo.label}
                </h2>
                <p className="mt-1 text-sm text-[#91867d]">
                  {visiblePlans.length}{" "}
                  {visiblePlans.length === 1 ? "plan" : "plans"} shown
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search plans..."
                  aria-label="Search plans"
                  className="min-w-0 rounded-xl border border-[#e7dce5] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#a98ca7] sm:w-48"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  aria-label="Filter by completion status"
                  className="rounded-xl border border-[#e7dce5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a98ca7]"
                >
                  <option value="all">All plans</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-[#eee6df] bg-white p-8 text-sm text-[#91867d]">
                Loading your plans...
              </div>
            ) : visiblePlans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9cbd8] bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8f0f7] text-2xl text-[#816780]">
                  {activeTypeInfo.icon}
                </div>
                <h3 className="mt-4 font-semibold text-[#514451]">
                  {search || statusFilter !== "all"
                    ? "No matching plans"
                    : `Your ${activeTypeInfo.label.toLowerCase()} starts here`}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#91867d]">
                  {search || statusFilter !== "all"
                    ? "Try another search or change your filter."
                    : "Every big dream starts small. Add your first plan and keep it safe in this space. ♡"}
                </p>
                {!search && statusFilter === "all" && (
                  <button
                    type="button"
                    onClick={startCreate}
                    className="mt-5 rounded-xl bg-[#816780] px-5 py-3 text-sm font-medium text-white hover:bg-[#70556f]"
                  >
                    + Add your first plan
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visiblePlans.map((plan) => {
                  const overdue = isOverdue(plan);

                  return (
                    <article
                      key={plan.id}
                      className={`rounded-2xl border bg-white p-4 transition sm:p-5 ${
                        plan.is_completed
                          ? "border-[#e7e9e1] opacity-80"
                          : "border-[#eee6df] hover:border-[#d8c5d6]"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <button
                          type="button"
                          disabled={updatingId !== null}
                          onClick={() => void toggleCompleted(plan)}
                          aria-label={
                            plan.is_completed
                              ? `Mark ${plan.title} as pending`
                              : `Mark ${plan.title} as completed`
                          }
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                            plan.is_completed
                              ? "border-[#819275] bg-[#819275] text-white"
                              : "border-[#d6c6d5] text-transparent hover:border-[#816780]"
                          }`}
                        >
                          {updatingId === plan.id
                            ? "…"
                            : plan.is_completed
                              ? "✓"
                              : "✓"}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#f5eef5] px-2.5 py-1 text-[10px] font-medium text-[#816780]">
                              {plan.category || "General"}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                                plan.priority === "high"
                                  ? "bg-[#fae8e6] text-[#a65e56]"
                                  : plan.priority === "medium"
                                    ? "bg-[#f8efdc] text-[#987642]"
                                    : "bg-[#eaf0e6] text-[#63785b]"
                              }`}
                            >
                              {priorityLabel(plan.priority)} priority
                            </span>

                            {overdue && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-600">
                                Overdue
                              </span>
                            )}
                          </div>

                          <h3
                            className={`mt-3 break-words font-semibold text-[#514451] ${
                              plan.is_completed ? "line-through" : ""
                            }`}
                          >
                            {plan.title}
                          </h3>

                          {plan.description && (
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#91867d]">
                              {plan.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#a1978d]">
                            {plan.target_date && (
                              <span
                                className={
                                  overdue ? "font-medium text-red-600" : ""
                                }
                              >
                                {overdue ? "Past due · " : "Target · "}
                                {formatDate(plan.target_date)}
                              </span>
                            )}

                            <span>
                              {plan.is_completed ? "Completed" : "In progress"}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => startEdit(plan)}
                            className="rounded-lg border border-[#e7dce5] px-3 py-2 text-xs text-[#816780] hover:bg-[#f8f1f7]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingId !== null}
                            onClick={() => void handleDelete(plan)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === plan.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
