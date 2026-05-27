import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  Search,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { getCurrentUser } from '../auth/authUtils';
import { API_BASE } from '../../api/http';

interface ApiNotification {
  id: number;
  requestId: number;
  status: number | null; // reject=0, accept=1, updated=2, created=3
  requestType: number;   // Risk=0, Incident=1
  createdAt: string;
  userId: number;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  route: string;
  status: number | null;
  requestType: number;
  requestId: number;
}

const NOTIFICATION_STATUS_LABEL: Record<number, string> = {
  0: 'تم الرفض',
  1: 'تم القبول',
  2: 'تحديث',
  3: 'تم الإنشاء',
};

const REQUEST_TYPE_LABEL: Record<number, string> = {
  0: 'خطر',
  1: 'طلب',
};

const READ_NOTIFICATIONS_STORAGE_KEY = 'readNotificationIds';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      READ_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  const isNotificationRead = (id: string) => readNotificationIds.includes(id);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_BASE}/notification`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const list: ApiNotification[] = Array.isArray(data) ? data : [];

      const mapped: NotificationItem[] = list
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(item => {
          const statusLabel = item.status != null ? NOTIFICATION_STATUS_LABEL[item.status] : '';
          const typeLabel = REQUEST_TYPE_LABEL[item.requestType] || '';
          return {
            id: String(item.id),
            title: `${statusLabel || 'إشعار'}: ${typeLabel} #${item.requestId}`,
            description:
              statusLabel === 'تم الرفض'
                ? 'تم رفض طلبك ونقله إلى الأرشيف التاريخي.'
                : statusLabel === 'تم القبول'
                  ? 'تم قبول طلبك ونقله إلى سجلات المخاطر المعتمدة.'
                  : 'تم تحديث حالة الطلب الخاص بك بنجاح.',
            createdAt: item.createdAt,
            route: '/requests',
            status: item.status,
            requestType: item.requestType,
            requestId: item.requestId
          };
        });

      setNotifications(mapped);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.role]);

  // Handle highlighted/selected notification from navigation state
  useEffect(() => {
    const state = location.state as { selectedNotificationId?: string } | null;
    if (state?.selectedNotificationId) {
      setExpandedId(state.selectedNotificationId);
      // Optional: scroll to the element
      setTimeout(() => {
        const el = document.getElementById(`notification-${state.selectedNotificationId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.state, notifications]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - date);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'الآن';
    if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `منذ ${minutes} دقيقة`;
    }
    if (diff < day) {
      const hours = Math.floor(diff / hour);
      if (hours === 1) return 'منذ ساعة';
      if (hours === 2) return 'منذ ساعتين';
      if (hours >= 3 && hours <= 10) return `منذ ${hours} ساعات`;
      return `منذ ${hours} ساعة`;
    }
    const days = Math.floor(diff / day);
    if (days === 1) return 'منذ يوم';
    if (days === 2) return 'منذ يومين';
    if (days >= 3 && days <= 10) return `منذ ${days} أيام`;
    return `منذ ${days} يوم`;
  };

  const toggleReadStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNotificationRead(id)) {
      setReadNotificationIds(prev => prev.filter(item => item !== id));
    } else {
      setReadNotificationIds(prev => [...prev, id]);
    }
  };

  const markAllAsRead = () => {
    const ids = notifications.map(item => item.id);
    setReadNotificationIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const getStatusIcon = (status: number | null) => {
    if (status === 0) return <AlertCircle className="text-red-500 w-6 h-6" />;
    if (status === 1) return <CheckCircle2 className="text-green-500 w-6 h-6" />;
    return <Info className="text-blue-500 w-6 h-6" />;
  };

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(item => {
        const isRead = isNotificationRead(item.id);
        if (activeFilter === 'unread') return !isRead;
        if (activeFilter === 'read') return isRead;
        return true;
      })
      .filter(item => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      });
  }, [notifications, readNotificationIds, activeFilter, searchQuery]);

  const unreadCount = useMemo(() => {
    return notifications.filter(item => !isNotificationRead(item.id)).length;
  }, [notifications, readNotificationIds]);

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-5rem)] rounded-2xl p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border shadow-sm">
        <div className="flex items-center gap-4 text-right justify-end md:justify-start w-full md:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-gray-100 rounded-xl transition border text-gray-500"
            title="رجوع"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 justify-end">
              <span>مركز الإشعارات</span>
              <Bell className="text-blue-600 w-8 h-8" />
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              إدارة واستعراض جميع إشعارات وتحديثات النظام الخاصة بك
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full md:w-auto px-6 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <CheckCheck size={18} />
            <span>تحديد الكل كمقروء ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Controls & Filter Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في الإشعارات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 border rounded-2xl bg-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex bg-white rounded-2xl p-1.5 border gap-1 w-full justify-between">
          <button
            onClick={() => setActiveFilter('read')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition ${
              activeFilter === 'read' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            المقروءة
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition ${
              activeFilter === 'unread' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            غير المقروءة
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition ${
              activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            الكل
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-gray-500 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <span>جاري تحميل الإشعارات...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-gray-500 shadow-sm space-y-2">
            <Bell className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-bold text-lg text-gray-700">لا توجد إشعارات حالياً</p>
            <p className="text-sm text-gray-400">ستظهر هنا أي تحديثات جديدة تتعلق بالطلبات والمخاطر</p>
          </div>
        ) : (
          filteredNotifications.map(item => {
            const isRead = isNotificationRead(item.id);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                id={`notification-${item.id}`}
                onClick={() => {
                  setExpandedId(isExpanded ? null : item.id);
                  if (!isRead) {
                    setReadNotificationIds(prev => [...prev, item.id]);
                  }
                }}
                className={`bg-white rounded-2xl border transition-all duration-350 cursor-pointer shadow-sm hover:shadow-md overflow-hidden ${
                  !isRead ? 'border-r-4 border-r-blue-600' : 'border-r-gray-200'
                } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="p-6 flex items-start gap-4 text-right justify-between">
                  {/* Mark read button */}
                  <button
                    onClick={(e) => toggleReadStatus(item.id, e)}
                    className={`p-2.5 rounded-xl border transition ${
                      isRead
                        ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-200'
                        : 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100'
                    }`}
                    title={isRead ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                  >
                    {isRead ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  {/* Main details */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-semibold text-gray-400 flex items-center gap-1">
                        {formatRelativeTime(item.createdAt)}
                        <Calendar size={14} />
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <span className="shrink-0">{getStatusIcon(item.status)}</span>
                    </div>

                    <p className={`text-gray-600 text-sm leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {item.description}
                    </p>

                    {isExpanded && (
                      <div className="pt-4 border-t border-gray-100 mt-4 space-y-4 text-right">
                        <div className="bg-gray-50 rounded-2xl p-5 border text-sm text-gray-700">
                          <div className="flex justify-start items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-500 w-32 shrink-0 text-right">رقم الطلب</span>
                            <span className="font-bold text-gray-900">#{item.requestId}</span>
                          </div>
                          <div className="flex justify-start items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-500 w-32 shrink-0 text-right">نوع الطلب</span>
                            <span className="font-bold text-gray-900">
                              {REQUEST_TYPE_LABEL[item.requestType]}
                            </span>
                          </div>
                          <div className="flex justify-start items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-500 w-32 shrink-0 text-right">الحالة</span>
                            <span className="font-bold text-gray-900">
                              {NOTIFICATION_STATUS_LABEL[item.status ?? 0] || 'تم التعديل'}
                            </span>
                          </div>
                          <div className="flex justify-start items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-500 w-32 shrink-0 text-right">تاريخ الإنشاء</span>
                            <span className="font-bold text-gray-900">
                              {new Date(item.createdAt).toLocaleString('ar-EG', {
                                dateStyle: 'long',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(item.route);
                          }}
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition inline-flex items-center gap-2"
                        >
                          <span>الانتقال لصفحة الطلبات</span>
                          <ChevronLeft size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
