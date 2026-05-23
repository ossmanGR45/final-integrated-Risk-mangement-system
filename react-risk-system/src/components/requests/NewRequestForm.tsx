import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Info,
  Target,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  ClipboardList,
  Siren,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { RiskMode } from '../../types';
import {
  calculateRiskScore,
  getRiskColor,
  getRiskLabel
} from '../../utils/riskCalculations';

interface NewRequestFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Partial<RiskRequestFormData>;
  disabled?: boolean;
  title?: string;
  submitLabel?: string;
}

type SemesterValue = 'first' | 'second' | 'summer';
type SectionKey = 'strategicGoals' | 'causes' | 'responseActions' | 'preventiveActions';

interface RiskRequestFormData {
  riskId?: number | null;
  mode: RiskMode;
  department: string;
  category: string;
  name: string;
  date: string;
  impact: number;
  likelihood: number;
  score: number;
  postImpact: number;
  postLikelihood: number;
  postScore: number;
  responsibleEntityId?: number | string;
  responsibleEntityName?: string;
  responsiblePerson: string;
  contactPhoneNumber?: string;
  contactEmail?: string;
  location?: string;
  customResponsible: string;
  semester: SemesterValue;
  strategicGoal?: string;
  causes?: string[];
  responseActions?: string[];
  preventiveActions?: string[];
  mitigationActions: string[];
}

interface CategoryItem {
  id: number;
  categoryName: string;
}

interface ResponsibleItem {
  id: number;
  entityName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
}

interface RiskItem {
  id: number;
  riskName: string;
  riskDescription: string;
  location: string;
  likelihood: number;
  impact: number;
  categoryName: string;
  categoryID: number;
  responsibleId?: number | null;
  riskCauses?: string[] | null;
  riskActions?: string[] | null;
  strategicGoals?: string[] | null;
  riskGoals?: Array<
    | string
    | {
        strategicGoal?: {
          goalDescription?: string | null;
        } | null;
      }
  > | null;
  riskCausesMap?: Array<{
    cause?: {
      causeDescription?: string | null;
    } | null;
  }> | null;
  riskActionsMap?: Array<{
    action?: {
      actionDescription?: string | null;
      actionType?: number | string | null;
    } | null;
  }> | null;
}

const USER_DEPARTMENT = 'كلية تقنية المعلومات';
const API_BASE = 'https://localhost:7002/api';
const EMPTY_LIST = [''];

const RiskLevelsInfo = () => (
  <div className="bg-white border rounded-2xl p-5 text-sm space-y-3 shadow-sm h-full">
    <div className="flex items-center gap-2 font-bold text-base">
      <Info className="w-4 h-4 text-gray-600" />
      شرح مستويات الخطورة
    </div>

    <p>
      <span className="font-bold text-red-600">حرج:</span> يؤدي إلى توقف العمل أو خسائر جسيمة
      ويتطلب تدخلًا فوريًا.
    </p>
    <p>
      <span className="font-bold text-orange-500">عالي:</span> تأثير كبير يحتاج خطة معالجة عاجلة.
    </p>
    <p>
      <span className="font-bold text-yellow-500">متوسط:</span> يمكن السيطرة عليه بإجراءات تنظيمية.
    </p>
    <p>
      <span className="font-bold text-green-600">منخفض:</span> تأثير محدود ويمكن متابعته بالمراقبة.
    </p>

    <div className="pt-2 text-xs text-gray-400 text-center">
      ISO 31000:2018 – COSO ERM Framework
    </div>
  </div>
);

