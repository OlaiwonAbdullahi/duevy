"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LockIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { Tabs } from "../_components/Tabs";
import { Switch } from "../_components/Switch";

type AdminRole = "Super Admin" | "Compliance Officer" | "Support Lead";
type PermissionKey = "userManagement" | "payouts" | "disputes" | "overrides";
type Severity = "info" | "warning" | "critical";

interface RolePermissions {
  role: AdminRole;
  userCount: number;
  permissions: Record<PermissionKey, boolean>;
}

interface AuditLog {
  id: string;
  actor: string;
  role: AdminRole;
  action: string;
  target: string;
  ip: string;
  device: string;
  date: string;
  severity: Severity;
}

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "userManagement", label: "User management" },
  { key: "payouts", label: "Payouts" },
  { key: "disputes", label: "Disputes" },
  { key: "overrides", label: "System overrides" },
];

const initialRoles: RolePermissions[] = [
  {
    role: "Super Admin",
    userCount: 2,
    permissions: { userManagement: true, payouts: true, disputes: true, overrides: true },
  },
  {
    role: "Compliance Officer",
    userCount: 3,
    permissions: { userManagement: true, payouts: true, disputes: true, overrides: false },
  },
  {
    role: "Support Lead",
    userCount: 5,
    permissions: { userManagement: true, payouts: false, disputes: true, overrides: false },
  },
];

const auditLogs: AuditLog[] = [
  {
    id: "LOG-01",
    actor: "Admin Alex",
    role: "Super Admin",
    action: "Clawed back referral reward",
    target: "user_2891 (Ada Nwosu) · ₦500",
    ip: "102.89.34.12",
    device: "Chrome / macOS",
    date: "2026-07-06 14:02",
    severity: "warning",
  },
  {
    id: "LOG-02",
    actor: "Officer Fatima",
    role: "Compliance Officer",
    action: "Approved payout",
    target: "PO-501 (Musa Ibrahim) · ₦150,000",
    ip: "197.210.8.44",
    device: "Firefox / Windows",
    date: "2026-07-06 11:15",
    severity: "info",
  },
  {
    id: "LOG-03",
    actor: "Support Sarah",
    role: "Support Lead",
    action: "Reset security PIN",
    target: "user_112 (Zainab Sani)",
    ip: "102.89.34.15",
    device: "Safari / iPhone",
    date: "2026-07-05 16:45",
    severity: "critical",
  },
];

const SEVERITY_TONES: Record<Severity, StatusTone> = {
  info: "neutral",
  warning: "warn",
  critical: "bad",
};

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-cloud bg-canvas p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-soft">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "roles" | "audit">("general");
  const [roles, setRoles] = useState<RolePermissions[]>(initialRoles);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [bankTransfers, setBankTransfers] = useState(true);
  const [cardPayments, setCardPayments] = useState(true);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auditLogs.filter(
      (log) =>
        (q === "" ||
          log.actor.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q)) &&
        (severityFilter === "all" || log.severity === severityFilter),
    );
  }, [search, severityFilter]);

  const selectedLog = auditLogs.find((log) => log.id === selectedLogId) ?? null;

  const togglePermission = (role: AdminRole, key: PermissionKey) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.role === role
          ? { ...r, permissions: { ...r.permissions, [key]: !r.permissions[key] } }
          : r,
      ),
    );
    toast(`Permissions updated for ${role}.`);
  };

  const announceToggle = (label: string) => (next: boolean) => {
    toast(`${label} ${next ? "enabled" : "disabled"}.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Settings"
        description="Platform controls, admin roles and the audit trail."
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: "general", label: "General" },
          { value: "roles", label: "Roles" },
          { value: "audit", label: "Audit log" },
        ]}
      />

      {activeTab === "general" && (
        <TableCard
          title="Platform controls"
          subtitle="Global switches — changes apply immediately"
        >
          <div className="space-y-3">
            <ToggleRow
              title="Maintenance mode"
              description="Pauses all payments and payouts and shows users a maintenance notice."
              checked={maintenanceMode}
              onChange={(next) => {
                setMaintenanceMode(next);
                announceToggle("Maintenance mode")(next);
              }}
            />
            <ToggleRow
              title="Bank transfers"
              description="Accept dues and top-ups via bank transfer."
              checked={bankTransfers}
              onChange={(next) => {
                setBankTransfers(next);
                announceToggle("Bank transfers")(next);
              }}
            />
            <ToggleRow
              title="Card payments"
              description="Accept card checkout. When off, users are steered to bank transfer."
              checked={cardPayments}
              onChange={(next) => {
                setCardPayments(next);
                announceToggle("Card payments")(next);
              }}
            />
          </div>
        </TableCard>
      )}

      {activeTab === "roles" && (
        <TableCard
          title="Roles & permissions"
          subtitle="What each admin tier is allowed to do"
        >
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
                <td className="p-4 font-semibold text-ink">{r.role}</td>
                <td className="p-4 text-center font-medium">{r.userCount}</td>
                {PERMISSION_COLUMNS.map((col) => (
                  <td key={col.key} className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={r.permissions[col.key]}
                      onChange={() => togglePermission(r.role, col.key)}
                      aria-label={`${col.label} for ${r.role}`}
                      className="h-4 w-4 cursor-pointer rounded border-cloud accent-brand"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </DataTable>
        </TableCard>
      )}

      {activeTab === "audit" && (
        <TableCard
          title="Audit log"
          subtitle="Every admin action, who did it and from where"
        >
          <div className="mb-4">
            <Toolbar>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by admin, action or target…"
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

          {filteredLogs.length === 0 ? (
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
                { label: "Target" },
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
                  <td className="p-4">
                    <p className="font-medium">{log.actor}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{log.role}</p>
                  </td>
                  <td className="max-w-[220px] truncate p-4 text-ink-soft">{log.target}</td>
                  <td className="p-4 whitespace-nowrap text-xs text-ink-soft">{log.date}</td>
                  <td className="p-4">
                    <StatusBadge tone={SEVERITY_TONES[log.severity]}>
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
          description={`${selectedLog.id} · ${selectedLog.date}`}
          onClose={() => setSelectedLogId(null)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Admin">
              {selectedLog.actor}
              <p className="mt-0.5 text-xs font-normal text-ink-soft">{selectedLog.role}</p>
            </ModalField>
            <ModalField label="Severity">
              <StatusBadge tone={SEVERITY_TONES[selectedLog.severity]}>
                {selectedLog.severity}
              </StatusBadge>
            </ModalField>
            <ModalField label="Target" className="sm:col-span-2">
              {selectedLog.target}
            </ModalField>
            <ModalField label="IP address">
              <span className="font-mono">{selectedLog.ip}</span>
            </ModalField>
            <ModalField label="Device">{selectedLog.device}</ModalField>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
