"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { RowActions } from "../_components/RowActions";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { naira } from "../_components/format";

type UserRole = "student" | "rep" | "admin";
type KycStatus = "verified" | "pending" | "rejected" | "unverified";

interface AppUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  department: string;
  walletBalance: number;
  isDeactivated: boolean;
  isSuspended: boolean;
  kycStatus: KycStatus;
  kycDocs: string[];
  spaces: string[];
}

const initialUsers: AppUser[] = [
  {
    id: "user_2891",
    role: "student",
    name: "Ada Nwosu",
    email: "ada@duevy.com",
    department: "Computer Science 2025",
    walletBalance: 1200,
    isDeactivated: false,
    isSuspended: false,
    kycStatus: "verified",
    kycDocs: ["BVN verification", "School ID card"],
    spaces: ["Faculty of Science Collective", "Computer Science Association"],
  },
  {
    id: "user_774",
    role: "rep",
    name: "Kofi Mensah",
    email: "kofi@duevy.com",
    department: "Business Studies 2025",
    walletBalance: 98000,
    isDeactivated: false,
    isSuspended: false,
    kycStatus: "pending",
    kycDocs: ["NIN slip"],
    spaces: ["Business Studies Hub"],
  },
  {
    id: "user_112",
    role: "student",
    name: "Zainab Sani",
    email: "zainab@duevy.com",
    department: "Mass Comm 2024",
    walletBalance: 0,
    isDeactivated: true,
    isSuspended: false,
    kycStatus: "rejected",
    kycDocs: ["NIN (mismatched)"],
    spaces: ["Mass Communication Press Unit"],
  },
];

const KYC_TONES: Record<KycStatus, StatusTone> = {
  verified: "ok",
  pending: "warn",
  rejected: "bad",
  unverified: "neutral",
};

const ROLE_TONES: Record<UserRole, StatusTone> = {
  admin: "warn",
  rep: "ok",
  student: "neutral",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (q === "" ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)) &&
        (roleFilter === "all" || u.role === roleFilter) &&
        (kycFilter === "all" || u.kycStatus === kycFilter),
    );
  }, [users, search, roleFilter, kycFilter]);

  // Keep the modal in sync with list edits by deriving it from the list.
  const selected = users.find((u) => u.id === selectedId) ?? null;

  const toggleFlag = (id: string, key: "isSuspended" | "isDeactivated") => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [key]: !u[key] } : u)),
    );
    const user = users.find((u) => u.id === id);
    if (!user) return;
    toast(
      key === "isSuspended"
        ? `${user.name} ${user.isSuspended ? "unsuspended" : "suspended"}.`
        : `${user.name} ${user.isDeactivated ? "reactivated" : "deactivated"}.`,
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Users"
        description="Search and manage every account on the platform."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or department…"
        />
        <FilterSelect
          value={roleFilter}
          onChange={setRoleFilter}
          label="Filter by role"
          options={[
            { value: "all", label: "All roles" },
            { value: "student", label: "Students" },
            { value: "rep", label: "Reps" },
            { value: "admin", label: "Admins" },
          ]}
        />
        <FilterSelect
          value={kycFilter}
          onChange={setKycFilter}
          label="Filter by KYC status"
          options={[
            { value: "all", label: "All KYC statuses" },
            { value: "verified", label: "Verified" },
            { value: "pending", label: "Pending" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      </Toolbar>

      <TableCard title="Accounts" subtitle="Click a row for the full profile">
        {filtered.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No users match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "User" },
              { label: "Department" },
              { label: "Role" },
              { label: "Balance" },
              { label: "KYC" },
              { label: "", align: "right" },
            ]}
          >
            {filtered.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {u.name}
                    {u.isSuspended && <StatusBadge tone="bad">Suspended</StatusBadge>}
                    {u.isDeactivated && (
                      <StatusBadge tone="neutral">Inactive</StatusBadge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">{u.email}</p>
                </td>
                <td className="p-4 font-medium">{u.department}</td>
                <td className="p-4">
                  <StatusBadge tone={ROLE_TONES[u.role]}>{u.role}</StatusBadge>
                </td>
                <td className="p-4 font-semibold">{naira(u.walletBalance)}</td>
                <td className="p-4">
                  <StatusBadge tone={KYC_TONES[u.kycStatus]}>{u.kycStatus}</StatusBadge>
                </td>
                <td className="p-4 text-right">
                  <RowActions
                    actions={[
                      {
                        label: u.isSuspended ? "Unsuspend" : "Suspend",
                        tone: u.isSuspended ? "default" : "danger",
                        onSelect: () => toggleFlag(u.id, "isSuspended"),
                      },
                      {
                        label: u.isDeactivated ? "Reactivate" : "Deactivate",
                        onSelect: () => toggleFlag(u.id, "isDeactivated"),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          wide
          icon={UserIcon}
          title={selected.name}
          description={`${selected.email} · ${selected.department}`}
          onClose={() => setSelectedId(null)}
          footer={
            <>
              <Button
                variant={selected.isSuspended ? "brand-outline" : "danger-outline"}
                size="pill"
                onClick={() => toggleFlag(selected.id, "isSuspended")}
              >
                {selected.isSuspended ? "Unsuspend" : "Suspend"}
              </Button>
              <Button
                variant="brand-outline"
                size="pill"
                onClick={() => toggleFlag(selected.id, "isDeactivated")}
              >
                {selected.isDeactivated ? "Reactivate" : "Deactivate"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Wallet balance">{naira(selected.walletBalance)}</ModalField>
            <ModalField label="KYC status">
              <StatusBadge tone={KYC_TONES[selected.kycStatus]}>
                {selected.kycStatus}
              </StatusBadge>
            </ModalField>
            <ModalField label="Spaces">
              <ul className="space-y-1 text-[13px]">
                {selected.spaces.map((space) => (
                  <li key={space} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {space}
                  </li>
                ))}
              </ul>
            </ModalField>
            <ModalField label="KYC documents">
              {selected.kycDocs.length ? (
                <ul className="space-y-1 text-[13px] font-medium text-ink-soft">
                  {selected.kycDocs.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-ink-soft">None uploaded</span>
              )}
            </ModalField>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
