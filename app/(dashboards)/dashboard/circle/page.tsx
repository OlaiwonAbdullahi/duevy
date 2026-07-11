"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Student } from "./_components/types";
import { CircleHeader } from "./_components/CircleHeader";
import { CircleStats } from "./_components/CircleStats";
import { StudentsTable } from "./_components/StudentsTable";
import { useRepSpace } from "../_components/use-rep-space";
import { timeAgo } from "../_components/notifications-data";
import { listMembers, getRepOverview, regenerateJoinCode } from "@/lib/api/rep";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function CirclePage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;

  const [students, setStudents] = useState<Student[]>([]);
  const [recentCount, setRecentCount] = useState(0);
  const [code, setCode] = useState("—");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    (async () => {
      try {
        // Members roster + join code — the join code comes from the same
        // `/spaces/{spaceId}/overview` the rep dashboard uses.
        const [members, overview] = await Promise.all([
          listMembers(spaceId, { perPage: 100 }),
          getRepOverview(spaceId),
        ]);
        if (cancelled) return;
        const weekAgo = Date.now() - WEEK_MS;
        setRecentCount(
          members.data.filter((m) => new Date(m.joinedAt).getTime() >= weekAgo).length,
        );
        setStudents(members.data.map((m) => ({ ...m, joinedAt: timeAgo(m.joinedAt) })));
        setCode(overview.joinCode);
      } catch {
        if (!cancelled) toast.error("Couldn't load your circle.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

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

  const regenerateCode = async () => {
    if (!spaceId) return;
    try {
      const { code: next } = await regenerateJoinCode(spaceId);
      setCode(next);
      toast.success("Join code regenerated", {
        description: "The old code no longer works — reshare the new one.",
      });
    } catch {
      toast.error("Couldn't regenerate the code. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <CircleHeader />

      <CircleStats
        studentCount={students.length}
        recentCount={recentCount}
        code={code}
        spaceName={repSpace?.name ?? "your department"}
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
