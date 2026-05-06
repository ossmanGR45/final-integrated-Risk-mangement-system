import React, { useEffect, useMemo, useState } from 'react';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import {
  STATUS_FORWARD_TO_ADMIN,
  STATUS_REJECT,
  suggestionStatusFromApi,
  SuggestionUiStatus,
} from '../../utils/statusMapping';

// What the backend returns for a Risk row.
interface ApiRisk {
  id: number;
  riskName?: string | null;
  riskDescription?: string | null;
  location?: string | null;
  department?: string | null;
  categoryName?: string | null;
  likelihood?: number | null;
  impact?: number | null;
  status?: number | null;
  custom?: boolean | null;
  reDirected?: boolean | null;
  userId?: number | null;
  responsibleId?: number | null;
}

// What this component renders.
export interface NewRiskProposal {
  id: string;
  riskName: string;
  riskDescription: string;
  location: string;
  department: string;
  categoryName: string;
  categoryID: number;
  impact: number;
  likelihood: number;
  score: number;
  causes?: string[];
  actions?: string[];
  strategicGoals?: string[];
  proposedBy: string;
  proposedByRole: UserRole;
  status: SuggestionUiStatus;
  rejectionReason?: string;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

interface NewRisksTabProps {
  role: UserRole;
}

const statusMap: Record<SuggestionUiStatus, { label: string; color: string }> = {
  manager_review: { label: 'بانتظار مراجعة المدير', color: 'bg-yellow-500' },
  admin_review: { label: 'بانتظار مراجعة الأدمن', color: 'bg-blue-600' },
  accepted: { label: 'مقبول', color: 'bg-green-600' },
  rejected: { label: 'مرفوض', color: 'bg-red-600' },
};

const adapt = (r: ApiRisk): NewRiskProposal => ({
  id: String(r.id),
  riskName: r.riskName || '',
  riskDescription: r.riskDescription || '',
  location: r.location || '',
  department: r.department || '',
  categoryName: r.categoryName || '',
  categoryID: 0,
  impact: r.impact || 1,
  likelihood: r.likelihood || 1,
  score: (r.impact || 1) * (r.likelihood || 1),
  causes: [],
  actions: [],
  strategicGoals: [],
  proposedBy: '',
  proposedByRole: 'initiator',
  status: suggestionStatusFromApi(r.status ?? null, r.reDirected ?? null),
  submittedDate: '',
});

const NewRisksTab: React.FC<NewRisksTabProps> = ({ role }) => {
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<NewRiskProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<NewRiskProposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    category: '',
    status: '',
  });

  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const buildPayload = (
    proposal: NewRiskProposal,
    overrides: Partial<{ status: number; rejectReason: string }>,
  ) => ({
    id: Number(proposal.id),
    department: proposal.department || '',
    riskName: proposal.riskName || '',
    riskDescription: proposal.riskDescription || '',
    categoryName: proposal.categoryName || '',
    likelihood: proposal.likelihood || 1,
    impact: proposal.impact || 1,
    location: proposal.location || '',
    actions: (proposal.actions || []).map(actionDescription => ({
      id: 0,
      actionDescription,
      actionType: 1,
      custom: true,
    })),
    causes: (proposal.causes || []).map(causeDescription => ({
      id: 0,
      causeDescription,
      custom: true,
    })),
    strategicGoals: (proposal.strategicGoals || [])
      .filter(Boolean)
      .map(() => ({ id: 0 })), // server only accepts existing ids
    ...overrides,
  });

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      // Show suggestion records: Custom=true regardless of role.
      // The backend already scopes by role, so a manager only sees their team's
      // and admin sees everything.
      const endpoint = `https://localhost:7002/api/risk?custom=true`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseJsonSafe(response);
      const apiList: ApiRisk[] = Array.isArray(data) ? data : [];
      setProposals(apiList.map(adapt));
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [role]);

  const filteredData = useMemo(() => {
    return proposals.filter(item => {
      return (
        (!filters.id || item.id.toLowerCase().includes(filters.id.toLowerCase())) &&
        (!filters.name || item.riskName.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.category || item.categoryName === filters.category) &&
        (!filters.status || item.status === (filters.status as SuggestionUiStatus))
      );
    });
  }, [proposals, filters]);

  const categories = Array.from(new Set(proposals.map(p => p.categoryName).filter(Boolean)));

  const handleManagerSendToAdmin = async () => {
    if (!selectedProposal) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://localhost:7002/api/risk/addUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          buildPayload(selectedProposal, { status: STATUS_FORWARD_TO_ADMIN }),
        ),
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(result?.message || 'فشل الإرسال');
        return;
      }

      alert(result?.message || 'تم الإرسال إلى الأدمن');
      setSelectedProposal(null);
      await fetchProposals();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الإرسال');
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://localhost:7002/api/risk/addUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          buildPayload(selectedProposal, {
            status: STATUS_REJECT,
            rejectReason: rejectionReason,
          }),
        ),
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(result?.message || 'فشل الرفض');
        return;
      }

      alert(result?.message || 'تم رفض المقترح');
      setSelectedProposal(null);
      setRejectionReason('');
      await fetchProposals();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الرفض');
    }
  };

  const handleAdminAccept = () => {
    if (!selectedProposal) return;

    // Admin-side: navigate to the full "add new risk" form so the admin
    // can fill in everything before officially accepting.
    navigate('/add-new-risk', {
      state: {
        sourceProposalId: selectedProposal.id,
        sourceProposalData: selectedProposal,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل المقترحات...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-4xl font-bold mb-4 text-center">مقترحات المخاطر الجديدة</h2>

        <div className="grid grid-cols-4 gap-3">
          <input
            placeholder="رقم المقترح"
            className="border rounded px-4 py-3 text-lg"
            onChange={e => setFilters({ ...filters, id: e.target.value })}
          />

          <input
            placeholder="اسم الخطر"
            className="border rounded px-4 py-3 text-lg"
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />

          <select
            className="border rounded px-4 py-3 text-lg"
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
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">كل الحالات</option>
            <option value="manager_review">بانتظار المدير</option>
            <option value="admin_review">بانتظار الأدمن</option>
            <option value="accepted">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xl">
              <th className="px-6 py-4 text-center">إجراءات</th>
              <th className="px-6 py-4 text-center">الحالة</th>
              <th className="px-6 py-4 text-center">الفئة</th>
              <th className="px-6 py-4 text-center">التاريخ</th>
              <th className="px-6 py-4 text-center">اسم الخطر</th>
              <th className="px-6 py-4 text-center">رقم المقترح</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredData.map(proposal => (
              <tr key={proposal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setRejectionReason('');
                    }}
                    className="border border-gray-400 px-6 py-2 text-lg rounded-lg hover:bg-gray-100"
                  >
                    عرض التفاصيل
                  </button>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`${statusMap[proposal.status]?.color || 'bg-gray-500'} text-white px-6 py-2 rounded-full text-lg font-medium`}
                  >
                    {statusMap[proposal.status]?.label || proposal.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center text-lg">{proposal.categoryName}</td>
                <td className="px-6 py-4 text-center text-lg">{proposal.submittedDate}</td>
                <td className="px-6 py-4 text-center text-lg font-medium">{proposal.riskName}</td>
                <td className="px-6 py-4 text-center text-lg font-medium">{proposal.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="p-10 text-center text-gray-500 text-lg">
          لا توجد مقترحات مطابقة للفلاتر الحالية
        </div>
      )}

      {selectedProposal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-[950px] max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => {
                setSelectedProposal(null);
                setRejectionReason('');
              }}
              className="absolute left-4 top-4 text-3xl"
            >
              ✕
            </button>

            <h3 className="text-3xl font-bold mb-8 text-center">تفاصيل المقترح</h3>

            <div className="grid grid-cols-2 gap-6 text-right">
              <div>
                <label className="block text-sm text-gray-500 mb-1">اسم الخطر</label>
                <div className="border rounded-lg p-4 bg-gray-50">{selectedProposal.riskName}</div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">موقع الخطر</label>
                <div className="border rounded-lg p-4 bg-gray-50">{selectedProposal.location}</div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm text-gray-500 mb-1 text-right">وصف الخطر</label>
              <div className="border rounded-lg p-4 bg-gray-50 text-right min-h-[120px] leading-8">
                {selectedProposal.riskDescription}
              </div>
            </div>

            {selectedProposal.rejectionReason && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-right">
                <p className="font-bold text-red-700 mb-1">سبب الرفض</p>
                <p className="text-red-800">{selectedProposal.rejectionReason}</p>
              </div>
            )}

            {(role === 'manager' && selectedProposal.status === 'manager_review') ||
            (role === 'admin' && selectedProposal.status === 'admin_review') ? (
              <div className="mt-6">
                <label className="block mb-2 text-right font-semibold">سبب الرفض</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full border rounded p-4 text-right"
                  placeholder="اكتب سبب الرفض..."
                />
              </div>
            ) : null}

            <div className="mt-6 flex gap-4 justify-center">
              {role === 'manager' && selectedProposal.status === 'manager_review' && (
                <>
                  <button
                    onClick={handleManagerSendToAdmin}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-lg"
                  >
                    تحويل إلى الأدمن
                  </button>

                  <button
                    onClick={handleReject}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg"
                  >
                    رفض المقترح
                  </button>
                </>
              )}

              {role === 'admin' && selectedProposal.status === 'admin_review' && (
                <>
                  <button
                    onClick={handleAdminAccept}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
                  >
                    قبول والمتابعة للإضافة
                  </button>

                  <button
                    onClick={handleReject}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg"
                  >
                    رفض المقترح
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRisksTab;
