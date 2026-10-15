"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, DiscountTag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import { PartnerLogo } from "../../dashboard/_components/PartnerLogo";
import PageHeader from "../_components/PageHeader";
import RefreshButton from "../_components/RefreshButton";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { RowActions } from "../_components/RowActions";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { ApiError } from "@/lib/api/errors";
import { listAdminPartners, updateAdminPartner, type AdminPartner } from "@/lib/api/admin";
import { PartnerFormModal } from "./_components/PartnerFormModal";
import { PartnerDetailModal } from "./_components/PartnerDetailModal";
import { formatDate, formatDuration, signupLink } from "./_components/data";

type StatusFilter = "all" | "active" | "inactive";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  // `null` = closed, "new" = create, otherwise the partner being edited.
  const [formFor, setFormFor] = useState<AdminPartner | "new" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Loading is derived: the list is stale until a response for the current
  // filters (and refresh tick) has landed.
  const [reloadTick, setReloadTick] = useState(0);
  const requestKey = `${debouncedSearch}|${status}|${reloadTick}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    listAdminPartners({ q: debouncedSearch || undefined, status, perPage: 100 })
      .then(({ data }) => {
        if (!cancelled) setPartners(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load partners.");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, debouncedSearch, status]);

  const selected = useMemo(
    () => partners.find((p) => p.id === selectedId) ?? null,
    [partners, selectedId],
  );

  const replace = (saved: AdminPartner) =>
    setPartners((prev) =>
      prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev],
    );

  async function toggleActive(partner: AdminPartner) {
    try {
      const updated = await updateAdminPartner(partner.id, { isActive: !partner.isActive });
      replace(updated);
      toast.success(`${partner.short} ${updated.isActive ? "activated" : "deactivated"}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update this partner.");
    }
  }

  async function copyLink(partner: AdminPartner) {
    try {
      await navigator.clipboard.writeText(signupLink(partner.code));
      toast.success("Signup link copied.", { description: signupLink(partner.code) });
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Partners"
        description="Partner codes (SUG, NACOS…) that discount reps' withdrawal fees."
        right={
          <div className="flex gap-2">
            <RefreshButton onClick={() => setReloadTick((t) => t + 1)} loading={loading} />
            <Button variant="brand" size="pill" onClick={() => setFormFor("new")}>
              <HugeiconsIcon icon={Add01Icon} size={14} />
              New partner
            </Button>
          </div>
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code…" />
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          label="Filter by status"
          options={[
            { value: "all", label: "All partners" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </Toolbar>

      <TableCard title="Partners" subtitle="Click a row to see the spaces using it">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <EmptyState
            icon={DiscountTag01Icon}
            title={debouncedSearch || status !== "all" ? "No partners match" : "No partners yet"}
            description={
              debouncedSearch || status !== "all"
                ? "Try a different search or clear the filters."
                : "Create a partner to give its reps a withdrawal fee discount."
            }
          />
        ) : (
          <DataTable
            headers={[
              { label: "Partner" },
              { label: "Code" },
              { label: "Discount" },
              { label: "Duration" },
              { label: "Uses" },
              { label: "Expires" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {partners.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <PartnerLogo logoUrl={p.logoUrl} short={p.short} size={36} />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{p.short}</p>
                      <p className="mt-0.5 max-w-56 truncate text-xs text-ink-soft">{p.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs font-semibold">{p.code}</td>
                <td className="p-4 font-semibold text-brand">{p.withdrawalFeeDiscountPercent}%</td>
                <td className="whitespace-nowrap p-4">{formatDuration(p.durationDays)}</td>
                <td className="whitespace-nowrap p-4 font-medium">
                  {p.redemptionCount} / {p.maxRedemptions ?? "∞"}
                </td>
                <td className="whitespace-nowrap p-4">
                  {p.expiresAt ? formatDate(p.expiresAt) : "Never"}
                </td>
                <td className="p-4">
                  <StatusBadge tone={p.isActive ? "ok" : "neutral"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                </td>
                <td className="p-4 text-right">
                  <RowActions
                    label={`Actions for ${p.short}`}
                    actions={[
                      { label: "Edit", onSelect: () => setFormFor(p) },
                      { label: "Copy signup link", onSelect: () => void copyLink(p) },
                      {
                        label: p.isActive ? "Deactivate" : "Activate",
                        tone: p.isActive ? "danger" : "default",
                        onSelect: () => void toggleActive(p),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {formFor && (
        <PartnerFormModal
          partner={formFor === "new" ? undefined : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(saved) => {
            replace(saved);
            setFormFor(null);
          }}
        />
      )}

      {selected && !formFor && (
        <PartnerDetailModal
          partner={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setFormFor(selected)}
          onRevoked={() =>
            replace({ ...selected, redemptionCount: Math.max(0, selected.redemptionCount - 1) })
          }
        />
      )}
    </div>
  );
}
