import React, { useEffect, useMemo, useState } from 'react';
import {
  Target,
  ChevronDown,
  Sparkles,
  FileText,
  Clock3,
  CheckCircle2,
  XCircle,
  X,
  MapPin,
  Shield
} from 'lucide-react';
import {
  calculateRiskScore,
  getRiskColor,
  getRiskLabel
} from '../../utils/riskCalculations';

type RequestItem = {
  id: string;
  name: string;
  category: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'closed';
  semester: 'first' | 'second' | 'summer';
};

type RiskItem = {
  id: number;
  riskName: string;
  riskDescription: string;
  categoryName: string;
  categoryID: number;
  location: string;
  likelihood: number;
  impact: number;
  responsibleId?: number | null;
  strategicGoals?: string[] | null;
};

type StrategicGoalItem = {
  title: string;
  count: number;
};

const API_BASE = 'https://localhost:7002/api';

const Dashboard: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGoals, setShowGoals] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<StrategicGoalItem | null>(null);

  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem('authToken');

        const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [requestsRes, risksRes] = await Promise.all([
          fetch(`${API_BASE}/requests`, { headers: authHeaders }),
          fetch(`${API_BASE}/risk`, { headers: authHeaders }),
        ]);

        const requestsData = await parseJsonSafe(requestsRes);
        const risksData = await parseJsonSafe(risksRes);

        // The backend returns Status as a numeric enum (0..3). Map it to the
        // string form the rest of this component already uses.
        // RequestStatus: Rejected=0, InProgress=1, underReview=2, Accepted=3
        const mapped = (Array.isArray(requestsData) ? requestsData : []).map((r: any) => {
          let statusStr: 'pending' | 'accepted' | 'rejected' | 'closed' = 'pending';
          if (r.status === 3) statusStr = 'accepted';
          else if (r.status === 0) statusStr = 'rejected';
          else statusStr = 'pending';
          return { ...r, status: statusStr };
        });

        setRequests(mapped);
        setRisks(Array.isArray(risksData) ? risksData : []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setRequests([]);
        setRisks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedGoal(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      inProgress: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  }, [requests]);

  const strategicGoals = useMemo(() => {
    const goalsMap = new Map<string, number>();

    risks.forEach(risk => {
      const goals = Array.isArray(risk.strategicGoals) ? risk.strategicGoals : [];

      goals.forEach(goal => {
        const cleanGoal = goal.trim();
        if (!cleanGoal) return;
        goalsMap.set(cleanGoal, (goalsMap.get(cleanGoal) || 0) + 1);
      });
    });

    return Array.from(goalsMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.title.localeCompare(b.title, 'ar');
      });
  }, [risks]);

  const selectedGoalRisks = useMemo(() => {
    if (!selectedGoal) return [];

    return risks
      .filter(risk => {
        const goals = Array.isArray(risk.strategicGoals) ? risk.strategicGoals : [];
        return goals.some(goal => goal.trim() === selectedGoal.title.trim());
      })
      .sort((a, b) => {
        const scoreA = calculateRiskScore(a.impact, a.likelihood);
        const scoreB = calculateRiskScore(b.impact, b.likelihood);
        return scoreB - scoreA;
      });
  }, [risks, selectedGoal]);

  const totalStrategicGoals = strategicGoals.length;

  const StatCard = ({
    title,
    value,
    icon,
    color,
    borderColor
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
  }) => (
    <div
      className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 border-r-[6px] ${borderColor} hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between">
        <div className={`${color} p-3 rounded-2xl shadow-sm`}>{icon}</div>

        <div className="text-right">
          <p className="text-gray-500 text-sm mb-2 font-medium">{title}</p>
          <p className="text-4xl font-black text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-gray-200 rounded w-48 mr-auto"></div>
            <div className="h-12 bg-gray-200 rounded-2xl w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
              <div className="h-28 bg-gray-100 rounded-2xl"></div>
              <div className="h-28 bg-gray-100 rounded-2xl"></div>
              <div className="h-28 bg-gray-100 rounded-2xl"></div>
              <div className="h-28 bg-gray-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-[1px] shadow-lg">
          <div className="bg-white rounded-[27px] p-3">
            <button
              type="button"
              onClick={() => setShowGoals(prev => !prev)}
              className="w-full rounded-[24px] bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 text-white px-6 py-6 hover:opacity-95 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div
                  className={`flex items-center gap-3 transition-transform ${
                    showGoals ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown size={26} />
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <span className="bg-white/15 text-white text-sm px-3 py-1 rounded-full font-bold">
                      {totalStrategicGoals} غاية
                    </span>
                    <Sparkles size={18} />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black">
                    الغايات الإستراتيجية
                  </h2>

                  <p className="text-blue-100 mt-2 text-sm md:text-base">
                    كبسة واحدة تعرض كل الغايات الإستراتيجية المرتبطة بالمخاطر المسجلة
                  </p>
                </div>

                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center shrink-0">
                  <Target size={30} />
                </div>
              </div>
            </button>

            {showGoals && (
              <div className="mt-4 rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 md:p-8">
                {strategicGoals.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                      <Target size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      لا توجد غايات إستراتيجية حالياً
                    </h3>
                    <p className="text-gray-500">
                      بمجرد وجود غايات مرتبطة بالمخاطر ستظهر هنا تلقائيًا
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="hidden md:flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                          اكبس على أي غاية لعرض الأخطار المرتبطة بها
                        </span>
                      </div>

                      <div className="text-right">
                        <h3 className="text-2xl font-black text-gray-900">
                          جميع الغايات الإستراتيجية
                        </h3>
                        <p className="text-gray-500 mt-1">
                          مرتبة بشكل جميل وواضح لسهولة الاستعراض
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {strategicGoals.map((goal, index) => (
                        <button
                          key={`${goal.title}-${index}`}
                          type="button"
                          onClick={() => setSelectedGoal(goal)}
                          className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-right"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500"></div>

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                ظهر {goal.count} مرة
                              </span>
                            </div>

                            <div className="text-right flex-1">
                              <div className="flex items-center justify-end gap-2 mb-3">
                                <span className="text-sm text-gray-400 font-bold">
                                  #{index + 1}
                                </span>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
                                  <Target size={18} />
                                </div>
                              </div>

                              <p className="text-gray-900 font-bold leading-8 text-lg">
                                {goal.title}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-bold">
                الطلبات: {stats.total}
              </div>
              <div className="px-4 py-2 rounded-2xl bg-cyan-50 text-cyan-700 font-bold">
                الغايات: {totalStrategicGoals}
              </div>
              <div className="px-4 py-2 rounded-2xl bg-purple-50 text-purple-700 font-bold">
                المخاطر: {risks.length}
              </div>
            </div>

            <div className="text-right">
              <p className="text-gray-500 mb-2">
                عرض مرتب وسريع لأهم مؤشرات النظام
              </p>
              <h1 className="text-4xl font-black text-gray-900">
                لوحة المعلومات
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الطلبات"
            value={stats.total}
            icon={<FileText className="text-white" size={24} />}
            color="bg-blue-600"
            borderColor="border-blue-600"
          />

          <StatCard
            title="قيد العمل"
            value={stats.inProgress}
            icon={<Clock3 className="text-white" size={24} />}
            color="bg-purple-600"
            borderColor="border-purple-600"
          />

          <StatCard
            title="الطلبات المقبولة"
            value={stats.accepted}
            icon={<CheckCircle2 className="text-white" size={24} />}
            color="bg-green-600"
            borderColor="border-green-600"
          />

          <StatCard
            title="الطلبات المرفوضة"
            value={stats.rejected}
            icon={<XCircle className="text-white" size={24} />}
            color="bg-red-600"
            borderColor="border-red-600"
          />
        </div>
      </div>

      {selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="w-11 h-11 rounded-2xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
              >
                <X size={22} />
              </button>

              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-bold">
                    {selectedGoalRisks.length} خطر
                  </span>
                  <Target size={18} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  {selectedGoal.title}
                </h3>
                <p className="text-gray-500 mt-1">
                  جميع الأخطار التي تؤثر على هذه الغاية الإستراتيجية
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-96px)] bg-gray-50">
              {selectedGoalRisks.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Target size={26} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    لا توجد أخطار مرتبطة بهذه الغاية
                  </h4>
                  <p className="text-gray-500">
                    لم يتم العثور على أخطار مرتبطة بها حاليًا
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {selectedGoalRisks.map((risk, index) => {
                    const score = calculateRiskScore(risk.impact, risk.likelihood);

                    return (
                      <div
                        key={`${risk.id}-${index}`}
                        className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div
                            className={`${getRiskColor(
                              score
                            )} text-white px-3 py-1.5 rounded-xl text-sm font-bold`}
                          >
                            {getRiskLabel(score)}
                          </div>

                          <div className="text-right flex-1">
                            <p className="text-xs text-gray-400 mb-1">#{risk.id}</p>
                            <h4 className="text-xl font-black text-gray-900 leading-8">
                              {risk.riskName}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {risk.categoryName}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-right">
                            <p className="text-sm text-gray-500 mb-2">وصف الخطر</p>
                            <p className="text-gray-800 leading-7">
                              {risk.riskDescription || 'لا يوجد وصف'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
                              <p className="text-sm text-blue-700 mb-1">درجة الخطر</p>
                              <p className="text-2xl font-black text-blue-900">{score}</p>
                            </div>

                            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center">
                              <p className="text-sm text-gray-500 mb-1">الاحتمالية / الأثر</p>
                              <p className="text-lg font-black text-gray-900">
                                {risk.likelihood} / {risk.impact}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <span className="text-right">{risk.location || 'غير محدد'}</span>
                            <MapPin size={17} />
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Shield size={14} />
                              <span>خطر مرتبط بهذه الغاية</span>
                            </div>

                            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold">
                              {selectedGoal.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;