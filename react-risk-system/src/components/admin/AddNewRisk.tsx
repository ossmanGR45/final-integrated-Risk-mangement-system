import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Save,
  ShieldAlert,
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  User,
  Target,
  ChevronDown,
  ChevronLeft,
  AlertCircle,
  Siren,
  ShieldCheck
} from 'lucide-react';
import { calculateRiskScore, getRiskColor, getRiskLabel } from '../../utils/riskCalculations';

interface AddNewRiskProps {
  onSubmit?: (data: any) => void;
  onCancel: () => void;
  initialData?: Partial<AddRiskInitialData>;
  initialTab?: TabKey;
  keepTabAfterCreate?: boolean;
}

interface AddRiskInitialData {
  department: string;
  riskName: string;
  riskDescription: string;
  categoryID: number | string;
  categoryName: string;
  likelihood: number;
  impact: number;
  responsibleId: number | string;
  location: string;
  causes: string[];
  responseActions: string[];
  preventiveActions: string[];
  strategicGoals: string[];
  /**
   * If this form was opened by an admin accepting an existing Risk
   * suggestion, this is the id of that Risk row. We send it back to
   * /api/risk/addUpdate so the backend updates the existing record
   * (and flips Custom=false because Status=Accepted) rather than
   * creating a duplicate.
   */
  proposalId?: number | string | null;
}

interface CategoryItem {
  id: number;
  categoryName: string;
  risks?: any;
}

interface ResponsibleItem {
  id: number;
  entityName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
}

interface DepartmentItem {
  id: number;
  name: string;
}

interface StrategicGoalCatalogItem {
  id: number;
  goalDescription?: string | null;
  goalReference?: string | null;
}

interface CauseItem {
  id: number;
  causeDescription?: string | null;
}

interface ActionItem {
  id: number;
  actionDescription?: string | null;
  actionType?: number | string | null;
}

type TabKey =
  | 'category'
  | 'responsible'
  | 'department'
  | 'strategicGoal'
  | 'cause'
  | 'responseAction'
  | 'preventiveAction'
  | 'risk';
type SectionKey = 'strategicGoals' | 'causes' | 'responseActions' | 'preventiveActions';

const emptyList: string[] = [];
const API_BASE = 'https://localhost:7002/api';

