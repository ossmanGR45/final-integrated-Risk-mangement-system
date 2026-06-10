import React, { useEffect, useState, useMemo } from 'react';
import { UserPlus, Edit2, Trash2, Users, Search, Shield, X, Check, Mail, Lock, User as UserIcon, Award } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import { API_BASE } from '../../api/http';
import CustomSelect from '../shared/CustomSelect';



interface UserItem {
  employeeId: number;
  userName: string;
  email: string;
  roles: string[];
  managerId: number | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms & Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Confirm Delete Dialog State
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    roleName: 'Initi',
    managerId: '',
  });

  // Edit User Form State
  const [editUser, setEditUser] = useState({
    newRole: 'Initi',
    managerId: '',
  });

  // Feedback Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل تحميل قائمة المستخدمين');
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message || 'خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      return (
        user.userName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        String(user.employeeId).includes(q)
      );
    });
  }, [users, searchQuery]);

  // Available Managers list (Users who have Admin or Manager roles)
  const availableManagers = useMemo(() => {
    return users.filter(user =>
      user.roles.some(role =>
        role.toLowerCase() === 'admin' || role.toLowerCase() === 'manager'
      )
    );
  }, [users]);

  // Handle Add User Submit
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.employeeId || !newUser.name || !newUser.email || !newUser.password) {
      showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        id: Number(newUser.employeeId),
        email: newUser.email,
        name: newUser.name,
        password: newUser.password,
        roleName: newUser.roleName,
        managerId: newUser.managerId ? Number(newUser.managerId) : null,
      };

      const response = await fetch(`${API_BASE}/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إضافة المستخدم');
      }

      showNotification('تمت إضافة المستخدم بنجاح', 'success');
      setIsAddModalOpen(false);
      setNewUser({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        roleName: 'Initi',
        managerId: '',
      });
      fetchUsers();
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setEditUser({
      newRole: user.roles[0] || 'Initi',
      managerId: user.managerId ? String(user.managerId) : '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit User Submit
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        userName: selectedUser.userName,
        newRole: editUser.newRole,
        managerId: editUser.managerId ? Number(editUser.managerId) : null,
      };

      const response = await fetch(`${API_BASE}/admin/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تحديث بيانات المستخدم');
      }

      showNotification('تم تحديث بيانات المستخدم بنجاح', 'success');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  const handleDeleteRequest = (employeeId: number) => {
    setPendingDeleteId(employeeId);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId === null) return;
    const employeeId = pendingDeleteId;
    setPendingDeleteId(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/admin/user/${employeeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل حذف المستخدم');
      }

      showNotification('تم حذف المستخدم بنجاح', 'success');
      fetchUsers();
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  // Helper to translate roles into Arabic labels
  const getRoleLabel = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'بدون صلاحية';
    const role = roles[0].toLowerCase();
    if (role === 'admin') return 'مدير النظام (Admin)';
    if (role === 'manager') return 'مدير (Manager)';
    if (role === 'initi' || role === 'initiator') return 'ضابط ارتباط (Initiator)';
    return roles[0];
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="bg-white rounded-[28px] p-12 text-center border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل قائمة المستخدمين...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="تأكيد حذف المستخدم"
        message="هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDeleteId(null)}
      />

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 left-5 z-[200] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-white border transition-all transform translate-y-0 ${notification.type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'
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
            <div className="flex items-center justify-start gap-3 mb-2">
              <Users size={22} className="text-[#105a9e]" />
              <span className="bg-blue-50 text-[#105a9e] text-sm px-3 py-1 rounded-full font-bold">
                {users.length} مستخدم
              </span>
            </div>
            <h1 className="text-4xl font-black text-gray-900">إدارة المستخدمين</h1>
            <p className="text-gray-500 mt-2">إضافة مستخدمين جدد للنظام، وتعديل صلاحياتهم وأدوارهم الإدارية</p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#105a9e] text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-md transition-all shadow-sm"
          >
            <UserPlus size={20} />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Table */}
      <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-start mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الموظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-5 py-3 pr-12 text-right text-base focus:border-blue-500 focus:outline-none transition-colors"
            />
            <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-sm font-bold bg-slate-50/50">
                <th className="px-6 py-4 text-right">رقم الموظف</th>
                <th className="px-6 py-4 text-left">الاسم</th>
                <th className="px-6 py-4 text-left">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right">الصلاحية / الدور</th>
                <th className="px-6 py-4 text-left">المدير المباشر</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const manager = users.find(u => u.employeeId === user.managerId);
                return (
                  <tr key={user.employeeId} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-right text-gray-500 font-bold">{user.employeeId}</td>
                    <td className="px-6 py-4 text-left text-gray-900 font-bold" dir="ltr">{user.userName}</td>
                    <td className="px-6 py-4 text-left text-gray-700" dir="ltr">{user.email}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${user.roles[0]?.toLowerCase() === 'admin'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : user.roles[0]?.toLowerCase() === 'manager'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-blue-50 text-[#105a9e] border border-blue-100'
                        }`}>
                        <Shield size={12} />
                        {getRoleLabel(user.roles)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left text-gray-600 font-medium">
                      {manager ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-gray-700 text-sm" dir="ltr">
                          <span>{manager.userName}</span>
                          <span className="text-[10px] text-gray-400">({manager.employeeId})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        title="تعديل"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-50"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(user.employeeId)}
                        title="حذف"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-lg">
            لا توجد نتائج مطابقة لبحثك
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span>إضافة مستخدم جديد</span>
                <UserPlus size={20} className="text-[#105a9e]" />
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-slate-50 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4 overflow-y-auto">
              {/* Employee ID */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">رقم الموظف *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="مثال: 100003"
                    value={newUser.employeeId}
                    onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-right focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <Award className="absolute right-3.5 top-3 text-gray-400" size={18} />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">اسم الموظف بالكامل *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد أحمد"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-right focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <UserIcon className="absolute right-3.5 top-3 text-gray-400" size={18} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="example@ju.edu.jo"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-left focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <Mail className="absolute right-3.5 top-3 text-gray-400" size={18} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-left focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <Lock className="absolute right-3.5 top-3 text-gray-400" size={18} />
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">الصلاحية / الدور *</label>
                <CustomSelect
                  value={newUser.roleName}
                  onChange={(value) => setNewUser({ ...newUser, roleName: value })}
                  options={[
                    { value: 'Admin', label: 'مدير النظام (Admin)' },
                    { value: 'Manager', label: 'مدير (Manager)' },
                    { value: 'Initi', label: 'ضابط ارتباط (Initiator)' }
                  ]}
                  placeholder="الصلاحية / الدور *"
                />
              </div>

              {/* Manager Dropdown */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">المدير المباشر (اختياري)</label>
                <CustomSelect
                  value={newUser.managerId}
                  onChange={(value) => setNewUser({ ...newUser, managerId: value })}
                  options={availableManagers.map(m => ({
                    value: String(m.employeeId),
                    label: `${m.userName} (${getRoleLabel(m.roles)})`
                  }))}
                  placeholder="حدد المدير المباشر"
                />
              </div>

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
                  className="flex-1 bg-[#105a9e] text-white rounded-2xl px-5 py-3 hover:bg-blue-700 font-bold shadow-sm transition-all text-center"
                >
                  حفظ المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <span>تعديل الصلاحيات: {selectedUser.userName}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-slate-50 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4 overflow-y-auto">
              {/* Role Dropdown */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">الصلاحية / الدور *</label>
                <CustomSelect
                  value={editUser.newRole}
                  onChange={(value) => setEditUser({ ...editUser, newRole: value })}
                  options={[
                    { value: 'Admin', label: 'مدير النظام (Admin)' },
                    { value: 'Manager', label: 'مدير (Manager)' },
                    { value: 'Initi', label: 'ضابط ارتباط (Initiator)' }
                  ]}
                  placeholder="الصلاحية / الدور *"
                />
              </div>

              {/* Manager Dropdown */}
              <div>
                <label className="block text-right text-sm font-bold text-gray-700 mb-1">المدير المباشر (اختياري)</label>
                <CustomSelect
                  value={editUser.managerId}
                  onChange={(value) => setEditUser({ ...editUser, managerId: value })}
                  options={availableManagers
                    .filter(m => m.employeeId !== selectedUser.employeeId)
                    .map(m => ({
                      value: String(m.employeeId),
                      label: `${m.userName} (${getRoleLabel(m.roles)})`
                    }))}
                  placeholder="بدون مدير مباشر"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 border border-gray-200 rounded-2xl px-5 py-3 hover:bg-slate-50 font-bold transition-all text-gray-700 text-center"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#105a9e] text-white rounded-2xl px-5 py-3 hover:bg-blue-700 font-bold shadow-sm transition-all text-center"
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
