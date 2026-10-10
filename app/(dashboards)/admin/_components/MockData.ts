export type Dept = {
  id: string;
  name: string;
  school: string;
  memberCount: number;
  duesTarget: number;
  collectedAmount: number;
  assignedRepIds: string[];
};

export type Rep = {
  id: string;
  name: string;
  departmentIds: string[];
  status: "active" | "suspended" | "pending";
  verification: "verified" | "pending" | "unverified";
  heldAmount: number;
  uncollectedAmount: number;
  collectionRate: number; // 0..1
};

export const mockDepartments: Dept[] = [
  {
    id: "dept_cs_2025",
    name: "Computer Science 2025",
    school: "Duevy University",
    memberCount: 428,
    duesTarget: 860000,
    collectedAmount: 732400,
    assignedRepIds: ["rep_kofi"],
  },
  {
    id: "dept_biz_2025",
    name: "Business Studies 2025",
    school: "Duevy University",
    memberCount: 311,
    duesTarget: 610000,
    collectedAmount: 405250,
    assignedRepIds: ["rep_ama"],
  },
  {
    id: "dept_mcc_2024",
    name: "Mass Comm 2024",
    school: "Duevy College",
    memberCount: 190,
    duesTarget: 360000,
    collectedAmount: 355000,
    assignedRepIds: ["rep_kofi"],
  },
];

export const mockReps: Rep[] = [
  {
    id: "rep_kofi",
    name: "Kofi R.",
    departmentIds: ["dept_cs_2025", "dept_mcc_2024"],
    status: "active",
    verification: "verified",
    heldAmount: 185000,
    uncollectedAmount: 128600,
    collectionRate: 0.86,
  },
  {
    id: "rep_ama",
    name: "Ama E.",
    departmentIds: ["dept_biz_2025"],
    status: "pending",
    verification: "pending",
    heldAmount: 98000,
    uncollectedAmount: 204750,
    collectionRate: 0.66,
  },
  {
    id: "rep_sam",
    name: "Sam O.",
    departmentIds: ["dept_cs_2025"],
    status: "suspended",
    verification: "unverified",
    heldAmount: 2200,
    uncollectedAmount: 0,
    collectionRate: 0.12,
  },
];
