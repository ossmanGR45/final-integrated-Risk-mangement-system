import React, { useEffect, useMemo, useState } from 'react';
import { UserRole } from '../../types';

// What the backend actually returns from /api/logs and /api/logs/my.
interface ApiAuditLog {
  id: number;
  userId: number;
  type?: string | null;        // "Create" | "Update" | "Delete"
  tableName?: string | null;
  dateTime: string;
  oldValues?: string | null;   // JSON string
  newValues?: string | null;   // JSON string
  affectedColumns?: string | null;
  primaryKey?: number | null;
}

// The shape this page renders.
interface LogEntry {
  id: string;
  type: string;          // localized action
  tableName: string;
  recordId: string;
  actorUserId: string;
  createdAt: string;
  affectedColumns: string;
  details: string;
}

interface LogsPageProps {
  role: UserRole;
}

type SortOption = 'date_desc' | 'date_asc' | 'type_asc' | 'table_asc';

const typeLabel: Record<string, string> = {
  Create: 'إضافة',
  Update: 'تعديل',
  Delete: 'حذف',
};

const tableLabel: Record<string, string> = {
  Risk: 'مخاطر',
  Request: 'طلب',
  Cause: 'سبب',
  Actions: 'إجراء',
  Category: 'فئة',
  StrategicGoal: 'غاية استراتيجية',
  Department: 'قسم',
  Responsible: 'جهة مسؤولة',
  RiskActionMapping: 'ربط إجراء بمخاطرة',
  RiskCauseMapping: 'ربط سبب بمخاطرة',
  RiskStrategicGoalMapping: 'ربط غاية بمخاطرة',
  RequestActionMapping: 'ربط إجراء بطلب',
  RequestCauseMapping: 'ربط سبب بطلب',
  RequestStrategicGoalMapping: 'ربط غاية بطلب',
  NotificationModel: 'إشعار',
  User: 'مستخدم',
};

// Make a JSON blob readable by trimming and pretty-printing if possible.
const summarizeJson = (raw: string | null | undefined): string => {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const pieces = Object.entries(parsed)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .slice(0, 6)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
      return pieces.join(' | ');
    }
    return String(parsed);
  } catch {
    return raw;
  }
};

const adapt = (log: ApiAuditLog): LogEntry => ({
  id: String(log.id),
  type: typeLabel[log.type || ''] || log.type || '',
  tableName: tableLabel[log.tableName || ''] || log.tableName || '',
  recordId: log.primaryKey != null ? String(log.primaryKey) : '',
  actorUserId: String(log.userId ?? ''),
  createdAt: log.dateTime,
  affectedColumns: log.affectedColumns || '',
  details:
    log.type === 'Update'
      ? `قبل: ${summarizeJson(log.oldValues)}\nبعد: ${summarizeJson(log.newValues)}`
      : log.type === 'Delete'
        ? summarizeJson(log.oldValues)
        : summarizeJson(log.newValues),
});

