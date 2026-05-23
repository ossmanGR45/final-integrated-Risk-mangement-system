import React, { useEffect, useMemo, useState } from 'react';
import { UserRole } from '../../types';
import NewRequestForm from './NewRequestForm';
import {
  STATUS_ACCEPT,
  STATUS_REJECT,
  STATUS_FORWARD_TO_ADMIN,
  uiStatusFromApi,
  reviewerFromStatus,
  UiStatus,
} from '../../utils/statusMapping';

// Shape returned by `/api/requests` (the backend Request entity).
interface ApiRequest {
  id: number;
  department?: string | null;
  category?: string | null;
  description?: string | null;
  expectedTime?: string | null;
  year?: string | null;
  likelihood?: number | null;
  impact?: number | null;
  postLikelihood?: number | null;
  postImpact?: number | null;
  occured?: boolean | null;
  status?: number | null;
  rejectReason?: string | null;
  reDirected?: boolean | null;
  userId?: number | null;
  responsibleId?: number | null;
  riskId?: number | null;
  responsible?: {
    contactName?: string | null;
    entityName?: string | null;
  } | null;
  user?: {
    userName?: string | null;
  } | null;
  requestActions?: Array<{
    action?: { actionDescription?: string | null } | null;
  }> | null;
}

// Shape consumed by the list / modal in this component.
interface WorkflowRequest {
  id: string;
  mode: 'before' | 'after';
  department: string;
  category: string;
  name: string;
  date: string;
  impact: number;
  likelihood: number;
  score: number;
  postImpact?: number;
  postLikelihood?: number;
  postScore?: number;
  responsiblePerson: string;
  responsibleId?: number | null;
  customResponsible?: string;
  semester: 'first' | 'second' | 'summer';
  mitigationActions: string[];
  submittedBy: string;
  status: UiStatus;
  rawStatus: number;
  sentToAdmin: boolean;
  currentReviewerRole?: 'manager' | 'admin' | null;
  rejectionReason?: string;
  evidence?: string;
}

interface RequestsListProps {
  requests: any[];
  role: UserRole;
  /**
   * 'pending'  → InProgress + underReview (default for the main tab)
   * 'history'  → Accepted + Rejected (سجلاتي tab)
   */
  mode?: 'pending' | 'history';
}

type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'id_asc'
  | 'id_desc'
  | 'status_asc'
  | 'category_asc';

const adapt = (r: ApiRequest): WorkflowRequest => {
  const score = (r.likelihood || 0) * (r.impact || 0);
  const postScore = (r.postLikelihood || 0) * (r.postImpact || 0);
  const reviewer = reviewerFromStatus(r.status ?? null);

  return {
    id: String(r.id),
    mode: r.occured ? 'after' : 'before',
    department: r.department || '',
    category: r.category || '',
    name: r.description || '',
    date: r.expectedTime ? String(r.expectedTime).slice(0, 10) : '',
    impact: r.impact || 1,
    likelihood: r.likelihood || 1,
    score,
    postImpact: r.postImpact || undefined,
    postLikelihood: r.postLikelihood || undefined,
    postScore: postScore || undefined,
    responsiblePerson:
      r.responsible?.contactName || r.responsible?.entityName || '',
    responsibleId: r.responsibleId ?? null,
    customResponsible: '',
    semester: 'first',
    mitigationActions: (r.requestActions || [])
      .map(rm => rm?.action?.actionDescription || '')
      .filter(Boolean),
    submittedBy: r.user?.userName || '',
    status: uiStatusFromApi(r.status ?? null),
    rawStatus: r.status ?? 1,
    sentToAdmin: r.status === 2 /* underReview */ || r.reDirected === true,
    currentReviewerRole: reviewer,
    rejectionReason: r.rejectReason || undefined,
  };
};

