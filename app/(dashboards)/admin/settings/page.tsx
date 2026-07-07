"use client";

import React, { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Shield01Icon,
  DatabaseIcon,
  MoreHorizontalIcon,
  ArrowDown01Icon,
  UserIcon,
  Settings01Icon,
  LockIcon,
  ActivityIcon,
  FileDocumentIcon,
  AlertCircleIcon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";

// --- Types & Schema Interfaces ---
type AdminRole = "Super Admin" | "Compliance Officer" | "Support Lead";
type SettingsTab = "configuration" | "roles" | "audit_logs";

interface PermissionMatrix {
  role: AdminRole;
  userCount: number;
  permissions: {
    userManagement: boolean;
    financialDisbursement: boolean;
    disputeTriage: boolean;
    systemOverrides: boolean;
  };
}

interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: AdminRole;
  action: string;
  targetContext: string;
  ipAddress: string;
  deviceString: string;
  date: string;
  severity: "info" | "warning" | "critical";
}

// --- Mock Datasets ---
const initialPermissions: PermissionMatrix[] = [
  { role: "Super Admin", userCount: 2, permissions: { userManagement: true, financialDisbursement: true, disputeTriage: true, systemOverrides: true } },
  { role: "Compliance Officer", userCount: 3, permissions: { userManagement: true, financialDisbursement: true, disputeTriage: true, systemOverrides: false } },
  { role: "Support Lead", userCount: 5, permissions: { userManagement: true, financialDisbursement: false, disputeTriage: true, systemOverrides: false } },
];

const initialAuditLogs: AuditLogEntry[] = [
  { id: "LOG-01", actorName: "Admin Alex", actorRole: "Super Admin", action: "Clawed Back Referral Reward", targetContext: "user_2891 (Ada Nwosu) • Value: ₦500", ipAddress: "102.89.34.12", deviceString: "Chrome / macOS", date: "2026-07-06 14:02", severity: "warning" },
  { id: "LOG-02", actorName: "Officer Fatima", actorRole: "Compliance Officer", action: "Authorized High-Trust Payout", targetContext: "PO-501 (Musa Ibrahim) • Value: ₦150,000", ipAddress: "197.210.8.44", deviceString: "Firefox / Windows", date: "2026-07-06 11:15", severity: "info" },
  { id: "LOG-03", actorName: "Support Sarah", actorRole: "Support Lead", action: "Manually Reset Security PIN", targetContext: "user_112 (Zainab Sani)", ipAddress: "102.89.34.15", deviceString: "iPhone 15 / Safari", date: "2026-07-05 16:45", severity: "critical" },
];

