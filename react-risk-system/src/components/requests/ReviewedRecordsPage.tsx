import React, { useEffect, useMemo, useState } from 'react';
import { UserRole } from '../../types';
import { uiStatusFromApi, UiStatus } from '../../utils/statusMapping';
import { API_BASE } from '../../api/http';
import Pagination from '../common/Pagination';

// Extended display status — adds 'redirected' for the manager's "تم تحويلها" case.
type DisplayStatus = UiStatus | 'redirected';

// Unified row for the merged history list.
interface ReviewedRow {
  id: string;
  type: 'logged' | 'suggested';
  typeLabel: string;
  name: string;
  category: string;
  date: string;
  /** Actual API status (Accepted/Rejected/Pending). */
  status: UiStatus;
  /**
   * What we display in the Status column.
   * For managers, forwarded items show 'redirected' regardless of final admin decision.
   */
  displayStatus: DisplayStatus;
  rejectReason?: string;
  userId: string;
}

interface Props {
  role: UserRole;
}

// -----------------------------------------------------------------------
// Status colour + label maps — 'redirected' is the manager-only state.
// -----------------------------------------------------------------------
const statusColor: Record<DisplayStatus, string> = {
  pending: 'bg-yellow-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  redirected: 'bg-blue-500',
};

const statusLabel: Record<DisplayStatus, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  redirected: 'تم تحويلها',
};

// -----------------------------------------------------------------------
// Status filter options are role-dependent.
// -----------------------------------------------------------------------
const statusFilterOptions: Record<UserRole, { value: string; label: string }[]> = {
  initiator: [
    { value: 'accepted', label: 'مقبول' },
    { value: 'rejected', label: 'مرفوض' },
  ],
  manager: [
    { value: 'redirected', label: 'تم تحويلها' },
    { value: 'rejected', label: 'مرفوض' },
  ],
  admin: [
    { value: 'accepted', label: 'مقبول' },
    { value: 'rejected', label: 'مرفوض' },
  ],
};

// -----------------------------------------------------------------------
// Helper: decode userId from JWT (NameIdentifier claim).
// -----------------------------------------------------------------------
const getUserIdFromToken = (token: string | null): string => {
  if (!token) return '';
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return String(parsed.nameid || parsed.sub || '');
  } catch {
    return '';
  }
};

// -----------------------------------------------------------------------
// Map a raw request object to a ReviewedRow for the Initiator / Admin view.
// -----------------------------------------------------------------------
const toRequestRow = (r: any): ReviewedRow => ({
  id: `req-${r.id}`,
  type: 'logged',
  typeLabel: 'خطر مسجل',
  name: r.risk?.riskName || r.description || '',
  category: r.category || '',
  date: r.expectedTime ? String(r.expectedTime).slice(0, 10) : '',
  status: uiStatusFromApi(r.status),
  displayStatus: uiStatusFromApi(r.status),
  rejectReason: r.rejectReason || undefined,
  userId: r.userId != null ? String(r.userId) : '',
});

// -----------------------------------------------------------------------
// Map a raw request object to a ReviewedRow for the Manager view.
//
// IMPORTANT: The backend ALWAYS sets reDirected=true whenever a manager
// touches a request (line 212-213 in RequestsController.cs):
//   if (IsManager(userRole)) request.ReDirected = true;
// This means BOTH rejected AND forwarded requests have reDirected=true.
//
// We therefore distinguish them by STATUS, not by reDirected:
//   • status === 0 (Rejected) → "مرفوض"   (manager rejected it)
//   • status !== 0            → "تم تحويلها" (manager forwarded to admin)
// -----------------------------------------------------------------------
const toManagerRequestRow = (r: any): ReviewedRow => {
  // status=0 means Rejected (manager rejected without or with forwarding intent)
  const displayStatus: DisplayStatus = r.status === 0 ? 'rejected' : 'redirected';
  return {
    id: `req-${r.id}`,
    type: 'logged',
    typeLabel: 'خطر مسجل',
    name: r.risk?.riskName || r.description || '',
    category: r.category || '',
    date: r.expectedTime ? String(r.expectedTime).slice(0, 10) : '',
    status: uiStatusFromApi(r.status),
    displayStatus,
    rejectReason: r.rejectReason || undefined,
    userId: r.userId != null ? String(r.userId) : '',
  };
};

