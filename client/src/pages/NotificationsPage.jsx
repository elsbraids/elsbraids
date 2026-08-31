import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Package, Calendar, ShieldAlert } from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const token = localStorage.getItem('customerToken') || localStorage.getItem('adminToken');
  const role = localStorage.getItem('adminToken') ? 'Admin' : 'Customer';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id || n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Booking': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'Purchase': return <Package className="w-5 h-5 text-green-500" />;
      case 'Status': return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'Reminder': return <Bell className="w-5 h-5 text-yellow-500" />;
      default: return <ShieldAlert className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifs = filter === 'All' ? notifications : notifications.filter(n => n.type === filter);

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <p className="text-gray-500">Please log in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12">
      <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-500">Stay updated on your bookings and orders.</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['All', 'Booking', 'Purchase', 'Status', 'Reminder'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f 
                  ? 'bg-[#5b2b45] text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading notifications...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
              <p className="text-gray-500">You don't have any {filter !== 'All' ? filter.toLowerCase() : ''} notifications right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifs.map((notif, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={notif._id || notif.id}
                  onClick={() => !notif.read && markAsRead(notif._id || notif.id)}
                  className={`p-6 flex gap-4 transition-colors ${!notif.read ? 'bg-pink-50/30 cursor-pointer hover:bg-pink-50/60' : 'bg-white'}`}
                >
                  <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-base ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {notif.subject}
                      </h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${!notif.read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#c0749a]" />
                    </div>
                  )}
                </motion.div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
