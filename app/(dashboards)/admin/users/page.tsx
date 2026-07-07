"use client";

import React, { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Download01Icon,
  Mail01Icon,
  CancelCircleIcon,
  Shield01Icon,
  AlertCircleIcon,
  ValidationIcon,
  MoreHorizontalIcon,
  ArrowDown01Icon,
  UserIcon,
  PropertyNewIcon,
  CircleCheckIcon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";

type UserRole = "student" | "rep" | "admin";
type KycStatus = "verified" | "pending" | "rejected" | "unverified";

interface AppUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  department: string;
  walletBalance: number;
  isTwoFactorEnabled: boolean;
  isDeactivated: boolean;
  isSuspended: boolean;
  kyc: {
    status: KycStatus;
    docs: string[];
  };
  sessionsCount: number;
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
    isTwoFactorEnabled: true,
    isDeactivated: false,
    isSuspended: false,
    kyc: { status: "verified", docs: ["BVN Verification Statement", "Official School Identity Card"] },
    sessionsCount: 2,
    spaces: ["Faculty of Science Collective", "Computer Science Association"],
  },
  {
    id: "user_774",
    role: "rep",
    name: "Kofi Mensah",
    email: "kofi@duevy.com",
    department: "Business Studies 2025",
    walletBalance: 98000,
    isTwoFactorEnabled: false,
    isDeactivated: false,
    isSuspended: false,
    kyc: { status: "pending", docs: ["National Identification Number Slip (NIN)"] },
    sessionsCount: 1,
    spaces: ["Business Studies Unit Hub"],
  },
  {
    id: "user_112",
    role: "student",
    name: "Zainab Sani",
    email: "zainab@duevy.com",
    department: "Mass Comm 2024",
    walletBalance: 0,
    isTwoFactorEnabled: true,
    isDeactivated: true,
    isSuspended: false,
    kyc: { status: "rejected", docs: ["Mismatched NIN Document Upload"] },
    sessionsCount: 0,
    spaces: ["Mass Communication Press Unit"],
  },
];

