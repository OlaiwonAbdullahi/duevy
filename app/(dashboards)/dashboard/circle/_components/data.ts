import type { Student } from "./types";

/**
 * Characters used to build department join codes. Ambiguous glyphs (0/O, 1/I,
 * etc.) are left out so a code read aloud or off a slide can't be mistyped.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A fresh 5-character department join code. */
export function generateJoinCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * The department's current join code. Students enter this to find and join the
 * space — no approval step. Regenerating it (see JoinCodeStat) retires the old
 * one. Fixed here so the demo is stable; the API would persist it per space.
 */
export const REP_JOIN_CODE = "CS7K9";

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "std-1",
    name: "Amina Bello",
    matricNo: "CSC/21/1042",
    level: "400L",
    email: "amina.bello@student.edu",
    joinedAt: "12 Jun",
  },
  {
    id: "std-2",
    name: "Daniel Okafor",
    matricNo: "CSC/22/1176",
    level: "300L",
    email: "daniel.okafor@student.edu",
    joinedAt: "18 Jun",
  },
  {
    id: "std-3",
    name: "Rukayat Yusuf",
    matricNo: "CSC/23/1288",
    level: "200L",
    email: "rukayat.yusuf@student.edu",
    joinedAt: "24 Jun",
  },
  {
    id: "std-4",
    name: "Samuel Udo",
    matricNo: "CSC/24/1431",
    level: "100L",
    email: "samuel.udo@student.edu",
    joinedAt: "28 Jun",
  },
];
