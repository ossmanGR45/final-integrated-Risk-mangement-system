import React, { useMemo, useState } from 'react';
import {
  Home,
  FileText,
  CheckSquare,
  Settings,
  Plus,
  Logs,
  Search,
  ChevronDown,
  ChevronLeft,
  Users
} from 'lucide-react';
import { UserRole } from '../../types';
import { getCurrentUser } from '../auth/authUtils';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, role }) => {
  const displayName = getCurrentUser().username?.trim() || 'مستخدم';
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: Home },
    { id: 'risk-inquiry', label: 'استفسار المخاطر', icon: Search },

    ...(role === 'initiator'
      ? [{ id: 'new-request', label: 'تسجيل خطر', icon: CheckSquare }]
      : []),

    { id: 'requests', label: 'قائمة الطلبات', icon: FileText },

    ...(role === 'initiator'
      ? [{ id: 'predefined', label: 'مقترح خطر جديد', icon: Plus }]
      : []),

    // سجلاتي = finished (Accepted + Rejected) requests for ALL roles.
    // The user sees only their own; managers see their team's; admins see all
    // (the backend already enforces this).
    { id: 'records', label: role === 'admin' ? 'العمليات السابقة' : 'الطلبات السابقة', icon: FileText },

    // السجلات = system audit log. Admin-only.
    ...(role === 'admin'
      ? [{ id: 'logs', label: 'السجلات', icon: Logs }]
      : [])
  ];

  const addMenuItems = useMemo(
    () => (role === 'admin'
      ? [
          { id: 'manage-user', label: 'مستخدم', icon: Plus },
          { id: 'manage-strategic-goal', label: 'غاية إستراتيجية', icon: Plus },
          { id: 'manage-risk', label: 'خطر', icon: Plus },
          { id: 'manage-department', label: 'قسم', icon: Plus },
          { id: 'manage-category', label: 'فئة', icon: Plus },
          { id: 'manage-responsible', label: 'جهة مسؤولة', icon: Plus },
          { id: 'manage-cause', label: 'سبب خطر', icon: Plus },
          { id: 'manage-response-action', label: 'إجراء عند حدوث الخطر', icon: Plus },
          { id: 'manage-preventive-action', label: 'إجراء لتجنب حدوث الخطر', icon: Plus }
        ]
      : []),
    [role]
  );

  const isAddSectionActive = addMenuItems.some(item => item.id === currentPage);

  return (
    <div className="w-64 bg-[#105a9e] text-white h-screen fixed right-0 top-0 flex flex-col overflow-hidden">
      <div className="p-6 text-center border-b border-blue-700">
        <div className="w-20 h-20 bg-blue-700 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold truncate px-1" title={displayName}>
          {displayName}
        </h2>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                currentPage === item.id
                  ? 'bg-blue-700'
                  : 'hover:bg-blue-700'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {role === 'admin' && addMenuItems.length > 0 && (
          <>
            <button
              onClick={() => setIsAddMenuOpen(prev => !prev)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mb-2 transition-colors ${
                isAddSectionActive ? 'bg-blue-700' : 'hover:bg-blue-700'
              }`}
            >
              <span className="flex items-center gap-3">
                <Plus size={20} />
                <span>إضافة وتعديل عناصر</span>
              </span>
              {isAddMenuOpen ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
            </button>

            {isAddMenuOpen && addMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 mr-3 transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-700'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
