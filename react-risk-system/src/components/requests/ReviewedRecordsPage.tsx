import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserRole } from '../../types';
import { uiStatusFromApi, UiStatus } from '../../utils/statusMapping';
import { API_BASE } from '../../api/http';
import Pagination from '../common/Pagination';
import NewRequestForm from './NewRequestForm';
import { FileDown } from 'lucide-react';

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
  raw: any;
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
  raw: r,
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
    raw: r,
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
  raw: r,
});

// -----------------------------------------------------------------------
// Adapter: Maps a raw request object to NewRequestForm initialData shape.
// -----------------------------------------------------------------------
const adaptRequestToForm = (r: any) => {
  return {
    mode: r.occured ? ('after' as const) : ('before' as const),
    category: r.category || '',
    name: r.risk?.riskName || r.description || '',
    date: r.expectedTime ? String(r.expectedTime).slice(0, 10) : '',
    impact: r.impact || 1,
    likelihood: r.likelihood || 1,
    postImpact: r.postImpact || 1,
    postLikelihood: r.postLikelihood || 1,
    responsiblePerson: r.responsible?.contactName || r.responsible?.entityName || '',
    customResponsible: '',
    semester: 'first' as const,
    mitigationActions: (r.requestActions || [])
      .map((rm: any) => rm?.action?.actionDescription || '')
      .filter(Boolean),
    causes: (r.requestCauses || [])
      .map((rc: any) => rc?.cause?.causeDescription || '')
      .filter(Boolean),
    responseActions: (r.requestActions || [])
      .filter((rm: any) => rm?.action?.actionType === 1 || rm?.action?.actionType === 'Reduction')
      .map((rm: any) => rm?.action?.actionDescription || '')
      .filter(Boolean),
    preventiveActions: (r.requestActions || [])
      .filter((rm: any) => rm?.action?.actionType === 0 || rm?.action?.actionType === 'Avoidance')
      .map((rm: any) => rm?.action?.actionDescription || '')
      .filter(Boolean),
    strategicGoal: (r.requestGoals || [])
      .map((rg: any) => rg?.strategicGoal?.goalDescription || '')
      .filter(Boolean)[0] || '',
    strategicGoalsList: (r.requestGoals || [])
      .map((rg: any) => rg?.strategicGoal?.goalDescription || '')
      .filter(Boolean),
    riskId: r.riskId || null,
  };
};

