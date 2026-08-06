// src/components/common/NotificationToast.jsx
import { useNotification } from '../../context/NotificationContext';
import { RiCheckLine, RiCloseLine, RiAlertLine, RiInformationLine, RiErrorWarningLine } from 'react-icons/ri';

const iconMap = {
  success: { Icon: RiCheckLine, bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', bar: 'bg-emerald-500' },
  error:   { Icon: RiErrorWarningLine, bg: 'bg-red-50 border-red-200', icon: 'text-red-600', bar: 'bg-red-500' },
  warning: { Icon: RiAlertLine, bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', bar: 'bg-amber-500' },
  info:    { Icon: RiInformationLine, bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', bar: 'bg-blue-500' },
};

const Toast = ({ notification, onRemove }) => {
  const cfg = iconMap[notification.type] || iconMap.info;
  const { Icon } = cfg;
  return (
    <div className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-card-md animate-fade-in ${cfg.bg} max-w-sm w-full`}>
      <div className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        {notification.title && <p className="text-sm font-semibold text-gray-200">{notification.title}</p>}
        {notification.message && <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>}
      </div>
      <button onClick={() => onRemove(notification.id)} className="text-gray-400 hover:text-gray-400 flex-shrink-0">
        <RiCloseLine className="w-4 h-4" />
      </button>
    </div>
  );
};

export const NotificationToast = () => {
  const { notifications, removeNotification } = useNotification();
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onRemove={removeNotification} />
      ))}
    </div>
  );
};

export default NotificationToast;
