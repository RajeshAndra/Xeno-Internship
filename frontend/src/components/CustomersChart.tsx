import React, { useMemo } from 'react';

interface CustomerDataPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
}

interface CustomersChartProps {
  data: CustomerDataPoint[];
  loading?: boolean;
}

const CustomersChart: React.FC<CustomersChartProps> = ({ 
  data, 
  loading = false 
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { maxCustomers: 0, points: [] };

    const maxCustomers = Math.max(...data.map(d => d.totalCustomers));
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const newY = 100 - (point.newCustomers / maxCustomers) * 80;
      const returningY = 100 - (point.returningCustomers / maxCustomers) * 80;
      const totalY = 100 - (point.totalCustomers / maxCustomers) * 80;
      
      return { 
        x, 
        newY, 
        returningY, 
        totalY, 
        ...point 
      };
    });

    return { maxCustomers, points };
  }, [data]);

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-80">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-80 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customer data</h3>
          <p className="mt-1 text-sm text-gray-500">Customer analytics will appear here once you have data.</p>
        </div>
      </div>
    );
  }

  // Create path data for each line
  const newCustomersPath = chartData.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.newY}`)
    .join(' ');

  const returningCustomersPath = chartData.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.returningY}`)
    .join(' ');

  const totalCustomersPath = chartData.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.totalY}`)
    .join(' ');

  return (
    <div className="bg-white rounded-lg shadow p-6 h-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Customer Growth</h3>
        <div className="text-sm text-gray-500">
          Total: {formatNumber(data.reduce((sum, d) => sum + d.totalCustomers, 0))}
        </div>
      </div>
      
      <div className="relative h-48">
        {/* SVG Chart */}
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="customerGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#customerGrid)" />
          
          {/* Area fills */}
          <defs>
            <linearGradient id="newCustomersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="returningCustomersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="totalCustomersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Total customers area */}
          <path
            d={`${totalCustomersPath} L ${chartData.points[chartData.points.length - 1].x} 100 L ${chartData.points[0].x} 100 Z`}
            fill="url(#totalCustomersGradient)"
          />
          
          {/* Lines */}
          <path
            d={newCustomersPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          
          <path
            d={returningCustomersPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
          
          <path
            d={totalCustomersPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.8"
          />
          
          {/* Data points */}
          {chartData.points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.newY} r="0.6" fill="#10b981" />
              <circle cx={point.x} cy={point.returningY} r="0.6" fill="#f59e0b" />
              <circle cx={point.x} cy={point.totalY} r="0.8" fill="#3b82f6" />
            </g>
          ))}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{formatNumber(chartData.maxCustomers)}</span>
          <span>{formatNumber(Math.round(chartData.maxCustomers * 0.75))}</span>
          <span>{formatNumber(Math.round(chartData.maxCustomers * 0.5))}</span>
          <span>{formatNumber(Math.round(chartData.maxCustomers * 0.25))}</span>
          <span>0</span>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        {data.map((point, index) => (
          <span key={index} className={index % Math.ceil(data.length / 6) === 0 ? '' : 'hidden sm:inline'}>
            {formatDate(point.date)}
          </span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
          <span className="text-gray-600">Total</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border mr-2"></div>
          <span className="text-gray-600">New</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-yellow-500 border-dashed border mr-2"></div>
          <span className="text-gray-600">Returning</span>
        </div>
      </div>
    </div>
  );
};

export default CustomersChart;