"use client";

import { useMemo, useState } from "react";
import { INITIAL_STUDENTS, REP_JOIN_CODE, generateJoinCode } from "./_components/data";
import type { Student } from "./_components/types";
import { CircleHeader } from "./_components/CircleHeader";
import { CircleStats } from "./_components/CircleStats";
import { StudentsTable } from "./_components/StudentsTable";

export default function CirclePage() {
  const [students] = useState<Student[]>(INITIAL_STUDENTS);
  const [code, setCode] = useState(REP_JOIN_CODE);
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        student.matricNo.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q),
    );
  }, [query, students]);

  // Students who joined this week — a light signal that the code is circulating.
  const recentJoins = students.filter((s) => /Jun|Jul|Just now/.test(s.joinedAt));

  const regenerateCode = () => setCode(generateJoinCode());

  return (
    <div className="mx-auto max-w-6xl">
      <CircleHeader />

      <CircleStats
        studentCount={students.length}
        recentCount={recentJoins.length}
        code={code}
        onRegenerate={regenerateCode}
      />

      {/* Members who joined with the code. */}
      <StudentsTable
        students={filteredStudents}
        totalCount={students.length}
        query={query}
        onQueryChange={setQuery}
      />
    </div>
  );
}
