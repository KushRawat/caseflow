export type Role = 'ADMIN' | 'OPERATOR';

export type User = {
  id: string;
  email: string;
  role: Role;
};

export type CaseCategory = 'TAX' | 'LICENSE' | 'PERMIT';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type CaseStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type CaseRecord = {
  id: string;
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string | null;
  phone?: string | null;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  assignee?: { id: string; email: string } | null;
  createdBy?: { id: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type CaseHistory = {
  id: string;
  message: string;
  createdAt: string;
};

export type CaseNote = {
  id: string;
  body: string;
  createdAt: string;
  author?: { id: string; email: string } | null;
};

export type CaseDetail = CaseRecord & {
  history: CaseHistory[];
  notes: CaseNote[];
};

export type CasesResponse = {
  cases: CaseRecord[];
  pageSize: number;
  total: number;
  hasNext: boolean;
  nextCursor: string | null;
};

export type ImportJob = {
  id: string;
  sourceName?: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string | null;
  createdBy?: { id: string; email: string } | null;
};

export type ImportError = {
  id: string;
  rowNumber: number;
  field: string;
  message: string;
};

export type CaseRowInput = {
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string;
  phone?: string;
  category: CaseCategory;
  priority: CasePriority;
  status?: CaseStatus;
};

export type ImportAuditEntry = {
  id: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type ImportReportPayload = ImportJob & {
  errors: ImportError[];
  audits: ImportAuditEntry[];
};

export type ImportListResponse = {
  imports: ImportJob[];
  pageSize: number;
  total: number;
  hasNext: boolean;
  nextCursor: string | null;
};
