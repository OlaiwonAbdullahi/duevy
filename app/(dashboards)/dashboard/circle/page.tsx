"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { INITIAL_REQUESTS, INITIAL_STUDENTS } from "./_components/data";
import type { JoinRequest, Student } from "./_components/types";
import { CircleHeader } from "./_components/CircleHeader";
import { CircleStats } from "./_components/CircleStats";
import { PendingRequestsCard } from "./_components/PendingRequestsCard";
import { StudentsTable } from "./_components/StudentsTable";
import { UploadApprovalCard } from "./_components/UploadApprovalCard";

export default function CirclePage() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [requests, setRequests] = useState<JoinRequest[]>(INITIAL_REQUESTS);
  const [query, setQuery] = useState("");
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadMatched, setUploadMatched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const matchedRequests = requests.filter((request) => request.matchedByUpload);
  const openUploadPicker = () => fileInputRef.current?.click();

  const approveRequest = (request: JoinRequest) => {
    setStudents((list) => [
      {
        id: `std-${request.id}`,
        name: request.name,
        matricNo: request.matricNo,
        level: request.level,
        email: request.email,
        status: "approved",
        joinedAt: "Just now",
      },
      ...list,
    ]);
    setRequests((list) => list.filter((item) => item.id !== request.id));
    toast.success("Student approved", { description: request.name });
  };

  const declineRequest = (request: JoinRequest) => {
    setRequests((list) => list.filter((item) => item.id !== request.id));
    toast.success("Request declined", { description: request.name });
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadName(file.name);
    setUploadMatched(true);
    setRequests((list) =>
      list.map((request, index) => ({
        ...request,
        matchedByUpload: index < 2,
      })),
    );
    toast.success("List checked", {
      description: "2 pending requests matched the uploaded sheet.",
    });
  };

  const approveMatched = () => {
    if (matchedRequests.length === 0) return;

    setStudents((list) => [
      ...matchedRequests.map((request) => ({
        id: `std-${request.id}`,
        name: request.name,
        matricNo: request.matricNo,
        level: request.level,
        email: request.email,
        status: "approved" as const,
        joinedAt: "Just now",
      })),
      ...list,
    ]);
    setRequests((list) => list.filter((request) => !request.matchedByUpload));
    toast.success(`${matchedRequests.length} students approved`, {
      description: "Matched requests moved into the department circle.",
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <CircleHeader onUploadClick={openUploadPicker} />

      <CircleStats
        studentCount={students.length}
        requestCount={requests.length}
        matchedCount={matchedRequests.length}
        uploadMatched={uploadMatched}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.45fr]">
        <div className="flex flex-col gap-6">
          <UploadApprovalCard
            fileInputRef={fileInputRef}
            uploadName={uploadName}
            uploadMatched={uploadMatched}
            matchedCount={matchedRequests.length}
            onUpload={handleUpload}
            onUploadClick={openUploadPicker}
            onApproveMatched={approveMatched}
          />
          <PendingRequestsCard
            requests={requests}
            onApprove={approveRequest}
            onDecline={declineRequest}
          />
        </div>

        <StudentsTable
          students={filteredStudents}
          query={query}
          onQueryChange={setQuery}
        />
      </div>
    </div>
  );
}
