/* eslint-disable react/only-export-components */
// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const NotificationContext = createContext(null);

let notifId = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++notifId;
    setNotifications((prev) => {
      const duplicate = prev.some((n) => n.type === type && n.title === title && n.message === message);
      if (duplicate) return prev;
      return [...prev, { id, type, title, message }];
    });
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useMemo(() => ({
    success: (title, message) => addNotification({ type: 'success', title, message }),
    error: (title, message) => addNotification({ type: 'error', title, message }),
    warning: (title, message) => addNotification({ type: 'warning', title, message }),
    info: (title, message) => addNotification({ type: 'info', title, message }),
  }), [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
