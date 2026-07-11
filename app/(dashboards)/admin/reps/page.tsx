"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserGroup03Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { RowActions } from "../_components/RowActions";
import { Tabs } from "../_components/Tabs";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { nairaFromKobo, formatPercent01 } from "../_components/format";
import { ApiError } from "@/lib/api/errors";
import {
  listAdminReps,
  suspendRep,
  reinstateRep,
  freezeRepPayouts,
  unfreezeRepPayouts,
  listRepApplications,
  getRepApplication,
  verifyRep,
  rejectRep,
  type AdminRep,
  type RepApplication,
  type RepApplicationStatus,
} from "@/lib/api/admin";

const STATUS_TONES: Record<AdminRep["status"], StatusTone> = {
  active: "ok",
  pending: "warn",
  suspended: "bad",
};

const VERIFICATION_TONES: Record<string, StatusTone> = {
  verified: "ok",
  pending: "warn",
  unverified: "neutral",
};

const APPLICATION_TONES: Record<RepApplicationStatus, StatusTone> = {
  pending: "warn",
  approved: "ok",
  rejected: "bad",
};

function rateTone(rate: number): StatusTone {
  if (rate >= 0.85) return "ok";
  if (rate >= 0.5) return "warn";
  return "bad";
}

function spacesLabel(rep: AdminRep) {
  const n = rep.departmentIds?.length ?? 0;
  return `${n} space${n === 1 ? "" : "s"}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminRepsPage() {
  const [tab, setTab] = useState<"directory" | "applications">("directory");

  // ---- Directory (active/suspended reps) -----------------------------------
  const [reps, setReps] = useState<AdminRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listAdminReps({ q: debouncedSearch || undefined, perPage: 100 });
      setReps(data);
    } catch {
      toast.error("Couldn't load reps.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? reps : reps.filter((r) => r.status === statusFilter)),
    [reps, statusFilter],
  );

  const selected = reps.find((r) => r.id === selectedId) ?? null;

  const patch = (id: string, next: Partial<AdminRep>) =>
    setReps((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const suspend = async (r: AdminRep) => {
    const reason = window.prompt(`Reason for suspending ${r.name}?`)?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      await suspendRep(r.id, reason);
      patch(r.id, { status: "suspended" });
      toast.success(`${r.name} suspended.`);
    } catch {
      toast.error("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const reinstate = async (r: AdminRep) => {
    setBusy(true);
    try {
      await reinstateRep(r.id);
      patch(r.id, { status: "active" });
      toast.success(`${r.name} reinstated.`);
    } catch {
      toast.error("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleFreeze = async (r: AdminRep) => {
    const next = !r.payoutsFrozen;
    setBusy(true);
    try {
      if (next) {
        const reason = window.prompt(`Reason for freezing ${r.name}'s payouts?`)?.trim();
        if (!reason) return;
        await freezeRepPayouts(r.id, reason);
      } else {
        await unfreezeRepPayouts(r.id);
      }
      patch(r.id, { payoutsFrozen: next });
      toast.success(`Payouts ${next ? "frozen" : "unfrozen"} for ${r.name}.`);
    } catch {
      toast.error("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  // ---- Applications (pending rep sign-ups) ---------------------------------
  const [applications, setApplications] = useState<RepApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appStatusFilter, setAppStatusFilter] = useState<RepApplicationStatus | "all">("pending");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appDetail, setAppDetail] = useState<RepApplication | null>(null);
  const [appDetailLoading, setAppDetailLoading] = useState(false);
  const [appBusy, setAppBusy] = useState(false);

  async function loadApplications() {
    setAppsLoading(true);
    try {
      const { data } = await listRepApplications({
        status: appStatusFilter === "all" ? undefined : appStatusFilter,
        perPage: 100,
      });
      setApplications(data);
    } catch {
      toast.error("Couldn't load rep applications.");
    } finally {
      setAppsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "applications") loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, appStatusFilter]);

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  function openApplication(id: string) {
    setSelectedAppId(id);
    setAppDetailLoading(true);
    setAppDetail(null);
    getRepApplication(id)
      .then(setAppDetail)
      .catch(() => {
        toast.error("Couldn't load that application.");
        setSelectedAppId(null);
      })
      .finally(() => setAppDetailLoading(false));
  }

  const verify = async (app: RepApplication) => {
    setAppBusy(true);
    try {
      const rep = await verifyRep(app.userId);
      toast.success(
        `${app.applicant?.name ?? "Applicant"} verified — ${app.requestedSpace.name} is live.`,
      );
      setApplications((prev) => prev.filter((a) => a.userId !== app.userId));
      setReps((prev) =>
        prev.some((r) => r.id === rep.id)
          ? prev.map((r) => (r.id === rep.id ? rep : r))
          : [rep, ...prev],
      );
      setSelectedAppId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't verify this application.",
      );
    } finally {
      setAppBusy(false);
    }
  };

  const reject = async (app: RepApplication) => {
    const reason = window
      .prompt(`Reason for rejecting ${app.applicant?.name ?? "this"}'s application?`)
      ?.trim();
    if (!reason) return;
    setAppBusy(true);
    try {
      await rejectRep(app.userId, reason);
      toast.success(`${app.applicant?.name ? `${app.applicant.name}'s` : "The"} application rejected.`);
      setApplications((prev) => prev.filter((a) => a.userId !== app.userId));
      setSelectedAppId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't reject this application.",
      );
    } finally {
      setAppBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reps"
        description="Every rep's spaces, held float and collection performance."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "directory", label: "Directory" },
          { value: "applications", label: `Applications${pendingCount ? ` (${pendingCount})` : ""}` },
        ]}
      />

      {tab === "directory" && (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by rep…" />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              label="Filter by status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "suspended", label: "Suspended" },
              ]}
            />
          </Toolbar>

          <TableCard title="Reps" subtitle="Click a row for the full profile">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={UserGroup03Icon}
                title="No reps match"
                description="Try a different search or clear the filters."
              />
            ) : (
              <DataTable
                headers={[
                  { label: "Rep" },
                  { label: "Spaces" },
                  { label: "Status" },
                  { label: "Verification" },
                  { label: "Float held" },
                  { label: "Collection rate" },
                  { label: "", align: "right" },
                ]}
              >
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="cursor-pointer transition-colors hover:bg-paper/40"
                  >
                    <td className="p-4 font-semibold text-ink">
                      {r.name}
                      {r.payoutsFrozen && (
                        <span className="ml-2 inline-block align-middle">
                          <StatusBadge tone="bad">Payouts frozen</StatusBadge>
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium">{spacesLabel(r)}</td>
                    <td className="p-4">
                      <StatusBadge tone={STATUS_TONES[r.status]}>{r.status}</StatusBadge>
                    </td>
                    <td className="p-4">
                      <StatusBadge tone={VERIFICATION_TONES[r.verification ?? "unverified"]}>
                        {r.verification ?? "unverified"}
                      </StatusBadge>
                    </td>
                    <td className="p-4 font-semibold">{nairaFromKobo(r.heldAmount)}</td>
                    <td className="p-4">
                      <StatusBadge tone={rateTone(r.collectionRate)}>
                        {formatPercent01(r.collectionRate)}
                      </StatusBadge>
                    </td>
                    <td className="p-4 text-right">
                      <RowActions
                        actions={[
                          r.status === "suspended"
                            ? { label: "Reinstate", onSelect: () => reinstate(r) }
                            : { label: "Suspend", tone: "danger", onSelect: () => suspend(r) },
                          {
                            label: r.payoutsFrozen ? "Unfreeze payouts" : "Freeze payouts",
                            tone: r.payoutsFrozen ? "default" : "danger",
                            onSelect: () => toggleFreeze(r),
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
              icon={UserGroup03Icon}
              title={selected.name}
              description={selected.email ?? spacesLabel(selected)}
              onClose={() => setSelectedId(null)}
              footer={
                <>
                  <Button
                    variant="brand-outline"
                    size="pill"
                    disabled={busy}
                    onClick={() => toggleFreeze(selected)}
                  >
                    {selected.payoutsFrozen ? "Unfreeze payouts" : "Freeze payouts"}
                  </Button>
                  {selected.status === "suspended" ? (
                    <Button variant="brand" size="pill" disabled={busy} onClick={() => reinstate(selected)}>
                      Reinstate rep
                    </Button>
                  ) : (
                    <Button
                      variant="danger-outline"
                      size="pill"
                      disabled={busy}
                      onClick={() => suspend(selected)}
                    >
                      Suspend rep
                    </Button>
                  )}
                </>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <ModalField label="Status">
                  <StatusBadge tone={STATUS_TONES[selected.status]}>{selected.status}</StatusBadge>
                </ModalField>
                <ModalField label="Verification">
                  <StatusBadge tone={VERIFICATION_TONES[selected.verification ?? "unverified"]}>
                    {selected.verification ?? "unverified"}
                  </StatusBadge>
                </ModalField>
                <ModalField label="Float held">{nairaFromKobo(selected.heldAmount)}</ModalField>
                <ModalField label="Uncollected dues">
                  {nairaFromKobo(selected.uncollectedAmount)}
                </ModalField>
                <ModalField label="Collection rate" className="sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-cloud">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${Math.round(selected.collectionRate * 100)}%` }}
                      />
                    </div>
                    <span>{formatPercent01(selected.collectionRate)}</span>
                  </div>
                </ModalField>
              </div>
            </AdminModal>
          )}
        </>
      )}

      {tab === "applications" && (
        <>
          <Toolbar>
            <FilterSelect
              value={appStatusFilter}
              onChange={(v) => setAppStatusFilter(v as RepApplicationStatus | "all")}
              label="Filter by status"
              options={[
                { value: "pending", label: "Pending review" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "all", label: "All applications" },
              ]}
            />
          </Toolbar>

          <TableCard
            title="Rep applications"
            subtitle="New sign-ups requesting a department — click a row to review"
          >
            {appsLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                icon={UserAdd01Icon}
                title="No applications"
                description="Rep sign-ups waiting on review will show up here."
              />
            ) : (
              <DataTable
                headers={[
                  { label: "Applicant" },
                  { label: "Requested space" },
                  { label: "School" },
                  { label: "Submitted" },
                  { label: "Status" },
                  { label: "", align: "right" },
                ]}
              >
                {applications.map((app) => (
                  <tr
                    key={app.userId}
                    onClick={() => openApplication(app.userId)}
                    className="cursor-pointer transition-colors hover:bg-paper/40"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-ink">
                        {app.applicant?.name ?? "Unknown applicant"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {app.applicant?.email ?? "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-ink">{app.requestedSpace.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{app.requestedSpace.short}</p>
                    </td>
                    <td className="p-4 font-medium">{app.requestedSpace.school}</td>
                    <td className="p-4 text-ink-soft">{formatDate(app.submittedAt)}</td>
                    <td className="p-4">
                      <StatusBadge tone={APPLICATION_TONES[app.status]}>{app.status}</StatusBadge>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === "pending" && (
                        <RowActions
                          actions={[
                            { label: "Verify rep", onSelect: () => verify(app) },
                            { label: "Reject", tone: "danger", onSelect: () => reject(app) },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </TableCard>

          {selectedAppId && (
            <AdminModal
              wide
              icon={UserAdd01Icon}
              title={appDetail?.applicant?.name ?? "Application"}
              description={appDetail?.applicant?.email}
              onClose={() => setSelectedAppId(null)}
              footer={
                appDetail && appDetail.status === "pending" ? (
                  <>
                    <Button
                      variant="danger-outline"
                      size="pill"
                      disabled={appBusy}
                      onClick={() => reject(appDetail)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="brand"
                      size="pill"
                      disabled={appBusy}
                      onClick={() => verify(appDetail)}
                    >
                      Verify rep
                    </Button>
                  </>
                ) : undefined
              }
            >
              {appDetailLoading || !appDetail ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ModalField label="Status">
                    <StatusBadge tone={APPLICATION_TONES[appDetail.status]}>
                      {appDetail.status}
                    </StatusBadge>
                  </ModalField>
                  <ModalField label="Submitted">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {formatDate(appDetail.submittedAt)}
                    </span>
                  </ModalField>
                  <ModalField label="Matric number">
                    {appDetail.applicant?.matricNo ?? "—"}
                  </ModalField>
                  <ModalField label="Level">{appDetail.applicant?.level ?? "—"}</ModalField>
                  <ModalField label="Referral code">{appDetail.referralCode ?? "—"}</ModalField>
                  <ModalField label="Requested space" className="sm:col-span-2">
                    {appDetail.requestedSpace.name} ({appDetail.requestedSpace.short})
                  </ModalField>
                  <ModalField label="Kind">{appDetail.requestedSpace.kind}</ModalField>
                  <ModalField label="School">{appDetail.requestedSpace.school}</ModalField>
                  <ModalField label="Faculty" className="sm:col-span-2">
                    {appDetail.requestedSpace.faculty ?? "—"}
                  </ModalField>
                  <ModalField label="Co-rep invites" className="sm:col-span-2">
                    {appDetail.coRepInvites.length > 0
                      ? appDetail.coRepInvites.join(", ")
                      : "None invited"}
                  </ModalField>
                  {appDetail.status !== "pending" && (
                    <>
                      <ModalField label="Reviewed">
                        {appDetail.reviewedAt ? formatDate(appDetail.reviewedAt) : "—"}
                      </ModalField>
                      <ModalField label="Review note">
                        {appDetail.reviewNote ?? "—"}
                      </ModalField>
                    </>
                  )}
                </div>
              )}
            </AdminModal>
          )}
        </>
      )}
    </div>
  );
}
