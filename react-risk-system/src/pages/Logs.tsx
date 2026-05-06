import React from 'react';
import { RiskRequest } from '../types';
import {
  getStatusColor,
  getStatusLabel,
  getRiskColor,
  getRiskLabel
} from '../utils/riskCalculations';

interface LogsProps {
  requests: RiskRequest[];
}

const Logs: React.FC<LogsProps> = ({ requests }) => {

  // ✅ فقط الطلبات المغلقة
  const closedRequests = requests.filter(
    (req) => req.status === 'closed'
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-2xl font-bold">السجلات / موسوعة المخاطر</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                درجة الخطر
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                الحالة
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                القطاع
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                تاريخ الإغلاق
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                عنوان الخطر
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                رقم الطلب
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {closedRequests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50 transition-colors">

                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`${getRiskColor(req.score)} text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold`}
                    >
                      {req.score}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getRiskLabel(req.score)}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`${getStatusColor(req.status)} text-white px-4 py-1.5 rounded-full text-sm font-medium inline-block`}
                  >
                    {getStatusLabel(req.status)}
                  </span>
                </td>

                <td className="px-6 py-4 text-center text-sm text-gray-700">
                  {req.sector}
                </td>

                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {req.closedAt || '-'}
                </td>

                <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                  {req.name}
                </td>

                <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                  {req.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {closedRequests.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p className="text-lg">لا توجد سجلات حالياً</p>
        </div>
      )}
    </div>
  );
};

export default Logs;