const LogsPage: React.FC<LogsPageProps> = ({ role }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    tableName: '',
  });

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const endpoint =
        role === 'admin'
          ? 'https://localhost:7002/api/logs'
          : 'https://localhost:7002/api/logs/my';

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Failed to fetch logs:', response.status);
        setLogs([]);
        return;
      }

      const data = await response.json();
      const apiList: ApiAuditLog[] = Array.isArray(data) ? data : [];
      setLogs(apiList.map(adapt));
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filteredLogs = useMemo(() => {
    const result = logs.filter(log => {
      const matchesSearch =
        !filters.search ||
        log.type.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.tableName.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.recordId.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.details.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.affectedColumns.toLowerCase().includes(filters.search.toLowerCase());

      const matchesType = !filters.type || log.type === filters.type;
      const matchesTable = !filters.tableName || log.tableName === filters.tableName;

      return matchesSearch && matchesType && matchesTable;
    });

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'type_asc':
          return a.type.localeCompare(b.type, 'ar');
        case 'table_asc':
          return a.tableName.localeCompare(b.tableName, 'ar');
        default:
          return 0;
      }
    });

    return sorted;
  }, [logs, filters, sortBy]);

  const allTypes = useMemo(
    () => Array.from(new Set(logs.map(l => l.type).filter(Boolean))),
    [logs],
  );
  const allTables = useMemo(
    () => Array.from(new Set(logs.map(l => l.tableName).filter(Boolean))),
    [logs],
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل السجلات...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-4xl font-bold mb-4 text-center">
          {role === 'admin' ? 'السجلات' : 'سجلاتي'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            placeholder="بحث..."
            className="border rounded px-4 py-3 text-lg"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />

          <select
            className="border rounded px-4 py-3 text-lg"
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">كل الإجراءات</option>
            {allTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-4 py-3 text-lg"
            value={filters.tableName}
            onChange={e => setFilters({ ...filters, tableName: e.target.value })}
          >
            <option value="">كل الجداول</option>
            {allTables.map(table => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-4 py-3 text-lg"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
          >
            <option value="date_desc">الأحدث أولاً</option>
            <option value="date_asc">الأقدم أولاً</option>
            <option value="type_asc">حسب الإجراء</option>
            <option value="table_asc">حسب الجدول</option>
          </select>
        </div>
      </div>

      <div className="px-6 pt-4 text-right text-gray-600">
        عدد النتائج: <span className="font-bold text-gray-900">{filteredLogs.length}</span>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xl">
              <th className="px-6 py-4 text-center">إجراءات</th>
              <th className="px-6 py-4 text-center">المستخدم</th>
              <th className="px-6 py-4 text-center">رقم السجل</th>
              <th className="px-6 py-4 text-center">الجدول</th>
              <th className="px-6 py-4 text-center">الإجراء</th>
              <th className="px-6 py-4 text-center">التاريخ</th>
              <th className="px-6 py-4 text-center">رقم اللوغ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="border border-gray-400 px-6 py-2 text-lg rounded-lg hover:bg-gray-100"
                  >
                    عرض
                  </button>
                </td>
                <td className="px-6 py-4 text-center text-lg">{log.actorUserId}</td>
                <td className="px-6 py-4 text-center text-lg">{log.recordId}</td>
                <td className="px-6 py-4 text-center text-lg">{log.tableName}</td>
                <td className="px-6 py-4 text-center text-lg">{log.type}</td>
                <td className="px-6 py-4 text-center text-lg">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString('ar-EG') : ''}
                </td>
                <td className="px-6 py-4 text-center text-lg font-medium">{log.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="p-10 text-center text-gray-500 text-lg">
          لا توجد سجلات مطابقة للفلاتر الحالية
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute left-4 top-4 text-3xl"
            >
              ✕
            </button>

            <h3 className="text-3xl font-bold mb-6 text-center">تفاصيل السجل</h3>

            <div className="grid grid-cols-2 gap-4 text-right text-lg mb-6">
              <div>
                <span className="text-gray-500">رقم اللوغ: </span>
                <span className="font-bold">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-gray-500">المستخدم: </span>
                <span className="font-bold">{selectedLog.actorUserId}</span>
              </div>
              <div>
                <span className="text-gray-500">الإجراء: </span>
                <span className="font-bold">{selectedLog.type}</span>
              </div>
              <div>
                <span className="text-gray-500">الجدول: </span>
                <span className="font-bold">{selectedLog.tableName}</span>
              </div>
              <div>
                <span className="text-gray-500">رقم السجل: </span>
                <span className="font-bold">{selectedLog.recordId}</span>
              </div>
              <div>
                <span className="text-gray-500">التاريخ: </span>
                <span className="font-bold">
                  {selectedLog.createdAt
                    ? new Date(selectedLog.createdAt).toLocaleString('ar-EG')
                    : ''}
                </span>
              </div>
            </div>

            {selectedLog.affectedColumns && (
              <div className="mb-4">
                <p className="text-gray-500 mb-1 text-right">الأعمدة المتأثرة</p>
                <div className="border rounded-lg p-3 bg-gray-50 text-right">
                  {selectedLog.affectedColumns}
                </div>
              </div>
            )}

            <div>
              <p className="text-gray-500 mb-1 text-right">التفاصيل</p>
              <pre className="border rounded-lg p-4 bg-gray-50 text-right whitespace-pre-wrap text-sm">
                {selectedLog.details}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
