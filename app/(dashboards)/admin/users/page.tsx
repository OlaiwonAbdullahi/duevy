"use client";

import { useEffect, useState } from "react";
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
import { nairaFromKobo } from "../_components/format";
import {
  listAdminUsers,
  suspendUser,
  unsuspendUser,
  deactivateUser,
  reviewKyc,
  type AdminUser,
} from "@/lib/api/admin";
import type { KycStatus, UserRole } from "@/lib/api/types";

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listAdminUsers({
        role: roleFilter === "all" ? undefined : (roleFilter as UserRole),
        kycStatus: kycFilter === "all" ? undefined : (kycFilter as KycStatus),
        q: debouncedSearch || undefined,
        perPage: 100,
      });
      setUsers(data);
    } catch {
      toast.error("Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, kycFilter, debouncedSearch]);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  const setSuspended = async (u: AdminUser, next: boolean) => {
    setBusy(true);
    try {
      if (next) {
        const reason = window
          .prompt(`Reason for suspending ${u.name}?`)
          ?.trim();
        if (!reason) return;
        await suspendUser(u.id, reason);
      } else {
        await unsuspendUser(u.id);
      }
      setUsers((list) =>
        list.map((x) => (x.id === u.id ? { ...x, isSuspended: next } : x)),
      );
      toast.success(`${u.name} ${next ? "suspended" : "unsuspended"}.`);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (u: AdminUser) => {
    const reason = window.prompt(`Reason for deactivating ${u.name}?`)?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      await deactivateUser(u.id, reason);
      setUsers((list) =>
        list.map((x) => (x.id === u.id ? { ...x, isDeactivated: true } : x)),
      );
      toast.success(`${u.name} deactivated.`);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const decideKyc = async (u: AdminUser, decision: "verified" | "rejected") => {
    setBusy(true);
    try {
      const { kycStatus } = await reviewKyc(u.id, { decision });
      setUsers((list) =>
        list.map((x) => (x.id === u.id ? { ...x, kycStatus } : x)),
      );
      toast.success(`KYC ${decision} for ${u.name}.`);
    } catch {
      toast.error("Couldn't update KYC.");
    } finally {
      setBusy(false);
    }
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
          placeholder="Search by name or email…"
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
            { value: "unverified", label: "Unverified" },
          ]}
        />
      </Toolbar>

      <TableCard title="Accounts" subtitle="Click a row for the full profile">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No users match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "User" },
              { label: "Role" },
              { label: "KYC" },
              { label: "", align: "right" },
            ]}
          >
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {u.name}
                    {u.isSuspended && (
                      <StatusBadge tone="bad">Suspended</StatusBadge>
                    )}
                    {u.isDeactivated && (
                      <StatusBadge tone="neutral">Inactive</StatusBadge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">{u.email}</p>
                </td>
                <td className="p-4">
                  <StatusBadge tone={ROLE_TONES[u.role]}>{u.role}</StatusBadge>
                </td>
                <td className="p-4">
                  <StatusBadge tone={KYC_TONES[u.kycStatus]}>
                    {u.kycStatus}
                  </StatusBadge>
                </td>
                <td className="p-4 text-right">
                  <RowActions
                    actions={[
                      {
                        label: u.isSuspended ? "Unsuspend" : "Suspend",
                        tone: u.isSuspended ? "default" : "danger",
                        onSelect: () => setSuspended(u, !u.isSuspended),
                      },
                      ...(u.isDeactivated
                        ? []
                        : [
                            {
                              label: "Deactivate",
                              onSelect: () => deactivate(u),
                            },
                          ]),
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
          description={selected.email}
          onClose={() => setSelectedId(null)}
          footer={
            <>
              {selected.kycStatus === "pending" && (
                <>
                  <Button
                    variant="brand-outline"
                    size="pill"
                    disabled={busy}
                    onClick={() => decideKyc(selected, "verified")}
                  >
                    Approve KYC
                  </Button>
                  <Button
                    variant="danger-outline"
                    size="pill"
                    disabled={busy}
                    onClick={() => decideKyc(selected, "rejected")}
                  >
                    Reject KYC
                  </Button>
                </>
              )}
              <Button
                variant={
                  selected.isSuspended ? "brand-outline" : "danger-outline"
                }
                size="pill"
                disabled={busy}
                onClick={() => setSuspended(selected, !selected.isSuspended)}
              >
                {selected.isSuspended ? "Unsuspend" : "Suspend"}
              </Button>
              {!selected.isDeactivated && (
                <Button
                  variant="brand-outline"
                  size="pill"
                  disabled={busy}
                  onClick={() => deactivate(selected)}
                >
                  Deactivate
                </Button>
              )}
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Role">
              <StatusBadge tone={ROLE_TONES[selected.role]}>
                {selected.role}
              </StatusBadge>
            </ModalField>
            <ModalField label="KYC status">
              <StatusBadge tone={KYC_TONES[selected.kycStatus]}>
                {selected.kycStatus}
              </StatusBadge>
            </ModalField>
            <ModalField label="Matric number">
              {selected.matricNo ?? "—"}
            </ModalField>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
