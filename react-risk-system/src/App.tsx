import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NewRequestForm from './components/requests/NewRequestForm';
import RequestsListWithTabs from './components/requests/RequestsListWithTabs';
import RequestsList from './components/requests/RequestsList';
import ReviewedRecordsPage from './components/requests/ReviewedRecordsPage';
import PredefinedDataForm from './components/predefined/PredefinedDataForm';
import LoginPage from './components/auth/LoginPage';
import RiskInquiryPage from './components/inquiry/RiskInquiryPage';
import { UserRole } from './types';
import AddNewRisk from './components/admin/AddNewRisk';
import LogsPage from './components/logs/LogsPage';
import Dashboard from './components/dashboard/Dashboard';
import UsersPage from './components/admin/UsersPage';
import DataManagementPage from './components/admin/DataManagementPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import { normalizeUserRole } from './components/auth/authUtils';
import { STATUS_PENDING } from './utils/statusMapping';
import { API_BASE } from './api/http';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState<UserRole>(() =>
    normalizeUserRole(localStorage.getItem('userRole'))
  );

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const raw = localStorage.getItem('userRole');
    const next = normalizeUserRole(raw);
    if (raw !== next) {
      localStorage.setItem('userRole', next);
    }
    setRole(next);
  }, []);

  const routeState = (location.state as any) || null;
  const sourceProposalData = routeState?.sourceProposalData || null;
  const legacyAddNewRiskInitialData = routeState?.addNewRiskInitialData || null;

  const addNewRiskInitialData = useMemo(() => {
    if (legacyAddNewRiskInitialData) {
      return legacyAddNewRiskInitialData;
    }

    if (!sourceProposalData) {
      return null;
    }

    return {
      department: sourceProposalData.department || '',
      riskName: sourceProposalData.riskName || '',
      riskDescription: sourceProposalData.riskDescription || '',
      categoryID:
        sourceProposalData.categoryID !== undefined && sourceProposalData.categoryID !== null
          ? sourceProposalData.categoryID
          : '',
      categoryName: sourceProposalData.categoryName || '',
      likelihood:
        typeof sourceProposalData.likelihood === 'number' && sourceProposalData.likelihood > 0
          ? sourceProposalData.likelihood
          : 1,
      impact:
        typeof sourceProposalData.impact === 'number' && sourceProposalData.impact > 0
          ? sourceProposalData.impact
          : 1,
      responsibleId:
        sourceProposalData.responsibleId !== undefined && sourceProposalData.responsibleId !== null
          ? sourceProposalData.responsibleId
          : '',
      location: sourceProposalData.location || '',
      causes: Array.isArray(sourceProposalData.causes) ? sourceProposalData.causes : [],
      responseActions: Array.isArray(sourceProposalData.actions) ? sourceProposalData.actions : [],
      preventiveActions: Array.isArray(sourceProposalData.strategicGoals)
        ? sourceProposalData.strategicGoals
        : [],
      proposalId: sourceProposalData.id || null,
    };
  }, [legacyAddNewRiskInitialData, sourceProposalData]);

  const isAuth = localStorage.getItem('isLoggedIn');
  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const currentPage = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') navigate('/');
    else navigate(`/${page}`);
  };

  const clearAddNewRiskState = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} role={role} />
      <Header />

      <main className="mr-64 pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard key={role} />} />

            {/*
              الإبلاغ عن خطر  →  posts to /api/requests/addUpdate.
              The Request stays in the "pending" list (Status=InProgress) until
              a manager forwards it (underReview) or rejects it (Rejected),
              and an admin accepts (Accepted) or rejects (Rejected).
            */}
            <Route
              path="/new-request"
              element={
                role === 'initiator' ? (
                  <NewRequestForm
                    title="الإبلاغ عن خطر"
                    submitLabel="حفظ وإرسال"
                    onSubmit={async (data) => {
                      const requestPayload = {
                        department: data.department,
                        category: data.category,
                        description: data.name,
                        expectedTime: data.date || null,
                        likelihood: data.likelihood,
                        impact: data.impact,
                        postLikelihood: data.postLikelihood,
                        postImpact: data.postImpact,
                        occured: data.mode === 'after',
                        status: STATUS_PENDING,
                        responsibleId:
                          data.responsibleEntityId !== '' && data.responsibleEntityId !== undefined
                            ? Number(data.responsibleEntityId)
                            : null,
                        riskId: data.riskId ?? null,
                        causes: (data.causes || []).map((cause: string) => ({
                          id: 0,
                          causeDescription: cause,
                          custom: true,
                        })),
                        actions: [
                          ...(data.responseActions || []).map((action: string) => ({
                            id: 0,
                            actionDescription: action,
                            actionType: 1,
                            custom: true,
                          })),
                          ...(data.preventiveActions || []).map((action: string) => ({
                            id: 0,
                            actionDescription: action,
                            actionType: 0,
                            custom: true,
                          })),
                        ],
                        strategicGoals: data.strategicGoalsList && data.strategicGoalsList.length > 0
                          ? data.strategicGoalsList.map((g: string) => ({ id: 0, goalDescription: g }))
                          : (data.strategicGoal ? [{ id: 0, goalDescription: data.strategicGoal }] : []),
                      };

                      const response = await fetch(`${API_BASE}/requests/addUpdate`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify(requestPayload),
                      });

                      const result = await parseJsonSafe(response);
                      if (response.ok) {
                        navigate('/requests', { state: { message: result?.message || 'تم تسجيل الخطر', type: 'success' } });
                      } else {
                        showNotification(result?.message || 'فشل تسجيل الخطر', 'error');
                      }
                    }}
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/requests"
              element={<RequestsListWithTabs requests={[]} role={role} />}
            />

            <Route
              path="/add-new-risk"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialData={addNewRiskInitialData || undefined}
                    hideTabs={true}
                    onCancel={() => {
                      clearAddNewRiskState();
                      navigate('/requests');
                    }}
                    onSubmit={() => {
                      clearAddNewRiskState();
                      navigate('/requests');
                    }}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/*
              إقتراح خطر جديد  →  posts to /api/risk/addUpdate with Custom=true
              (the backend forces this for non-admin creators). Lives in the
              Risks table as a *suggestion*, surfaced in the
              "مخاطر تقترح اضافتها" tab until accepted by an admin.
            */}
            <Route
              path="/predefined"
              element={
                role === 'initiator' ? (
                  <PredefinedDataForm
                    onSubmit={async (data) => {
                      // We send the minimum the backend needs. Likelihood/Impact
                      // are placeholders the admin will refine when accepting.
                      const payload = {
                        riskName: data.riskName,
                        riskDescription: data.riskDescription,
                        location: data.location,
                        department: '',
                        categoryName: '',
                        impact: 1,
                        likelihood: 1,
                        status: STATUS_PENDING,
                        causes: [],
                        actions: [],
                        strategicGoals: [],
                      };

                      const response = await fetch(`${API_BASE}/risk/addUpdate`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      const result = await parseJsonSafe(response);
                      if (response.ok) {
                        navigate('/requests', { state: { message: result?.message || 'تم إرسال المقترح', type: 'success' } });
                      } else {
                        showNotification(result?.message || 'فشل إرسال المقترح', 'error');
                      }
                    }}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-user"
              element={
                role === 'admin' ? (
                  <UsersPage />
                ) : (
                  <Navigate to="/" />
                )
              }
            />


            <Route
              path="/manage-strategic-goal"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="strategicGoal" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-risk"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="risk" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-department"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="department" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-category"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="category" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-responsible"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="responsible" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-cause"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="cause" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-response-action"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="responseAction" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/manage-preventive-action"
              element={
                role === 'admin' ? (
                  <DataManagementPage type="preventiveAction" />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* سجلاتي — finished requests history (any authenticated user) */}
            <Route
              path="/records"
              element={<ReviewedRecordsPage role={role} />}
            />

            {/* السجلات — system audit log, admin only */}
            <Route
              path="/logs"
              element={
                role === 'admin'
                  ? <LogsPage role={role} />
                  : <Navigate to="/" />
              }
            />

            {/* المستخدمين — user management, admin only */}
            <Route
              path="/users"
              element={
                role === 'admin'
                  ? <UsersPage />
                  : <Navigate to="/" />
              }
            />

            <Route path="/risk-inquiry" element={<RiskInquiryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </div>
      </main>
      {notification && (
        <div
          className={`fixed bottom-5 left-5 z-[200] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-white border transition-all transform translate-y-0 ${
            notification.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
          }`}
        >
          {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>
  );
}

export default App;
