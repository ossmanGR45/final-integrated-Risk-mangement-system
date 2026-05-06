import { http } from "./http";
import { RiskRequest } from "../types";
import { STATUS_REJECT } from "../utils/statusMapping";

export const riskRequestsApi = {
  /** Pending list — InProgress + underReview only. Used by the main list. */
  async getPending() {
    const res = await http.get<RiskRequest[]>("/requests?pending=true");
    return res.data;
  },

  /** History list — Accepted + Rejected only. Used by the سجلاتي tab. */
  async getHistory() {
    const res = await http.get<RiskRequest[]>("/requests?pending=false");
    return res.data;
  },

  /** Everything visible to the current user (subject to backend role scoping). */
  async getAll() {
    const res = await http.get<RiskRequest[]>("/requests");
    return res.data;
  },

  async getById(id: string) {
    const res = await http.get<RiskRequest>(`/requests?id=${id}`);
    return res.data;
  },

  async create(payload: Partial<RiskRequest>) {
    const res = await http.post<RiskRequest>("/requests/addUpdate", payload);
    return res.data;
  },

  async update(id: string, payload: Partial<RiskRequest>) {
    const res = await http.post<RiskRequest>("/requests/addUpdate", {
      ...payload,
      id: Number(id),
    });
    return res.data;
  },

  /**
   * "Cancel" / Reject the request. Maps to the backend Rejected enum value
   * (0), not the previous accidental Accepted (3).
   */
  async cancel(id: string, rejectReason?: string) {
    await http.post(`/requests/addUpdate`, {
      id: Number(id),
      status: STATUS_REJECT,
      rejectReason,
    });
  },
};