// -----------------------------------------------------------------------
// Map a raw risk suggestion to a ReviewedRow (generic — no special display override).
// -----------------------------------------------------------------------
const toRiskRow = (r: any, displayOverride?: DisplayStatus): ReviewedRow => ({
  id: `risk-${r.id}`,
  type: 'suggested',
  typeLabel: 'خطر مقترح',
  name: r.riskName || '',
  category: r.categoryName || '',
  date: '',
  status: uiStatusFromApi(r.status),
  displayStatus: displayOverride ?? uiStatusFromApi(r.status),
  rejectReason: r.rejectReason || undefined,
  userId: r.userId != null ? String(r.userId) : '',
});

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
const ReviewedRecordsPage: React.FC<Props> = ({ role }) => {
  const [rows, setRows] = useState<ReviewedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filters, setFilters] = useState({ type: '', status: '', name: '', user: '' });

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      let reqRows: ReviewedRow[] = [];
      let riskRows: ReviewedRow[] = [];

      // =================================================================
      // INITIATOR
      // =================================================================
      // • Requests: backend scopes to own; pending=false → Accepted+Rejected only.
      // • Risk suggestions: backend scopes to own (custom=false || userId===me).
      //     - Rejected suggestions stay custom=true  → appear in ?custom=true query
      //     - Accepted suggestions become custom=false → appear in general query; filter by userId
      // =================================================================
      if (role === 'initiator') {
        const currentUserId = getUserIdFromToken(token);

        const [reqRes, riskCustomRes, riskAcceptedRes] = await Promise.all([
          // Own finished requests (Accepted or Rejected)
          fetch(`${API_BASE}/requests?pending=false&include=Risk`, { headers }),
          // Own risk suggestions that are still custom=true (includes rejected ones)
          fetch(`${API_BASE}/risk?custom=true`, { headers }),
          // Accepted suggestions (now custom=false); we'll filter by userId client-side
          fetch(`${API_BASE}/risk?status=3`, { headers }),
        ]);

        const requests: any[] = reqRes.ok ? await reqRes.json() : [];
        const customRisks: any[] = riskCustomRes.ok ? await riskCustomRes.json() : [];
        const acceptedRisks: any[] = riskAcceptedRes.ok ? await riskAcceptedRes.json() : [];

        reqRows = (Array.isArray(requests) ? requests : []).map(toRequestRow);

        // Rejected suggestions: custom=true, status=0
        const rejectedRisks = (Array.isArray(customRisks) ? customRisks : [])
          .filter((r: any) => r.status === 0);

        // Accepted suggestions that originally belonged to this initiator
        const myAcceptedRisks = (Array.isArray(acceptedRisks) ? acceptedRisks : [])
          .filter((r: any) => r.userId != null && String(r.userId) === currentUserId);

        riskRows = [
          ...rejectedRisks.map((r: any) => toRiskRow(r)),
          ...myAcceptedRisks.map((r: any) => toRiskRow(r)),
        ];
      }

      // =================================================================
      // MANAGER
      // =================================================================
      // • Requests: backend scopes to (own OR team's); no pending filter → all statuses.
      //     Client filter: reDirected===true (forwarded) OR status===0 (directly rejected).
      //     Display status: 'redirected' if reDirected===true, else 'rejected'.
      //
      // • Risk suggestions: same logic on ?custom=true (role-scoped: own + team's suggestions).
      //     custom=true flag:
      //       - Rejected risks → stay custom=true  ✓ (matches ?custom=true)
      //       - Forwarded pending risks → still custom=true ✓
      //       - Accepted risks → became custom=false ✗ (won't appear in ?custom=true)
      //     For accepted suggestions from team: query all risks (no custom param) + filter.
      // =================================================================
      if (role === 'manager') {
        const [reqRes, riskCustomRes, riskAllRes] = await Promise.all([
          // All requests in manager's scope (own + team), all statuses
          fetch(`${API_BASE}/requests?include=Risk`, { headers }),
          // Risk suggestions (custom=true) in manager's scope: own + team's
          fetch(`${API_BASE}/risk?custom=true`, { headers }),
          // All risks (no custom filter) in manager's scope — catches accepted team suggestions
          fetch(`${API_BASE}/risk`, { headers }),
        ]);

        const requests: any[] = reqRes.ok ? await reqRes.json() : [];
        const customRisks: any[] = riskCustomRes.ok ? await riskCustomRes.json() : [];
        const allRisks: any[] = riskAllRes.ok ? await riskAllRes.json() : [];

        // Keep only requests the manager acted on.
        // Since the backend ALWAYS sets reDirected=true when a manager acts,
        // filtering by reDirected===true covers BOTH rejected AND forwarded requests.
        reqRows = (Array.isArray(requests) ? requests : [])
          .filter((r: any) => r.reDirected === true)
          .map(toManagerRequestRow); // toManagerRequestRow distinguishes by status, not reDirected

        // Same logic for risk suggestions (custom=true pool covers rejected + pending-forwarded).
        // reDirected=true is set by the backend for any manager action on a risk.
        const managerCustomRisks = (Array.isArray(customRisks) ? customRisks : [])
          .filter((r: any) => r.reDirected === true);

        // Accepted suggestions from manager's scope (they have custom=false now, reDirected=true).
        const managerAcceptedRisks = (Array.isArray(allRisks) ? allRisks : [])
          .filter((r: any) => r.status === 3 && r.reDirected === true && r.custom === false);

        riskRows = [
          ...managerCustomRisks.map((r: any) => {
            // Same status-based logic: status=0 → rejected, else → redirected
            const displayStatus: DisplayStatus = r.status === 0 ? 'rejected' : 'redirected';
            return toRiskRow(r, displayStatus);
          }),
          ...managerAcceptedRisks.map((r: any) => toRiskRow(r, 'redirected')),
        ];
      }

      // =================================================================
      // ADMIN
      // =================================================================
      // • Requests: backend already scopes to reDirected=true; pending=false → Accepted+Rejected.
      //     These are requests the admin made a decision on.
      //
      // • Risk suggestions: query with no custom param (role-scoped: custom=false || reDirected=true).
      //     Filter client-side:
      //       - (status===0 || status===3) AND reDirected===true
      //       → this catches accepted/rejected suggestions that went through manager→admin flow.
      //       - Excludes admin-created catalog risks (reDirected=false, admin created directly).
      // =================================================================
      if (role === 'admin') {
        const [reqRes, riskRes] = await Promise.all([
          fetch(`${API_BASE}/requests?pending=false&include=Risk`, { headers }),
          // No custom param → role-scoped: (custom=false || reDirected=true)
          fetch(`${API_BASE}/risk`, { headers }),
        ]);

        const requests: any[] = reqRes.ok ? await reqRes.json() : [];
        const risks: any[] = riskRes.ok ? await riskRes.json() : [];

        reqRows = (Array.isArray(requests) ? requests : []).map(toRequestRow);

        // Show only suggestion-based risks (reDirected=true) that are finished.
        // Excludes risks the admin created from scratch (reDirected=false).
        riskRows = (Array.isArray(risks) ? risks : [])
          .filter((r: any) =>
            (r.status === 0 || r.status === 3) &&
            r.reDirected === true
          )
          .map((r: any) => toRiskRow(r));
      }

      // Deduplicate by id (in case accepted risks appear in both pools)
      const seen = new Set<string>();
      const merged: ReviewedRow[] = [];
      for (const row of [...reqRows, ...riskRows]) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row);
        }
      }

      setRows(merged);
    } catch (err) {
      console.error('ReviewedRecordsPage fetch error:', err);
      setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Filter uses displayStatus so the manager's "تم تحويلها" filter works correctly.
  const filtered = useMemo(() => {
    return rows.filter(r =>
      (!filters.type || r.type === filters.type) &&
      (!filters.status || r.displayStatus === (filters.status as DisplayStatus)) &&
      (!filters.name || r.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.user || r.userId.includes(filters.user.trim()))
    );
  }, [rows, filters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // -----------------------------------------------------------------------
  // Render: Loading
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Error
  // -----------------------------------------------------------------------
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={fetchAll}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Main
  // -----------------------------------------------------------------------
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ---- Header + Filters ---- */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-4xl font-bold mb-4 text-center">
          {role === 'admin' ? 'العمليات السابقة' : 'الطلبات السابقة'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="اسم الخطر"
            className="border rounded px-4 py-3 text-lg"
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />
          <input
            placeholder="رقم الموظف..."
            className="border rounded px-4 py-3 text-lg"
            value={filters.user}
            onChange={e => setFilters({ ...filters, user: e.target.value })}
          />
          <select
            className="border rounded px-4 py-3 text-lg"
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">كل الأنواع</option>
            <option value="logged">خطر مسجل</option>
            <option value="suggested">خطر مقترح</option>
          </select>
          <select
            className="border rounded px-4 py-3 text-lg"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">كل الحالات</option>
            {statusFilterOptions[role].map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ---- Result count ---- */}
      <div className="px-6 pt-4 text-right text-gray-600">
        عدد النتائج: <span className="font-bold text-gray-900">{filtered.length}</span>
      </div>

      {/* ---- Table ---- */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xl">
              <th className="px-6 py-4 text-center">رقم</th>
              <th className="px-6 py-4 text-center">رقم الموظف</th>
              <th className="px-6 py-4 text-center">النوع</th>
              <th className="px-6 py-4 text-center">اسم الخطر</th>
              <th className="px-6 py-4 text-center">التاريخ</th>
              <th className="px-6 py-4 text-center">الفئة</th>
              <th className="px-6 py-4 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-center text-lg font-medium">{row.id}</td>
                <td className="px-6 py-4 text-center text-lg font-medium">{row.userId || '—'}</td>
                <td className="px-6 py-4 text-center text-lg">{row.typeLabel}</td>
                <td className="px-6 py-4 text-center text-lg font-medium">{row.name}</td>
                <td className="px-6 py-4 text-center text-lg">{row.date || '—'}</td>
                <td className="px-6 py-4 text-center text-lg">{row.category || '—'}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`${statusColor[row.displayStatus]} text-white px-6 py-2 rounded-full text-lg font-medium`}
                  >
                    {statusLabel[row.displayStatus]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination ---- */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {filtered.length === 0 && (
        <div className="p-10 text-center text-gray-500 text-lg">
          لا توجد سجلات مطابقة للفلاتر الحالية
        </div>
      )}
    </div>
  );
};

export default ReviewedRecordsPage;