const NewRequestForm: React.FC<NewRequestFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  disabled = false,
  title = 'تسجيل خطر',
  submitLabel = 'حفظ وإرسال'
}) => {
  const [mode, setMode] = useState<RiskMode>('before');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [responsibleEntities, setResponsibleEntities] = useState<ResponsibleItem[]>([]);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);

  const [category, setCategory] = useState('');
  const [riskName, setRiskName] = useState('');
  const [date, setDate] = useState('');

  const [impact, setImpact] = useState(1);
  const [likelihood, setLikelihood] = useState(1);

  const [postImpact, setPostImpact] = useState(1);
  const [postLikelihood, setPostLikelihood] = useState(1);

  const [responsibleId, setResponsibleId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [strategicGoal, setStrategicGoal] = useState('');

  const [formData, setFormData] = useState({
    semester: 'first' as SemesterValue,
    customResponsible: ''
  });

  const [causes, setCauses] = useState<string[]>(EMPTY_LIST);
  const [responseActions, setResponseActions] = useState<string[]>(EMPTY_LIST);
  const [preventiveActions, setPreventiveActions] = useState<string[]>(EMPTY_LIST);

  const [selectedCauseTemplate, setSelectedCauseTemplate] = useState('');
  const [selectedActionTemplate, setSelectedActionTemplate] = useState('');
  const [selectedPreventiveTemplate, setSelectedPreventiveTemplate] = useState('');

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    strategicGoals: true,
    causes: true,
    responseActions: false,
    preventiveActions: false
  });

  const score = useMemo(() => calculateRiskScore(impact, likelihood), [impact, likelihood]);
  const postScore = useMemo(
    () => calculateRiskScore(postImpact, postLikelihood),
    [postImpact, postLikelihood]
  );

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
    const fetchMasterData = async () => {
      try {
        setIsLoadingMasterData(true);

        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [categoriesRes, risksRes, responsibleRes] = await Promise.all([
          fetch(`${API_BASE}/category`, { headers }),
          // Risk-name dropdown: only the global catalog of admin-approved
          // risks (Custom=false). The backend bypasses role scoping when this
          // filter is passed, so initiators can populate the picker too.
          fetch(`${API_BASE}/risk?custom=false`, { headers }),
          fetch(`${API_BASE}/responsible`, { headers })
        ]);

        const categoriesData = await parseJsonSafe(categoriesRes);
        const risksData = await parseJsonSafe(risksRes);
        const responsibleData = await parseJsonSafe(responsibleRes);

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setRisks(Array.isArray(risksData) ? risksData : []);
        setResponsibleEntities(Array.isArray(responsibleData) ? responsibleData : []);
      } catch (error) {
        console.error('Error loading master data:', error);
      } finally {
        setIsLoadingMasterData(false);
      }
    };

    fetchMasterData();
  }, []);

  const selectedRiskOptions = useMemo(() => {
    if (!category) return [];
    return risks.filter(risk => risk.categoryName === category);
  }, [risks, category]);

  const selectedRisk = useMemo(() => {
    return selectedRiskOptions.find(risk => risk.riskName === riskName) || null;
  }, [selectedRiskOptions, riskName]);

  const selectedResponsible = useMemo(() => {
    return responsibleEntities.find(item => item.id === Number(responsibleId)) || null;
  }, [responsibleEntities, responsibleId]);

  const uniqueValues = (groups: Array<string[] | null | undefined>) => {
    return Array.from(
      new Set(
        groups
          .flatMap(group => (Array.isArray(group) ? group : []))
          .map(item => item.trim())
          .filter(Boolean)
      )
    );
  };

  const getRiskGoalStrings = (risk: RiskItem): string[] => {
    if (!Array.isArray(risk.riskGoals)) return [];
    return risk.riskGoals
      .map(item => {
        if (typeof item === 'string') return item.trim();
        return item?.strategicGoal?.goalDescription?.trim() || '';
      })
      .filter(Boolean);
  };

  const allStrategicGoals = useMemo(() => {
    return uniqueValues(risks.map(risk => risk.strategicGoals));
  }, [risks]);

  const strategicGoalOptions = useMemo(() => {
    if (selectedRisk?.strategicGoals && selectedRisk.strategicGoals.length > 0) {
      return selectedRisk.strategicGoals.filter(Boolean);
    }
    return allStrategicGoals;
  }, [selectedRisk, allStrategicGoals]);

  const selectedRiskStrategicGoals = useMemo(() => {
    if (!selectedRisk) return [];
    if (Array.isArray(selectedRisk.riskGoals) && selectedRisk.riskGoals.length > 0) {
      return getRiskGoalStrings(selectedRisk);
    }

    if (Array.isArray(selectedRisk.strategicGoals) && selectedRisk.strategicGoals.length > 0) {
      return selectedRisk.strategicGoals.map(item => (item || '').trim()).filter(Boolean);
    }

    return [];
  }, [selectedRisk]);

  const causeTemplates = useMemo(() => {
    if (selectedRisk) {
      if (Array.isArray(selectedRisk.riskCausesMap) && selectedRisk.riskCausesMap.length > 0) {
        return selectedRisk.riskCausesMap
          .map(item => item?.cause?.causeDescription?.trim())
          .filter((item): item is string => Boolean(item));
      }
      return Array.isArray(selectedRisk.riskCauses) ? selectedRisk.riskCauses.filter(Boolean) : [];
    }
    return uniqueValues(risks.map(risk => risk.riskCauses));
  }, [selectedRisk, risks]);

  const actionTemplates = useMemo(() => {
    if (selectedRisk) {
      if (Array.isArray(selectedRisk.riskActionsMap) && selectedRisk.riskActionsMap.length > 0) {
        return selectedRisk.riskActionsMap
          .filter(item => {
            const t = item?.action?.actionType;
            return t === 1 || t === 'Reduction';
          })
          .map(item => item?.action?.actionDescription?.trim())
          .filter((item): item is string => Boolean(item));
      }
      return Array.isArray(selectedRisk.riskActions) ? selectedRisk.riskActions.filter(Boolean) : [];
    }
    return uniqueValues(risks.map(risk => risk.riskActions));
  }, [selectedRisk, risks]);

  const preventiveTemplates = useMemo(() => {
    if (selectedRisk) {
      if (Array.isArray(selectedRisk.riskActionsMap) && selectedRisk.riskActionsMap.length > 0) {
        return selectedRisk.riskActionsMap
          .filter(item => {
            const t = item?.action?.actionType;
            return t === 0 || t === 'Avoidance';
          })
          .map(item => item?.action?.actionDescription?.trim())
          .filter((item): item is string => Boolean(item));
      }
      return getRiskGoalStrings(selectedRisk);
    }
    return uniqueValues(risks.map(getRiskGoalStrings));
  }, [selectedRisk, risks]);

  useEffect(() => {
    if (!initialData) return;

    if (initialData.mode) setMode(initialData.mode);
    if (typeof initialData.category === 'string') setCategory(initialData.category);
    if (typeof initialData.name === 'string') setRiskName(initialData.name);
    if (typeof initialData.date === 'string') setDate(initialData.date);

    if (typeof initialData.impact === 'number') setImpact(initialData.impact);
    if (typeof initialData.likelihood === 'number') setLikelihood(initialData.likelihood);

    if (typeof initialData.postImpact === 'number') setPostImpact(initialData.postImpact);
    if (typeof initialData.postLikelihood === 'number') setPostLikelihood(initialData.postLikelihood);

    if (
      initialData.responsibleEntityId !== undefined &&
      initialData.responsibleEntityId !== null
    ) {
      setResponsibleId(String(initialData.responsibleEntityId));
    }

    if (typeof initialData.location === 'string') setLocation(initialData.location);
    if (typeof initialData.strategicGoal === 'string') setStrategicGoal(initialData.strategicGoal);

    if (typeof initialData.semester === 'string') {
      setFormData(prev => ({ ...prev, semester: initialData.semester as SemesterValue }));
    }

    if (typeof initialData.customResponsible === 'string') {
      setFormData(prev => ({ ...prev, customResponsible: initialData.customResponsible || '' }));
    }

    if (Array.isArray(initialData.causes) && initialData.causes.length > 0) {
      setCauses(initialData.causes);
    }

    if (Array.isArray(initialData.responseActions) && initialData.responseActions.length > 0) {
      setResponseActions(initialData.responseActions);
    }

    if (Array.isArray(initialData.preventiveActions) && initialData.preventiveActions.length > 0) {
      setPreventiveActions(initialData.preventiveActions);
    } else if (
      Array.isArray(initialData.mitigationActions) &&
      initialData.mitigationActions.length > 0
    ) {
      setPreventiveActions(initialData.mitigationActions);
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData || responsibleEntities.length === 0 || responsibleId) return;

    if (typeof initialData.responsiblePerson === 'string' && initialData.responsiblePerson) {
      const matchedResponsible = responsibleEntities.find(
        item => item.contactName === initialData.responsiblePerson
      );
      if (matchedResponsible) {
        setResponsibleId(String(matchedResponsible.id));
      }
    }
  }, [initialData, responsibleEntities, responsibleId]);

  useEffect(() => {
    if (!selectedRisk) return;

    setImpact(selectedRisk.impact || 1);
    setLikelihood(selectedRisk.likelihood || 1);
    setLocation(selectedRisk.location || '');

    if (selectedRisk.responsibleId) {
      setResponsibleId(String(selectedRisk.responsibleId));
    }

    const riskGoals = selectedRiskStrategicGoals;

    if (riskGoals.length > 0) {
      setStrategicGoal(prev => (prev && riskGoals.includes(prev) ? prev : riskGoals[0]));
    }

    const loadedCauses = causeTemplates.length > 0 ? causeTemplates : [''];
    const loadedActions = actionTemplates.length > 0 ? actionTemplates : [''];
    const loadedPreventive = preventiveTemplates.length > 0 ? preventiveTemplates : [''];

    setCauses(loadedCauses);
    setResponseActions(loadedActions);
    setPreventiveActions(loadedPreventive);
  }, [selectedRisk, selectedRiskStrategicGoals, causeTemplates, actionTemplates, preventiveTemplates]);

  useEffect(() => {
    if (!selectedRisk?.id) return;

    const fetchRiskDetails = async () => {
      try {
        const include = encodeURIComponent('RiskCauses.Cause,RiskActions.Action,RiskGoals.StrategicGoal');
        const token = localStorage.getItem('authToken');
        // custom=false bypasses role scoping (catalog lookup).
        const response = await fetch(
          `${API_BASE}/risk?id=${selectedRisk.id}&custom=false&include=${include}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const data = await parseJsonSafe(response);
        const detailedRisk = Array.isArray(data) ? data[0] : null;
        if (!detailedRisk) return;

        setRisks(prev =>
          prev.map(item => {
            if (item.id !== selectedRisk.id) return item;

            return {
              ...item,
              riskCausesMap: detailedRisk.riskCauses || detailedRisk.RiskCauses || [],
              riskActionsMap: detailedRisk.riskActions || detailedRisk.RiskActions || [],
              riskGoals: detailedRisk.riskGoals || detailedRisk.RiskGoals || [],
              strategicGoals: item.strategicGoals
            };
          })
        );
      } catch (error) {
        console.error('Error loading related risk details:', error);
      }
    };

    fetchRiskDetails();
  }, [selectedRisk?.id]);

  const countFilled = (items: string[]) => items.filter(item => item.trim()).length;

  const cleanList = (items: string[]) => items.map(item => item.trim()).filter(Boolean);

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const removeListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [''];
    });
  };

  const addTemplateValue = (
    value: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    resetTemplate: () => void
  ) => {
    if (!value.trim()) return;

    const alreadyExists = values.some(item => item.trim() === value.trim());
    if (alreadyExists) {
      resetTemplate();
      return;
    }

    if (values.length === 1 && !values[0].trim()) {
      setter([value]);
    } else {
      setter(prev => [...prev, value]);
    }

    resetTemplate();
  };

  const renderAccordionListSection = (
    key: SectionKey,
    title: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string,
    suggestions: string[],
    selectedSuggestion: string,
    onSelectSuggestion: (value: string) => void,
    onApplySuggestion: () => void,
    suggestionPlaceholder: string,
    icon: React.ReactNode
  ) => {
    const isOpen = expandedSections[key];
    const itemsCount = countFilled(values);

    return (
      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(key)}
          className="w-full px-5 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 text-gray-500">
            {isOpen ? <ChevronDown size={22} /> : <ChevronLeft size={22} />}
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
              {itemsCount} عنصر
            </span>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="text-right">
              <h4 className="text-xl font-bold text-gray-800">{title}</h4>
            </div>
            <div className="text-gray-600">{icon}</div>
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-gray-200 p-5 space-y-4 bg-gray-50">
            {!disabled && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onApplySuggestion}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 whitespace-nowrap"
                >
                  إضافة من القائمة
                </button>

                <select
                  value={selectedSuggestion}
                  onChange={e => onSelectSuggestion(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-right"
                >
                  <option value="">{suggestionPlaceholder}</option>
                  {suggestions.map((item, index) => (
                    <option key={`${title}-suggestion-${index}`} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {values.map((item, index) => (
              <div key={`${title}-${index}`} className="flex items-center gap-3">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeListItem(setter, index)}
                    className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <input
                  value={item}
                  disabled={disabled}
                  onChange={e => updateListItem(setter, index, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-right"
                />
              </div>
            ))}

            {!disabled && (
              <button
                type="button"
                onClick={() => addListItem(setter)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                <Plus size={16} />
                إضافة عنصر مخصص
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setRiskName('');
    setStrategicGoal('');
    setLocation('');
    setResponsibleId('');
    setCauses(['']);
    setResponseActions(['']);
    setPreventiveActions(['']);
    setImpact(1);
    setLikelihood(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCauses = cleanList(causes);
    const finalResponseActions = cleanList(responseActions);
    const finalPreventiveActions = cleanList(preventiveActions);

    const payload: RiskRequestFormData = {
      riskId: selectedRisk?.id ?? null,
      mode,
      department: USER_DEPARTMENT,
      category,
      name: riskName,
      date,
      impact,
      likelihood,
      score,
      postImpact,
      postLikelihood,
      postScore,
      responsibleEntityId: selectedResponsible?.id ?? '',
      responsibleEntityName: selectedResponsible?.entityName ?? '',
      responsiblePerson: selectedResponsible?.contactName || '',
      contactPhoneNumber: selectedResponsible?.contactPhoneNumber || '',
      contactEmail: selectedResponsible?.contactEmail || '',
      location,
      customResponsible: formData.customResponsible,
      semester: formData.semester,
      strategicGoal,
      causes: finalCauses,
      responseActions: finalResponseActions,
      preventiveActions: finalPreventiveActions,
      mitigationActions: finalPreventiveActions
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md text-lg">
      <form onSubmit={handleSubmit}>
        <div className="p-8 md:p-10 space-y-8">
          <h2 className="text-3xl font-bold text-right">{title}</h2>

          <div className="flex border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => !disabled && setMode('before')}
              disabled={disabled}
              className={`flex-1 py-5 flex items-center justify-center gap-3 text-lg transition-all ${
                mode === 'before'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-gray-100 text-gray-600'
              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Shield /> خطر محتمل ووقائي
            </button>

            <button
              type="button"
              onClick={() => !disabled && setMode('after')}
              disabled={disabled}
              className={`flex-1 py-5 flex items-center justify-center gap-3 text-lg transition-all ${
                mode === 'after'
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-gray-100 text-gray-600'
              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <AlertTriangle /> خطر وقع بالفعل
            </button>
          </div>

          {/* الفئة والخطر والتاريخ */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-2xl font-bold text-right">بيانات الخطر الأساسية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-3 text-right font-semibold">القسم</label>
                <input
                  disabled
                  value={USER_DEPARTMENT}
                  className="w-full px-4 py-4 rounded-xl bg-gray-100 text-right"
                />
              </div>

              <div>
                <label className="block mb-3 text-right font-semibold">الفئة</label>
                <div className="relative">
                  <Building2
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    className="w-full pl-4 pr-12 py-4 rounded-xl border bg-gray-50 text-right"
                    value={category}
                    disabled={disabled || isLoadingMasterData}
                    onChange={e => handleCategoryChange(e.target.value)}
                    required
                  >
                    <option value="">اختر الفئة</option>
                    {categories.map(item => (
                      <option key={item.id} value={item.categoryName}>
                        {item.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-3 text-right font-semibold">اسم الخطر</label>
                <select
                  className={`w-full px-4 py-4 rounded-xl border text-right ${
                    !category ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50'
                  }`}
                  value={riskName}
                  disabled={disabled || isLoadingMasterData || !category}
                  onChange={e => setRiskName(e.target.value)}
                  required
                >
                  <option value="">
                    {category ? 'اختر خطرًا' : 'اختر الفئة أولًا'}
                  </option>
                  {selectedRiskOptions.map(risk => (
                    <option key={risk.id} value={risk.riskName}>
                      {risk.riskName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-3 text-right font-semibold">التاريخ</label>
                <div className="relative">
                  <CalendarDays
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="date"
                    className="w-full pl-4 pr-12 py-4 rounded-xl border bg-gray-50 text-right"
                    value={date}
                    disabled={disabled}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* الغاية الاستراتيجية */}
          <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('strategicGoals')}
              className="w-full px-5 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-gray-500">
                {expandedSections.strategicGoals ? <ChevronDown size={22} /> : <ChevronLeft size={22} />}
                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  {selectedRiskStrategicGoals.length} عنصر
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <h4 className="text-xl font-bold text-gray-800">الغاية الاستراتيجية التي يؤثر بها الخطر</h4>
                <Target size={20} className="text-blue-600" />
              </div>
            </button>

            {expandedSections.strategicGoals && (
              <div className="border-t border-gray-200 p-5 space-y-3 bg-gray-50">
                {selectedRiskStrategicGoals.length === 0 ? (
                  <div className="px-4 py-3 rounded-xl bg-white border text-right text-gray-500">
                    لا توجد غايات استراتيجية مرتبطة بالخطر المختار
                  </div>
                ) : (
                  selectedRiskStrategicGoals.map((goal, index) => (
                    <div key={`${goal}-${index}`} className="px-4 py-3 rounded-xl bg-white border text-right">
                      {goal}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* تقييم الخطر */}
          <div className="p-6 md:p-8 bg-gray-50 rounded-2xl space-y-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedRisk ? 'تم جلب القيم من الخطر المختار' : 'يمكنك اختيار الفئة والخطر لاحقًا'}
              </div>
              <h3 className="text-2xl font-bold text-right">تقييم الخطر</h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
              <RiskLevelsInfo />

              <div className="xl:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div>
                    <label className="block mb-2 text-right font-semibold">
                      شدة أثر الخطر: <span className="font-bold">{impact}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={impact}
                      disabled={disabled || !!selectedRisk}
                      onChange={e => setImpact(+e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-right font-semibold">
                      احتمالية الخطر: <span className="font-bold">{likelihood}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={likelihood}
                      disabled={disabled || !!selectedRisk}
                      onChange={e => setLikelihood(+e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div
                    className={`${getRiskColor(
                      score
                    )} text-white rounded-2xl p-6 text-center text-2xl font-bold shadow-sm`}
                  >
                    {score}
                    <div className="text-base mt-2">{getRiskLabel(score)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div className="bg-green-500 text-white rounded-lg p-3">منخفض</div>
                  <div className="bg-yellow-500 text-white rounded-lg p-3">متوسط</div>
                  <div className="bg-orange-500 text-white rounded-lg p-3">عالي</div>
                  <div className="bg-red-600 text-white rounded-lg p-3">حرج</div>
                </div>
              </div>
            </div>
          </div>

          {/* الجهة + الشخص + الاتصال + المكان */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-2xl font-bold text-right">جهة المعالجة والتواصل</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center justify-end gap-2 mb-3 text-right font-semibold">
                  <span>الجهة المسؤولة عن معالجة الخطر</span>
                  <Building2 size={18} className="text-gray-500" />
                </label>
                <select
                  value={responsibleId}
                  disabled={disabled || isLoadingMasterData}
                  onChange={e => setResponsibleId(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border bg-gray-50 text-right"
                >
                  <option value="">اختر الجهة المسؤولة</option>
                  {responsibleEntities.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.entityName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center justify-end gap-2 mb-3 text-right font-semibold">
                  <span>الشخص المسؤول</span>
                  <User size={18} className="text-gray-500" />
                </label>
                <select
                  value={responsibleId}
                  disabled={disabled || isLoadingMasterData}
                  onChange={e => setResponsibleId(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border bg-gray-50 text-right"
                >
                  <option value="">اختر الشخص المسؤول</option>
                  {responsibleEntities.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.contactName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center justify-end gap-2 mb-3 text-right font-semibold">
                  <span>رقم الهاتف</span>
                  <Phone size={18} className="text-gray-500" />
                </label>
                <input
                  readOnly
                  value={selectedResponsible?.contactPhoneNumber || ''}
                  className="w-full px-4 py-4 rounded-xl border bg-gray-100 text-right"
                  placeholder="يتم تعبئته تلقائيًا"
                />
              </div>

              <div>
                <label className="flex items-center justify-end gap-2 mb-3 text-right font-semibold">
                  <span>البريد الإلكتروني</span>
                  <Mail size={18} className="text-gray-500" />
                </label>
                <input
                  readOnly
                  value={selectedResponsible?.contactEmail || ''}
                  className="w-full px-4 py-4 rounded-xl border bg-gray-100 text-right"
                  placeholder="يتم تعبئته تلقائيًا"
                />
              </div>

              <div>
                <label className="block mb-3 text-right font-semibold">
                  {mode === 'before' ? 'الوقت المتوقع للحدوث' : 'الفصل الذي وقع فيه الخطر'}
                </label>
                <select
                  value={formData.semester}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      semester: e.target.value as SemesterValue
                    }))
                  }
                  disabled={disabled}
                  className="w-full px-4 py-4 rounded-xl border bg-gray-50 text-right"
                >
                  <option value="first">الفصل الأول</option>
                  <option value="second">الفصل الثاني</option>
                  <option value="summer">الفصل الصيفي</option>
                </select>
              </div>

              <div>
                <label className="flex items-center justify-end gap-2 mb-3 text-right font-semibold">
                  <span>مكان الخطر</span>
                  <MapPin size={18} className="text-gray-500" />
                </label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  disabled={disabled}
                  className="w-full px-4 py-4 rounded-xl border bg-gray-50 text-right"
                  placeholder="مكان الخطر"
                  required
                />
              </div>
            </div>
          </div>

          {/* الأسباب والإجراءات بنفس الستايل المطلوب */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
            {renderAccordionListSection(
              'causes',
              'الأسباب المحتملة لحدوث الخطر',
              causes,
              setCauses,
              'أدخل سببًا محتملاً',
              causeTemplates,
              selectedCauseTemplate,
              setSelectedCauseTemplate,
              () =>
                addTemplateValue(
                  selectedCauseTemplate,
                  causes,
                  setCauses,
                  () => setSelectedCauseTemplate('')
                ),
              'اختر سببًا جاهزًا',
              <AlertCircle size={20} />
            )}

            {renderAccordionListSection(
              'responseActions',
              'الإجراءات التي تتخذها الجهة المسؤولة عند وقوع الخطر',
              responseActions,
              setResponseActions,
              'أدخل إجراءً عند وقوع الخطر',
              actionTemplates,
              selectedActionTemplate,
              setSelectedActionTemplate,
              () =>
                addTemplateValue(
                  selectedActionTemplate,
                  responseActions,
                  setResponseActions,
                  () => setSelectedActionTemplate('')
                ),
              'اختر إجراءً جاهزًا',
              <Siren size={20} />
            )}

            {renderAccordionListSection(
              'preventiveActions',
              'الإجراءات الواجب اتباعها لتفادي حدوث تلك المخاطر',
              preventiveActions,
              setPreventiveActions,
              'أدخل إجراءً وقائيًا',
              preventiveTemplates,
              selectedPreventiveTemplate,
              setSelectedPreventiveTemplate,
              () =>
                addTemplateValue(
                  selectedPreventiveTemplate,
                  preventiveActions,
                  setPreventiveActions,
                  () => setSelectedPreventiveTemplate('')
                ),
              'اختر إجراءً وقائيًا جاهزًا',
              <ShieldCheck size={20} />
            )}
          </div>

          {mode === 'after' && (
            <div className="p-6 md:p-8 bg-gray-50 rounded-2xl space-y-6 border border-gray-100">
              <h3 className="text-2xl font-bold text-right">تقييم الخطر بعد 3 أشهر</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block mb-2 text-right font-semibold">
                    شدة الأثر: {postImpact}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={postImpact}
                    disabled={disabled}
                    onChange={e => setPostImpact(+e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-right font-semibold">
                    الاحتمالية: {postLikelihood}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={postLikelihood}
                    disabled={disabled}
                    onChange={e => setPostLikelihood(+e.target.value)}
                    className="w-full"
                  />
                </div>

                <div
                  className={`${getRiskColor(
                    postScore
                  )} text-white rounded-2xl p-6 text-center text-2xl font-bold shadow-sm`}
                >
                  {postScore}
                  <div className="text-base mt-2">{getRiskLabel(postScore)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={disabled}
              className={`px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold ${
                disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {submitLabel}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 border rounded-xl text-lg"
            >
              إلغاء
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewRequestForm;