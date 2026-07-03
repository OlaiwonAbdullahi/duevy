import type { JoinRequest, Student } from "./types";

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "std-1",
    name: "Amina Bello",
    matricNo: "CSC/21/1042",
    level: "400L",
    email: "amina.bello@student.edu",
    status: "approved",
    joinedAt: "12 Jun",
  },
  {
    id: "std-2",
    name: "Daniel Okafor",
    matricNo: "CSC/22/1176",
    level: "300L",
    email: "daniel.okafor@student.edu",
    status: "approved",
    joinedAt: "18 Jun",
  },
  {
    id: "std-3",
    name: "Rukayat Yusuf",
    matricNo: "CSC/23/1288",
    level: "200L",
    email: "rukayat.yusuf@student.edu",
    status: "approved",
    joinedAt: "24 Jun",
  },
  {
    id: "std-4",
    name: "Samuel Udo",
    matricNo: "CSC/24/1431",
    level: "100L",
    email: "samuel.udo@student.edu",
    status: "approved",
    joinedAt: "28 Jun",
  },
];

export const INITIAL_REQUESTS: JoinRequest[] = [
  {
    id: "req-1",
    name: "Ifeoma Nwosu",
    matricNo: "CSC/22/1190",
    level: "300L",
    email: "ifeoma.nwosu@student.edu",
    requestedAt: "Today, 9:42 AM",
  },
  {
    id: "req-2",
    name: "Tobi Adebayo",
    matricNo: "CSC/23/1315",
    level: "200L",
    email: "tobi.adebayo@student.edu",
    requestedAt: "Today, 8:17 AM",
  },
  {
    id: "req-3",
    name: "Grace Etim",
    matricNo: "CSC/24/1408",
    level: "100L",
    email: "grace.etim@student.edu",
    requestedAt: "Yesterday",
  },
];
