"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Student } from "./_components/types";
import { CircleHeader } from "./_components/CircleHeader";
import { CircleStats } from "./_components/CircleStats";
import { StudentsTable } from "./_components/StudentsTable";
import { useRepSpace } from "../_components/use-rep-space";
import { timeAgo } from "../_components/notifications-data";
import { StatRowSkeleton, ListSkeleton } from "../_components/Skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { listAllMembers, regenerateJoinCode } from "@/lib/api/rep";
import { queryKeys, repOverviewQuery } from "@/lib/api/queries";
import type { RepOverview } from "@/lib/api/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function CirclePage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  // `/auth/me` usually carries the join code already; only fall back to the
  // (heavier, but probably cached) overview when it doesn't.
  const knownCode = repSpace?.joinCode ?? null;
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [recentCount, setRecentCount] = useState(0);
  const [code, setCode] = useState("—");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const [members, joinCode] = await Promise.all([
          listAllMembers(spaceId),
          knownCode ??
            queryClient.fetchQuery(repOverviewQuery(spaceId)).then((overview) => overview.joinCode),
        ]);
        if (cancelled) return;
        const weekAgo = Date.now() - WEEK_MS;
        setRecentCount(
          members.filter((m) => new Date(m.joinedAt).getTime() >= weekAgo).length,
        );
        setStudents(members.map((m) => ({ ...m, joinedAt: timeAgo(m.joinedAt) })));
        setCode(joinCode);
      } catch {
        if (!cancelled) toast.error("Couldn't load your circle.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId, knownCode, queryClient]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(q) ||
        (student.matricNo ?? "").toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q),
    );
  }, [query, students]);

  const regenerateCode = async () => {
    if (!spaceId) return;
    try {
      const { code: next } = await regenerateJoinCode(spaceId);
      setCode(next);
      queryClient.setQueryData<RepOverview>(queryKeys.repOverview(spaceId), (o) =>
        o ? { ...o, joinCode: next } : o,
      );
      // `/auth/me` carries the code too; refresh it so the next visit isn't stale.
      void refreshUser().catch(() => {});
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

      {loading ? (
        <div className="mt-6">
          <StatRowSkeleton />
          <div className="mt-4">
            <ListSkeleton />
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