function toneForKyc(status: KycStatus) {
  switch (status) {
    case "verified": return "ok";
    case "pending": return "warn";
    case "rejected": return "bad";
    default: return "neutral";
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // States to manage dropdown triggers and popup display modals
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [selectedModalUser, setSelectedModalUser] = useState<AppUser | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase()) ||
        u.id.includes(search);
      return matchesSearch && (roleFilter === "all" || u.role === roleFilter) && (kycFilter === "all" || u.kyc.status === kycFilter);
    });
  }, [users, search, roleFilter, kycFilter]);

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkAction = (action: "export" | "message" | "deactivate") => {
    if (selectedUserIds.length === 0) return;
    if (action === "deactivate") {
      setUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, isDeactivated: true } : u));
    }
    setSelectedUserIds([]);
    alert(`Bulk Operation [${action.toUpperCase()}] complete.`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Users Management"
        description="Search, filter, and manage account records platform-wide within a unified data matrix."
      />

      {/* --- Filter Toolbar --- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-canvas border border-cloud rounded-xl p-4 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-soft">
            <HugeiconsIcon icon={Search01Icon} size={15} />
          </span>
          <input
            type="text"
            placeholder="Filter users by name, email or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-md border border-cloud bg-paper/20 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Custom shadcn Select: Roles */}
          <div className="relative inline-block">
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)} 
              className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="rep">Reps</option>
              <option value="admin">Admins</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
            </span>
          </div>
          
          {/* Custom shadcn Select: Verification Status */}
          <div className="relative inline-block">
            <select 
              value={kycFilter} 
              onChange={(e) => setKycFilter(e.target.value)} 
              className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="all">All KYC Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
            </span>
          </div>

          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-1.5 border-l pl-2 border-cloud ml-1">
              <button onClick={() => handleBulkAction("export")} className="h-9 px-3 rounded-md bg-paper text-ink border border-cloud text-xs font-medium hover:bg-paper/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs">
                <HugeiconsIcon icon={Download01Icon} size={13} /> Export
              </button>
              <button onClick={() => handleBulkAction("message")} className="h-9 px-3 rounded-md bg-paper text-ink border border-cloud text-xs font-medium hover:bg-paper/80 transition-colors inline-flex items-center gap-1.5 shadow-2xs">
                <HugeiconsIcon icon={Mail01Icon} size={13} /> Message
              </button>
              <button onClick={() => handleBulkAction("deactivate")} className="h-9 px-3 rounded-md bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs">
                <HugeiconsIcon icon={CancelCircleIcon} size={13} /> Deactivate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Full Width Data Table Matrix --- */}
      <TableCard title="Accounts Matrix" subtitle="Click anywhere on a row layout to review profile details modal">
        <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 align-middle">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 shrink-0 rounded border border-cloud bg-canvas text-brand accent-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand cursor-pointer transition-all"
                    />
                  </div>
                </th>
                <th className="p-4 font-semibold text-ink-soft align-middle">User</th>
                <th className="p-4 font-semibold text-ink-soft align-middle">Department / Space</th>
                <th className="p-4 font-semibold text-ink-soft align-middle">Role</th>
                <th className="p-4 font-semibold text-ink-soft align-middle">Balance</th>
                <th className="p-4 font-semibold text-ink-soft align-middle">2FA Security</th>
                <th className="p-4 font-semibold text-ink-soft align-middle">Verification</th>
                <th className="p-4 font-semibold text-ink-soft align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud bg-canvas text-ink">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.id} 
                  onClick={() => setSelectedModalUser(u)}
                  className="hover:bg-paper/20 cursor-pointer transition-colors"
                >
                  <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="h-4 w-4 shrink-0 rounded border border-cloud bg-canvas text-brand accent-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand cursor-pointer transition-all"
                      />
                    </div>
                  </td>
                  <td className="p-4 align-middle font-normal">
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      {u.name}
                      {u.isSuspended && <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded tracking-wide">SUSPENDED</span>}
                      {u.isDeactivated && <span className="text-[9px] bg-cloud text-ink-soft font-bold px-1.5 py-0.5 rounded tracking-wide">INACTIVE</span>}
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5">{u.email} • <span className="font-mono">{u.id}</span></div>
                  </td>
                  <td className="p-4 align-middle font-medium text-ink">{u.department}</td>
                  <td className="p-4 align-middle">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-700 border-purple-500/20' : u.role === 'rep' ? 'bg-brand/10 text-brand border-brand/20' : 'bg-cloud text-ink-soft border-transparent'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 align-middle font-semibold text-ink">{u.walletBalance?.toLocaleString()} NGN</td>
                  <td className="p-4 align-middle">
                    <div className="inline-flex items-center gap-1 text-xs">
                      {u.isTwoFactorEnabled ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <HugeiconsIcon icon={Shield01Icon} size={14} /> Secured
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <HugeiconsIcon icon={AlertCircleIcon} size={14} /> SMS Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <StatusBadge tone={toneForKyc(u.kyc.status)}>{u.kyc.status}</StatusBadge>
                  </td>
                  
                  {/* --- Row Actions Dropdown Menu --- */}
                  <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveDropdownRowId(activeDropdownRowId === u.id ? null : u.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                    </button>

                    {activeDropdownRowId === u.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                        
                        <div className="absolute right-4 mt-1 w-44 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left divide-y divide-cloud">
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setUsers(prev => prev.map(item => item.id === u.id ? { ...item, isSuspended: !item.isSuspended } : item));
                                setActiveDropdownRowId(null);
                              }}
                              className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                            >
                              {u.isSuspended ? "Lift Account Ban" : "Suspend Profile"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUsers(prev => prev.map(item => item.id === u.id ? { ...item, isDeactivated: !item.isDeactivated } : item));
                                setActiveDropdownRowId(null);
                              }}
                              className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                            >
                              {u.isDeactivated ? "Activate Account" : "Deactivate Account"}
                            </button>
                          </div>
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                alert("Support login audit validation key released.");
                                setActiveDropdownRowId(null);
                              }}
                              className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper text-ink transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <HugeiconsIcon icon={ValidationIcon} size={12} /> Impersonate Support
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-ink-soft italic bg-canvas">No user logs conform to current filtering specifications.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {/* --- Detailed Profile Dialog Overlay Modal --- */}
      {selectedModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          {/* Background Close overlay dismiss trigger */}
          <div className="fixed inset-0" onClick={() => setSelectedModalUser(null)} />
          
          <div className="relative w-full max-w-2xl rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal Top Header */}
            <div className="flex items-start justify-between pb-4 border-b border-cloud">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-cloud flex items-center justify-center text-brand shrink-0">
                  <HugeiconsIcon icon={UserIcon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">{selectedModalUser.name}</h3>
                  <p className="text-xs text-ink-soft">{selectedModalUser.email} • ID: <span className="font-mono">{selectedModalUser.id}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModalUser(null)}
                className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft font-semibold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Overview Metrics Snapshot Layer */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="border border-cloud bg-paper/20 rounded-xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider block">Wallet Balance</span>
                <span className="text-base font-bold text-ink mt-1 inline-block">{selectedModalUser.walletBalance.toLocaleString()} ₦</span>
              </div>
              <div className="border border-cloud bg-paper/20 rounded-xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider block">Verification Standing</span>
                <div className="mt-1.5"><StatusBadge tone={toneForKyc(selectedModalUser.kyc.status)}>{selectedModalUser.kyc.status}</StatusBadge></div>
              </div>
              <div className="border border-cloud bg-paper/20 rounded-xl p-3.5">
                <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider block">Active Cookie Sessions</span>
                <span className="text-base font-bold text-ink mt-1 inline-block">{selectedModalUser.sessionsCount} Device(s)</span>
              </div>
            </div>

            {/* Comprehensive Detail Fields Box Blocks */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Spaces list container block */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider block inline-flex items-center gap-1">
                  <HugeiconsIcon icon={PropertyNewIcon} size={13} className="text-brand" /> Space Allocations
                </span>
                <div className="p-3 border border-cloud rounded-xl bg-paper/10 space-y-1">
                  {selectedModalUser.spaces.map((space, idx) => (
                    <div key={idx} className="font-semibold text-ink text-xs">• {space}</div>
                  ))}
                </div>
              </div>

              {/* KYC list documents container block */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider block inline-flex items-center gap-1">
                  <HugeiconsIcon icon={CircleCheckIcon} size={13} className="text-brand" /> Verified Verification Files
                </span>
                <div className="p-3 border border-cloud rounded-xl bg-paper/10 space-y-1">
                  {selectedModalUser.kyc.docs.map((doc, idx) => (
                    <div key={idx} className="text-ink-soft text-xs">{doc}</div>
                  ))}
                  {selectedModalUser.kyc.docs.length === 0 && <div className="text-ink-soft italic text-xs">No documents uploaded.</div>}
                </div>
              </div>
            </div>

            {/* Overrides Control Console Suite */}
            <div className="border border-cloud bg-paper/30 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">Profile Administrative Console</span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    setUsers(prev => prev.map(u => u.id === selectedModalUser.id ? { ...u, isSuspended: !u.isSuspended } : u));
                    setSelectedModalUser(prev => prev ? { ...prev, isSuspended: !prev.isSuspended } : null);
                  }} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedModalUser.isSuspended ? "bg-emerald-600 text-white" : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"}`}
                >
                  {selectedModalUser.isSuspended ? "Lift Account Ban" : "Suspend Profile"}
                </button>
                
                <button 
                  onClick={() => {
                    setUsers(prev => prev.map(u => u.id === selectedModalUser.id ? { ...u, isDeactivated: !u.isDeactivated } : u));
                    setSelectedModalUser(prev => prev ? { ...prev, isDeactivated: !prev.isDeactivated } : null);
                  }} 
                  className="px-3 py-1.5 rounded-xl border border-cloud bg-canvas text-xs font-semibold text-ink hover:bg-paper transition-colors cursor-pointer"
                >
                  {selectedModalUser.isDeactivated ? "Activate Profile status" : "Soft Deactivate Profile"}
                </button>
                
                <button 
                  onClick={() => alert("Credentials bypass tracking dispatched to client endpoint window.")} 
                  className="px-3 py-1.5 rounded-xl border border-cloud bg-canvas text-xs font-semibold text-ink hover:bg-paper transition-colors cursor-pointer"
                >
                  Reset Security PIN / Credentials
                </button>
              </div>
            </div>

            {/* Modal Bottom Cancel Row */}
            <div className="flex justify-end pt-2 border-t border-cloud">
              <button 
                type="button" 
                onClick={() => setSelectedModalUser(null)} 
                className="px-4 py-2 border border-cloud rounded-xl text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}