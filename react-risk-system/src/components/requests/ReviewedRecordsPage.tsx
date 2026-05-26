import React, { useEffect, useMemo, useState } from 'react';
import { UserRole } from '../../types';
import { uiStatusFromApi, UiStatus } from '../../utils/statusMapping';
import { API_BASE } from '../../api/http';
import Pagination from '../common/Pagination';

// Unified row for the merged history list.
interface ReviewedRow {
  id: string;
  type: 'logged' | 'suggested';
  typeLabel: string;
  name: string;
  category: string;
  date: string;
  status: UiStatus;
  rejectReason?: string;
  userId: string;
}

interface Props {
  role: UserRole;
}

const statusColor: Record<UiStatus, string> = {
  pending: 'bg-yellow-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
};

const statusLabel: Record<UiStatus, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

const ReviewedRecordsPage: React.FC<Props> = ({ role }) => {
  const [rows, setRows] = useState<ReviewedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    name: '',
    user: '',
  });

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
    } catch (e) {
      return '';
    }
  };

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const currentUserId = getUserIdFromToken(token);

      // Fetch requests, risks, and the specific user's audit logs to track actions
      const [reqRes, riskRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/requests?pending=false&include=Risk`, { headers }),
        fetch(`${API_BASE}/risk`, { headers }),
        fetch(`${API_BASE}/logs/my`, { headers }),
      ]);

      const requests = reqRes.ok ? await reqRes.json() : [];
      const risks = riskRes.ok ? await riskRes.json() : [];
      const auditLogs = logsRes.ok ? await logsRes.ok && logsRes.json() : [];

      const touchedRequestIds = new Set<string>();
      const touchedRiskIds = new Set<string>();

      if (Array.isArray(auditLogs)) {
        auditLogs.forEach((log: any) => {
          if (log.primaryKey != null) {
            const pkStr = String(log.primaryKey);
            if (log.tableName === 'Request') {
              touchedRequestIds.add(pkStr);
            } else if (log.tableName === 'Risk') {
              touchedRiskIds.add(pkStr);
            }
          }
        });
      }

      const reqRows: ReviewedRow[] = (Array.isArray(requests) ? requests : [])
        .map((r: any) => ({
          id: `req-${r.id}`,
          type: 'logged' as const,
          typeLabel: 'خطر مسجل',
          name: r.risk?.riskName || r.description || '',
          category: r.category || '',
          date: r.expectedTime ? String(r.expectedTime).slice(0, 10) : '',
          status: uiStatusFromApi(r.status),
          rejectReason: r.rejectReason || undefined,
          userId: r.userId !== undefined && r.userId !== null ? String(r.userId) : '',
        }))
        .filter((row: ReviewedRow) => {
          const reqId = row.id.replace('req-', '');
          if (role === 'initiator') {
            return row.userId === currentUserId;
          } else if (role === 'manager') {
            // Manager: only those he redirected or rejected
            return touchedRequestIds.has(reqId);
          } else if (role === 'admin') {
            // Admin: only those he accepted or rejected
            return touchedRequestIds.has(reqId);
          }
          return true;
        });

      // Risks: only the *finished* ones (status 0=Rejected or 3=Accepted).
      const riskRows: ReviewedRow[] = (Array.isArray(risks) ? risks : [])
        .filter((r: any) => r.status === 0 || r.status === 3)
        .map((r: any) => ({
          id: `risk-${r.id}`,
          type: 'suggested' as const,
          typeLabel: 'خطر مقترح',
          name: r.riskName || '',
          category: r.categoryName || '',
          date: '',
          status: uiStatusFromApi(r.status),
          rejectReason: r.rejectReason || undefined,
          userId: r.userId !== undefined && r.userId !== null ? String(r.userId) : '',
        }))
        .filter((row: ReviewedRow) => {
          const riskId = row.id.replace('risk-', '');
          if (role === 'initiator') {
            return row.userId === currentUserId;
          } else if (role === 'manager') {
            // Manager: only those he or his team touched or redirected
            return touchedRiskIds.has(riskId) || row.userId === currentUserId;
          } else if (role === 'admin') {
            // Admin: only those he accepted or rejected
            return touchedRiskIds.has(riskId);
          }
          return true;
        });

      setRows([...reqRows, ...riskRows]);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filtered = useMemo(() => {
    return rows.filter(r =>
      (!filters.type || r.type === filters.type) &&
      (!filters.status || r.status === (filters.status as UiStatus)) &&
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
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
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
            <option value="accepted">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
      </div>

      <div className="px-6 pt-4 text-right text-gray-600">
        عدد النتائج: <span className="font-bold text-gray-900">{filtered.length}</span>
      </div>

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
                <td className="px-6 py-4 text-center text-lg">{row.date}</td>
                <td className="px-6 py-4 text-center text-lg">{row.category}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`${statusColor[row.status]} text-white px-6 py-2 rounded-full text-lg font-medium`}>
                    {statusLabel[row.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
