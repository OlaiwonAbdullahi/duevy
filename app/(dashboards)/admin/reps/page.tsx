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
  listAdminSpaces,
  suspendRep,
  reinstateRep,
  freezeRepPayouts,
  unfreezeRepPayouts,
  listRepApplications,
  getRepApplication,
  verifyRep,
  rejectRep,
  reviewStudentId,
  listStudentIdsForReview,
  applicationKycReady,
  type AdminRep,
  type ApplicationKyc,
  type RepApplication,
  type RepApplicationStatus,
  type StudentIdReviewRow,
} from "@/lib/api/admin";
import { ApplicationReviewModal, IdReuploadModal } from "./_components/RepReview";

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

/** NIN (Bachs) verdict → badge. */
const NIN_META: Record<ApplicationKyc["identity"]["status"], { tone: StatusTone; label: string }> = {
  unverified: { tone: "neutral", label: "NIN not submitted" },
  pending: { tone: "warn", label: "NIN pending" },
  verified: { tone: "ok", label: "NIN verified" },
  rejected: { tone: "bad", label: "NIN failed" },
};

/** Student ID review state → badge. */
function studentIdMeta(status: ApplicationKyc["studentId"]["status"]): { tone: StatusTone; label: string } {
  if (status === "approved") return { tone: "ok", label: "ID approved" };
  if (status === "pending") return { tone: "warn", label: "ID to review" };
  if (status === "rejected") return { tone: "bad", label: "ID rejected" };
  return { tone: "neutral", label: "No ID yet" };
}

function KycBadges({ kyc }: { kyc: ApplicationKyc | null }) {
  if (!kyc) return <span className="text-xs text-ink-soft">—</span>;
  const nin = NIN_META[kyc.identity.status];
  const id = studentIdMeta(kyc.studentId.status);
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusBadge tone={nin.tone}>{nin.label}</StatusBadge>
      <StatusBadge tone={id.tone}>{id.label}</StatusBadge>
    </div>
  );
}

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
      // `/admin/reps` doesn't say whether payouts are frozen; that flag lives on
      // the rep's spaces, so read it from `/admin/spaces`.
      const [{ data }, spaces] = await Promise.all([
        listAdminReps({ q: debouncedSearch || undefined, perPage: 100 }),
        listAdminSpaces({ perPage: 100 }).then((p) => p.data).catch(() => []),
      ]);
      const frozen = new Set(spaces.filter((s) => s.payoutsFrozen).map((s) => s.id));
      setReps(
        data.map((r) => ({
          ...r,
          payoutsFrozen: r.payoutsFrozen ?? (r.departmentIds ?? []).some((id) => frozen.has(id)),
        })),
      );
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
    } catch (err) {
      // e.g. 404 "Rep leads no spaces" for a co-rep — say why.
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
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

  // Loaded up front (not only on the tab) so the tab shows how many are waiting.
  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appStatusFilter]);

  // ---- Student ID re-uploads from reps who are already approved -------------
  // (An applicant's ID is reviewed inside their application instead.)
  const [idReuploads, setIdReuploads] = useState<StudentIdReviewRow[]>([]);
  const [idRow, setIdRow] = useState<StudentIdReviewRow | null>(null);
  const [idBusy, setIdBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listStudentIdsForReview({ status: "pending", perPage: 100 }),
      listRepApplications({ status: "pending", perPage: 100 }),
    ])
      .then(([ids, apps]) => {
        if (cancelled) return;
        const applicants = new Set(apps.data.map((a) => a.userId));
        setIdReuploads(ids.data.filter((r) => !applicants.has(r.userId)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const openIdReupload = async (row: StudentIdReviewRow) => {
    // Signed links are short-lived — re-fetch so the image still loads.
    const fresh = await listStudentIdsForReview({ status: "pending", perPage: 100 }).catch(() => null);
    setIdRow(fresh?.data.find((r) => r.userId === row.userId) ?? row);
  };

  const decideIdReupload = async (decision: "approved" | "rejected", note?: string) => {
    if (!idRow) return;
    setIdBusy(true);
    try {
      await reviewStudentId(idRow.userId, { decision, note });
      toast.success(decision === "approved" ? `${idRow.name}'s student ID approved.` : `Sent back to ${idRow.name}.`);
      setIdReuploads((list) => list.filter((r) => r.userId !== idRow.userId));
      setIdRow(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the review.");
    } finally {
      setIdBusy(false);
    }
  };

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

  // Ask the applicant to upload a better student ID (their NIN result stands).
  // Resolves whether it worked, so the modal keeps the note on a failure.
  const rejectStudentId = async (app: RepApplication, note: string): Promise<boolean> => {
    setAppBusy(true);
    try {
      await reviewStudentId(app.userId, { decision: "rejected", note });
      toast.success("Asked the applicant for a new student ID.");
      const fresh = await getRepApplication(app.userId).catch(() => null);
      if (fresh) {
        setAppDetail(fresh);
        setApplications((prev) => prev.map((a) => (a.userId === app.userId ? fresh : a)));
      }
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update the student ID.");
      return false;
    } finally {
      setAppBusy(false);
    }
  };

  const verify = async (app: RepApplication) => {
    setAppBusy(true);
    try {
      const rep = await verifyRep(app.userId);
      toast.success(
        `${app.applicant?.name ?? "Applicant"} approved — ${app.requestedSpace.name} is live.`,
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

  const reject = async (app: RepApplication, reason: string) => {
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
        description="Approve new reps, and manage every rep's spaces, float and collections."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "directory", label: "All reps" },
          { value: "applications", label: `Applications${pendingCount ? ` (${pendingCount})` : ""}` },
        ]}
      />

      {tab === "directory" && (
        <>
          {idReuploads.length > 0 && (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-ink">
                {idReuploads.length} rep{idReuploads.length === 1 ? "" : "s"} uploaded a new student ID
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Their departments can&apos;t collect until you approve it.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {idReuploads.map((row) => (
                  <li
                    key={row.userId}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                      <p className="truncate text-xs text-ink-soft">{row.email}</p>
                    </div>
                    <Button variant="brand-outline" size="pill" onClick={() => void openIdReupload(row)}>
                      Review ID
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

      {idRow && (
        <IdReuploadModal
          key={idRow.userId}
          row={idRow}
          busy={idBusy}
          onClose={() => setIdRow(null)}
          onDecide={decideIdReupload}
        />
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
                  { label: "Verification" },
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
                    <td className="p-4">
                      <KycBadges kyc={app.kyc} />
                    </td>
                    <td className="p-4 text-ink-soft">{formatDate(app.submittedAt)}</td>
                    <td className="p-4">
                      <StatusBadge tone={APPLICATION_TONES[app.status]}>{app.status}</StatusBadge>
                    </td>
                    <td className="p-4 text-right">
                      {app.status === "pending" && (
                        <RowActions
                          actions={[
                            // Final approval only once KYC is in; open the row to review the ID.
                            ...(applicationKycReady(app.kyc)
                              ? [{ label: "Approve rep", onSelect: () => verify(app) }]
                              : []),
                            { label: "Review", onSelect: () => openApplication(app.userId) },
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
            <ApplicationReviewModal
              key={selectedAppId}
              app={appDetail}
              loading={appDetailLoading}
              busy={appBusy}
              onClose={() => setSelectedAppId(null)}
              onApprove={verify}
              onReject={reject}
              onRejectId={rejectStudentId}
            />
          )}
        </>
      )}
    </div>
  );
}
