import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Building2,
  Target,
  Users,
  AlertCircle,
  Siren,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import AddNewRisk from './AddNewRisk';
import { API_BASE } from '../../api/http';



export type ManagementType =
  | 'role'
  | 'strategicGoal'
  | 'risk'
  | 'department'
  | 'category'
  | 'responsible'
  | 'cause'
  | 'responseAction'
  | 'preventiveAction';

interface DataManagementPageProps {
  type: ManagementType;
}

interface CatalogItem {
  id: number;
  [key: string]: any;
}

export default function DataManagementPage({ type }: DataManagementPageProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  // For Risks editing (renders AddNewRisk component inside our screen context)
  const [isRiskFormActive, setIsRiskFormActive] = useState(false);
  const [riskFormInitialData, setRiskFormInitialData] = useState<any>(null);

  // Unified Form States for all other entities
  const [roleForm, setRoleForm] = useState({ roleName: '' });
  const [categoryForm, setCategoryForm] = useState({ categoryName: '' });
  const [departmentForm, setDepartmentForm] = useState({ name: '' });
  const [strategicGoalForm, setStrategicGoalForm] = useState({ goalDescription: '' });
  const [causeForm, setCauseForm] = useState({ causeDescription: '' });
  const [actionForm, setActionForm] = useState({ actionDescription: '' });
  const [responsibleForm, setResponsibleForm] = useState({
    entityName: '',
    contactName: '',
    contactEmail: '',
    contactPhoneNumber: ''
  });

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Configure Entity Specific Settings
  const config = useMemo(() => {
    switch (type) {
      case 'role':
        return {
          title: 'إدارة المناصب الوظيفية',
          subtitle: 'إضافة وتعديل وحذف الأدوار والمناصب الوظيفية في النظام',
          addButtonLabel: 'إضافة منصب وظيفي جديد',
          searchPlaceholder: 'ابحث عن منصب وظيفي...',
          icon: Briefcase,
          fetchUrl: `${API_BASE}/role`,
          createUrl: `${API_BASE}/role/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/role/${item.name}`,
          tableHeaders: ['الرقم المعرف', 'اسم المنصب الوظيفي'],
          mapRow: (item: CatalogItem) => [item.id, item.name],
          getEditPayload: () => ({ roleName: roleForm.roleName }),
          getCreatePayload: () => ({ roleName: roleForm.roleName }),
          setEditFormValues: (item: CatalogItem) => setRoleForm({ roleName: item.name })
        };
      case 'strategicGoal':
        return {
          title: 'إدارة الغايات الاستراتيجية',
          subtitle: 'إضافة وتعديل وحذف الغايات الاستراتيجية للمنظمة',
          addButtonLabel: 'إضافة غاية جديدة',
          searchPlaceholder: 'ابحث عن غاية استراتيجية...',
          icon: Target,
          fetchUrl: `${API_BASE}/strategicgoal`,
          createUrl: `${API_BASE}/strategicgoal/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/strategicgoal/${item.id}`,
          tableHeaders: ['الرقم', 'الوصف'],
          mapRow: (item: CatalogItem) => [item.id, item.goalDescription],
          getEditPayload: () => ({ id: selectedItem?.id, goalDescription: strategicGoalForm.goalDescription }),
          getCreatePayload: () => ({ goalDescription: strategicGoalForm.goalDescription }),
          setEditFormValues: (item: CatalogItem) => setStrategicGoalForm({ goalDescription: item.goalDescription || '' })
        };
      case 'risk':
        return {
          title: 'إدارة سجل المخاطر القياسية',
          subtitle: 'إضافة وتعديل وحذف المخاطر المعتمدة في النظام',
          addButtonLabel: 'إضافة مخاطرة قياسية جديدة',
          searchPlaceholder: 'ابحث عن مخاطرة باسمها أو قسمها...',
          icon: AlertCircle,
          fetchUrl: `${API_BASE}/risk?custom=false&include=RiskActions.Action,RiskCauses.Cause,RiskGoals.StrategicGoal`,
          createUrl: `${API_BASE}/risk/addUpdate`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/risk/${item.id}`,
          tableHeaders: ['الرقم', 'اسم المخاطرة', 'القسم', 'الموقع', 'فئة الخطر', 'الاحتمالية', 'الأثر'],
          mapRow: (item: CatalogItem) => [
            item.id,
            item.riskName,
            item.department,
            item.location,
            item.categoryName,
            item.likelihood,
            item.impact
          ],
          getEditPayload: () => ({}),
          getCreatePayload: () => ({}),
          setEditFormValues: () => {}
        };
      case 'department':
        return {
          title: 'إدارة الأقسام والوحدات التنظيمية',
          subtitle: 'إضافة وتعديل وحذف الأقسام الإدارية في النظام',
          addButtonLabel: 'إضافة قسم جديد',
          searchPlaceholder: 'ابحث عن قسم...',
          icon: Building2,
          fetchUrl: `${API_BASE}/departments`,
          createUrl: `${API_BASE}/departments/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/departments/${item.id}`,
          tableHeaders: ['الرقم', 'اسم القسم الإداري'],
          mapRow: (item: CatalogItem) => [item.id, item.name],
          getEditPayload: () => ({ id: selectedItem?.id, name: departmentForm.name }),
          getCreatePayload: () => ({ name: departmentForm.name }),
          setEditFormValues: (item: CatalogItem) => setDepartmentForm({ name: item.name || '' })
        };
      case 'category':
        return {
          title: 'إدارة فئات المخاطر',
          subtitle: 'إضافة وتعديل وحذف تصنيفات وفئات المخاطر',
          addButtonLabel: 'إضافة فئة جديدة',
          searchPlaceholder: 'ابحث عن فئة...',
          icon: Building2,
          fetchUrl: `${API_BASE}/category`,
          createUrl: `${API_BASE}/category/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/category/${item.id}`,
          tableHeaders: ['الرقم', 'اسم فئة الخطر'],
          mapRow: (item: CatalogItem) => [item.id, item.categoryName],
          getEditPayload: () => ({ id: selectedItem?.id, categoryName: categoryForm.categoryName }),
          getCreatePayload: () => ({ categoryName: categoryForm.categoryName }),
          setEditFormValues: (item: CatalogItem) => setCategoryForm({ categoryName: item.categoryName || '' })
        };
      case 'responsible':
        return {
          title: 'إدارة الجهات المسؤولة عن معالجة المخاطر',
          subtitle: 'إضافة وتعديل وحذف الجهات والمسؤولين داخل النظام',
          addButtonLabel: 'إضافة جهة مسؤولة جديدة',
          searchPlaceholder: 'ابحث باسم الجهة أو مسؤول التواصل...',
          icon: Users,
          fetchUrl: `${API_BASE}/responsible`,
          createUrl: `${API_BASE}/responsible/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/responsible/${item.id}`,
          tableHeaders: ['الرقم', 'الجهة', 'مسؤول التواصل', 'البريد الإلكتروني', 'الهاتف'],
          mapRow: (item: CatalogItem) => [
            item.id,
            item.entityName,
            item.contactName,
            item.contactEmail,
            item.contactPhoneNumber
          ],
          getEditPayload: () => ({
            id: selectedItem?.id,
            entityName: responsibleForm.entityName,
            contactName: responsibleForm.contactName,
            contactEmail: responsibleForm.contactEmail,
            contactPhoneNumber: responsibleForm.contactPhoneNumber
          }),
          getCreatePayload: () => ({
            entityName: responsibleForm.entityName,
            contactName: responsibleForm.contactName,
            contactEmail: responsibleForm.contactEmail,
            contactPhoneNumber: responsibleForm.contactPhoneNumber
          }),
          setEditFormValues: (item: CatalogItem) =>
            setResponsibleForm({
              entityName: item.entityName || '',
              contactName: item.contactName || '',
              contactEmail: item.contactEmail || '',
              contactPhoneNumber: item.contactPhoneNumber || ''
            })
        };
      case 'cause':
        return {
          title: 'إدارة سجل مسببات المخاطر القياسية',
          subtitle: 'إضافة وتعديل وحذف مسببات وعوامل الخطر القياسية',
          addButtonLabel: 'إضافة سبب جديد في الدليل',
          searchPlaceholder: 'ابحث عن سبب خطر...',
          icon: AlertCircle,
          fetchUrl: `${API_BASE}/cause`,
          createUrl: `${API_BASE}/cause/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/cause/${item.id}`,
          tableHeaders: ['الرقم', 'الوصف المسبب للخطر'],
          mapRow: (item: CatalogItem) => [item.id, item.causeDescription],
          getEditPayload: () => ({ id: selectedItem?.id, causeDescription: causeForm.causeDescription, custom: false }),
          getCreatePayload: () => ({ causeDescription: causeForm.causeDescription, custom: false }),
          setEditFormValues: (item: CatalogItem) => setCauseForm({ causeDescription: item.causeDescription || '' })
        };
      case 'responseAction':
        return {
          title: 'إدارة الإجراءات العلاجية (عند وقوع الخطر)',
          subtitle: 'إضافة وتعديل وحذف إجراءات التخفيف والحد من الأثر للتعامل الفوري مع الخطر',
          addButtonLabel: 'إضافة إجراء علاجي جديد',
          searchPlaceholder: 'ابحث عن إجراء علاجي...',
          icon: Siren,
          fetchUrl: `${API_BASE}/action?type=true`,
          createUrl: `${API_BASE}/action/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/action/${item.id}`,
          tableHeaders: ['الرقم', 'وصف الإجراء العلاجي'],
          mapRow: (item: CatalogItem) => [item.id, item.actionDescription],
          getEditPayload: () => ({ id: selectedItem?.id, actionDescription: actionForm.actionDescription, actionType: 1, custom: false }),
          getCreatePayload: () => ({ actionDescription: actionForm.actionDescription, actionType: 1, custom: false }),
          setEditFormValues: (item: CatalogItem) => setActionForm({ actionDescription: item.actionDescription || '' })
        };
      case 'preventiveAction':
        return {
          title: 'إدارة الإجراءات الوقائية (لتجنب وقوع الخطر)',
          subtitle: 'إضافة وتعديل وحذف الإجراءات والضوابط الوقائية لتقليل احتمالية حدوث الخطر',
          addButtonLabel: 'إضافة إجراء وقائي جديد',
          searchPlaceholder: 'ابحث عن إجراء وقائي...',
          icon: ShieldCheck,
          fetchUrl: `${API_BASE}/action?type=false`,
          createUrl: `${API_BASE}/action/create`,
          deleteUrl: (item: CatalogItem) => `${API_BASE}/action/${item.id}`,
          tableHeaders: ['الرقم', 'وصف الإجراء الوقائي'],
          mapRow: (item: CatalogItem) => [item.id, item.actionDescription],
          getEditPayload: () => ({ id: selectedItem?.id, actionDescription: actionForm.actionDescription, actionType: 0, custom: false }),
          getCreatePayload: () => ({ actionDescription: actionForm.actionDescription, actionType: 0, custom: false }),
          setEditFormValues: (item: CatalogItem) => setActionForm({ actionDescription: item.actionDescription || '' })
        };
    }
  }, [
    type,
    roleForm,
    categoryForm,
    departmentForm,
    strategicGoalForm,
    causeForm,
    actionForm,
    responsibleForm,
    selectedItem
  ]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(config.fetchUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('فشل تحميل البيانات من الخادم');

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message || 'خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    setIsRiskFormActive(false);
  }, [type]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = searchQuery.toLowerCase();
      return Object.values(item).some(val => String(val).toLowerCase().includes(q));
    });
  }, [items, searchQuery]);

  const handleOpenAdd = () => {
    if (type === 'risk') {
      setRiskFormInitialData(null);
      setIsRiskFormActive(true);
      return;
    }
    // Reset specific forms
    setRoleForm({ roleName: '' });
    setCategoryForm({ categoryName: '' });
    setDepartmentForm({ name: '' });
    setStrategicGoalForm({ goalDescription: '' });
    setCauseForm({ causeDescription: '' });
    setActionForm({ actionDescription: '' });
    setResponsibleForm({ entityName: '', contactName: '', contactEmail: '', contactPhoneNumber: '' });

    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setSelectedItem(item);
    if (type === 'risk') {
      // Map catalog Risk item back into initial format for AddNewRisk component
      setRiskFormInitialData({
        proposalId: item.id,
        department: item.department || '',
        riskName: item.riskName || '',
        riskDescription: item.riskDescription || '',
        categoryID: item.categoryID || '',
        categoryName: item.categoryName || '',
        likelihood: item.likelihood || 1,
        impact: item.impact || 1,
        responsibleId: item.responsibleId || '',
        location: item.location || '',
        causes: (item.riskCauses || []).map((rc: any) => rc.cause?.causeDescription || rc.causeDescription || '').filter(Boolean),
        responseActions: (item.riskActions || []).filter((ra: any) => ra.action?.actionType === 1 || ra.actionType === 1 || ra.actionType === 'Reduction').map((ra: any) => ra.action?.actionDescription || ra.actionDescription || '').filter(Boolean),
        preventiveActions: (item.riskActions || []).filter((ra: any) => ra.action?.actionType === 0 || ra.actionType === 0 || ra.actionType === 'Avoidance').map((ra: any) => ra.action?.actionDescription || ra.actionDescription || '').filter(Boolean),
        strategicGoals: (item.riskGoals || []).map((rg: any) => rg.strategicGoal?.goalDescription || rg.goalDescription || '').filter(Boolean)
      });
      setIsRiskFormActive(true);
      return;
    }

    config.setEditFormValues(item);
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const payload = isEdit ? config.getEditPayload() : config.getCreatePayload();

      const response = await fetch(config.createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'فشل حفظ التعديلات');
      }

      showNotification('تم حفظ البيانات بنجاح', 'success');
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    const confirmDelete = window.confirm('هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(config.deleteUrl(item), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'فشل حذف العنصر بسبب قيود البيانات المرتبطة');
      }

      showNotification('تم حذف العنصر بنجاح', 'success');
      fetchItems();
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  const CurrentIcon = config.icon;

  // If Admin is adding/updating a Risk, render AddNewRisk directly in place
  if (type === 'risk' && isRiskFormActive) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="text-right">
            <h1 className="text-2xl font-black text-gray-900">
              {riskFormInitialData ? 'تعديل مخاطرة معتمدة' : 'إضافة مخاطرة معتمدة جديدة'}
            </h1>
            <p className="text-gray-500 mt-1">قم بتحديث تفاصيل وبنية المخاطرة وسيقوم النظام بتحديث المرجع القياسي مباشرة</p>
          </div>
          <button
            type="button"
            onClick={() => setIsRiskFormActive(false)}
            className="border border-gray-200 rounded-xl px-5 py-2.5 font-bold hover:bg-slate-50 transition-all text-gray-700"
          >
            رجوع للقائمة
          </button>
        </div>
        <AddNewRisk
          initialData={riskFormInitialData}
          hideTabs={true}
          onCancel={() => setIsRiskFormActive(false)}
          onSubmit={() => {
            setIsRiskFormActive(false);
            fetchItems();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      {/* Header Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="text-right">
            <div className="flex items-center justify-end gap-3 mb-2">
              <span className="bg-blue-50 text-[#105a9e] text-sm px-3 py-1 rounded-full font-bold">
                {items.length} عنصر مسجل
              </span>
              <CurrentIcon size={22} className="text-[#105a9e]" />
            </div>
            <h1 className="text-4xl font-black text-gray-900">{config.title}</h1>
            <p className="text-gray-500 mt-2">{config.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-[#105a9e] text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-md transition-all shadow-sm"
          >
            <Plus size={20} />
            <span>{config.addButtonLabel}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Table */}
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-start mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-5 py-3 pr-12 text-right text-base focus:border-blue-500 focus:outline-none transition-colors"
            />
            <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-sm font-bold bg-slate-50/50">
                {config.tableHeaders.map((header, idx) => (
                  <th key={idx} className="px-6 py-4 text-right">
                    {header}
                  </th>
                ))}
                <th className="px-6 py-4 text-center w-36">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  {config.mapRow(item).map((val, idx) => (
                    <td key={idx} className={`px-6 py-4 text-right ${idx === 0 ? 'text-gray-500 font-bold' : 'text-gray-900 font-bold'}`}>
                      {val !== null && val !== undefined ? String(val) : '—'}
                    </td>
                  ))}
                  <td className="px-6 py-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="تعديل"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-50"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="حذف"
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-lg">لا توجد نتائج مطابقة لبحثك</div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span>{config.addButtonLabel}</span>
                <Plus size={20} className="text-[#105a9e]" />
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-slate-50 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4 overflow-y-auto">
              {renderFormFields(type, {
                roleForm, setRoleForm,
                categoryForm, setCategoryForm,
                departmentForm, setDepartmentForm,
                strategicGoalForm, setStrategicGoalForm,
                causeForm, setCauseForm,
                actionForm, setActionForm,
                responsibleForm, setResponsibleForm
              })}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 border border-gray-200 rounded-2xl px-5 py-3 hover:bg-slate-50 font-bold transition-all text-gray-700 text-center"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#105a9e] text-white rounded-2xl px-5 py-3 hover:bg-blue-700 font-bold shadow-sm transition-all text-center disabled:opacity-60"
                >
                  إضافة العنصر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span>تعديل العنصر</span>
                <Edit2 size={18} className="text-[#105a9e]" />
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedItem(null);
                }}
                className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-slate-50 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, true)} className="p-6 space-y-4 overflow-y-auto">
              {renderFormFields(type, {
                roleForm, setRoleForm,
                categoryForm, setCategoryForm,
                departmentForm, setDepartmentForm,
                strategicGoalForm, setStrategicGoalForm,
                causeForm, setCauseForm,
                actionForm, setActionForm,
                responsibleForm, setResponsibleForm
              })}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 border border-gray-200 rounded-2xl px-5 py-3 hover:bg-slate-50 font-bold transition-all text-gray-700 text-center"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#105a9e] text-white rounded-2xl px-5 py-3 hover:bg-blue-700 font-bold shadow-sm transition-all text-center disabled:opacity-60"
                >
                  تحديث البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Render dynamic forms based on entity selection
function renderFormFields(type: ManagementType, forms: any) {
  switch (type) {
    case 'role':
      return (
        <div>
          <label className="block text-right text-sm font-bold text-gray-700 mb-1">اسم الدور / المنصب الوظيفي *</label>
          <input
            type="text"
            required
            placeholder="مثال: Initiator"
            value={forms.roleForm.roleName}
            onChange={(e) => forms.setRoleForm({ roleName: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      );
    case 'strategicGoal':
      return (
        <div>
          <label className="block text-right text-sm font-bold text-gray-700 mb-1">وصف الغاية الاستراتيجية *</label>
          <textarea
            required
            rows={3}
            placeholder="أدخل وصفاً للقاية الاستراتيجية..."
            value={forms.strategicGoalForm.goalDescription}
            onChange={(e) => forms.setStrategicGoalForm({ goalDescription: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      );
    case 'department':
      return (
        <div>
          <label className="block text-right text-sm font-bold text-gray-700 mb-1">اسم القسم الإداري *</label>
          <input
            type="text"
            required
            placeholder="مثال: إدارة المالية"
            value={forms.departmentForm.name}
            onChange={(e) => forms.setDepartmentForm({ name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      );
    case 'category':
      return (
        <div>
          <label className="block text-right text-sm font-bold text-gray-700 mb-1">اسم فئة الخطر *</label>
          <input
            type="text"
            required
            placeholder="مثال: تشغيلي"
            value={forms.categoryForm.categoryName}
            onChange={(e) => forms.setCategoryForm({ categoryName: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      );
    case 'responsible':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-right text-sm font-bold text-gray-700 mb-1">اسم الجهة المسؤولة *</label>
            <input
              type="text"
              required
              placeholder="مثال: إدارة تقنية المعلومات"
              value={forms.responsibleForm.entityName}
              onChange={(e) => forms.setResponsibleForm({ ...forms.responsibleForm, entityName: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-right text-sm font-bold text-gray-700 mb-1">اسم مسؤول التواصل *</label>
            <input
              type="text"
              required
              placeholder="مثال: م. أحمد عبد الله"
              value={forms.responsibleForm.contactName}
              onChange={(e) => forms.setResponsibleForm({ ...forms.responsibleForm, contactName: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-right text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني للتواصل *</label>
            <input
              type="email"
              required
              placeholder="example@qm.com"
              value={forms.responsibleForm.contactEmail}
              onChange={(e) => forms.setResponsibleForm({ ...forms.responsibleForm, contactEmail: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-left focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-right text-sm font-bold text-gray-700 mb-1">رقم الهاتف *</label>
            <input
              type="text"
              required
              placeholder="مثال: 0791234567"
              value={forms.responsibleForm.contactPhoneNumber}
              onChange={(e) => forms.setResponsibleForm({ ...forms.responsibleForm, contactPhoneNumber: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      );
    case 'cause':
      return (
        <div>
          <label className="block text-right text-sm font-bold text-gray-700 mb-1">وصف مسبب الخطر *</label>
          <textarea
            required
            rows={3}
            placeholder="أدخل مسبب أو عامل الخطر القياسي..."
            value={forms.causeForm.causeDescription}
            onChange={(e) => forms.setCauseForm({ causeDescription: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      );
    case 'responseAction':
    case 'preventiveAction':
      return (
        <div>
          <label className="block text-right text-sm font-bold text-gray-700 mb-1">وصف الإجراء القياسي *</label>
          <textarea
            required
            rows={3}
            placeholder="أدخل تفاصيل ووصف الإجراء القياسي..."
            value={forms.actionForm.actionDescription}
            onChange={(e) => forms.setActionForm({ actionDescription: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      );
    default:
      return null;
  }
}
