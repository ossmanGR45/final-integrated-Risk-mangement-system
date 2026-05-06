import React from 'react';
import { RiskRequest } from '../../types';
import { getStatusColor, getStatusLabel } from '../../utils/riskCalculations';

interface RecentActivityProps {
  requests: RiskRequest[];
  limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ requests, limit = 4 }) => {
  // Sort by date (most recent first) and limit
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">النشاط الأخير</h3>
        <button className="text-blue-600 text-sm hover:underline">
          عرض الكل
        </button>
      </div>
      
      <div className="space-y-4">
        {recentRequests.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            لا توجد أنشطة حديثة
          </p>
        ) : (
          recentRequests.map(req => (
            <div 
              key={req.id} 
              className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0"
            >
              <div 
                className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(req.status)}`}
              ></div>
              <div className="flex-1">
                <p className="font-medium text-sm">{req.name}</p>
                <p className="text-xs text-gray-500">
                  {getStatusLabel(req.status)} • {req.date}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;