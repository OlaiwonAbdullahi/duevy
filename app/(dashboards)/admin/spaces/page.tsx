"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND_INPUT } from "../../dashboard/_components/form-styles";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { nairaFromKobo, formatPercent01 } from "../_components/format";
import { ApiError } from "@/lib/api/errors";
import type { SpaceKind } from "@/lib/api/types";
import {
  listAdminSpaces,
  createAdminSpace,
  updateAdminSpace,
  assignRep,
  archiveAdminSpace,
  type AdminSpace,
  type AdminSpaceInput,
} from "@/lib/api/admin";

const KINDS: { value: SpaceKind; label: string }[] = [
  { value: "department", label: "Department" },
  { value: "association", label: "Association" },
  { value: "faculty", label: "Faculty" },
  { value: "club", label: "Club" },
];

const KIND_LABEL: Record<SpaceKind, string> = {
  department: "Department",
  association: "Association",
  faculty: "Faculty",
  club: "Club",
};

const EMPTY_FORM: AdminSpaceInput = {
  name: "",
  short: "",
  kind: "department",
  school: "",
  faculty: "",
};

function collectionTone(ratio: number): StatusTone {
  if (ratio >= 0.85) return "ok";
  if (ratio >= 0.65) return "warn";
  return "bad";
}

