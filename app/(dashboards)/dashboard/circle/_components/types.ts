export type StudentStatus = "approved" | "pending";

export type Student = {
  id: string;
  name: string;
  matricNo: string;
  level: string;
  email: string;
  status: StudentStatus;
  joinedAt: string;
};

export type JoinRequest = {
  id: string;
  name: string;
  matricNo: string;
  level: string;
  email: string;
  requestedAt: string;
  matchedByUpload?: boolean;
};
