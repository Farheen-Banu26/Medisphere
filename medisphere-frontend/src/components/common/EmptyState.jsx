// src/components/common/EmptyState.jsx
import { RiInboxLine } from 'react-icons/ri';

export const EmptyState = ({ title = 'No data found', description = '', icon: Icon = RiInboxLine, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-400 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
