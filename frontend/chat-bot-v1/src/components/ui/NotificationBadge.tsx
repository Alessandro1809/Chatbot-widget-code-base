import React from 'react';

interface NotificationBadgeProps {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  type,
  title,
  message,
  icon,
  className = ''
}) => {
  const baseClasses = "mb-2 border rounded-lg p-3 max-w-xs";
  
  const typeClasses = {
    warning: "bg-orange-50 border-orange-200",
    error: "bg-red-50 border-red-200", 
    info: "bg-yellow-50 border-yellow-200"
  };

  const iconClasses = {
    warning: "w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center",
    error: "w-8 h-8 bg-red-100 rounded-full flex items-center justify-center",
    info: "w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center"
  };

  const textClasses = {
    warning: { title: "text-orange-800", message: "text-orange-600" },
    error: { title: "text-red-800", message: "text-red-600" },
    info: { title: "text-yellow-800", message: "text-yellow-600" }
  };

  const defaultIcons = {
    warning: (
      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={iconClasses[type]}>
          {icon || defaultIcons[type]}
        </div>
        <div>
          <p className={`text-sm font-medium ${textClasses[type].title}`}>{title}</p>
          <p className={`text-xs ${textClasses[type].message}`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationBadge;
