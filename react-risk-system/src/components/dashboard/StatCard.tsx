import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, borderColor }) => {
  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border-r-4 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;