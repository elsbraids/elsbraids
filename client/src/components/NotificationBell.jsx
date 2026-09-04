import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentSkeleton } from './LoadingSkeleton';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('customerToken') || sessionStorage.getItem('elsAdminToken');

  const fetchNotifications = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return undefined;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id) => {
    if (!token) return;

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications((current) =>
        current.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!token) return null;

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full border border-[#ead4dd] bg-white/80 p-2 text-[#5b2b45] transition-colors hover:bg-[#f9eaf1]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="bg-[#5b2b45] p-4 flex justify-between items-center text-white">
                <h3 className="font-semibold">Notifications</h3>
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">{unreadCount} New</span>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="space-y-3 p-4"><ContentSkeleton className="h-14" /><ContentSkeleton className="h-14" /></div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 5).map(notif => (
                    <div 
                      key={notif._id || notif.id}
                      onClick={() => !notif.read && markAsRead(notif._id || notif.id)}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-pink-50/50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${!notif.read ? 'font-bold text-[#5b2b45]' : 'font-medium text-gray-700'}`}>
                          {notif.subject}
                        </h4>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-[#c0749a] mt-1.5" />}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-gray-400 mt-2 block">
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-sm text-[#5b2b45] font-semibold hover:underline"
                >
                  View All Notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
