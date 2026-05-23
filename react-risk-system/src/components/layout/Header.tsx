import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LogOut,
  Settings,
  Bell,
  CheckCheck,
  ChevronDown,
  MonitorSmartphone,
  Moon,
  Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../auth/authUtils';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  route: string;
}

interface ApiNotification {
  id: number;
  requestId: number;
  status: number | null;          // notificationType: reject=0, accept=1, updated=2, created=3
  requestType: number;            // requestType: Risk=0, Incident=1
  createdAt: string;
  userId: number;
}

const NOTIFICATION_STATUS_LABEL: Record<number, string> = {
  0: 'تم الرفض',
  1: 'تم القبول',
  2: 'تحديث',
  3: 'تم الإنشاء',
};

const REQUEST_TYPE_LABEL: Record<number, string> = {
  0: 'مخاطرة',
  1: 'طلب',
};

const THEME_STORAGE_KEY = 'themePreference';
const READ_NOTIFICATIONS_STORAGE_KEY = 'readNotificationIds';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
    return saved || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const isNotificationRead = (id: string) => readNotificationIds.includes(id);

  const unreadCount = useMemo(() => {
    return notifications.filter(item => !isNotificationRead(item.id)).length;
  }, [notifications, readNotificationIds]);

  const applyTheme = (preference: ThemePreference) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextResolvedTheme: ResolvedTheme =
      preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;

    setResolvedTheme(nextResolvedTheme);
    document.documentElement.setAttribute('data-theme', nextResolvedTheme);
    document.documentElement.style.colorScheme = nextResolvedTheme;
  };

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    applyTheme(themePreference);

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (themePreference === 'system') {
        applyTheme('system');
      }
    };

    if (media.addEventListener) {
      media.addEventListener('change', handleSystemThemeChange);
    } else {
      media.addListener(handleSystemThemeChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleSystemThemeChange);
      } else {
        media.removeListener(handleSystemThemeChange);
      }
    };
  }, [themePreference]);

  useEffect(() => {
    localStorage.setItem(
      READ_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }

      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
          setNotifications([]);
          return;
        }

        // Real notification endpoint. The backend filters by the current user
        // automatically (admin gets all unless they pass userId).
        const response = await fetch('https://localhost:7002/api/notification', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          setNotifications([]);
          return;
        }

        const data = await response.json();
        const list: ApiNotification[] = Array.isArray(data) ? data : [];

        const mapped: NotificationItem[] = list
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 8)
          .map(item => {
            const statusLabel =
              item.status != null ? NOTIFICATION_STATUS_LABEL[item.status] : '';
            const typeLabel = REQUEST_TYPE_LABEL[item.requestType] || '';
            return {
              id: String(item.id),
              title: `${statusLabel || 'إشعار'}: ${typeLabel} #${item.requestId}`,
              description:
                statusLabel === 'تم الرفض'
                  ? 'تم رفض طلبك'
                  : statusLabel === 'تم القبول'
                    ? 'تم قبول طلبك'
                    : 'يوجد تحديث جديد',
              createdAt: item.createdAt,
              route: '/requests'
            };
          });

        setNotifications(mapped);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [user.role]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - date);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'الآن';
    if (diff < hour) return `منذ ${Math.floor(diff / minute)} دقيقة`;
    if (diff < day) return `منذ ${Math.floor(diff / hour)} ساعة`;
    return `منذ ${Math.floor(diff / day)} يوم`;
  };

  const markNotificationAsRead = (id: string) => {
    if (isNotificationRead(id)) return;
    setReadNotificationIds(prev => [...prev, id]);
  };

  const markAllAsRead = () => {
    const ids = notifications.map(item => item.id);
    setReadNotificationIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const openNotification = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    setIsNotificationsOpen(false);
    navigate(item.route);
  };

  const ThemeButton = ({
    value,
    label,
    icon
  }: {
    value: ThemePreference;
    label: string;
    icon: React.ReactNode;
  }) => {
    const isActive = themePreference === value;

    return (
      <button
        type="button"
        onClick={() => setThemePreference(value)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
          isActive
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
        }`}
      >
        <span className="font-medium">{label}</span>
        {icon}
      </button>
    );
  };

  return (
    <header className="bg-white h-16 border-b border-gray-200 fixed top-0 left-0 right-64 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="text-red-500 flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>

        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(false);
              setIsSettingsOpen(prev => !prev);
            }}
            className="text-gray-600 hover:bg-gray-100 p-2 rounded flex items-center gap-1"
          >
            <Settings size={20} />
            <ChevronDown size={15} />
          </button>

          {isSettingsOpen && (
            <div className="absolute top-full mt-3 left-0 w-[300px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-right">الإعدادات</h3>
                <p className="text-sm text-gray-500 text-right mt-1">
                  اختر مظهر النظام
                </p>
              </div>

              <div className="p-4 space-y-3">
                <ThemeButton
                  value="light"
                  label="الوضع الفاتح"
                  icon={<Sun size={18} />}
                />

                <ThemeButton
                  value="dark"
                  label="الوضع الداكن"
                  icon={<Moon size={18} />}
                />

                <ThemeButton
                  value="system"
                  label="حسب النظام"
                  icon={<MonitorSmartphone size={18} />}
                />
              </div>

              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 text-right">
                <p className="text-sm text-gray-600">
                  الوضع الحالي:{' '}
                  <span className="font-bold">
                    {resolvedTheme === 'dark' ? 'داكن' : 'فاتح'}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen(false);
              setIsNotificationsOpen(prev => !prev);
            }}
            className="text-gray-600 hover:bg-gray-100 p-2 rounded relative"
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute top-full mt-3 left-0 w-[420px] max-h-[520px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <CheckCheck size={16} />
                  تحديد الكل كمقروء
                </button>

                <div className="text-right">
                  <h3 className="text-lg font-bold">الإشعارات</h3>
                  <p className="text-sm text-gray-500">{unreadCount} غير مقروءة</p>
                </div>
              </div>

              <div className="max-h-[390px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="p-6 text-center text-gray-500">
                    جاري تحميل الإشعارات...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    لا توجد إشعارات حالياً
                  </div>
                ) : (
                  notifications.map(item => {
                    const isRead = isNotificationRead(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-5 border-b border-gray-200 ${
                          isRead ? 'bg-white' : 'bg-blue-50'
                        }`}
                      >
                        <div className="text-right">
                          <div className="flex items-start justify-between gap-3">
                            {!isRead ? (
                              <span className="mt-2 w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                            ) : (
                              <span className="w-2.5 h-2.5 shrink-0"></span>
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-gray-900 truncate">
                                {item.title}
                              </h4>

                              <p className="text-sm text-gray-500 mt-2">
                                {formatRelativeTime(item.createdAt)}
                              </p>

                              <p className="text-sm text-gray-600 mt-3 leading-6">
                                {item.description}
                              </p>

                              <button
                                type="button"
                                onClick={() => openNotification(item)}
                                className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                              >
                                عرض كامل
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate(user.role === 'manager' ? '/requests' : '/logs');
                  }}
                  className="w-full text-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  عرض كل الإشعارات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold">{user.username}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;