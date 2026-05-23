import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Target, ChevronDown, Sparkles, FileText, Clock3,
  CheckCircle2, XCircle, X, MapPin, User, Activity
} from 'lucide-react';
import { calculateRiskScore, getRiskColor, getRiskLabel } from '../../utils/riskCalculations';
import RiskDetailModal, { RiskFull, ResponsibleEntity } from '../shared/RiskDetailModal';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

type RequestItem = {
  id: string;
  name: string;
  category: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'closed';
  semester: 'first' | 'second' | 'summer';
};

type StrategicGoalItem = {
  id: number;
  title: string;
  count: number;
};

// -- Raw risk types for normalizing API data --
interface RiskActionMappingDto {
  action?: { actionDescription?: string | null; actionType?: unknown } | null;
}
interface RiskCauseMappingDto {
  cause?: { causeDescription?: string | null } | null;
}
interface RiskGoalMappingDto {
  strategicGoal?: { goalDescription?: string | null } | null;
}
type RawRisk = {
  id?: unknown; riskName?: unknown; riskDescription?: unknown; location?: unknown;
  likelihood?: unknown; impact?: unknown; custom?: unknown; userId?: unknown;
  categoryName?: unknown; categoryID?: unknown; responsibleId?: unknown; department?: unknown;
  strategicGoals?: unknown; riskActions?: unknown; riskCauses?: unknown; riskGoals?: unknown;
  riskactions?: unknown; riskcauses?: unknown; riskgoals?: unknown;
  status?: unknown; Status?: unknown;
  RiskActions?: RiskActionMappingDto[] | null;
  RiskCauses?: RiskCauseMappingDto[] | null;
  RiskGoals?: RiskGoalMappingDto[] | null;
};

const API_BASE = 'http://localhost:7002/api';

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map(i => i.trim()).filter(Boolean);
};

const extractActionDescriptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (!item || typeof item !== 'object') return '';
    const action = (item as RiskActionMappingDto).action;
    return typeof action?.actionDescription === 'string' ? action.actionDescription.trim() : '';
  }).filter(Boolean);
};

const splitMappedActionsByType = (value: unknown): { reduction: string[]; avoidance: string[] } => {
  if (!Array.isArray(value)) return { reduction: [], avoidance: [] };
  const reduction: string[] = [];
  const avoidance: string[] = [];
  value.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const action = (item as RiskActionMappingDto).action;
    const desc = typeof action?.actionDescription === 'string' ? action.actionDescription.trim() : '';
    if (!desc) return;
    const t = action?.actionType;
    if (t === 0 || t === '0' || t === 'Avoidance') { avoidance.push(desc); return; }
    reduction.push(desc);
  });
  return { reduction, avoidance };
};

const extractCauseDescriptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (!item || typeof item !== 'object') return '';
    const cause = (item as RiskCauseMappingDto).cause;
    return typeof cause?.causeDescription === 'string' ? cause.causeDescription.trim() : '';
  }).filter(Boolean);
};

const extractGoalDescriptions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (!item || typeof item !== 'object') return '';
    const goal = (item as RiskGoalMappingDto).strategicGoal;
    return typeof goal?.goalDescription === 'string' ? goal.goalDescription.trim() : '';
  }).filter(Boolean);
};

const normalizeRisk = (risk: RawRisk): RiskFull => {
  const rawActions = risk.riskActions ?? risk.riskactions ?? risk.RiskActions;
  const rawCauses = risk.riskCauses ?? risk.riskcauses ?? risk.RiskCauses;
  const rawGoals = risk.riskGoals ?? risk.riskgoals ?? risk.RiskGoals;

  const directActions = toStringArray(rawActions);
  const directCauses = toStringArray(rawCauses);
  const directGoals = toStringArray(rawGoals);

  const mappedByType = splitMappedActionsByType(rawActions);
  const mappedActions = mappedByType.reduction.length > 0 ? mappedByType.reduction : extractActionDescriptions(rawActions);
  const mappedCauses = extractCauseDescriptions(rawCauses);
  const mappedGoals = extractGoalDescriptions(rawGoals);

  return {
    id: Number(risk.id ?? 0),
    riskName: String(risk.riskName ?? ''),
    riskDescription: String(risk.riskDescription ?? ''),
    location: String(risk.location ?? ''),
    likelihood: Number(risk.likelihood ?? 0),
    impact: Number(risk.impact ?? 0),
    custom: Boolean(risk.custom),
    userId: Number(risk.userId ?? 0),
    categoryName: String(risk.categoryName ?? ''),
    categoryID: Number(risk.categoryID ?? 0),
    responsibleId: Number(risk.responsibleId ?? 0),
    department: String(risk.department ?? ''),
    riskCauses: directCauses.length > 0 ? directCauses : mappedCauses,
    riskActions: directActions.length > 0 ? directActions : mappedActions,
    riskGoals: directGoals.length > 0 ? directGoals : (mappedGoals.length > 0 ? mappedGoals : mappedByType.avoidance),
    strategicGoals: toStringArray(risk.strategicGoals),
  };
};

const Dashboard: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [risks, setRisks] = useState<RiskFull[]>([]);
  const [responsibleEntities, setResponsibleEntities] = useState<ResponsibleEntity[]>([]);
  const [allStrategicGoals, setAllStrategicGoals] = useState<{ id: number, title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGoals, setShowGoals] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<StrategicGoalItem | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskFull | null>(null);
  const [rawRisksData, setRawRisksData] = useState<RawRisk[]>([]);
  const [heatmapHover, setHeatmapHover] = useState<[number, number, number] | null>(null);

  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return [];
    try { return JSON.parse(text); } catch { return []; }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [requestsRes, risksRes, respRes, goalsRes] = await Promise.all([
          fetch(`${API_BASE}/requests`, { headers: authHeaders }),
          fetch(`${API_BASE}/risk?include=RiskActions.Action,RiskCauses.Cause,RiskGoals.StrategicGoal`, { headers: authHeaders }),
          fetch(`${API_BASE}/responsible`, { headers: authHeaders }),
          fetch(`${API_BASE}/strategicgoal`, { headers: authHeaders }),
        ]);

        const requestsData = await parseJsonSafe(requestsRes);
        const risksData = await parseJsonSafe(risksRes);
        const respData = await parseJsonSafe(respRes);
        const goalsData = await parseJsonSafe(goalsRes);

        const mapped = (Array.isArray(requestsData) ? requestsData : []).map((r: any) => {
          let statusStr: 'pending' | 'accepted' | 'rejected' | 'closed' = 'pending';
          if (r.status === 3) statusStr = 'accepted';
          else if (r.status === 0) statusStr = 'rejected';
          else statusStr = 'pending';
          return { ...r, status: statusStr };
        });

        const mappedGoals = (Array.isArray(goalsData) ? goalsData : []).map((g: any) => ({
          id: g.id,
          title: g.goalDescription || g.name || g.title || ''
        })).filter(g => g.title);

        setRequests(mapped);
        const risksArr = Array.isArray(risksData) ? risksData : [];
        setRawRisksData(risksArr);
        setRisks(risksArr.map(normalizeRisk));
        setResponsibleEntities(Array.isArray(respData) ? respData : []);
        setAllStrategicGoals(mappedGoals);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setRequests([]);
        setRisks([]);
        setAllStrategicGoals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedRisk) setSelectedRisk(null);
        else setSelectedGoal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedRisk]);

  const stats = useMemo(() => ({
    total: requests.length,
    inProgress: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  const strategicGoals = useMemo(() => {
    const goalsMap = new Map<string, { id: number, title: string, count: number }>();
    
    // Initialize map with all known strategic goals
    allStrategicGoals.forEach(g => {
      goalsMap.set(g.title.trim(), { id: g.id, title: g.title.trim(), count: 0 });
    });

    // Count risks for each goal
    risks.forEach(risk => {
        const goals = Array.isArray(risk.strategicGoals) ? risk.strategicGoals : [];
        const riskGoals = Array.isArray(risk.riskGoals) ? risk.riskGoals : [];
        
        const allAssociatedGoals = Array.from(new Set([...goals, ...riskGoals]));
        
        allAssociatedGoals.forEach(goal => {
        const clean = goal.trim();
        if (!clean) return;
        
        if (goalsMap.has(clean)) {
          const entry = goalsMap.get(clean)!;
          entry.count += 1;
          goalsMap.set(clean, entry);
        } else {
          // Fallback if risk has a goal not in the database (should not happen ideally)
          goalsMap.set(clean, { id: goalsMap.size + 1000, title: clean, count: 1 });
        }
      });
    });

    return Array.from(goalsMap.values())
      .sort((a, b) => b.count !== a.count ? b.count - a.count : a.title.localeCompare(b.title, 'ar'));
  }, [risks, allStrategicGoals]);

  const selectedGoalRisks = useMemo(() => {
    if (!selectedGoal) return [];
    return risks
      .filter(risk => {
        const goals = Array.isArray(risk.strategicGoals) ? risk.strategicGoals : [];
        const riskGoals = Array.isArray(risk.riskGoals) ? risk.riskGoals : [];
        return [...goals, ...riskGoals].some(g => g.trim() === selectedGoal.title.trim());
      })
      .sort((a, b) => calculateRiskScore(b.impact, b.likelihood) - calculateRiskScore(a.impact, a.likelihood));
  }, [risks, selectedGoal]);

  const totalStrategicGoals = strategicGoals.length;

  const getResponsibleEntity = useCallback((responsibleId: number) =>
    responsibleEntities.find(e => e.id === responsibleId),
  [responsibleEntities]);

  // ─── Reports: Derived Chart Data ───────────────────────────────────

  const CHART_COLORS = {
    blue: '#3b82f6', green: '#22c55e', purple: '#8b5cf6', red: '#ef4444',
    amber: '#f59e0b', teal: '#0ea5e9', indigo: '#6366f1', pink: '#ec4899',
    cyan: '#06b6d4',
  };

  // Status labels for risk Status enum
  const STATUS_LABELS: Record<number, string> = {
    0: 'مرفوضة', 1: 'قيد العمل', 2: 'قيد المراجعة', 3: 'مقبولة',
  };
  const STATUS_COLORS: Record<number, string> = {
    0: CHART_COLORS.red, 1: CHART_COLORS.amber, 2: CHART_COLORS.teal, 3: CHART_COLORS.green,
  };

  // 3. Risks by Status
  const risksByStatus = useMemo(() => {
    const counts: Record<number, number> = {};
    rawRisksData.forEach(r => {
      const s = Number(r.status ?? r.Status ?? 1);
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({
        name: STATUS_LABELS[Number(key)] || `حالة ${key}`,
        value: count,
        color: STATUS_COLORS[Number(key)] || CHART_COLORS.blue,
      }))
      .sort((a, b) => b.value - a.value);
  }, [rawRisksData]);

  // 4. Mitigation Type Split
  const mitigationSplit = useMemo(() => {
    let reduction = 0;
    let avoidance = 0;
    rawRisksData.forEach(r => {
      const rawActions = r.riskActions ?? r.riskactions ?? r.RiskActions;
      if (!Array.isArray(rawActions)) return;
      rawActions.forEach((item: any) => {
        if (!item || typeof item !== 'object') return;
        const action = item.action ?? item.Action;
        if (!action) return;
        const t = action.actionType ?? action.ActionType;
        if (t === 0 || t === '0' || t === 'Avoidance') avoidance++;
        else reduction++;
      });
    });
    return [
      { name: 'تخفيض', value: reduction, color: CHART_COLORS.indigo },
      { name: 'تجنب', value: avoidance, color: CHART_COLORS.pink },
    ];
  }, [rawRisksData]);

  const mitigationTotal = mitigationSplit[0].value + mitigationSplit[1].value;

  // 5. Risk Count by Category
  const risksByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach(r => {
      const cat = r.categoryName || 'غير مصنف';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [risks]);

  const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#0ea5e9', '#22d3ee', '#14b8a6', '#f59e0b', '#ef4444'];

  // 6. Dept Risk Profile
  const deptProfile = useMemo(() => {
    const deptMap: Record<string, { risks: number; incidents: number; resolved: number }> = {};
    risks.forEach(r => {
      const d = r.department || 'غير محدد';
      if (!deptMap[d]) deptMap[d] = { risks: 0, incidents: 0, resolved: 0 };
      deptMap[d].risks++;
    });
    requests.forEach((r: any) => {
      const d = r.department || 'غير محدد';
      if (!deptMap[d]) deptMap[d] = { risks: 0, incidents: 0, resolved: 0 };
      deptMap[d].incidents++;
      if (r.status === 'accepted') deptMap[d].resolved++;
    });
    return Object.entries(deptMap).map(([dept, v]) => ({ dept, ...v }));
  }, [risks, requests]);

  // 7. Trend Data (half-year)
  const trendData = useMemo(() => {
    const buckets: Record<string, { submitted: number; accepted: number; rejected: number }> = {};
    requests.forEach((r: any) => {
      const raw = r.year || r.Year || r.date;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const half = d.getMonth() < 6 ? 'H1' : 'H2';
      const key = `${half} ${d.getFullYear()}`;
      if (!buckets[key]) buckets[key] = { submitted: 0, accepted: 0, rejected: 0 };
      buckets[key].submitted++;
      if (r.status === 'accepted') buckets[key].accepted++;
      if (r.status === 'rejected') buckets[key].rejected++;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => {
        const [ha, ya] = a.split(' ');
        const [hb, yb] = b.split(' ');
        const va = Number(ya) * 2 + (ha === 'H2' ? 1 : 0);
        const vb = Number(yb) * 2 + (hb === 'H2' ? 1 : 0);
        return va - vb;
      })
      .map(([period, v]) => ({ period, ...v }));
  }, [requests]);

  // KPI delta: compare last two periods
  const kpiDelta = useMemo(() => {
    if (trendData.length < 2) return null;
    const curr = trendData[trendData.length - 1].submitted;
    const prev = trendData[trendData.length - 2].submitted;
    if (prev === 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { pct: Math.abs(pct), up: pct >= 0, prevLabel: trendData[trendData.length - 2].period };
  }, [trendData]);

  // 8. Heatmap Data
  const heatmapGrid = useMemo(() => {
    const grid: Record<string, number> = {};
    risks.forEach(r => {
      const l = r.likelihood;
      const i = r.impact;
      if (l >= 1 && l <= 5 && i >= 1 && i <= 5) {
        const key = `${l}-${i}`;
        grid[key] = (grid[key] || 0) + 1;
      }
    });
    return grid;
  }, [risks]);

  const getHeatColor = (count: number) => {
    if (!count) return '#f1f5f9';
    if (count <= 2) return '#bfdbfe';
    if (count <= 4) return '#3b82f6';
    if (count <= 6) return '#f59e0b';
    if (count <= 8) return '#ef4444';
    return '#991b1b';
  };

  const getHeatTextColor = (count: number) => {
    if (!count) return '#94a3b8';
    if (count <= 2) return '#1e40af';
    return '#ffffff';
  };

  const getHeatLabel = (l: number, i: number) => {
    const s = l * i;
    if (s <= 4) return { text: 'منخفض', color: '#3b82f6' };
    if (s <= 8) return { text: 'متوسط', color: '#0ea5e9' };
    if (s <= 12) return { text: 'مرتفع', color: '#f59e0b' };
    if (s <= 16) return { text: 'حرج', color: '#ef4444' };
    return { text: 'خطر شديد', color: '#991b1b' };
  };

  // Custom tooltip for recharts
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-200" style={{ direction: 'rtl' }}>
        {label && <div className="text-gray-500 text-xs mb-1">{label}</div>}
        {payload.map((p: any, i: number) => (
          <div key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color, borderColor }: {
    title: string; value: number; icon: React.ReactNode; color: string; borderColor: string;
  }) => (
    <div className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 border-r-[6px] ${borderColor} hover:shadow-md transition-all`}>
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
        {/* Strategic Goals Section */}
        <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-[1px] shadow-lg">
          <div className="bg-white rounded-[27px] p-3">
            <button
              type="button"
              onClick={() => setShowGoals(prev => !prev)}
              className="w-full rounded-[24px] bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 text-white px-6 py-6 hover:opacity-95 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className={`flex items-center gap-3 transition-transform ${showGoals ? 'rotate-180' : ''}`}>
                  <ChevronDown size={26} />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-3 mb-2">
                    <span className="bg-white/15 text-white text-sm px-3 py-1 rounded-full font-bold">{totalStrategicGoals} غاية</span>
                    <Sparkles size={18} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black">الغايات الإستراتيجية</h2>
                  <p className="text-blue-100 mt-2 text-sm md:text-base">كبسة واحدة تعرض كل الغايات الإستراتيجية المرتبطة بالمخاطر المسجلة</p>
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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700"><Target size={28} /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد غايات إستراتيجية حالياً</h3>
                    <p className="text-gray-500">قم بإضافة غايات إستراتيجية للنظام لكي تظهر هنا</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="hidden md:flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">اكبس على أي غاية لعرض الأخطار المرتبطة بها</span>
                      </div>
                      <div className="text-right">
                        <h3 className="text-2xl font-black text-gray-900">جميع الغايات الإستراتيجية</h3>
                        <p className="text-gray-500 mt-1">مرتبة بشكل جميل وواضح لسهولة الاستعراض</p>
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

                          {/* Risk count badge - prominent in corner */}
                          <div className="absolute top-3 left-3 w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg font-black text-lg">
                            {goal.count}
                          </div>

                          <div className="flex items-start justify-end gap-4">
                            <div className="text-right flex-1">
                              <div className="flex items-center justify-end gap-2 mb-3">
                                <span className="text-sm text-gray-400 font-bold">#{index + 1}</span>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
                                  <Target size={18} />
                                </div>
                              </div>
                              <p className="text-gray-900 font-bold leading-8 text-lg">{goal.title}</p>
                              <p className="text-sm text-gray-400 mt-2">
                                {goal.count === 1 ? 'خطر واحد مرتبط' : `${goal.count} مخاطر مرتبطة`}
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

        {/* Stats Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-bold">الطلبات: {stats.total}</div>
              <div className="px-4 py-2 rounded-2xl bg-cyan-50 text-cyan-700 font-bold">الغايات: {totalStrategicGoals}</div>
              <div className="px-4 py-2 rounded-2xl bg-purple-50 text-purple-700 font-bold">المخاطر: {risks.length}</div>
            </div>
            <div className="text-right">
              <p className="text-gray-500 mb-2">عرض مرتب وسريع لأهم مؤشرات النظام</p>
              <h1 className="text-4xl font-black text-gray-900">لوحة المعلومات</h1>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="إجمالي الطلبات" value={stats.total} icon={<FileText className="text-white" size={24} />} color="bg-blue-600" borderColor="border-blue-600" />
          <StatCard title="قيد العمل" value={stats.inProgress} icon={<Clock3 className="text-white" size={24} />} color="bg-purple-600" borderColor="border-purple-600" />
          <StatCard title="الطلبات المقبولة" value={stats.accepted} icon={<CheckCircle2 className="text-white" size={24} />} color="bg-green-600" borderColor="border-green-600" />
          <StatCard title="الطلبات المرفوضة" value={stats.rejected} icon={<XCircle className="text-white" size={24} />} color="bg-red-600" borderColor="border-red-600" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ██  REPORTS & ANALYTICS SECTION                             ██ */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* 1. Section Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-12 rounded-full" style={{ background: 'linear-gradient(180deg, #0ea5e9, #3b82f6)' }} />
            <div>
              <div className="text-xs font-bold tracking-widest text-cyan-600 uppercase" style={{ fontFamily: 'monospace' }}>Analytics</div>
              <h2 className="text-3xl font-black text-gray-900">التقارير والإحصائيات</h2>
            </div>
            {trendData.length > 0 && (
              <div className="mr-auto">
                <div className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-cyan-700" style={{ fontFamily: 'monospace' }}>
                  ● {trendData[trendData.length - 1].period}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. KPI Cards Row (reusing same stat data + delta on total) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* إجمالي الطلبات — with delta */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 border-r-[6px] border-blue-600 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-sm"><FileText className="text-white" size={24} /></div>
              <div className="text-right">
                <p className="text-gray-500 text-sm mb-2 font-medium">إجمالي الطلبات</p>
                <p className="text-4xl font-black text-gray-900">{stats.total}</p>
                {kpiDelta && (
                  <p className={`text-xs mt-2 font-bold ${kpiDelta.up ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'monospace' }}>
                    {kpiDelta.up ? '▲' : '▼'} {kpiDelta.pct}% مقارنة بـ {kpiDelta.prevLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
          <StatCard title="قيد العمل" value={stats.inProgress} icon={<Clock3 className="text-white" size={24} />} color="bg-purple-600" borderColor="border-purple-600" />
          <StatCard title="الطلبات المقبولة" value={stats.accepted} icon={<CheckCircle2 className="text-white" size={24} />} color="bg-green-600" borderColor="border-green-600" />
          <StatCard title="الطلبات المرفوضة" value={stats.rejected} icon={<XCircle className="text-white" size={24} />} color="bg-red-600" borderColor="border-red-600" />
        </div>

        {/* 3 & 4. Status Bar Chart + Mitigation Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Risks by Status */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-right mb-1">المخاطر حسب الحالة</h3>
            <p className="text-gray-400 text-xs text-right mb-4" style={{ fontFamily: 'monospace' }}>Risks by Status</p>
            {risksByStatus.length === 0 ? (
              <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={risksByStatus} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3f4f620' }} />
                    <Bar dataKey="value" name="العدد" radius={[8, 8, 0, 0]}>
                      {risksByStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-2 flex-wrap mt-4 justify-end">
                  {risksByStatus.map(s => (
                    <div key={s.name} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${s.color}15`, border: `1px solid ${s.color}44`, color: s.color }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
                      {s.name}: <strong style={{ fontFamily: 'monospace' }}>{s.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 4. Mitigation Type Split */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-right mb-1">أنواع الإجراءات التخفيفية</h3>
            <p className="text-gray-400 text-xs text-right mb-4" style={{ fontFamily: 'monospace' }}>Mitigation Type Split</p>
            {mitigationTotal === 0 ? (
              <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
            ) : (
              <div className="flex items-center justify-center gap-8" style={{ height: 220 }}>
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={mitigationSplit} cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270}>
                      {mitigationSplit.map((m, i) => <Cell key={i} fill={m.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-5">
                  {mitigationSplit.map(m => (
                    <div key={m.name} className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-gray-500">{m.name}</span>
                        <div className="w-3 h-3 rounded" style={{ background: m.color }} />
                      </div>
                      <div className="text-3xl font-black text-right" style={{ color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
                      <div className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        {mitigationTotal > 0 ? Math.round((m.value / mitigationTotal) * 100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5 & 6. Category Bars + Dept Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 5. Risk Count by Category */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-right mb-1">المخاطر حسب الفئة</h3>
            <p className="text-gray-400 text-xs text-right mb-4" style={{ fontFamily: 'monospace' }}>Risk Count by Category</p>
            {risksByCategory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, risksByCategory.length * 46)}>
                <BarChart data={risksByCategory} layout="vertical" barSize={22} margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f3f4f610' }} />
                  <Bar dataKey="count" name="عدد المخاطر" radius={[0, 8, 8, 0]}>
                    {risksByCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 6. Dept Risk Profile */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-right mb-1">ملف الأقسام</h3>
            <p className="text-gray-400 text-xs text-right mb-4" style={{ fontFamily: 'monospace' }}>Dept Risk Profile</p>
            {deptProfile.length === 0 ? (
              <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={deptProfile} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="dept" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="مخاطر" dataKey="risks" stroke={CHART_COLORS.indigo} fill={CHART_COLORS.indigo} fillOpacity={0.2} strokeWidth={1.5} />
                  <Radar name="حوادث" dataKey="incidents" stroke={CHART_COLORS.pink} fill={CHART_COLORS.pink} fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name="محلولة" dataKey="resolved" stroke={CHART_COLORS.green} fill={CHART_COLORS.green} fillOpacity={0.15} strokeWidth={1.5} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 7. Risk Submission Trend */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-right mb-1">اتجاه تقديم المخاطر (كل نصف سنة)</h3>
          <p className="text-gray-400 text-xs text-right mb-4" style={{ fontFamily: 'monospace' }}>Risk Submission Trend — Semi-Annual</p>
          {trendData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا توجد بيانات كافية</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ right: 10 }}>
                  <defs>
                    <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAccepted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="submitted" name="مُقدَّمة" stroke={CHART_COLORS.indigo} fill="url(#gradSubmitted)" strokeWidth={2.5} dot={{ r: 5, fill: CHART_COLORS.indigo }} activeDot={{ r: 7 }} />
                  <Area type="monotone" dataKey="accepted" name="مقبولة" stroke={CHART_COLORS.green} fill="url(#gradAccepted)" strokeWidth={2.5} dot={{ r: 5, fill: CHART_COLORS.green }} activeDot={{ r: 7 }} />
                  <Area type="monotone" dataKey="rejected" name="مرفوضة" stroke={CHART_COLORS.red} fill="url(#gradRejected)" strokeWidth={2.5} dot={{ r: 5, fill: CHART_COLORS.red }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Period detail cards */}
              <div className="flex gap-3 mt-5 overflow-x-auto pb-2">
                {trendData.map((d, idx) => {
                  const rate = d.submitted > 0 ? Math.round((d.accepted / d.submitted) * 100) : 0;
                  const isLatest = idx === trendData.length - 1;
                  const prevD = idx > 0 ? trendData[idx - 1] : null;
                  const diff = prevD ? d.submitted - prevD.submitted : null;
                  return (
                    <div key={d.period} className={`min-w-[160px] flex-shrink-0 p-4 rounded-2xl border transition-all ${
                      isLatest ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-xs font-bold mb-2 ${isLatest ? 'text-cyan-700' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>{d.period}</div>
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="text-[10px] text-gray-400">مُقدَّمة</div>
                          <div className="text-xl font-black" style={{ color: CHART_COLORS.indigo, fontFamily: 'monospace' }}>{d.submitted}</div>
                        </div>
                        <div className="text-left">
                          <div className="text-[10px] text-gray-400">مقبولة</div>
                          <div className="text-xl font-black" style={{ color: CHART_COLORS.green, fontFamily: 'monospace' }}>{d.accepted}</div>
                        </div>
                      </div>
                      {/* Approval rate bar */}
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">نسبة القبول</span>
                          <span className="text-[10px] font-bold" style={{ color: CHART_COLORS.green, fontFamily: 'monospace' }}>{rate}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-gray-200">
                          <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: `hsl(${rate * 1.2}, 65%, 48%)` }} />
                        </div>
                      </div>
                      <div className="text-[10px] text-red-500" style={{ fontFamily: 'monospace' }}>✕ {d.rejected} مرفوضة</div>
                      {diff !== null && (
                        <div className={`mt-1.5 text-[10px] ${diff >= 0 ? 'text-cyan-600' : 'text-red-500'}`} style={{ fontFamily: 'monospace' }}>
                          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)} عن الفترة السابقة
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 8. Risk Likelihood × Impact Matrix */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-right mb-1">مصفوفة الاحتمالية × التأثير</h3>
          <p className="text-gray-400 text-xs text-right mb-4" style={{ fontFamily: 'monospace' }}>Risk Likelihood × Impact Matrix</p>
          <div className="flex gap-8 flex-wrap">
            {/* Grid */}
            <div className="flex gap-3 items-end">
              {/* Y label */}
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[10px] text-gray-400 pb-7 tracking-wider">الاحتمالية</div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 52px)', gap: 4 }}>
                  {[5, 4, 3, 2, 1].map(l =>
                    [1, 2, 3, 4, 5].map(imp => {
                      const count = heatmapGrid[`${l}-${imp}`] || 0;
                      const isHov = heatmapHover?.[0] === l && heatmapHover?.[1] === imp;
                      const lbl = getHeatLabel(l, imp);
                      return (
                        <div
                          key={`${l}-${imp}`}
                          onMouseEnter={() => setHeatmapHover([l, imp, count])}
                          onMouseLeave={() => setHeatmapHover(null)}
                          className="flex flex-col items-center justify-center cursor-pointer transition-all"
                          style={{
                            width: 52, height: 52, borderRadius: 10,
                            background: getHeatColor(count),
                            border: isHov ? `2px solid ${lbl.color}` : '2px solid transparent',
                            transform: isHov ? 'scale(1.12)' : 'scale(1)',
                            zIndex: isHov ? 5 : 1,
                            position: 'relative',
                          }}
                        >
                          <span className="text-base font-black" style={{ color: getHeatTextColor(count), fontFamily: 'monospace' }}>
                            {count || '·'}
                          </span>
                          {count > 0 && (
                            <span className="text-[8px]" style={{ color: getHeatTextColor(count) + '88', fontFamily: 'monospace' }}>{l}×{imp}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {/* X axis numbers */}
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map(v => (
                    <div key={v} className="text-center text-[10px] text-gray-400" style={{ width: 52, fontFamily: 'monospace' }}>{v}</div>
                  ))}
                </div>
                <div className="text-center text-[10px] text-gray-400 mt-1 tracking-wider">التأثير ←</div>
              </div>
            </div>

            {/* Right side: hover detail + legend */}
            <div className="flex-1 min-w-[220px] flex flex-col justify-between">
              {/* Hover info */}
              <div className={`p-4 rounded-2xl border transition-all min-h-[90px] ${heatmapHover ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent'}`}>
                {heatmapHover ? (() => {
                  const lbl = getHeatLabel(heatmapHover[0], heatmapHover[1]);
                  const score = heatmapHover[0] * heatmapHover[1];
                  return (
                    <>
                      <div className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'monospace' }}>
                        احتمالية {heatmapHover[0]} × تأثير {heatmapHover[1]}
                      </div>
                      <div className="flex gap-5 items-center">
                        <div>
                          <div className="text-[10px] text-gray-400">الدرجة</div>
                          <div className="text-3xl font-black" style={{ color: lbl.color, fontFamily: 'monospace' }}>{score}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">عدد المخاطر</div>
                          <div className="text-3xl font-black text-gray-900" style={{ fontFamily: 'monospace' }}>{heatmapHover[2]}</div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${lbl.color}22`, border: `1px solid ${lbl.color}55`, color: lbl.color }}>
                          {lbl.text}
                        </div>
                      </div>
                    </>
                  );
                })() : (
                  <div className="text-gray-400 text-sm pt-3">مرِّر مؤشر الماوس على أي خلية لعرض التفاصيل</div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-3">مستويات الخطورة</div>
                <div className="flex flex-col gap-2">
                  {[
                    { range: '1 – 4', label: 'منخفض', color: '#3b82f6' },
                    { range: '5 – 8', label: 'متوسط', color: '#0ea5e9' },
                    { range: '9 – 12', label: 'مرتفع', color: '#f59e0b' },
                    { range: '13 – 16', label: 'حرج', color: '#ef4444' },
                    { range: '17 – 25', label: 'خطر شديد', color: '#991b1b' },
                  ].map(r => (
                    <div key={r.range} className="flex items-center gap-2">
                      <div className="w-8 h-4 rounded flex-shrink-0" style={{ background: r.color }} />
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>{r.range}</span>
                      <span className="text-xs font-bold" style={{ color: r.color }}>— {r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Footer */}
        <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
          <span>Risk Management & Incident Tracking System</span>
          <span>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

      </div>

      {/* Goal Risks Modal */}
      {selectedGoal && !selectedRisk && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <button type="button" onClick={() => setSelectedGoal(null)} className="w-11 h-11 rounded-2xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center">
                <X size={22} />
              </button>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-bold">{selectedGoalRisks.length} خطر</span>
                  <Target size={18} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">{selectedGoal.title}</h3>
                <p className="text-gray-500 mt-1">اضغط على أي خطر لعرض تفاصيله الكاملة</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-96px)] bg-gray-50">
              {selectedGoalRisks.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center"><Target size={26} /></div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">لا توجد أخطار مرتبطة بهذه الغاية</h4>
                  <p className="text-gray-500">لم يتم العثور على أخطار مرتبطة بها حاليًا</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedGoalRisks.map((risk) => {
                    const score = calculateRiskScore(risk.impact, risk.likelihood);
                    const responsible = getResponsibleEntity(risk.responsibleId);

                    return (
                      <div
                        key={risk.id}
                        onClick={() => setSelectedRisk(risk)}
                        className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${getRiskColor(score)} text-white px-3 py-1 rounded-lg text-sm font-bold`}>{getRiskLabel(score)}</div>
                          <div className="text-right flex-1 mr-3">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{risk.riskName}</h3>
                            <p className="text-sm text-gray-500">{risk.categoryName}</p>
                          </div>
                        </div>

                        <p className="text-gray-600 text-right mb-4 line-clamp-2">{risk.riskDescription}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-end gap-2 text-gray-600">
                            <span>{risk.location}</span><MapPin size={16} />
                          </div>
                          <div className="flex items-center justify-end gap-2 text-gray-600">
                            <span>{responsible?.entityName || 'غير محدد'}</span><User size={16} />
                          </div>
                          <div className="flex items-center justify-end gap-2 text-gray-600">
                            <span>{risk.department}</span><Activity size={16} />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">درجة الخطر</p>
                            <p className="text-2xl font-bold text-gray-800">{score}</p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">الأثر</p>
                              <p className="font-bold text-gray-800">{risk.impact}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500 mb-1">الاحتمالية</p>
                              <p className="font-bold text-gray-800">{risk.likelihood}</p>
                            </div>
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

      {/* Risk Detail Modal */}
      {selectedRisk && (
        <RiskDetailModal
          risk={selectedRisk}
          responsibleEntities={responsibleEntities}
          onClose={() => setSelectedRisk(null)}
        />
      )}
    </>
  );
};

export default Dashboard;