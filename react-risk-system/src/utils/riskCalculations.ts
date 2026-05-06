// src/utils/riskCalculations.ts

import { RequestStatus, Semester } from '../types';

/* ===== RISK SCORE ===== */
export const calculateRiskScore = (
  impact: number,
  likelihood: number
): number => {
  return impact * likelihood;
};

/* ===== RISK COLOR ===== */
export const getRiskColor = (score: number): string => {
  if (score <= 3) return 'bg-green-500';
  if (score <= 6) return 'bg-yellow-500';
  if (score <= 12) return 'bg-orange-500';
  return 'bg-red-500';
};

/* ===== RISK LABEL ===== */
export const getRiskLabel = (score: number): string => {
  if (score <= 3) return 'منخفض';
  if (score <= 6) return 'متوسط';
  if (score <= 12) return 'عالي';
  return 'حرج';
};

/* ===== STATUS COLOR ===== */
export const getStatusColor = (status: RequestStatus): string => {
  const colors: Record<RequestStatus, string> = {
    pending: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
    closed: 'bg-gray-500'
  };

  return colors[status];
};

/* ===== STATUS LABEL ===== */
export const getStatusLabel = (status: RequestStatus): string => {
  const labels: Record<RequestStatus, string> = {
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    closed: 'مغلق'
  };

  return labels[status];
};

/* ===== SEMESTER LABEL ===== */
export const getSemesterLabel = (semester: Semester): string => {
  const labels: Record<Semester, string> = {
    first: 'الفصل الأول',
    second: 'الفصل الثاني',
    summer: 'الفصل الصيفي'
  };

  return labels[semester];
};