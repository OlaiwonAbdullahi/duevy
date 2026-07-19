"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LockIcon, Shield01Icon, CreditCardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { Tabs } from "../_components/Tabs";
import { ApiError } from "@/lib/api/errors";
import {
  getAdminRoles,
  updateAdminRole,
  listAuditLogs,
  getPaymentGatewaySettings,
  updatePaymentGateway,
  type AdminRoleInfo,
  type AdminAuditLog,
  type AdminPermissions,
  type PaymentGateway,
  type PaymentGatewaySettings,
} from "@/lib/api/admin";

type PermissionKey = keyof AdminPermissions;

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "userManagement", label: "User management" },
  { key: "payouts", label: "Payouts" },
  { key: "disputes", label: "Disputes" },
  { key: "overrides", label: "System overrides" },
];

const ROLE_LABELS: Record<AdminRoleInfo["role"], string> = {
  super_admin: "Super Admin",
  compliance_officer: "Compliance Officer",
  support_lead: "Support Lead",
};

const SEVERITY_TONES: Record<string, StatusTone> = {
  info: "neutral",
  warning: "warn",
  critical: "bad",
};

const GATEWAY_LABELS: Record<PaymentGateway, string> = {
  paystack: "Paystack",
  monnify: "Monnify",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "gateway" | "audit">("roles");

  const [roles, setRoles] = useState<AdminRoleInfo[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<AdminRoleInfo["role"] | null>(null);

  const [gatewaySettings, setGatewaySettings] = useState<PaymentGatewaySettings | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [savingGateway, setSavingGateway] = useState(false);

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  useEffect(() => {
    getAdminRoles()
      .then(setRoles)
      .catch(() => toast.error("Couldn't load admin roles."))
      .finally(() => setRolesLoading(false));
  }, []);

  useEffect(() => {
    getPaymentGatewaySettings()
      .then(setGatewaySettings)
      .catch(() => toast.error("Couldn't load payment gateway settings."))
      .finally(() => setGatewayLoading(false));
  }, []);

  useEffect(() => {
    setLogsLoading(true);
    listAuditLogs({
      severity: severityFilter === "all" ? undefined : severityFilter,
      perPage: 100,
    })
      .then(({ data }) => setLogs(data))
      .catch(() => toast.error("Couldn't load the audit log."))
      .finally(() => setLogsLoading(false));
  }, [severityFilter]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (log) =>
        log.actor.name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q),
    );
  }, [logs, search]);

  const selectedLog = logs.find((log) => log.id === selectedLogId) ?? null;

  async function togglePermission(roleInfo: AdminRoleInfo, key: PermissionKey) {
    const nextPermissions: AdminPermissions = {
      userManagement: roleInfo.userManagement,
      payouts: roleInfo.payouts,
      disputes: roleInfo.disputes,
      overrides: roleInfo.overrides,
      [key]: !roleInfo[key],
    };
    setSavingRole(roleInfo.role);
    try {
      const updated = await updateAdminRole(roleInfo.role, nextPermissions);
      setRoles((prev) => prev.map((r) => (r.role === roleInfo.role ? updated : r)));
      toast.success(`Permissions updated for ${ROLE_LABELS[roleInfo.role]}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update this role.");
    } finally {
      setSavingRole(null);
    }
  }

  async function switchGateway(gateway: PaymentGateway) {
    if (!gatewaySettings || gateway === gatewaySettings.active) return;
    setSavingGateway(true);
    try {
      const { active } = await updatePaymentGateway(gateway);
      setGatewaySettings((prev) => (prev ? { ...prev, active } : prev));
      toast.success(`Active payment gateway switched to ${GATEWAY_LABELS[active]}.`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "GATEWAY_NOT_CONFIGURED") {
        toast.error(`${GATEWAY_LABELS[gateway]} isn't configured — its env credentials are missing.`);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Couldn't switch payment gateway.");
      }
    } finally {
      setSavingGateway(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Settings"
        description="Admin roles, the active payment gateway and the platform-wide audit trail."
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: "roles", label: "Roles" },
          { value: "gateway", label: "Payment gateway" },
          { value: "audit", label: "Audit log" },
        ]}
      />

      {activeTab === "roles" && (
        <TableCard
          title="Roles & permissions"
          subtitle="What each admin tier is allowed to do"
        >
          {rolesLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
              ))}
            </div>
          ) : (
            <DataTable
              headers={[
                { label: "Role" },
                { label: "Members", align: "center" },
                ...PERMISSION_COLUMNS.map((c) => ({
                  label: c.label,
                  align: "center" as const,
                })),
              ]}
            >
              {roles.map((r) => (
                <tr key={r.role}>
                  <td className="p-4 font-semibold text-ink">{ROLE_LABELS[r.role]}</td>
                  <td className="p-4 text-center font-medium">{r.userCount}</td>
                  {PERMISSION_COLUMNS.map((col) => (
                    <td key={col.key} className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={r[col.key]}
                        disabled={savingRole === r.role}
                        onChange={() => togglePermission(r, col.key)}
                        aria-label={`${col.label} for ${ROLE_LABELS[r.role]}`}
                        className="h-4 w-4 cursor-pointer rounded border-cloud accent-brand disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </DataTable>
          )}
        </TableCard>
      )}

      {activeTab === "gateway" && (
        <TableCard
          title="Payment gateway"
          subtitle="Which processor handles platform money right now"
        >
          {gatewayLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-paper" />
              ))}
            </div>
          ) : !gatewaySettings ? (
            <EmptyState
              icon={CreditCardIcon}
              title="Couldn't load gateway settings"
              description="Try refreshing the page."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(gatewaySettings.gateways) as PaymentGateway[]).map((gateway) => {
                const info = gatewaySettings.gateways[gateway];
                const isActive = gatewaySettings.active === gateway;
                return (
                  <button
                    key={gateway}
                    type="button"
                    disabled={savingGateway || isActive || !info.configured}
                    onClick={() => switchGateway(gateway)}
                    className={
                      "flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed " +
                      (isActive
                        ? "border-brand bg-brand/5"
                        : "border-cloud hover:bg-paper/60 disabled:hover:bg-transparent")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cloud">
                        <HugeiconsIcon icon={CreditCardIcon} size={18} className="text-ink-soft" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{GATEWAY_LABELS[gateway]}</p>
                        <p className="text-xs text-ink-soft">
                          {info.configured ? "Credentials configured" : "Not configured"}
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <StatusBadge tone="ok">Active</StatusBadge>
                    ) : !info.configured ? (
                      <StatusBadge tone="neutral">Unavailable</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Switch</StatusBadge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </TableCard>
      )}

      {activeTab === "audit" && (
        <TableCard
          title="Audit log"
          subtitle="Every admin action, who did it and when"
        >
          <div className="mb-4">
            <Toolbar>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by admin, action or detail…"
              />
              <FilterSelect
                value={severityFilter}
                onChange={setSeverityFilter}
                label="Filter by severity"
                options={[
                  { value: "all", label: "All severities" },
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </Toolbar>
          </div>

          {logsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={Shield01Icon}
              title="No log entries match"
              description="Try a different search or clear the filters."
            />
          ) : (
            <DataTable
              headers={[
                { label: "Action" },
                { label: "Admin" },
                { label: "Detail" },
                { label: "Date" },
                { label: "Severity" },
              ]}
            >
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className="cursor-pointer transition-colors hover:bg-paper/40"
                >
                  <td className="p-4 font-semibold text-ink">{log.action}</td>
                  <td className="p-4 font-medium">{log.actor.name}</td>
                  <td className="max-w-[220px] truncate p-4 text-ink-soft">
                    {log.description}
                  </td>
                  <td className="p-4 whitespace-nowrap text-xs text-ink-soft">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={SEVERITY_TONES[log.severity] ?? "neutral"}>
                      {log.severity}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </TableCard>
      )}

      {selectedLog && (
        <AdminModal
          icon={LockIcon}
          title={selectedLog.action}
          description={`${selectedLog.id} · ${formatDate(selectedLog.createdAt)}`}
          onClose={() => setSelectedLogId(null)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Admin">{selectedLog.actor.name}</ModalField>
            <ModalField label="Severity">
              <StatusBadge tone={SEVERITY_TONES[selectedLog.severity] ?? "neutral"}>
                {selectedLog.severity}
              </StatusBadge>
            </ModalField>
            <ModalField label="Detail" className="sm:col-span-2">
              {selectedLog.description}
            </ModalField>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