function SpaceFormFields({
  form,
  onChange,
}: {
  form: AdminSpaceInput;
  onChange: (next: AdminSpaceInput) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="space-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Space name
        </label>
        <Input
          id="space-name"
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="e.g. Computer Science Students' Association"
          className={BRAND_INPUT}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="space-short" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Short code
          </label>
          <Input
            id="space-short"
            required
            minLength={2}
            maxLength={6}
            value={form.short}
            onChange={(e) => onChange({ ...form, short: e.target.value.toUpperCase() })}
            placeholder="e.g. CSSA"
            className={BRAND_INPUT}
          />
        </div>
        <div>
          <label htmlFor="space-kind" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Type
          </label>
          <FilterSelect
            value={form.kind}
            onChange={(v) => onChange({ ...form, kind: v as SpaceKind })}
            label="Space type"
            options={KINDS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="space-school" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          School
        </label>
        <Input
          id="space-school"
          required
          value={form.school}
          onChange={(e) => onChange({ ...form, school: e.target.value })}
          placeholder="e.g. University of Lagos"
          className={BRAND_INPUT}
        />
      </div>

      <div>
        <label htmlFor="space-faculty" className="mb-1.5 block text-xs font-semibold text-ink-soft">
          Faculty (optional)
        </label>
        <Input
          id="space-faculty"
          value={form.faculty ?? ""}
          onChange={(e) => onChange({ ...form, faculty: e.target.value })}
          placeholder="e.g. Faculty of Science"
          className={BRAND_INPUT}
        />
      </div>
    </div>
  );
}

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<AdminSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AdminSpaceInput>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<AdminSpaceInput>(EMPTY_FORM);

  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<"lead" | "co">("co");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listAdminSpaces({
        q: debouncedSearch || undefined,
        type: kindFilter === "all" ? undefined : (kindFilter as SpaceKind),
        perPage: 100,
      });
      setSpaces(data);
    } catch {
      toast.error("Couldn't load spaces.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, kindFilter]);

  const selected = useMemo(
    () => spaces.find((s) => s.id === selectedId) ?? null,
    [spaces, selectedId],
  );

  function openSpace(space: AdminSpace) {
    setSelectedId(space.id);
    setEditing(false);
    setAssignUserId("");
    setAssignRole("co");
  }

  function startEdit(space: AdminSpace) {
    setEditForm({
      name: space.name,
      short: space.short ?? "",
      kind: space.kind,
      school: space.school,
      faculty: space.faculty ?? "",
    });
    setEditing(true);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const space = await createAdminSpace({
        ...createForm,
        faculty: createForm.faculty || undefined,
      });
      setSpaces((prev) => [space, ...prev]);
      toast.success(`${space.name} created.`);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create this space.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSave(event: React.FormEvent<HTMLFormElement>, space: AdminSpace) {
    event.preventDefault();
    setBusy(true);
    try {
      const updated = await updateAdminSpace(space.id, {
        ...editForm,
        faculty: editForm.faculty || undefined,
      });
      setSpaces((prev) => prev.map((s) => (s.id === space.id ? updated : s)));
      toast.success("Space updated.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update this space.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(event: React.FormEvent<HTMLFormElement>, space: AdminSpace) {
    event.preventDefault();
    const userId = assignUserId.trim();
    if (!userId) return;
    setBusy(true);
    try {
      await assignRep(space.id, { userId, role: assignRole });
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === space.id ? { ...s, assignedRepIds: [...s.assignedRepIds, userId] } : s,
        ),
      );
      toast.success("Rep assigned to this space.");
      setAssignUserId("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't assign this rep.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(space: AdminSpace) {
    const reason = window.prompt(`Reason for archiving ${space.name}?`)?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      await archiveAdminSpace(space.id, reason);
      setSpaces((prev) => prev.filter((s) => s.id !== space.id));
      toast.success(`${space.name} archived.`);
      setSelectedId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't archive this space.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Spaces"
        description="Every collection hub — departments, faculties and associations."
        right={
          <Button variant="brand" size="pill" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} size={14} />
            New space
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by space or school…"
        />
        <FilterSelect
          value={kindFilter}
          onChange={setKindFilter}
          label="Filter by type"
          options={[
            { value: "all", label: "All types" },
            ...KINDS.map((k) => ({ value: k.value, label: `${k.label}s` })),
          ]}
        />
      </Toolbar>

      <TableCard title="Spaces" subtitle="Click a row to manage reps and details">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <EmptyState
            icon={Building03Icon}
            title="No spaces match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Space" },
              { label: "Type" },
              { label: "Members" },
              { label: "Target" },
              { label: "Collected" },
              { label: "Rate" },
            ]}
          >
            {spaces.map((s) => {
              const ratio = s.duesTarget ? s.collectedAmount / s.duesTarget : 0;
              return (
                <tr
                  key={s.id}
                  onClick={() => openSpace(s)}
                  className="cursor-pointer transition-colors hover:bg-paper/40"
                >
                  <td className="p-4">
                    <p className="font-semibold text-ink">
                      {s.name}
                      {s.payoutsFrozen && (
                        <span className="ml-2 inline-block align-middle">
                          <StatusBadge tone="bad">Payouts frozen</StatusBadge>
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{s.school}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge tone="neutral">{KIND_LABEL[s.kind]}</StatusBadge>
                  </td>
                  <td className="p-4 font-medium">{s.memberCount ?? 0}</td>
                  <td className="p-4 font-semibold">{nairaFromKobo(s.duesTarget)}</td>
                  <td className="p-4 font-semibold text-brand">
                    {nairaFromKobo(s.collectedAmount)}
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={collectionTone(ratio)}>
                      {formatPercent01(ratio)}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </TableCard>

      {createOpen && (
        <AdminModal
          icon={Building03Icon}
          title="New space"
          description="Departments, faculties, associations and clubs all use this form."
          onClose={() => setCreateOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleCreate}>
            <SpaceFormFields form={createForm} onChange={setCreateForm} />
            <Button type="submit" variant="brand" size="pill" className="w-full" disabled={creating}>
              {creating ? "Creating…" : "Create space"}
            </Button>
          </form>
        </AdminModal>
      )}

      {selected && (
        <AdminModal
          wide
          icon={Building03Icon}
          title={selected.name}
          description={`${KIND_LABEL[selected.kind]} · ${selected.school}`}
          onClose={() => setSelectedId(null)}
          footer={
            <>
              <Button
                variant="danger-outline"
                size="pill"
                disabled={busy}
                onClick={() => handleArchive(selected)}
              >
                Archive
              </Button>
              <Button
                variant="brand-outline"
                size="pill"
                disabled={busy}
                onClick={() => (editing ? setEditing(false) : startEdit(selected))}
              >
                {editing ? "Cancel edit" : "Edit space"}
              </Button>
            </>
          }
        >
          {editing ? (
            <form onSubmit={(e) => handleEditSave(e, selected)}>
              <SpaceFormFields form={editForm} onChange={setEditForm} />
              <Button type="submit" variant="brand" size="pill" className="mt-4 w-full" disabled={busy}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </form>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <ModalField label="Dues target">{nairaFromKobo(selected.duesTarget)}</ModalField>
                <ModalField label="Collected">
                  <span className="text-brand">{nairaFromKobo(selected.collectedAmount)}</span>
                </ModalField>
                <ModalField label="Collection rate">
                  {formatPercent01(
                    selected.duesTarget ? selected.collectedAmount / selected.duesTarget : 0,
                  )}
                </ModalField>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold text-ink-soft">Assigned reps</p>
                {selected.assignedRepIds.length === 0 ? (
                  <EmptyState
                    size="sm"
                    className="rounded-2xl border border-dashed border-cloud"
                    icon={Building03Icon}
                    title="No reps assigned"
                    description="Assign a rep below so they can run this space."
                  />
                ) : (
                  <ul className="space-y-2">
                    {selected.assignedRepIds.map((repId) => (
                      <li
                        key={repId}
                        className="rounded-xl border border-cloud bg-canvas p-2.5 font-mono text-xs text-ink-soft"
                      >
                        {repId}
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  onSubmit={(e) => handleAssign(e, selected)}
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                >
                  <Input
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    placeholder="Rep user id (usr_…)"
                    className={BRAND_INPUT}
                  />
                  <FilterSelect
                    value={assignRole}
                    onChange={(v) => setAssignRole(v as "lead" | "co")}
                    label="Rep role"
                    options={[
                      { value: "co", label: "Co-rep" },
                      { value: "lead", label: "Lead rep" },
                    ]}
                  />
                  <Button type="submit" variant="brand-outline" size="pill" disabled={busy}>
                    Assign
                  </Button>
                </form>
              </div>
            </>
          )}
        </AdminModal>
      )}
    </div>
  );
}
