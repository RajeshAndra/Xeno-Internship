import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    percentage: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'INR';
const SYMBOL = CURRENCY === 'INR' ? '₹' : '$';

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  change,
  icon,
  loading = false
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 10000000 && CURRENCY === 'INR') {
        return `${SYMBOL}${(val / 10000000).toFixed(1)} Cr`;
      } else if (val >= 100000 && CURRENCY === 'INR') {
        return `${SYMBOL}${(val / 100000).toFixed(1)} L`;
      } else if (val >= 1000) {
        return `${SYMBOL}${(val / 1000).toFixed(1)}K`;
      } else {
        return `${SYMBOL}${val.toFixed(2)}`;
      }
    }
    return val.toString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="p-3 bg-blue-50 rounded-full">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {change && (
        <div className="mt-4">
          <div className="flex items-center">
            <span
              className={`text-sm font-medium ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change.isPositive ? '+' : ''}
              {change.percentage.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">
              vs last period ({change.isPositive ? '+' : ''}
              {typeof change.value === 'number' ? formatValue(change.value) : change.value})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;