const AddNewRisk: React.FC<AddNewRiskProps> = ({
  onCancel,
  onSubmit,
  initialData,
  initialTab = 'risk',
  keepTabAfterCreate = false
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [responsibleEntities, setResponsibleEntities] = useState<ResponsibleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [strategicGoalsCatalog, setStrategicGoalsCatalog] = useState<StrategicGoalCatalogItem[]>([]);
  const [causesCatalog, setCausesCatalog] = useState<CauseItem[]>([]);
  const [actionsCatalog, setActionsCatalog] = useState<ActionItem[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    strategicGoals: false,
    causes: false,
    responseActions: false,
    preventiveActions: false
  });

  const [categoryForm, setCategoryForm] = useState({
    categoryName: ''
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: ''
  });

  const [strategicGoalForm, setStrategicGoalForm] = useState({
    goalDescription: ''
  });

  const [causeForm, setCauseForm] = useState({
    causeDescription: ''
  });

  const [responseActionForm, setResponseActionForm] = useState({
    actionDescription: ''
  });

  const [preventiveActionForm, setPreventiveActionForm] = useState({
    actionDescription: ''
  });

  const [responsibleForm, setResponsibleForm] = useState({
    entityName: '',
    contactName: '',
    contactEmail: '',
    contactPhoneNumber: ''
  });

  const [riskForm, setRiskForm] = useState({
    department: '',
    riskName: '',
    riskDescription: '',
    categoryID: '',
    likelihood: 1,
    impact: 1,
    responsibleId: '',
    location: ''
  });

  const [causes, setCauses] = useState<string[]>(emptyList);
  const [responseActions, setResponseActions] = useState<string[]>(emptyList);
  const [preventiveActions, setPreventiveActions] = useState<string[]>(emptyList);
  const [strategicGoals, setStrategicGoals] = useState<string[]>(emptyList);

  // When the admin opens this form via "accept proposal", we keep the id of
  // the existing Risk suggestion so we update it instead of creating a duplicate.
  const [proposalId, setProposalId] = useState<number | null>(null);

  const [selectedCauseTemplate, setSelectedCauseTemplate] = useState('');
  const [selectedActionTemplate, setSelectedActionTemplate] = useState('');
  const [selectedPreventiveTemplate, setSelectedPreventiveTemplate] = useState('');
  const [selectedStrategicGoalTemplate, setSelectedStrategicGoalTemplate] = useState('');

  const token = localStorage.getItem('authToken') || 'mock-admin-token';

  const score = useMemo(
    () => calculateRiskScore(riskForm.impact, riskForm.likelihood),
    [riskForm.impact, riskForm.likelihood]
  );

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === Number(riskForm.categoryID)) || null,
    [categories, riskForm.categoryID]
  );

  const selectedResponsible = useMemo(
    () => responsibleEntities.find(r => r.id === Number(riskForm.responsibleId)) || null,
    [responsibleEntities, riskForm.responsibleId]
  );

  const cleanList = (items: string[]) => items.map(i => i.trim()).filter(Boolean);

  const mapStrategicGoalLabelsToIds = (
    labels: string[],
    catalog: StrategicGoalCatalogItem[]
  ): { id: number }[] => {
    const seen = new Set<number>();
    const out: { id: number }[] = [];
    for (const raw of labels) {
      const t = raw.trim().toLowerCase();
      if (!t) continue;
      const found = catalog.find(
        g =>
          (g.goalDescription && g.goalDescription.trim().toLowerCase() === t) ||
          (g.goalReference && g.goalReference.trim().toLowerCase() === t)
      );
      if (found && !seen.has(found.id)) {
        seen.add(found.id);
        out.push({ id: found.id });
      }
    }
    return out;
  };

  const formatApiError = (result: unknown): string => {
    if (result == null || typeof result !== 'object') return '';
    const r = result as Record<string, unknown>;
    if (typeof r.message === 'string' && r.message) return r.message;
    if (typeof r.detail === 'string' && r.detail) return String(r.detail);
    if (typeof r.title === 'string' && r.title) {
      return typeof r.detail === 'string' ? `${r.title}: ${r.detail}` : r.title;
    }
    const errs = r.errors;
    if (errs && typeof errs === 'object') {
      const parts = Object.values(errs as Record<string, unknown>)
        .flatMap(v => (Array.isArray(v) ? v.map(String) : [String(v)]))
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    return '';
  };

  const countFilled = (items: string[]) => items.filter(item => item.trim()).length;

  const uniqueValues = (items: Array<string | null | undefined>) => {
    return Array.from(new Set(items.map(item => (item || '').trim()).filter(Boolean)));
  };

  const causeTemplates = useMemo(() => {
    return uniqueValues(causesCatalog.map(cause => cause.causeDescription));
  }, [causesCatalog]);

  const actionTemplates = useMemo(() => {
    return uniqueValues(
      actionsCatalog
        .filter(action => action.actionType === 1 || action.actionType === 'Reduction')
        .map(action => action.actionDescription)
    );
  }, [actionsCatalog]);

  const preventiveTemplates = useMemo(() => {
    return uniqueValues(
      actionsCatalog
        .filter(action => action.actionType === 0 || action.actionType === 'Avoidance')
        .map(action => action.actionDescription)
    );
  }, [actionsCatalog]);

  const strategicGoalTemplates = useMemo(() => {
    return uniqueValues(
      strategicGoalsCatalog.map(goal => goal.goalDescription || goal.goalReference)
    );
  }, [strategicGoalsCatalog]);

  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  };

  const fetchMasterData = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const headers: HeadersInit = authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {};

      const [
        categoriesRes,
        responsibleRes,
        strategicGoalsRes,
        causesRes,
        actionsRes,
        departmentsRes
      ] = await Promise.all([
        fetch(`${API_BASE}/category`, { headers }),
        fetch(`${API_BASE}/responsible`, { headers }),
        fetch(`${API_BASE}/strategicgoal`, { headers }),
        // Admin sees ALL items (Custom=true and Custom=false). Pass an
        // explicit ?custom= query so the backend's default non-admin scoping
        // doesn't apply.
        fetch(`${API_BASE}/cause`, { headers }),
        fetch(`${API_BASE}/action`, { headers }),
        fetch(`${API_BASE}/departments`, { headers })
      ]);

      const categoriesData = await parseJsonSafe(categoriesRes);
      const responsibleData = await parseJsonSafe(responsibleRes);
      const strategicGoalsData = await parseJsonSafe(strategicGoalsRes);
      const causesData = await parseJsonSafe(causesRes);
      const actionsData = await parseJsonSafe(actionsRes);
      const departmentsData = await parseJsonSafe(departmentsRes);

      if (!categoriesRes.ok) {
        throw new Error(categoriesData?.message || 'فشل تحميل الفئات');
      }

      if (!responsibleRes.ok) {
        throw new Error(responsibleData?.message || 'فشل تحميل الجهات المسؤولة');
      }

      if (!strategicGoalsRes.ok) {
        throw new Error(strategicGoalsData?.message || 'فشل تحميل الغايات الاستراتيجية');
      }

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setResponsibleEntities(Array.isArray(responsibleData) ? responsibleData : []);
      setStrategicGoalsCatalog(
        strategicGoalsRes.ok && Array.isArray(strategicGoalsData) ? strategicGoalsData : []
      );
      setCausesCatalog(causesRes.ok && Array.isArray(causesData) ? causesData : []);
      setActionsCatalog(actionsRes.ok && Array.isArray(actionsData) ? actionsData : []);
      setDepartments(departmentsRes.ok && Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      console.error('Error loading master data:', error);
      alert(
        `حدث خطأ أثناء تحميل البيانات الأساسية: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!initialData) return;

    setActiveTab('risk');

    // Capture the proposal id (if any) so handleCreateRisk includes it in the
    // payload and the backend updates the existing Risk row instead of inserting.
    if (initialData.proposalId !== undefined && initialData.proposalId !== null) {
      const numeric = Number(initialData.proposalId);
      setProposalId(Number.isFinite(numeric) && numeric > 0 ? numeric : null);
    } else {
      setProposalId(null);
    }

    setRiskForm(prev => ({
      ...prev,
      department: initialData.department ?? '',
      riskName: initialData.riskName ?? '',
      riskDescription: initialData.riskDescription ?? '',
      categoryID:
        initialData.categoryID !== undefined && initialData.categoryID !== null
          ? String(initialData.categoryID)
          : '',
      likelihood:
        typeof initialData.likelihood === 'number' && initialData.likelihood > 0
          ? initialData.likelihood
          : 1,
      impact:
        typeof initialData.impact === 'number' && initialData.impact > 0
          ? initialData.impact
          : 1,
      responsibleId:
        initialData.responsibleId !== undefined && initialData.responsibleId !== null
          ? String(initialData.responsibleId)
          : '',
      location: initialData.location ?? ''
    }));

    setCauses(
      Array.isArray(initialData.causes) && initialData.causes.length > 0
        ? initialData.causes
        : []
    );

    setResponseActions(
      Array.isArray(initialData.responseActions) && initialData.responseActions.length > 0
        ? initialData.responseActions
        : []
    );

    setPreventiveActions(
      Array.isArray(initialData.preventiveActions) && initialData.preventiveActions.length > 0
        ? initialData.preventiveActions
        : []
    );

    setStrategicGoals(
      Array.isArray(initialData.strategicGoals) && initialData.strategicGoals.length > 0
        ? initialData.strategicGoals
        : []
    );
  }, [initialData]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
    setter(prev => prev.filter((_, i) => i !== index));
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

    setter(prev => [...prev, value]);

    resetTemplate();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryForm.categoryName.trim()) {
      alert('الرجاء إدخال اسم الفئة');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/category/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName: categoryForm.categoryName.trim()
        })
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(result?.message || 'فشل إنشاء الفئة');
        return;
      }

      if (result?.data) {
        setCategories(prev => [...prev, result.data]);
      } else {
        await fetchMasterData();
      }

      setCategoryForm({ categoryName: '' });
      alert(result?.message || 'تمت إضافة الفئة بنجاح');
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert(`حدث خطأ أثناء إضافة الفئة: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResponsible = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !responsibleForm.entityName.trim() ||
      !responsibleForm.contactName.trim() ||
      !responsibleForm.contactPhoneNumber.trim()
    ) {
      alert('الرجاء تعبئة اسم الجهة واسم الشخص المسؤول ورقم الهاتف');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/responsible/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          entityName: responsibleForm.entityName.trim(),
          contactName: responsibleForm.contactName.trim(),
          contactEmail: responsibleForm.contactEmail.trim(),
          contactPhoneNumber: responsibleForm.contactPhoneNumber.trim()
        })
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(result?.message || 'فشل إنشاء الجهة المسؤولة');
        return;
      }

      if (result?.data) {
        setResponsibleEntities(prev => [...prev, result.data]);
      } else {
        await fetchMasterData();
      }

      setResponsibleForm({
        entityName: '',
        contactName: '',
        contactEmail: '',
        contactPhoneNumber: ''
      });

      alert(result?.message || 'تمت إضافة الجهة المسؤولة بنجاح');
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating responsible entity:', error);
      alert(
        `حدث خطأ أثناء إضافة الجهة المسؤولة: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentForm.name.trim()) {
      alert('الرجاء إدخال اسم القسم');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/departments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: departmentForm.name.trim()
        })
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(formatApiError(result) || 'فشل إنشاء القسم');
        return;
      }

      setDepartmentForm({ name: '' });
      alert('تمت إضافة القسم بنجاح');
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert(`حدث خطأ أثناء إضافة القسم: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStrategicGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strategicGoalForm.goalDescription.trim()) {
      alert('الرجاء إدخال الغاية الاستراتيجية');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/strategicgoal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          goalDescription: strategicGoalForm.goalDescription.trim()
        })
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(formatApiError(result) || 'فشل إنشاء الغاية الاستراتيجية');
        return;
      }

      setStrategicGoalForm({ goalDescription: '' });
      await fetchMasterData();
      alert('تمت إضافة الغاية الاستراتيجية بنجاح');
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating strategic goal:', error);
      alert(
        `حدث خطأ أثناء إضافة الغاية الاستراتيجية: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCause = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!causeForm.causeDescription.trim()) {
      alert('الرجاء إدخال السبب');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/cause/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          causeDescription: causeForm.causeDescription.trim()
        })
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(formatApiError(result) || 'فشل إنشاء السبب');
        return;
      }

      setCauseForm({ causeDescription: '' });
      await fetchMasterData();
      alert('تمت إضافة السبب بنجاح');
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating cause:', error);
      alert(`حدث خطأ أثناء إضافة السبب: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createAction = async (description: string, actionType: 0 | 1, successMessage: string) => {
    const response = await fetch(`${API_BASE}/action/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        actionDescription: description.trim(),
        actionType
      })
    });

    const result = await parseJsonSafe(response);

    if (!response.ok) {
      throw new Error(formatApiError(result) || 'فشل إنشاء الإجراء');
    }

    await fetchMasterData();
    alert(successMessage);
  };

  const handleCreateResponseAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseActionForm.actionDescription.trim()) {
      alert('الرجاء إدخال الإجراء عند وقوع الخطر');
      return;
    }

    setIsLoading(true);
    try {
      await createAction(
        responseActionForm.actionDescription,
        1,
        'تمت إضافة إجراء عند وقوع الخطر بنجاح'
      );
      setResponseActionForm({ actionDescription: '' });
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating response action:', error);
      alert(
        `حدث خطأ أثناء إضافة الإجراء عند وقوع الخطر: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePreventiveAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!preventiveActionForm.actionDescription.trim()) {
      alert('الرجاء إدخال الإجراء الوقائي');
      return;
    }

    setIsLoading(true);
    try {
      await createAction(preventiveActionForm.actionDescription, 0, 'تمت إضافة الإجراء الوقائي بنجاح');
      setPreventiveActionForm({ actionDescription: '' });
      if (!keepTabAfterCreate) {
        setActiveTab('risk');
      }
    } catch (error) {
      console.error('Error creating preventive action:', error);
      alert(
        `حدث خطأ أثناء إضافة الإجراء الوقائي: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !riskForm.categoryID ||
      !riskForm.riskName.trim() ||
      !riskForm.department.trim() ||
      !riskForm.location.trim()
    ) {
      alert('الرجاء تعبئة الحقول الأساسية للمخاطرة');
      return;
    }

    const causeDtos = cleanList(causes).map(causeDescription => ({ causeDescription }));
    const actions = [
      ...cleanList(responseActions).map(actionDescription => ({
        actionDescription,
        actionType: 1
      })),
      ...cleanList(preventiveActions).map(actionDescription => ({
        actionDescription,
        actionType: 0
      }))
    ];
    const strategicGoalDtos = mapStrategicGoalLabelsToIds(
      cleanList(strategicGoals),
      strategicGoalsCatalog
    );

    const payload: Record<string, unknown> = {
      department: riskForm.department.trim(),
      riskName: riskForm.riskName.trim(),
      riskDescription: riskForm.riskDescription.trim(),
      categoryName: selectedCategory?.categoryName || '',
      likelihood: riskForm.likelihood,
      impact: riskForm.impact,
      responsibleId: riskForm.responsibleId ? Number(riskForm.responsibleId) : null,
      location: riskForm.location.trim(),
      // Admin-created risks are accepted immediately and become standard
      // catalog entries (Custom=false enforced server-side).
      status: 3, // Accepted
      actions,
      causes: causeDtos,
      strategicGoals: strategicGoalDtos
    };

    // If we got here from "accept proposal", include the existing record id
    // so the backend updates that row (and flips Custom=false because
    // Status=Accepted) rather than creating a duplicate.
    if (proposalId) {
      payload.id = proposalId;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/risk/addUpdate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await parseJsonSafe(response);

      if (!response.ok) {
        alert(formatApiError(result) || 'فشل حفظ المخاطرة');
        return;
      }

      alert(result?.message || 'تمت إضافة المخاطرة مباشرة إلى قاعدة البيانات');

      onSubmit?.(result?.data ?? payload);

      setRiskForm({
        department: '',
        riskName: '',
        riskDescription: '',
        categoryID: '',
        likelihood: 1,
        impact: 1,
        responsibleId: '',
        location: ''
      });

      setCauses([]);
      setResponseActions([]);
      setPreventiveActions([]);
      setStrategicGoals([]);

      setSelectedCauseTemplate('');
      setSelectedActionTemplate('');
      setSelectedPreventiveTemplate('');
      setSelectedStrategicGoalTemplate('');
    } catch (error) {
      console.error('Error creating risk:', error);
      alert(`حدث خطأ أثناء إضافة المخاطرة: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
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
    onNavigateToCreate: () => void,
    actionButtonLabel: string,
    suggestionPlaceholder: string,
    icon: React.ReactNode,
    showAddCustomButton: boolean = true
  ) => {
    const isOpen = expandedSections[key];
    const itemsCount = countFilled(values);

    return (
      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(key)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 text-gray-500">
            {isOpen ? <ChevronDown size={24} /> : <ChevronLeft size={24} />}
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
          <div className="border-t border-gray-200 p-6 space-y-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateToCreate}
                className="px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 whitespace-nowrap"
              >
                {actionButtonLabel}
              </button>

              <select
                value={selectedSuggestion}
                onChange={(e) => onSelectSuggestion(e.target.value)}
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

            {values.map((item, index) => (
              <div key={`${title}-${index}`} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => removeListItem(setter, index)}
                  className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
                >
                  حذف
                </button>

                <div className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-right">
                  {item}
                </div>
              </div>
            ))}

            {showAddCustomButton && (
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

  return (
    <div className="bg-white rounded-2xl shadow-md">
      <div className="p-8 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-right">إدارة بيانات المخاطر</h2>
        <p className="text-gray-600 mt-2 text-right">
          من هنا يستطيع الأدمن إضافة فئة جديدة أو جهة مسؤولة أو مخاطرة جديدة مباشرة إلى قاعدة البيانات
        </p>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'risk'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert size={20} />
              إضافة مخاطرة
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'category'
                ? 'bg-green-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 size={20} />
              إضافة فئة
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responsible')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'responsible'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={20} />
              إضافة جهة مسؤولة
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('department')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'department'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 size={20} />
              إضافة قسم
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('strategicGoal')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'strategicGoal'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Target size={20} />
              إضافة غاية استراتيجية
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cause')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'cause'
                ? 'bg-red-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle size={20} />
              إضافة سبب
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responseAction')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'responseAction'
                ? 'bg-orange-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Siren size={20} />
              إضافة إجراء عند وقوع الخطر
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preventiveAction')}
            className={`rounded-2xl p-5 text-lg font-bold transition ${
              activeTab === 'preventiveAction'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={20} />
              إضافة إجراء وقائي
            </div>
          </button>
        </div>

        {activeTab === 'category' && (
          <form onSubmit={handleCreateCategory} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة فئة جديدة</h3>

              <div>
                <label className="block mb-3 text-right font-semibold">اسم الفئة</label>
                <input
                  value={categoryForm.categoryName}
                  onChange={(e) => setCategoryForm({ categoryName: e.target.value })}
                  className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                  placeholder="مثال: مخاطر الصحة والسلامة العامة"
                />
              </div>

              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60"
                >
                  حفظ الفئة
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 border rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'department' && (
          <form onSubmit={handleCreateDepartment} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة قسم جديد</h3>

              <div>
                <label className="block mb-3 text-right font-semibold">اسم القسم</label>
                <input
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ name: e.target.value })}
                  className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                  placeholder="مثال: قسم الصيانة والخدمات"
                />
              </div>

              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-60"
                >
                  حفظ القسم
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 border rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'strategicGoal' && (
          <form onSubmit={handleCreateStrategicGoal} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة غاية استراتيجية جديدة</h3>

              <div>
                <label className="block mb-3 text-right font-semibold">الغاية الاستراتيجية</label>
                <input
                  value={strategicGoalForm.goalDescription}
                  onChange={(e) => setStrategicGoalForm({ goalDescription: e.target.value })}
                  className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                  placeholder="مثال: تعزيز السلامة والصحة المهنية في بيئة العمل"
                />
              </div>

              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-60"
                >
                  حفظ الغاية الاستراتيجية
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 border rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'cause' && (
          <form onSubmit={handleCreateCause} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة سبب جديد</h3>

              <div>
                <label className="block mb-3 text-right font-semibold">السبب</label>
                <input
                  value={causeForm.causeDescription}
                  onChange={(e) => setCauseForm({ causeDescription: e.target.value })}
                  className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                  placeholder="مثال: ضعف الالتزام بإجراءات السلامة"
                />
              </div>

              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60"
                >
                  حفظ السبب
                </button>
                <button type="button" onClick={onCancel} className="px-8 py-4 border rounded-xl">
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'responseAction' && (
          <form onSubmit={handleCreateResponseAction} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة إجراء عند وقوع الخطر</h3>
              <div>
                <label className="block mb-3 text-right font-semibold">الإجراء</label>
                <input
                  value={responseActionForm.actionDescription}
                  onChange={(e) => setResponseActionForm({ actionDescription: e.target.value })}
                  className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                  placeholder="مثال: عزل المنطقة المتأثرة فورًا"
                />
              </div>
              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-60"
                >
                  حفظ الإجراء
                </button>
                <button type="button" onClick={onCancel} className="px-8 py-4 border rounded-xl">
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'preventiveAction' && (
          <form onSubmit={handleCreatePreventiveAction} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة إجراء وقائي</h3>
              <div>
                <label className="block mb-3 text-right font-semibold">الإجراء الوقائي</label>
                <input
                  value={preventiveActionForm.actionDescription}
                  onChange={(e) => setPreventiveActionForm({ actionDescription: e.target.value })}
                  className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                  placeholder="مثال: تنفيذ تدريب دوري على إجراءات السلامة"
                />
              </div>
              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60"
                >
                  حفظ الإجراء الوقائي
                </button>
                <button type="button" onClick={onCancel} className="px-8 py-4 border rounded-xl">
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'responsible' && (
          <form onSubmit={handleCreateResponsible} className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
              <h3 className="text-2xl font-bold text-right">إضافة جهة مسؤولة جديدة</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 text-right font-semibold">اسم الجهة المسؤولة</label>
                  <input
                    value={responsibleForm.entityName}
                    onChange={(e) =>
                      setResponsibleForm(prev => ({ ...prev, entityName: e.target.value }))
                    }
                    className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                    placeholder="مثال: لجنة السلامة العامة"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">الشخص المسؤول للاتصال به</label>
                  <input
                    value={responsibleForm.contactName}
                    onChange={(e) =>
                      setResponsibleForm(prev => ({ ...prev, contactName: e.target.value }))
                    }
                    className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                    placeholder="مثال: مدير مكتب السلامة العامة"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">البريد الإلكتروني</label>
                  <input
                    value={responsibleForm.contactEmail}
                    onChange={(e) =>
                      setResponsibleForm(prev => ({ ...prev, contactEmail: e.target.value }))
                    }
                    className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                    placeholder="example@ju.edu.jo"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">رقم الهاتف</label>
                  <input
                    value={responsibleForm.contactPhoneNumber}
                    onChange={(e) =>
                      setResponsibleForm(prev => ({ ...prev, contactPhoneNumber: e.target.value }))
                    }
                    className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                    placeholder="0790000000"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-start">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-60"
                >
                  حفظ الجهة المسؤولة
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 border rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'risk' && (
          <form onSubmit={handleCreateRisk} className="space-y-8">
            <div className="bg-gray-50 rounded-2xl p-8 space-y-8">
              <h3 className="text-2xl font-bold text-right">إضافة مخاطرة جديدة</h3>

              
              {renderAccordionListSection(
                'strategicGoals',
                'المؤشر / الغاية الإستراتيجية',
                strategicGoals,
                setStrategicGoals,
                '',
                strategicGoalTemplates,
                selectedStrategicGoalTemplate,
                (value) =>
                  addTemplateValue(value, strategicGoals, setStrategicGoals, () =>
                    setSelectedStrategicGoalTemplate('')
                  ),
                () => setActiveTab('strategicGoal'),
                'أضف غاية استراتيجية',
                'اختر غاية استراتيجية جاهزة',
                <Target size={20} />,
                false
              )}
              

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 text-right font-semibold">الفئة</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('category')}
                      className="px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 whitespace-nowrap"
                    >
                      أضف فئة
                    </button>

                    <select
                      value={riskForm.categoryID}
                      onChange={(e) =>
                        setRiskForm(prev => ({ ...prev, categoryID: e.target.value }))
                      }
                      className="flex-1 px-4 py-4 border rounded-xl bg-white text-right"
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">اسم الخطر</label>
                  <input
                    value={riskForm.riskName}
                    onChange={(e) =>
                      setRiskForm(prev => ({ ...prev, riskName: e.target.value }))
                    }
                    className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                    placeholder="مثال: إصابات العمل"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">القسم</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('department')}
                      className="px-4 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 whitespace-nowrap"
                    >
                      أضف قسم
                    </button>

                    <select
                      value={riskForm.department}
                      onChange={(e) =>
                        setRiskForm(prev => ({ ...prev, department: e.target.value }))
                      }
                      className="flex-1 px-4 py-4 border rounded-xl bg-white text-right"
                    >
                      <option value="">اختر القسم</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.name}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">وصف الخطر</label>
                  <input
                    value={riskForm.riskDescription}
                    onChange={(e) =>
                      setRiskForm(prev => ({ ...prev, riskDescription: e.target.value }))
                    }
                    className="w-full px-4 py-4 border rounded-xl bg-white text-right"
                    placeholder="وصف مختصر للمخاطرة"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border space-y-6">
                <h4 className="text-xl font-bold text-right">تقييم الخطر</h4>

                <div className="grid grid-cols-3 gap-8 items-end">
                  <div>
                    <label className="block mb-2 text-right font-semibold">
                      احتمالية الخطر: {riskForm.likelihood}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={riskForm.likelihood}
                      onChange={(e) =>
                        setRiskForm(prev => ({ ...prev, likelihood: Number(e.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-right font-semibold">
                      شدة أثر الخطر: {riskForm.impact}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={riskForm.impact}
                      onChange={(e) =>
                        setRiskForm(prev => ({ ...prev, impact: Number(e.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div className={`${getRiskColor(score)} text-white rounded-2xl p-6 text-center`}>
                    <div className="text-3xl font-bold">{score}</div>
                    <div className="mt-2 text-base">{getRiskLabel(score)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block mb-3 text-right font-semibold">
                    الجهة المسؤولة عن معالجة الخطر
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('responsible')}
                      className="px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 whitespace-nowrap"
                    >
                      أضف جهة
                    </button>

                    <select
                      value={riskForm.responsibleId}
                      onChange={(e) =>
                        setRiskForm(prev => ({ ...prev, responsibleId: e.target.value }))
                      }
                      className="flex-1 px-4 py-4 border rounded-xl bg-white text-right"
                    >
                      <option value="">اختر الجهة المسؤولة (اختياري)</option>
                      {responsibleEntities.map(entity => (
                        <option key={entity.id} value={entity.id}>
                          {entity.entityName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-right font-semibold">مكان الخطر</label>
                  <div className="relative">
                    <MapPin
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      value={riskForm.location}
                      onChange={(e) =>
                        setRiskForm(prev => ({ ...prev, location: e.target.value }))
                      }
                      className="w-full pl-4 pr-12 py-4 border rounded-xl bg-white text-right"
                      placeholder="مثال: جميع جهات العمل في الجامعة"
                    />
                  </div>
                </div>
              </div>

              {selectedResponsible && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
                  <h4 className="text-lg font-bold text-right">بيانات الاتصال المرتبطة بالجهة المختارة</h4>

                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div className="bg-white rounded-xl p-4 border">
                      <div className="flex items-center justify-end gap-2 text-gray-500 mb-2">
                        <User size={16} />
                        <span>الشخص المسؤول</span>
                      </div>
                      <div className="font-bold">{selectedResponsible.contactName || '-'}</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border">
                      <div className="flex items-center justify-end gap-2 text-gray-500 mb-2">
                        <Phone size={16} />
                        <span>وسائل الاتصال</span>
                      </div>
                      <div className="font-bold">{selectedResponsible.contactPhoneNumber || '-'}</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border">
                      <div className="flex items-center justify-end gap-2 text-gray-500 mb-2">
                        <Mail size={16} />
                        <span>البريد الإلكتروني</span>
                      </div>
                      <div className="font-bold break-all">{selectedResponsible.contactEmail || '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {renderAccordionListSection(
                'causes',
                'الأسباب المحتملة لحدوث الخطر',
                causes,
                setCauses,
                '',
                causeTemplates,
                selectedCauseTemplate,
                (value) => addTemplateValue(value, causes, setCauses, () => setSelectedCauseTemplate('')),
                () => setActiveTab('cause'),
                'أضف سببًا',
                'اختر سببًا جاهزًا',
                <AlertCircle size={20} />,
                false
              )}

              {renderAccordionListSection(
                'responseActions',
                'الإجراءات التي تتخذها الجهة المسؤولة عند وقوع الخطر',
                responseActions,
                setResponseActions,
                '',
                actionTemplates,
                selectedActionTemplate,
                (value) =>
                  addTemplateValue(value, responseActions, setResponseActions, () =>
                    setSelectedActionTemplate('')
                  ),
                () => setActiveTab('responseAction'),
                'أضف إجراء عند وقوع الخطر',
                'اختر إجراءً جاهزًا',
                <Siren size={20} />,
                false
              )}

              {renderAccordionListSection(
                'preventiveActions',
                'الإجراءات الواجب اتباعها لتفادي حدوث تلك المخاطر',
                preventiveActions,
                setPreventiveActions,
                '',
                preventiveTemplates,
                selectedPreventiveTemplate,
                (value) =>
                  addTemplateValue(value, preventiveActions, setPreventiveActions, () =>
                    setSelectedPreventiveTemplate('')
                  ),
                () => setActiveTab('preventiveAction'),
                'أضف إجراء وقائي',
                'اختر إجراءً وقائيًا جاهزًا',
                <ShieldCheck size={20} />,
                false
              )}

              <div className="flex gap-4 justify-start pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={18} />
                  حفظ المخاطرة
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 border rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddNewRisk;