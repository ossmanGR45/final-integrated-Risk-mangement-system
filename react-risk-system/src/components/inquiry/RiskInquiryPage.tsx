import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  AlertCircle,
  MapPin,
  User,
  Activity,
  Phone,
  Mail,
  ShieldCheck,
  ClipboardList,
  Siren,
  Filter,
  Target
} from 'lucide-react';
import { calculateRiskScore, getRiskColor, getRiskLabel } from '../../utils/riskCalculations';

interface Category {
  id: number;
  categoryName: string;
}

interface Risk {
  id: number;
  riskName: string;
  riskDescription: string;
  location: string;
  likelihood: number;
  impact: number;
  custom: boolean;
  userId: number;
  categoryName: string;
  categoryID: number;
  responsibleId: number;
  department: string;
  riskCauses?: string[] | null;
  riskActions?: string[] | null;
  riskGoals?: string[] | null;
  strategicGoals?: string[] | null;
}

interface RiskActionMappingDto {
  action?: {
    actionDescription?: string | null;
    actionType?: unknown;
  } | null;
}

interface RiskCauseMappingDto {
  cause?: {
    causeDescription?: string | null;
  } | null;
}

interface RiskGoalMappingDto {
  strategicGoal?: {
    goalDescription?: string | null;
  } | null;
}

type RawRisk = {
  id?: unknown;
  riskName?: unknown;
  riskDescription?: unknown;
  location?: unknown;
  likelihood?: unknown;
  impact?: unknown;
  custom?: unknown;
  userId?: unknown;
  categoryName?: unknown;
  categoryID?: unknown;
  responsibleId?: unknown;
  department?: unknown;
  strategicGoals?: unknown;
  riskActions?: unknown;
  riskCauses?: unknown;
  riskGoals?: unknown;
  riskactions?: unknown;
  riskcauses?: unknown;
  riskgoals?: unknown;
  RiskActions?: RiskActionMappingDto[] | null;
  RiskCauses?: RiskCauseMappingDto[] | null;
  RiskGoals?: RiskGoalMappingDto[] | null;
};

interface ResponsibleEntity {
  id: number;
  entityName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
}

const RiskInquiryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allRisks, setAllRisks] = useState<Risk[]>([]);
  const [responsibleEntities, setResponsibleEntities] = useState<ResponsibleEntity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [sortBy, setSortBy] = useState<'latest' | 'name' | 'score-high' | 'score-low'>('latest');
  const [riskTypeFilter, setRiskTypeFilter] = useState('');

  const toStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean);
  };

  const extractActionDescriptions = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => {
        if (!item || typeof item !== 'object') return '';
        const action = (item as RiskActionMappingDto).action;
        return typeof action?.actionDescription === 'string' ? action.actionDescription.trim() : '';
      })
      .filter(Boolean);
  };

  const splitMappedActionsByType = (value: unknown): { reduction: string[]; avoidance: string[] } => {
    if (!Array.isArray(value)) return { reduction: [], avoidance: [] };

    const reduction: string[] = [];
    const avoidance: string[] = [];

    value.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const action = (item as RiskActionMappingDto).action;
      const description = typeof action?.actionDescription === 'string' ? action.actionDescription.trim() : '';
      if (!description) return;

      const actionType = action?.actionType;
      if (actionType === 0 || actionType === '0' || actionType === 'Avoidance') {
        avoidance.push(description);
        return;
      }

      if (actionType === 1 || actionType === '1' || actionType === 'Reduction') {
        reduction.push(description);
        return;
      }

      // Fallback: unknown type defaults to reduction behavior.
      reduction.push(description);
    });

    return { reduction, avoidance };
  };

  const extractCauseDescriptions = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => {
        if (!item || typeof item !== 'object') return '';
        const cause = (item as RiskCauseMappingDto).cause;
        return typeof cause?.causeDescription === 'string' ? cause.causeDescription.trim() : '';
      })
      .filter(Boolean);
  };

  const extractGoalDescriptions = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => {
        if (!item || typeof item !== 'object') return '';
        const goal = (item as RiskGoalMappingDto).strategicGoal;
        return typeof goal?.goalDescription === 'string' ? goal.goalDescription.trim() : '';
      })
      .filter(Boolean);
  };

  const normalizeRisk = (risk: RawRisk): Risk => {
    const rawActions = risk.riskActions ?? risk.riskactions ?? risk.RiskActions;
    const rawCauses = risk.riskCauses ?? risk.riskcauses ?? risk.RiskCauses;
    const rawGoals = risk.riskGoals ?? risk.riskgoals ?? risk.RiskGoals;

    const directRiskActions = toStringArray(rawActions);
    const directRiskCauses = toStringArray(rawCauses);
    const directRiskGoals = toStringArray(rawGoals);

    const mappedActionsByType = splitMappedActionsByType(rawActions);
    const mappedRiskActions =
      mappedActionsByType.reduction.length > 0
        ? mappedActionsByType.reduction
        : extractActionDescriptions(rawActions);
    const mappedRiskCauses = extractCauseDescriptions(rawCauses);
    const mappedRiskGoals = extractGoalDescriptions(rawGoals);

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
      riskCauses: directRiskCauses.length > 0 ? directRiskCauses : mappedRiskCauses,
      riskActions: directRiskActions.length > 0 ? directRiskActions : mappedRiskActions,
      riskGoals:
        directRiskGoals.length > 0
          ? directRiskGoals
          : mappedRiskGoals.length > 0
            ? mappedRiskGoals
            : mappedActionsByType.avoidance,
      strategicGoals: toStringArray(risk.strategicGoals)
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [catRes, riskRes, respRes] = await Promise.all([
          fetch('https://localhost:7002/api/category', { headers }),
          fetch('https://localhost:7002/api/risk?custom=false&include=RiskActions.Action,RiskCauses.Cause,RiskGoals.StrategicGoal', { headers }),
          fetch('https://localhost:7002/api/responsible', { headers })
        ]);

        setCategories(await catRes.json());
        const risksPayload = (await riskRes.json()) as RawRisk[];
        setAllRisks(Array.isArray(risksPayload) ? risksPayload.map(normalizeRisk) : []);
        setResponsibleEntities(await respRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getResponsibleEntity = (responsibleId: number) => {
    return responsibleEntities.find(e => e.id === responsibleId);
  };

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(prev => (prev === categoryId ? null : categoryId));
  };

  const handleRiskClick = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRisk(null);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchTerm('');
    setRiskTypeFilter('');
    setSortBy('latest');
  };

  const toArray = (value?: string[] | null) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [];
  };

  const processedRisks = useMemo(() => {
    let result = selectedCategory
      ? allRisks.filter(r => r.categoryID === selectedCategory)
      : [...allRisks];

    result = result.filter(risk => {
      const matchesSearch =
        risk.riskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.riskDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        risk.categoryName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        !riskTypeFilter ||
        (riskTypeFilter === 'custom' && risk.custom) ||
        (riskTypeFilter === 'standard' && !risk.custom);

      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      const scoreA = calculateRiskScore(a.impact, a.likelihood);
      const scoreB = calculateRiskScore(b.impact, b.likelihood);

      if (sortBy === 'name') return a.riskName.localeCompare(b.riskName, 'ar');
      if (sortBy === 'score-high') return scoreB - scoreA;
      if (sortBy === 'score-low') return scoreA - scoreB;
      return b.id - a.id;
    });

    return result;
  }, [allRisks, selectedCategory, searchTerm, riskTypeFilter, sortBy]);

  const renderListSection = (
    title: string,
    items: string[],
    icon: React.ReactNode,
    emptyText: string
  ) => (
    <div className="bg-gray-50 rounded-xl p-6">
      <h4 className="text-lg font-bold text-right mb-4 flex items-center justify-end gap-2">
        {icon}
        {title}
      </h4>

      {items.length > 0 ? (
        <ul className="space-y-3 text-right">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="text-gray-700 leading-relaxed border-b border-gray-200 pb-3 last:border-b-0 last:pb-0"
            >
              - {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-right">{emptyText}</p>
      )}
    </div>
  );

  const selectedCategoryName =
    categories.find(category => category.id === selectedCategory)?.categoryName || '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-right mb-2">استفسار المخاطر</h1>
          <p className="text-gray-600 text-right text-lg">
            استعرض الفئات والمخاطر المسجلة في النظام
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  إلغاء تحديد الفئة
                </button>
              )}
            </div>

            <h2 className="text-3xl font-bold text-right">الفئات</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const risksCount = allRisks.filter(r => r.categoryID === category.id).length;
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`p-6 rounded-2xl border-2 transition-all text-right ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-100'
                      }`}
                    >
                      <AlertCircle className={isSelected ? 'text-white' : 'text-gray-600'} size={22} />
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {risksCount} مخاطرة
                    </div>
                  </div>

                  <h3 className={`text-2xl font-bold ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                    {category.categoryName}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              مسح الفلاتر
            </button>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <h2 className="text-3xl font-bold text-right">
                {selectedCategory ? `المخاطر التابعة لفئة: ${selectedCategoryName}` : 'جميع المخاطر'}
              </h2>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن مخاطرة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl border border-gray-300 text-right text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={24}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={riskTypeFilter}
              onChange={(e) => setRiskTypeFilter(e.target.value)}
              className="border rounded-xl px-4 py-4 text-right bg-white"
            >
              <option value="">كل الأنواع</option>
              <option value="standard">قياسي</option>
              <option value="custom">مخصص</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'name' | 'score-high' | 'score-low')}
              className="border rounded-xl px-4 py-4 text-right bg-white"
            >
              <option value="latest">الأحدث</option>
              <option value="name">حسب الاسم</option>
              <option value="score-high">درجة الخطر من الأعلى</option>
              <option value="score-low">درجة الخطر من الأقل</option>
            </select>

            <select
              value={selectedCategory ?? ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="border rounded-xl px-4 py-4 text-right bg-white"
            >
              <option value="">كل الفئات</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-gray-500 text-lg">
              عدد النتائج: <span className="font-bold text-gray-800">{processedRisks.length}</span>
            </div>

            <div className="text-right text-gray-600">
              {selectedCategory
                ? 'المخاطر المعروضة تخص الفئة المحددة'
                : 'المخاطر المعروضة من جميع الفئات'}
            </div>
          </div>

          {processedRisks.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-gray-600 text-lg">لا توجد مخاطر مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedRisks.map((risk) => {
                const score = calculateRiskScore(risk.impact, risk.likelihood);
                const responsible = getResponsibleEntity(risk.responsibleId);

                return (
                  <div
                    key={risk.id}
                    onClick={() => handleRiskClick(risk)}
                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${getRiskColor(score)} text-white px-3 py-1 rounded-lg text-sm font-bold`}>
                        {getRiskLabel(score)}
                      </div>

                      <div className="text-right flex-1 mr-3">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{risk.riskName}</h3>
                        <p className="text-sm text-gray-500">{risk.categoryName}</p>
                      </div>
                    </div>

                    <p className="text-gray-600 text-right mb-4 line-clamp-2">
                      {risk.riskDescription}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-end gap-2 text-gray-600">
                        <span>{risk.location}</span>
                        <MapPin size={16} />
                      </div>

                      <div className="flex items-center justify-end gap-2 text-gray-600">
                        <span>{responsible?.entityName || 'غير محدد'}</span>
                        <User size={16} />
                      </div>

                      <div className="flex items-center justify-end gap-2 text-gray-600">
                        <span>{risk.department}</span>
                        <Activity size={16} />
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

      {showModal && selectedRisk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold text-right">تفاصيل المخاطرة</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-right">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">{selectedRisk.riskName}</h3>
                <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
                  {selectedRisk.categoryName}
                </div>
              </div>

              <div
                className={`${getRiskColor(
                  calculateRiskScore(selectedRisk.impact, selectedRisk.likelihood)
                )} text-white rounded-xl p-6`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-lg opacity-90 mb-1">درجة الخطر</p>
                    <p className="text-5xl font-bold">
                      {calculateRiskScore(selectedRisk.impact, selectedRisk.likelihood)}
                    </p>
                    <p className="text-xl mt-2">
                      {getRiskLabel(calculateRiskScore(selectedRisk.impact, selectedRisk.likelihood))}
                    </p>
                  </div>

                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-sm opacity-90 mb-1">شدة أثر الخطر</p>
                      <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                        <p className="text-4xl font-bold">{selectedRisk.impact}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm opacity-90 mb-1">احتمالية الخطر</p>
                      <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                        <p className="text-4xl font-bold">{selectedRisk.likelihood}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {toArray(selectedRisk.strategicGoals).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-right mb-4 flex items-center justify-end gap-2">
                    <Target size={20} />
                    المؤشر / الغاية الإستراتيجية
                  </h4>

                  <div className="space-y-3 text-right">
                    {toArray(selectedRisk.strategicGoals).map((goal, index) => (
                      <div
                        key={`strategic-goal-${index}`}
                        className="bg-white border border-gray-200 rounded-xl p-4 text-gray-700 leading-relaxed"
                      >
                        {goal}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-end gap-2">
                    <User size={20} />
                    الجهة المسؤولة عن معالجة الخطر
                  </h4>
                  <p className="text-gray-700 text-right text-lg">
                    {getResponsibleEntity(selectedRisk.responsibleId)?.entityName || 'غير محددة'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-end gap-2">
                    <User size={20} />
                    الشخص المسؤول للاتصال به عند حدوث الخطر
                  </h4>
                  <p className="text-gray-700 text-right text-lg">
                    {getResponsibleEntity(selectedRisk.responsibleId)?.contactName || 'غير محدد'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-end gap-2">
                    <Phone size={20} />
                    وسائل الاتصال
                  </h4>
                  <div className="space-y-2 text-right">
                    <p className="text-gray-700 text-lg">
                      {getResponsibleEntity(selectedRisk.responsibleId)?.contactPhoneNumber || 'غير متوفر'}
                    </p>
                    <p className="text-gray-700 text-base break-all">
                      {getResponsibleEntity(selectedRisk.responsibleId)?.contactEmail || 'غير متوفر'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-end gap-2">
                    <MapPin size={20} />
                    مكان الخطر
                  </h4>
                  <p className="text-gray-700 text-right text-lg">{selectedRisk.location}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-end gap-2">
                  <Activity size={20} />
                  القسم
                </h4>
                <p className="text-gray-700 text-right text-lg">{selectedRisk.department}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-end gap-2">
                  <AlertCircle size={20} />
                  وصف المخاطرة
                </h4>
                <p className="text-gray-700 text-right leading-relaxed">
                  {selectedRisk.riskDescription}
                </p>
              </div>

              {renderListSection(
                'الأسباب المحتملة لحدوث الخطر',
                toArray(selectedRisk.riskCauses),
                <AlertCircle size={20} />,
                'لا توجد أسباب مسجلة لهذه المخاطرة'
              )}

              {renderListSection(
                'الإجراءات التي تتخذها الجهة المسؤولة عند وقوع الخطر',
                toArray(selectedRisk.riskActions),
                <Siren size={20} />,
                'لا توجد إجراءات مسجلة عند وقوع الخطر'
              )}

              {renderListSection(
                'الإجراءات الواجب اتباعها لتفادي حدوث تلك المخاطر',
                toArray(selectedRisk.riskGoals),
                <ShieldCheck size={20} />,
                'لا توجد إجراءات وقائية مسجلة لهذه المخاطرة'
              )}

              {(() => {
                const responsible = getResponsibleEntity(selectedRisk.responsibleId);
                return responsible ? (
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-lg font-bold text-right mb-4 flex items-center justify-end gap-2 text-blue-900">
                      <ClipboardList size={20} />
                      ملخص جهة التواصل
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                      <div className="bg-white rounded-xl p-4 border">
                        <div className="flex items-center justify-end gap-2 text-gray-500 mb-2">
                          <User size={16} />
                          <span>اسم الجهة</span>
                        </div>
                        <div className="font-bold text-blue-900">{responsible.entityName}</div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border">
                        <div className="flex items-center justify-end gap-2 text-gray-500 mb-2">
                          <Phone size={16} />
                          <span>الهاتف</span>
                        </div>
                        <div className="font-bold text-blue-900">{responsible.contactPhoneNumber || '-'}</div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border">
                        <div className="flex items-center justify-end gap-2 text-gray-500 mb-2">
                          <Mail size={16} />
                          <span>الإيميل</span>
                        </div>
                        <div className="font-bold text-blue-900 break-all">{responsible.contactEmail || '-'}</div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="border-t border-gray-200 p-6">
              <button
                onClick={closeModal}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
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

export default RiskInquiryPage;