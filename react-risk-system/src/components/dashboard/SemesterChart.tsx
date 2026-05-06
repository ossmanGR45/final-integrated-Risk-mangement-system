import React from 'react';
import { RiskRequest } from '../../types';

interface SemesterChartProps {
  requests: RiskRequest[];
}

const SemesterChart: React.FC<SemesterChartProps> = ({ requests }) => {
  // Calculate data for each semester
  const semesterData = {
    first: requests.filter(r => r.semester === 'first').length,
    second: requests.filter(r => r.semester === 'second').length,
    summer: requests.filter(r => r.semester === 'summer').length
  };

  const maxValue = Math.max(semesterData.first, semesterData.second, semesterData.summer, 1);

  const chartData = [
    { label: 'الفصل الأول', value: semesterData.first },
    { label: 'الفصل الثاني', value: semesterData.second },
    { label: 'الفصل الصيفي', value: semesterData.summer }
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-6">توزيع المخاطر حسب الفصل الدراسي</h3>
      <div className="flex items-end justify-around h-64 gap-4">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-400 rounded-t-lg transition-all duration-500 hover:bg-blue-500"
              style={{ 
                height: `${(item.value / maxValue) * 100}%`, 
                minHeight: item.value > 0 ? '20px' : '0px' 
              }}
            ></div>
            <p className="text-sm text-gray-600 mt-3">{item.label}</p>
            <p className="text-lg font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SemesterChart;