import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { normalizeUserRole } from './components/auth/authUtils';
import { STATUS_PENDING } from './utils/statusMapping';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState<UserRole>(() =>
    normalizeUserRole(localStorage.getItem('userRole'))
  );

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
              تسجيل خطر  →  posts to /api/requests/addUpdate.
              The Request stays in the "pending" list (Status=InProgress) until
              a manager forwards it (underReview) or rejects it (Rejected),
              and an admin accepts (Accepted) or rejects (Rejected).
            */}
            <Route
              path="/new-request"
              element={
                role === 'initiator' ? (
                  <NewRequestForm
                    title="تسجيل خطر"
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
                        strategicGoals: data.strategicGoal
                          ? [{ id: 0, goalDescription: data.strategicGoal }]
                          : [],
                      };

                      const response = await fetch('https://localhost:7002/api/requests/addUpdate', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify(requestPayload),
                      });

                      const result = await parseJsonSafe(response);
                      alert(result?.message || 'تم تسجيل الخطر');
                      if (response.ok) navigate('/requests');
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

            {/*
              مقترح خطر جديد  →  posts to /api/risk/addUpdate with Custom=true
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

                      const response = await fetch('https://localhost:7002/api/risk/addUpdate', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      const result = await parseJsonSafe(response);
                      alert(result?.message || 'تم إرسال المقترح');
                      if (response.ok) navigate('/requests');
                    }}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-new-risk"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="risk"
                    initialData={addNewRiskInitialData || undefined}
                    onSubmit={() => {
                      clearAddNewRiskState();
                      navigate('/requests');
                    }}
                    onCancel={() => {
                      clearAddNewRiskState();
                      navigate('/');
                    }}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-category"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="category"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-responsible"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="responsible"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-department"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="department"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-strategic-goal"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="strategicGoal"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-cause"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="cause"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-response-action"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="responseAction"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/add-preventive-action"
              element={
                role === 'admin' ? (
                  <AddNewRisk
                    initialTab="preventiveAction"
                    keepTabAfterCreate
                    onCancel={() => navigate('/')}
                  />
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

            <Route
              path="/settings"
              element={
                role === 'admin' ? (
                  <div className="bg-white rounded-lg p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-right">الإعدادات</h1>
                    <p className="text-gray-600 mt-4 text-right">صفحة الإعدادات قيد التطوير...</p>
                  </div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route path="/risk-inquiry" element={<RiskInquiryPage />} />
          </Routes>
        </div>
      </main>
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
