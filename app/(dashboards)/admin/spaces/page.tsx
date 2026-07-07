"use client";

import { useMemo, useState } from "react";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { Tabs } from "../_components/Tabs";
import { naira, formatPercent01 } from "../_components/format";
import { mockDepartments } from "../_components/MockData";

type SpaceType = "Department" | "Faculty" | "Association";

interface Space {
  id: string;
  name: string;
  school: string;
  type: SpaceType;
  memberCount: number;
  duesTarget: number;
  collectedAmount: number;
}

const SPACE_TYPES: SpaceType[] = ["Department", "Faculty", "Association"];

const spaces: Space[] = mockDepartments.map((d, i) => ({
  id: d.id,
  name: d.name,
  school: d.school,
  type: SPACE_TYPES[i % SPACE_TYPES.length],
  memberCount: d.memberCount,
  duesTarget: d.duesTarget,
  collectedAmount: d.collectedAmount,
}));

/** Sample space contents shown in the detail modal until real data lands. */
const mockDues = [
  { id: "d1", name: "Semester dues", type: "Levy", amount: 10000 },
  { id: "d2", name: "Annual dinner", type: "Event", amount: 5000 },
  { id: "d3", name: "Course handouts", type: "Handout", amount: 3500 },
];

const mockMembers = [
  { id: "m1", name: "Amara Nwosu", status: "Paid", owed: 0 },
  { id: "m2", name: "Chidi Egwu", status: "Partial", owed: 5000 },
  { id: "m3", name: "Tunde Bakare", status: "Unpaid", owed: 20500 },
];

const PAYMENT_TONES: Record<string, StatusTone> = {
  Paid: "ok",
  Partial: "warn",
  Unpaid: "bad",
};

function collectionTone(ratio: number): StatusTone {
  if (ratio >= 0.85) return "ok";
  if (ratio >= 0.65) return "warn";
  return "bad";
}

export default function AdminSpacesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<"dues" | "members">("dues");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spaces.filter(
      (s) =>
        (q === "" ||
          s.name.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q)) &&
        (typeFilter === "all" || s.type === typeFilter),
    );
  }, [search, typeFilter]);

  const selected = spaces.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Spaces"
        description="Every collection hub — departments, faculties and associations."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by space or school…"
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          label="Filter by type"
          options={[
            { value: "all", label: "All types" },
            ...SPACE_TYPES.map((t) => ({ value: t, label: `${t}s` })),
          ]}
        />
      </Toolbar>

      <TableCard title="Spaces" subtitle="Click a row to see dues and members">
        {filtered.length === 0 ? (
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
            {filtered.map((s) => {
              const ratio = s.collectedAmount / s.duesTarget;
              return (
                <tr
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                    setModalTab("dues");
                  }}
                  className="cursor-pointer transition-colors hover:bg-paper/40"
                >
                  <td className="p-4">
                    <p className="font-semibold text-ink">{s.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{s.school}</p>
                  </td>
                  <td className="p-4">
                    <StatusBadge tone="neutral">{s.type}</StatusBadge>
                  </td>
                  <td className="p-4 font-medium">{s.memberCount}</td>
                  <td className="p-4 font-semibold">{naira(s.duesTarget)}</td>
                  <td className="p-4 font-semibold text-brand">
                    {naira(s.collectedAmount)}
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

      {selected && (
        <AdminModal
          wide
          icon={Building03Icon}
          title={selected.name}
          description={`${selected.type} · ${selected.school}`}
          onClose={() => setSelectedId(null)}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <ModalField label="Dues target">{naira(selected.duesTarget)}</ModalField>
            <ModalField label="Collected">
              <span className="text-brand">{naira(selected.collectedAmount)}</span>
            </ModalField>
            <ModalField label="Collection rate">
              {formatPercent01(selected.collectedAmount / selected.duesTarget)}
            </ModalField>
          </div>

          <div className="mt-5">
            <Tabs
              value={modalTab}
              onChange={setModalTab}
              items={[
                { value: "dues", label: "Dues" },
                { value: "members", label: "Members" },
              ]}
            />

            {modalTab === "dues" && (
              <ul className="mt-4 space-y-2">
                {mockDues.map((due) => (
                  <li
                    key={due.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-cloud bg-canvas p-3.5"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{due.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{due.type}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-ink">
                      {naira(due.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {modalTab === "members" && (
              <div className="mt-4">
                <DataTable
                  headers={[
                    { label: "Member" },
                    { label: "Status" },
                    { label: "Owed", align: "right" },
                  ]}
                >
                  {mockMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="p-3.5 font-medium">{m.name}</td>
                      <td className="p-3.5">
                        <StatusBadge tone={PAYMENT_TONES[m.status]}>
                          {m.status}
                        </StatusBadge>
                      </td>
                      <td className="p-3.5 text-right font-semibold">
                        {naira(m.owed)}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
