// src/types/index.ts

export type UserRole = 'initiator' | 'manager' | 'admin';

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'closed';

export type EvidenceStatus =
  | 'none'
  | 'required'
  | 'submitted'
  | 'rejected'
  | 'approved';

export type RiskMode = 'before' | 'after';
export type Semester = 'first' | 'second' | 'summer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface RiskRequest {
  id: string;
  name: string;
  sector: string;
  category: string;
  date: string;
  impact: number;
  likelihood: number;
  score: number;
  status: RequestStatus;
  mode: RiskMode;
  semester: Semester;

  sentToAdmin?: boolean;

  mitigationActions: string | string[];

  responsiblePerson: string;
  customResponsible?: string;

  postImpact?: number;
  postLikelihood?: number;
  postScore?: number;

  evidence?: string;
  evidenceStatus?: EvidenceStatus;

  actionsTaken?: string;
  comments?: Comment[];

  closedAt?: string;
  report?: string;

  prevStatus?: RequestStatus;
  lockedBy?: UserRole;
  lockedSessionId?: string;
  lockedAt?: string;
  editedSessionId?: string;
}