// -----------------------------------------------------------------------
// Adapter: Maps a raw risk suggestion to NewRequestForm initialData shape.
// -----------------------------------------------------------------------
const adaptRiskToForm = (r: any) => {
  const causes = (r.riskCauses || [])
    .map((rc: any) => rc?.cause?.causeDescription || rc?.causeDescription || '')
    .filter(Boolean);
  const responseActions = (r.riskActions || [])
    .filter((rm: any) => rm?.action?.actionType === 1 || rm?.actionType === 1 || rm?.actionType === 'Reduction')
    .map((rm: any) => rm?.action?.actionDescription || rm?.actionDescription || '')
    .filter(Boolean);
  const preventiveActions = (r.riskActions || [])
    .filter((rm: any) => rm?.action?.actionType === 0 || rm?.type === 0 || rm?.actionType === 'Avoidance')
    .map((rm: any) => rm?.action?.actionDescription || rm?.actionDescription || '')
    .filter(Boolean);
  const strategicGoalsList = (r.riskGoals || r.strategicGoals || [])
    .map((rg: any) => typeof rg === 'string' ? rg : rg?.strategicGoal?.goalDescription || '')
    .filter(Boolean);

  return {
    mode: 'before' as const,
    category: r.categoryName || '',
    name: r.riskName || '',
    date: '',
    impact: r.impact || 1,
    likelihood: r.likelihood || 1,
    postImpact: 1,
    postLikelihood: 1,
    responsiblePerson: r.responsible?.contactName || r.responsible?.entityName || '',
    customResponsible: '',
    semester: 'first' as const,
    mitigationActions: preventiveActions,
    causes,
    responseActions,
    preventiveActions,
    strategicGoal: strategicGoalsList[0] || '',
    strategicGoalsList,
    riskId: r.id || null,
  };
};

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
  const [selectedRow, setSelectedRow] = useState<ReviewedRow | null>(null);

  const closeModal = () => {
    setSelectedRow(null);
  };

  const openRowDetails = (row: ReviewedRow) => {
    setSelectedRow(row);
  };

  const generatePDF = useCallback(() => {
    if (!selectedRow) return;
    const r = selectedRow.raw;

    const isRequest = selectedRow.type === 'logged';

    const riskName = isRequest ? (r.risk?.riskName || r.description || '') : (r.riskName || '');
    const category = isRequest ? (r.category || '') : (r.categoryName || '');
    const department = r.department || '';
    const location = isRequest ? '' : (r.location || '');
    const impact = r.impact || 1;
    const likelihood = r.likelihood || 1;
    const score = impact * likelihood;
    const responsibleEntity = r.responsible?.entityName || '';
    const responsiblePerson = r.responsible?.contactName || '';
    const responsiblePhone = r.responsible?.contactPhoneNumber || '';
    const responsibleEmail = r.responsible?.contactEmail || '';
    const date = isRequest && r.expectedTime ? String(r.expectedTime).slice(0, 10) : '';

    const causes: string[] = isRequest
      ? (r.requestCauses || []).map((rc: any) => rc?.cause?.causeDescription || '').filter(Boolean)
      : (r.riskCauses || []).map((rc: any) => rc?.cause?.causeDescription || rc?.causeDescription || '').filter(Boolean);

    const responseActions: string[] = isRequest
      ? (r.requestActions || []).filter((rm: any) => rm?.action?.actionType === 1 || rm?.action?.actionType === 'Reduction').map((rm: any) => rm?.action?.actionDescription || '').filter(Boolean)
      : (r.riskActions || []).filter((rm: any) => rm?.action?.actionType === 1 || rm?.actionType === 1).map((rm: any) => rm?.action?.actionDescription || rm?.actionDescription || '').filter(Boolean);

    const preventiveActions: string[] = isRequest
      ? (r.requestActions || []).filter((rm: any) => rm?.action?.actionType === 0 || rm?.action?.actionType === 'Avoidance').map((rm: any) => rm?.action?.actionDescription || '').filter(Boolean)
      : (r.riskActions || []).filter((rm: any) => rm?.action?.actionType === 0 || rm?.actionType === 0).map((rm: any) => rm?.action?.actionDescription || rm?.actionDescription || '').filter(Boolean);

    const strategicGoals: string[] = isRequest
      ? (r.requestGoals || []).map((rg: any) => rg?.strategicGoal?.goalDescription || '').filter(Boolean)
      : (r.riskGoals || []).map((rg: any) => typeof rg === 'string' ? rg : rg?.strategicGoal?.goalDescription || '').filter(Boolean);

    const bulletList = (items: string[]) =>
      items.length > 0
        ? `<ul style="margin:0;padding-right:20px;list-style-type:disc;">${items.map(i => `<li style="margin-bottom:4px;">${i}</li>`).join('')}</ul>`
        : '<span style="color:#999;">لا يوجد</span>';

    const scoreLabel = score >= 15 ? 'حرج' : score >= 8 ? 'عالي' : score >= 4 ? 'متوسط' : 'منخفض';
    const scoreColor = score >= 15 ? '#dc2626' : score >= 8 ? '#ea580c' : score >= 4 ? '#ca8a04' : '#16a34a';

    const htmlContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${riskName}</title>
<style>@page{size:A4;margin:20mm}*{box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:20px;color:#222;font-size:14px;line-height:1.6}
h1{text-align:center;font-size:22px;margin-bottom:20px;font-weight:bold}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:10px 14px;text-align:right;vertical-align:top}
th{background-color:#f5f5f5;font-weight:bold;text-align:center}.section-header{background-color:#f0f0f0;font-weight:bold;text-align:center;font-size:15px}.value-cell{text-align:center}ul{text-align:right}
@media print{body{padding:0}}</style></head><body><h1>${riskName}</h1><table>
<tr><th style="width:50%">احتمالية الخطر</th><th style="width:50%">شدة أثر الخطر</th></tr>
<tr><td class="value-cell">${likelihood}</td><td class="value-cell">${impact}</td></tr>
<tr><th colspan="2">درجة الخطر: <span style="color:${scoreColor};font-weight:bold;">${score} — ${scoreLabel}</span></th></tr>
${category ? `<tr><td colspan="2" class="section-header">الفئة</td></tr><tr><td colspan="2" class="value-cell">${category}</td></tr>` : ''}
${department ? `<tr><td colspan="2" class="section-header">القسم</td></tr><tr><td colspan="2" class="value-cell">${department}</td></tr>` : ''}
${date ? `<tr><td colspan="2" class="section-header">التاريخ</td></tr><tr><td colspan="2" class="value-cell">${date}</td></tr>` : ''}
${location ? `<tr><td colspan="2" class="section-header">مكان الخطر</td></tr><tr><td colspan="2" class="value-cell">${location}</td></tr>` : ''}
${strategicGoals.length > 0 ? `<tr><td colspan="2" class="section-header">الغايات الاستراتيجية</td></tr><tr><td colspan="2">${bulletList(strategicGoals)}</td></tr>` : ''}
<tr><th>الجهة المسؤولة</th><th>الشخص المسؤول</th></tr>
<tr><td class="value-cell">${responsibleEntity || 'غير محددة'}</td><td class="value-cell">${responsiblePerson || 'غير محدد'}</td></tr>
${responsiblePhone || responsibleEmail ? `<tr><th>الهاتف</th><th>البريد الإلكتروني</th></tr><tr><td class="value-cell" dir="ltr">${responsiblePhone || '-'}</td><td class="value-cell" dir="ltr">${responsibleEmail || '-'}</td></tr>` : ''}
<tr><td colspan="2" class="section-header">الأسباب المحتملة لحدوث الخطر</td></tr><tr><td colspan="2">${bulletList(causes)}</td></tr>
<tr><td colspan="2" class="section-header">الإجراءات التي تتخذها الجهة المسؤولة عند وقوع الخطر</td></tr><tr><td colspan="2">${bulletList(responseActions)}</td></tr>
<tr><td colspan="2" class="section-header">الإجراءات الواجب اتباعها لتفادي حدوث تلك المخاطر</td></tr><tr><td colspan="2">${bulletList(preventiveActions)}</td></tr>
</table></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(htmlContent); w.document.close(); w.onload = () => w.print(); }
  }, [selectedRow]);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      let reqRows: ReviewedRow[] = [];
      let riskRows: ReviewedRow[] = [];

      const reqIncludes = encodeURIComponent('Risk,RequestCauses.Cause,RequestActions.Action,RequestGoals.StrategicGoal');
      const riskIncludes = encodeURIComponent('RiskCauses.Cause,RiskActions.Action,RiskGoals.StrategicGoal');

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
          fetch(`${API_BASE}/requests?pending=false&include=${reqIncludes}`, { headers }),
          // Own risk suggestions that are still custom=true (includes rejected ones)
          fetch(`${API_BASE}/risk?custom=true&include=${riskIncludes}`, { headers }),
          // Accepted suggestions (now custom=false); we'll filter by userId client-side
          fetch(`${API_BASE}/risk?status=3&include=${riskIncludes}`, { headers }),
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
          fetch(`${API_BASE}/requests?include=${reqIncludes}`, { headers }),
          // Risk suggestions (custom=true) in manager's scope: own + team's
          fetch(`${API_BASE}/risk?custom=true&include=${riskIncludes}`, { headers }),
          // All risks (no custom filter) in manager's scope — catches accepted team suggestions
          fetch(`${API_BASE}/risk?include=${riskIncludes}`, { headers }),
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
          fetch(`${API_BASE}/requests?pending=false&include=${reqIncludes}`, { headers }),
          // No custom param → role-scoped: (custom=false || reDirected=true)
          fetch(`${API_BASE}/risk?include=${riskIncludes}`, { headers }),
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
              <th className="px-6 py-4 text-center">إجراءات</th>
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
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => openRowDetails(row)}
                    className="border border-gray-400 px-6 py-2 text-lg rounded-lg hover:bg-gray-100"
                  >
                    عرض التفاصيل
                  </button>
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

      {selectedRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[1100px] max-h-[90vh] overflow-y-auto p-8 relative">
            <button onClick={closeModal} className="absolute left-4 top-4 text-3xl">
              ✕
            </button>

            <h3 className="text-3xl font-bold mb-6 text-center">تفاصيل العملية</h3>

            <NewRequestForm
              initialData={
                selectedRow.type === 'logged'
                  ? adaptRequestToForm(selectedRow.raw)
                  : adaptRiskToForm(selectedRow.raw)
              }
              disabled={true}
              title="تفاصيل العملية"
              submitLabel="عرض فقط"
              onSubmit={() => {}}
              onCancel={closeModal}
            />

            {selectedRow.rejectReason && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-right">
                <p className="font-bold text-red-700 mb-1">سبب الرفض</p>
                <p 
                  className={`text-red-800 ${!/[\u0600-\u06FF]/.test(selectedRow.rejectReason) ? 'text-left' : 'text-right'}`}
                  style={{ direction: !/[\u0600-\u06FF]/.test(selectedRow.rejectReason) ? 'ltr' : 'rtl' }}
                >
                  {selectedRow.rejectReason}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={generatePDF}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileDown size={20} />
                حفظ كملف PDF
              </button>
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewedRecordsPage;
