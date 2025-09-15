import React, { useMemo } from 'react';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  loading = false, 
  height = 300 
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { maxRevenue: 0, points: [] };

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (point.revenue / maxRevenue) * 80; // 80% of height for padding
      return { x, y, ...point };
    });

    return { maxRevenue, points };
  }, [data]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" style={{ height }}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
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
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No revenue data</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by connecting your Shopify store.</p>
        </div>
      </div>
    );
  }

  const pathData = chartData.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaData = `${pathData} L ${chartData.points[chartData.points.length - 1].x} 100 L ${chartData.points[0].x} 100 Z`;

  return (
    <div className="bg-white rounded-lg shadow p-6" style={{ height }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
        <div className="text-sm text-gray-500">
          Total: {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
        </div>
      </div>
      
      <div className="relative" style={{ height: height - 120 }}>
        {/* SVG Chart */}
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Area fill */}
          <path
            d={areaData}
            fill="url(#gradient)"
            className="opacity-20"
          />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.5"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {chartData.points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="0.8"
              fill="#3b82f6"
              className="hover:r-1.5 transition-all duration-200"
            />
          ))}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{formatCurrency(chartData.maxRevenue)}</span>
          <span>{formatCurrency(chartData.maxRevenue * 0.75)}</span>
          <span>{formatCurrency(chartData.maxRevenue * 0.5)}</span>
          <span>{formatCurrency(chartData.maxRevenue * 0.25)}</span>
          <span>$0</span>
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
      <div className="flex items-center justify-center mt-4 space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
          <span className="text-gray-600">Orders: {data.reduce((sum, d) => sum + d.orders, 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;