export default function AdminSettingsPage() {
  // --- States ---
  const [activeTab, setActiveTab] = useState<SettingsTab>("configuration");
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionMatrix[]>(initialPermissions);
  const [auditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Context Dropdown / Modal visibility hooks
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [selectedAuditModal, setSelectedAuditModal] = useState<AuditLogEntry | null>(null);

  // System Global Parameters States
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isMonnifyRailActive, setIsMonnifyRailActive] = useState(true);
  const [isCardRailsActive, setIsCardRailsActive] = useState(true);

  // --- Filtering Ledger Logs Logic ---
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.targetContext.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [auditLogs, searchQuery, severityFilter]);

  // Handle single permission toggle internally
  const handleTogglePermission = (role: AdminRole, field: keyof PermissionMatrix["permissions"]) => {
    setPermissionsMatrix(prev => prev.map(item => {
      if (item.role === role) {
        return {
          ...item,
          permissions: { ...item.permissions, [field]: !item.permissions[field] }
        };
      }
      return item;
    }));
    alert(`Security Matrix Shifted: Permissions parameters updated for role: [${role.toUpperCase()}].`);
  };

  const getSeverityTone = (level: AuditLogEntry["severity"]) => {
    if (level === "info") return "neutral";
    if (level === "warning") return "warn";
    return "bad";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Control Panel & Settings"
        description="Configure infrastructure switches, manage fine-grained role matrices, and review platform-wide administrative activity trails."
      />

      {/* --- Section 1: Standard shadcn Segmented Tab Switcher Components --- */}
      <div className="flex border-b border-cloud text-sm">
        <button onClick={() => setActiveTab("configuration")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "configuration" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
          Core Settings Configuration
        </button>
        <button onClick={() => setActiveTab("roles")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "roles" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
          Roles & Permissions Matrix
        </button>
        <button onClick={() => setActiveTab("audit_logs")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "audit_logs" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
          System Audit & Activity Trail
        </button>
      </div>

      {/* ========================================================================= */}
      {/* --- TAB PANEL 1: CORE SYSTEM CONFIGURATION SETTINGS --- */}
      {activeTab === "configuration" && (
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <div className="md:col-span-2 space-y-6">
            <TableCard title="Infrastructure Controls" subtitle="Safely toggle global feature availability variables across the application instantly.">
              <div className="space-y-4 pt-2">
                
                {/* Switch Item 1: Maintenance Mode */}
                <div className="flex items-center justify-between p-4 border border-cloud rounded-xl bg-canvas shadow-2xs">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-sm font-semibold text-ink block">Platform-Wide Maintenance Mode</span>
                    <p className="text-xs text-ink-soft leading-relaxed">Halts all student dues payouts and collection actions. Displays a clean maintenance window state to application clients instantly.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMaintenanceMode}
                    onChange={(e) => {
                      setIsMaintenanceMode(e.target.checked);
                      alert(`Infrastructure Alert: Maintenance mode state is now [${e.target.checked ? "ENABLED" : "DISABLED"}].`);
                    }}
                    className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                  />
                </div>

                {/* Switch Item 2: Monnify Webhook Rails */}
                <div className="flex items-center justify-between p-4 border border-cloud rounded-xl bg-canvas shadow-2xs">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-sm font-semibold text-ink block">Monnify Processing Rail Hook</span>
                    <p className="text-xs text-ink-soft leading-relaxed">Enables database transaction ingestion pipelines via Monnify transfer rails. Turn off to shift traffic or manage gateway downtime emergency events.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMonnifyRailActive}
                    onChange={(e) => {
                      setIsMonnifyRailActive(e.target.checked);
                      alert(`Gateway Rail Mutated: Monnify connection pool flipped to [${e.target.checked ? "ACTIVE" : "INACTIVE"}].`);
                    }}
                    className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                  />
                </div>

                {/* Switch Item 3: Credit Card Processor Rail */}
                <div className="flex items-center justify-between p-4 border border-cloud rounded-xl bg-canvas shadow-2xs">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-sm font-semibold text-ink block">Visa / Mastercard / Verve Card Rails Ingestion</span>
                    <p className="text-xs text-ink-soft leading-relaxed">Toggles card checkout pipelines platform-wide. When deactivated, users are prompted to perform direct settlement matching through backup virtual bank transfer routes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCardRailsActive}
                    onChange={(e) => {
                      setIsCardRailsActive(e.target.checked);
                      alert(`Core Rail Mutated: Card checkout system pathways flipped to [${e.target.checked ? "ACTIVE" : "INACTIVE"}].`);
                    }}
                    className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                  />
                </div>

              </div>
            </TableCard>
          </div>

          {/* Right Summary Configuration Advice */}
          <div className="space-y-6">
            <TableCard title="Security Standards Compliance" subtitle="Global administrative credentials safety protocols context definition.">
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 bg-paper/40 border border-cloud rounded-xl flex items-start gap-1.5 text-ink-soft">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-brand shrink-0 mt-0.5" />
                  Altering infrastructure controls modifies core session configuration keys directly. Execution variables register immediately in the active central ledger environment.
                </div>
                <div className="p-3 border border-cloud rounded-xl bg-canvas space-y-1.5">
                  <span className="font-bold text-ink block inline-flex items-center gap-1">
                    <HugeiconsIcon icon={Shield01Icon} size={12} className="text-brand" /> MFA Login Enforced
                  </span>
                  <p className="text-[11px] text-ink-soft leading-relaxed">All operations running inside this workspace tier demand 2FA hardware pin validation steps prior to deployment completion paths.</p>
                </div>
              </div>
            </TableCard>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- TAB PANEL 2: ROLE-BASED ACCESS CONTROL (RBAC) DATA MATRIX --- */}
      {activeTab === "roles" && (
        <TableCard title="Role Access Policy Matrix" subtitle="Fine-tune granular visibility parameters, permission nodes, and authority constraints per operational tier group.">
          <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
                <tr>
                  <th className="p-4 align-middle">Administrative Role Profile</th>
                  <th className="p-4 align-middle text-center">Active Headcount</th>
                  <th className="p-4 align-middle text-center">User Management</th>
                  <th className="p-4 align-middle text-center">Financial Disbursement</th>
                  <th className="p-4 align-middle text-center">Dispute Triage Claims</th>
                  <th className="p-4 align-middle text-center">System Hard Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
                {permissionsMatrix.map((item) => (
                  <tr key={item.role} className="hover:bg-paper/10 transition-colors">
                    <td className="p-4 align-middle">
                      <div className="font-bold text-ink flex items-center gap-1.5">
                        <HugeiconsIcon icon={LockIcon} size={14} className="text-ink-soft" />
                        {item.role}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center font-bold text-ink-soft">{item.userCount} Accounts Linked</td>
                    
                    {/* User Management Checkbox */}
                    <td className="p-4 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={item.permissions.userManagement}
                        onChange={() => handleTogglePermission(item.role, "userManagement")}
                        className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                      />
                    </td>

                    {/* Financial Disbursement Checkbox */}
                    <td className="p-4 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={item.permissions.financialDisbursement}
                        onChange={() => handleTogglePermission(item.role, "financialDisbursement")}
                        className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                      />
                    </td>

                    {/* Dispute Triage Checkbox */}
                    <td className="p-4 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={item.permissions.disputeTriage}
                        onChange={() => handleTogglePermission(item.role, "disputeTriage")}
                        className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                      />
                    </td>

                    {/* System Overrides Checkbox */}
                    <td className="p-4 align-middle text-center">
                      <input
                        type="checkbox"
                        checked={item.permissions.systemOverrides}
                        onChange={() => handleTogglePermission(item.role, "systemOverrides")}
                        className="h-4 w-4 rounded border-cloud text-brand bg-canvas accent-brand cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* ========================================================================= */}
      {/* --- TAB PANEL 3: CHRONOLOGICAL AUDIT & ACTIVITY LEDGER LOGS --- */}
      {activeTab === "audit_logs" && (
        <TableCard title="Security Ledger Audit Trail" subtitle="Unalterable, system-generated trace index capturing every key action performed across the administration console.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between my-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-ink-soft">
                <HugeiconsIcon icon={Search01Icon} size={15} />
              </span>
              <input
                type="text"
                placeholder="Search audit ledger by actor identity, action type, log payload details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-md border border-cloud bg-paper/20 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
              />
            </div>
            
            {/* Custom shadcn Dropdown styling selection for log filters */}
            <div className="relative inline-block">
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)} 
                className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
              >
                <option value="all">All Anomaly Severities</option>
                <option value="info">Info Logs Summary</option>
                <option value="warning">System Warning Events</option>
                <option value="critical">Critical Access Actions</option>
              </select>
              <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
              </span>
            </div>
          </div>

          {/* Full Width Incorruptible Audit Logs Table */}
          <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
                <tr>
                  <th className="p-4 align-middle">Audit Code Log ID</th>
                  <th className="p-4 align-middle">Action Performed</th>
                  <th className="p-4 align-middle">Actor Entity Footprint</th>
                  <th className="p-4 align-middle">Target Context Metadata</th>
                  <th className="p-4 align-middle">Chronological Date Context</th>
                  <th className="p-4 align-middle">Threat Level</th>
                  <th className="p-4 align-middle text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedAuditModal(log)}
                    className="hover:bg-paper/20 transition-colors cursor-pointer"
                  >
                    <td className="p-4 align-middle font-bold tracking-tight text-ink font-mono">{log.id}</td>
                    <td className="p-4 align-middle font-semibold text-ink">{log.action}</td>
                    <td className="p-4 align-middle">
                      <div className="font-bold text-ink">{log.actorName}</div>
                      <div className="text-[11px] text-ink-soft mt-0.5">{log.actorRole}</div>
                    </td>
                    <td className="p-4 align-middle text-ink-soft font-medium max-w-[200px] truncate">{log.targetContext}</td>
                    <td className="p-4 align-middle text-ink-soft">{log.date}</td>
                    <td className="p-4 align-middle">
                      <StatusBadge tone={getSeverityTone(log.severity)}>{log.severity}</StatusBadge>
                    </td>

                    {/* Simple row context options click area trigger popover anchors wrapper template */}
                    <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveDropdownRowId(activeDropdownRowId === log.id ? null : log.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                      >
                        <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                      </button>

                      {activeDropdownRowId === log.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                          <div className="absolute right-4 mt-1 w-44 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left">
                            <button
                              type="button"
                              onClick={() => { setSelectedAuditModal(log); setActiveDropdownRowId(null); }}
                              className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                            >
                              Inspect Full Log Metadata
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-ink-soft italic bg-canvas">No administrative mutation items correspond to filter choices.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* --- SECTION 4: SHADCN OVERLAY DIALOG MODAL PREVIEW AUDIT ENTRY FILE --- */}
      {selectedAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-opacity anonymity-fadeIn">
          <div className="fixed inset-0" onClick={() => setSelectedAuditModal(null)} />
          
          <div className="relative w-full max-w-lg rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-5 z-10 max-h-[85vh] overflow-y-auto">
            {/* Modal Top Header Identification node */}
            <div className="flex items-start justify-between pb-3 border-b border-cloud">
              <div className="flex items-center gap-2.5">
                <ActivityIcon className="h-5 w-5 text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Incorruptible Trace Audit File</h3>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">Reference Stack Sequence Hash: {selectedAuditModal.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAuditModal(null)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft text-xs cursor-pointer">✕</button>
            </div>

            {/* Core Mutation summary details list content sheets context template parameters row fields */}
            <div className="bg-paper/30 border border-cloud rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-ink-soft font-medium">Actor Admin Identity</span>
                <span className="font-bold text-ink">{selectedAuditModal.actorName} ({selectedAuditModal.actorRole})</span>
              </div>
              <div className="flex justify-between border-t border-cloud/40 pt-2">
                <span className="text-ink-soft font-medium">Action Event String</span>
                <span className="font-bold text-ink text-right">{selectedAuditModal.action}</span>
              </div>
              <div className="flex flex-col border-t border-cloud/40 pt-2 gap-1">
                <span className="text-ink-soft font-medium">Target Context Log Payload Details</span>
                <span className="font-mono text-ink text-[11px] bg-paper p-2 border border-cloud rounded mt-0.5 break-all leading-normal">{selectedAuditModal.targetContext}</span>
              </div>
            </div>

            {/* Electronic Terminal footprints list grids nodes wrapper */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="border border-cloud p-3 rounded-xl bg-canvas space-y-1">
                <span className="text-ink-soft font-medium block">IP Terminal Source Endpoint</span>
                <span className="font-mono text-ink font-bold block">{selectedAuditModal.ipAddress}</span>
              </div>
              <div className="border border-cloud p-3 rounded-xl bg-canvas space-y-1">
                <span className="text-ink-soft font-medium block inline-flex items-center gap-1">
                  <HugeiconsIcon icon={ComputerIcon} size={12} className="text-brand" /> Device Footprint Stack
                </span>
                <span className="text-ink font-semibold block">{selectedAuditModal.deviceString}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs bg-paper/40 border border-cloud p-3 rounded-xl">
              <span className="text-ink-soft">Logged Timestamp Sequence:</span>
              <span className="font-semibold text-ink">{selectedAuditModal.date}</span>
            </div>

            {/* Modal Bottom Actions Row Close Controls Layout Line */}
            <div className="flex justify-end pt-2 border-t border-cloud">
              <button 
                type="button" 
                onClick={() => setSelectedAuditModal(null)} 
                className="px-4 py-2 border border-cloud rounded-xl text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer transition-colors"
              >
                Close Audit Entry File
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}