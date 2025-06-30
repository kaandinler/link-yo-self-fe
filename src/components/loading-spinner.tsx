import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'white';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'purple',
  text = 'Loading...',
  fullScreen = true,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    white: 'border-white',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}
        ></div>
        {text && (
          <p className="text-gray-300 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
