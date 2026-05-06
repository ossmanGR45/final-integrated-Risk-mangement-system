// src/utils/statusMapping.ts
//
// Single source of truth for converting between the backend RequestStatus enum
// and the strings the UI uses. The backend enum (QM.Models.Enums.RequestStatus)
// is:
//   Rejected     = 0
//   InProgress   = 1   <-- new request waiting for the manager
//   underReview  = 2   <-- forwarded by the manager, waiting for the admin
//   Accepted     = 3
//
// Anywhere we POST a status to the backend, use the *FromUI helpers below.
// Anywhere we read a status from the backend, use the *FromApi helpers.

export const RequestStatusEnum = {
  Rejected: 0,
  InProgress: 1,
  UnderReview: 2,
  Accepted: 3
} as const;

export type RequestStatusNum = 0 | 1 | 2 | 3;

export type UiStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Convert a numeric status from the API to the UI-level string we display.
 * Anything still in-flight (InProgress / underReview) is shown as "pending".
 */
export const uiStatusFromApi = (status: number | null | undefined): UiStatus => {
  if (status === RequestStatusEnum.Accepted) return 'accepted';
  if (status === RequestStatusEnum.Rejected) return 'rejected';
  return 'pending';
};

/**
 * Identify which review stage a request is in, so the UI can decide which
 * action buttons to show (manager vs admin).
 */
export const reviewerFromStatus = (
  status: number | null | undefined
): 'manager' | 'admin' | null => {
  if (status === RequestStatusEnum.InProgress) return 'manager';
  if (status === RequestStatusEnum.UnderReview) return 'admin';
  return null;
};

/**
 * Status to send when an admin ACCEPTS a request.
 */
export const STATUS_ACCEPT = RequestStatusEnum.Accepted; // 3

/**
 * Status to send when anyone REJECTS a request.
 */
export const STATUS_REJECT = RequestStatusEnum.Rejected; // 0

/**
 * Status to send when a manager FORWARDS a request to admin.
 */
export const STATUS_FORWARD_TO_ADMIN = RequestStatusEnum.UnderReview; // 2

/**
 * Status used when a request is initially created or kept pending at the
 * manager review stage.
 */
export const STATUS_PENDING = RequestStatusEnum.InProgress; // 1

/**
 * Map a Risk record's status to the suggestion-tab UI status string used by
 * NewRisksTab.
 */
export type SuggestionUiStatus =
  | 'manager_review'
  | 'admin_review'
  | 'accepted'
  | 'rejected';

export const suggestionStatusFromApi = (
  status: number | null | undefined,
  redirected: boolean | null | undefined
): SuggestionUiStatus => {
  if (status === RequestStatusEnum.Accepted) return 'accepted';
  if (status === RequestStatusEnum.Rejected) return 'rejected';
  // InProgress with a manager redirect means it has reached the admin queue.
  if (status === RequestStatusEnum.UnderReview || redirected === true) {
    return 'admin_review';
  }
  return 'manager_review';
};