const RequestsList: React.FC<RequestsListProps> = ({ role, mode = 'pending' }) => {
  const [data, setData] = useState<WorkflowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [evidenceInput, setEvidenceInput] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const [filters, setFilters] = useState({
    id: '',
    name: '',
    category: '',
    status: '',
  });

  const token = localStorage.getItem('authToken');

  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // Build the payload sent to /api/requests/addUpdate. We intentionally
  // only send overrides + the id, NOT the whole record, so the server
  // doesn't accidentally clobber fields it already has.
  const buildStatusUpdatePayload = (
    req: WorkflowRequest,
    overrides: Partial<{ status: number; rejectReason: string }>,
  ) => ({
    id: Number(req.id),
    description: req.name,
    department: req.department,
    category: req.category,
    expectedTime: req.date || null,
    likelihood: req.likelihood,
    impact: req.impact,
    postLikelihood: req.postLikelihood ?? null,
    postImpact: req.postImpact ?? null,
    occured: req.mode === 'after',
    responsibleId: req.responsibleId ?? null,
    riskId: null,
    causes: [],
    actions: [],
    strategicGoals: [],
    ...overrides,
  });

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const pendingFlag = mode === 'pending' ? 'true' : 'false';
      const url = `https://localhost:7002/api/requests?pending=${pendingFlag}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('Failed to fetch requests:', response.status);
        setData([]);
        return;
      }

      const result = await parseJsonSafe(response);
      const apiList: ApiRequest[] = Array.isArray(result) ? result : [];
      setData(apiList.map(adapt));
    } catch (error) {
      console.error('Error fetching requests:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, mode]);

  useEffect(() => {
    if (selectedRequest) {
      setEvidenceInput(selectedRequest.evidence || '');
      setRejectionReason(selectedRequest.rejectionReason || '');
    }
  }, [selectedRequest]);

  const getStatusMeta = (req: WorkflowRequest) => {
    if (req.status === 'accepted') {
      return { label: 'مقبول', color: 'bg-green-500' };
    }
    if (req.status === 'rejected') {
      return { label: 'مرفوض', color: 'bg-red-500' };
    }
    if (req.currentReviewerRole === 'admin') {
      return { label: 'بانتظار الأدمن', color: 'bg-indigo-500' };
    }
    if (req.currentReviewerRole === 'manager') {
      return { label: 'بانتظار المدير', color: 'bg-yellow-500' };
    }
    return { label: 'قيد الانتظار', color: 'bg-yellow-500' };
  };

  const filteredData = useMemo(() => {
    const result = data.filter(req => {
      return (
        (!filters.id || req.id.toLowerCase().includes(filters.id.toLowerCase())) &&
        (!filters.name || req.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.category || req.category === filters.category) &&
        (!filters.status || req.status === (filters.status as UiStatus))
      );
    });

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name, 'ar');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'ar');
        case 'id_asc':
          return a.id.localeCompare(b.id, 'en');
        case 'id_desc':
          return b.id.localeCompare(a.id, 'en');
        case 'status_asc':
          return getStatusMeta(a).label.localeCompare(getStatusMeta(b).label, 'ar');
        case 'category_asc':
          return a.category.localeCompare(b.category, 'ar');
        default:
          return 0;
      }
    });

    return sorted;
  }, [data, filters, sortBy]);

  const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));

  const closeModal = () => {
    setSelectedRequest(null);
    setRejectionReason('');
    setEvidenceInput('');
  };

  const saveRequestUpdate = async (body: any) => {
    const response = await fetch(`https://localhost:7002/api/requests/addUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return {
      ok: response.ok,
      data: await parseJsonSafe(response),
    };
  };

  const openRequestDetails = (req: WorkflowRequest) => {
    setSelectedRequest(req);
  };

  const handleInitiatorResubmit = async (payload: any) => {
    if (!selectedRequest) return;

    const requestPayload = {
      id: Number(selectedRequest.id),
      department: payload.department,
      category: payload.category,
      description: payload.name,
      expectedTime: payload.date || null,
      likelihood: payload.likelihood,
      impact: payload.impact,
      postLikelihood: payload.postLikelihood,
      postImpact: payload.postImpact,
      occured: payload.mode === 'after',
      // Resubmitting a rejected request puts it back into the manager queue.
      status: 1, // InProgress
      responsibleId:
        payload.responsibleEntityId !== '' && payload.responsibleEntityId !== undefined
          ? Number(payload.responsibleEntityId)
          : null,
      riskId: payload.riskId ?? null,
      causes: (payload.causes || []).map((cause: string) => ({
        id: 0,
        causeDescription: cause,
        custom: true,
      })),
      actions: [
        ...(payload.responseActions || []).map((action: string) => ({
          id: 0,
          actionDescription: action,
          actionType: 1,
          custom: true,
        })),
        ...(payload.preventiveActions || []).map((action: string) => ({
          id: 0,
          actionDescription: action,
          actionType: 0,
          custom: true,
        })),
      ],
      strategicGoals: payload.strategicGoal
        ? [{ id: 0, goalDescription: payload.strategicGoal }]
        : [],
    };

    const response = await fetch(`https://localhost:7002/api/requests/addUpdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestPayload),
    });

    const result = await parseJsonSafe(response);

    if (!response.ok) {
      alert(result?.message || 'فشل إعادة الإرسال');
      return;
    }

    alert(result?.message || 'تمت إعادة الإرسال');
    closeModal();
    fetchRequests();
  };

  const handleManagerSendToAdmin = async () => {
    if (!selectedRequest) return;

    const result = await saveRequestUpdate(
      buildStatusUpdatePayload(selectedRequest, { status: STATUS_FORWARD_TO_ADMIN }),
    );

    alert(result.data?.message || 'تم التحويل');
    closeModal();
    fetchRequests();
  };

  const handleManagerReject = async () => {
    if (!selectedRequest) return;

    const result = await saveRequestUpdate(
      buildStatusUpdatePayload(selectedRequest, {
        status: STATUS_REJECT,
        rejectReason: rejectionReason,
      }),
    );

    alert(result.data?.message || 'تم الرفض');
    closeModal();
    fetchRequests();
  };

  const handleAdminAccept = async () => {
    if (!selectedRequest) return;

    const result = await saveRequestUpdate(
      buildStatusUpdatePayload(selectedRequest, { status: STATUS_ACCEPT }),
    );

    alert(result.data?.message || 'تم القبول');
    closeModal();
    fetchRequests();
  };

  const handleAdminReject = async () => {
    if (!selectedRequest) return;

    const result = await saveRequestUpdate(
      buildStatusUpdatePayload(selectedRequest, {
        status: STATUS_REJECT,
        rejectReason: rejectionReason,
      }),
    );

    alert(result.data?.message || 'تم الرفض');
    closeModal();
    fetchRequests();
  };

  const canEditRejected =
    role === 'initiator' && selectedRequest?.status === 'rejected';

  // Manager actions: only when this is in the manager queue (status=InProgress).
  const showManagerActions =
    role === 'manager' &&
    selectedRequest?.status === 'pending' &&
    selectedRequest?.currentReviewerRole === 'manager';

  // Admin actions: only when manager has forwarded (status=underReview).
  const showAdminActions =
    role === 'admin' &&
    selectedRequest?.status === 'pending' &&
    selectedRequest?.currentReviewerRole === 'admin';

  const showRejectedInitiatorActions =
    role === 'initiator' && selectedRequest?.status === 'rejected';

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الطلبات...</p>
      </div>
    );
  }

  const headingTitle =
    mode === 'history' ? 'الطلبات التي تمت مراجعتها' : 'مخاطر تم طلب تسجيلها';

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-4xl font-bold mb-4 text-center">{headingTitle}</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            placeholder="رقم الطلب"
            className="border rounded px-4 py-3 text-lg"
            value={filters.id}
            onChange={e => setFilters({ ...filters, id: e.target.value })}
          />

          <input
            placeholder="اسم الخطر"
            className="border rounded px-4 py-3 text-lg"
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />

          <select
            className="border rounded px-4 py-3 text-lg"
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">كل الفئات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-4 py-3 text-lg"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">كل الحالات</option>
            {mode === 'pending' ? (
              <option value="pending">قيد الانتظار</option>
            ) : (
              <>
                <option value="accepted">مقبول</option>
                <option value="rejected">مرفوض</option>
              </>
            )}
          </select>

          <select
            className="border rounded px-4 py-3 text-lg"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
          >
            <option value="date_desc">ترتيب: الأحدث أولاً</option>
            <option value="date_asc">ترتيب: الأقدم أولاً</option>
            <option value="name_asc">ترتيب: اسم الخطر أ - ي</option>
            <option value="name_desc">ترتيب: اسم الخطر ي - أ</option>
            <option value="id_asc">ترتيب: رقم الطلب تصاعدي</option>
            <option value="id_desc">ترتيب: رقم الطلب تنازلي</option>
            <option value="status_asc">ترتيب: حسب الحالة</option>
            <option value="category_asc">ترتيب: حسب الفئة</option>
          </select>
        </div>
      </div>

      <div className="px-6 pt-4 text-right text-gray-600">
        عدد النتائج: <span className="font-bold text-gray-900">{filteredData.length}</span>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xl">
              <th className="px-6 py-4 text-center">إجراءات</th>
              <th className="px-6 py-4 text-center">الحالة</th>
              <th className="px-6 py-4 text-center">الفئة</th>
              <th className="px-6 py-4 text-center">التاريخ</th>
              <th className="px-6 py-4 text-center">الخطر</th>
              <th className="px-6 py-4 text-center">رقم الطلب</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredData.map(req => {
              const statusMeta = getStatusMeta(req);

              return (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openRequestDetails(req)}
                      className="border border-gray-400 px-6 py-2 text-lg rounded-lg hover:bg-gray-100"
                    >
                      عرض التفاصيل
                    </button>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`${statusMeta.color} text-white px-6 py-2 rounded-full text-lg font-medium`}
                    >
                      {statusMeta.label}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center text-lg">{req.category}</td>
                  <td className="px-6 py-4 text-center text-lg">{req.date}</td>
                  <td className="px-6 py-4 text-center text-lg font-medium">{req.name}</td>
                  <td className="px-6 py-4 text-center text-lg font-medium">{req.id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="p-10 text-center text-gray-500 text-lg">
          لا توجد طلبات مطابقة للفلاتر الحالية
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[1100px] max-h-[90vh] overflow-y-auto p-8 relative">
            <button onClick={closeModal} className="absolute left-4 top-4 text-3xl">
              ✕
            </button>

            <h3 className="text-3xl font-bold mb-6 text-center">تفاصيل الطلب</h3>

            <NewRequestForm
              initialData={{
                mode: selectedRequest.mode,
                category: selectedRequest.category,
                name: selectedRequest.name,
                date: selectedRequest.date,
                impact: selectedRequest.impact,
                likelihood: selectedRequest.likelihood,
                postImpact: selectedRequest.postImpact ?? 1,
                postLikelihood: selectedRequest.postLikelihood ?? 1,
                responsiblePerson: selectedRequest.responsiblePerson,
                customResponsible: selectedRequest.customResponsible ?? '',
                semester: selectedRequest.semester,
                mitigationActions: selectedRequest.mitigationActions,
              }}
              disabled={!canEditRejected}
              title="تفاصيل الطلب"
              submitLabel={canEditRejected ? 'تعديل وإعادة إرسال' : 'عرض فقط'}
              onSubmit={handleInitiatorResubmit}
              onCancel={closeModal}
            />

            {selectedRequest.rejectionReason && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-right">
                <p className="font-bold text-red-700 mb-1">سبب الرفض</p>
                <p className="text-red-800">{selectedRequest.rejectionReason}</p>
              </div>
            )}

            {(showManagerActions || showAdminActions) && (
              <div className="mt-6">
                <label className="block mb-2 text-right font-semibold">سبب الرفض</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full border rounded p-4 text-right"
                  placeholder="اكتب سبب الرفض..."
                />
              </div>
            )}

            {showManagerActions && (
              <div className="mt-6 flex gap-4 justify-center">
                <button
                  onClick={handleManagerSendToAdmin}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-lg"
                >
                  تحويل إلى الأدمن
                </button>

                <button
                  onClick={handleManagerReject}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg"
                >
                  رفض
                </button>
              </div>
            )}

            {showAdminActions && (
              <div className="mt-6 flex gap-4 justify-center">
                <button
                  onClick={handleAdminAccept}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
                >
                  قبول
                </button>

                <button
                  onClick={handleAdminReject}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg"
                >
                  رفض
                </button>
              </div>
            )}

            {showRejectedInitiatorActions && mode === 'pending' && (
              <div className="mt-6 text-center text-gray-500">
                يمكنك تعديل الطلب وإعادة إرساله من النموذج أعلاه.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsList;
