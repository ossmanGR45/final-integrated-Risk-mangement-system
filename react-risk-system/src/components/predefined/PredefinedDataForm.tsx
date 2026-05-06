import React, { useState } from 'react';
import { AlertTriangle, MapPin, FileText } from 'lucide-react';

interface PredefinedDataFormProps {
  onSubmit: (data: any) => void;
}

const PredefinedDataForm: React.FC<PredefinedDataFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    riskName: '',
    location: '',
    riskDescription: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      riskName: formData.riskName.trim(),
      location: formData.location.trim(),
      riskDescription: formData.riskDescription.trim()
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md">
      <div className="p-8 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-right">اقتراح خطر جديد</h2>
        <p className="text-gray-600 mt-2 text-right">
          من هنا يستطيع ضابط الارتباط اقتراح خطر جديد ليتم مراجعته لاحقًا
        </p>
      </div>

      <div className="p-8">
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-3 text-right font-semibold">
                  اسم الخطر
                </label>
                <div className="relative">
                  <AlertTriangle
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.riskName}
                    onChange={(e) => handleInputChange('riskName', e.target.value)}
                    className="w-full pl-4 pr-12 py-4 border rounded-xl bg-white text-right"
                    placeholder="أدخل اسم الخطر"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 text-right font-semibold">
                  موقع الخطر
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full pl-4 pr-12 py-4 border rounded-xl bg-white text-right"
                    placeholder="أدخل موقع الخطر"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-3 text-right font-semibold">
                وصف الخطر
              </label>
              <div className="relative">
                <FileText
                  className="absolute right-4 top-4 text-gray-400"
                  size={18}
                />
                <textarea
                  value={formData.riskDescription}
                  onChange={(e) => handleInputChange('riskDescription', e.target.value)}
                  rows={6}
                  className="w-full pl-4 pr-12 py-4 border rounded-xl bg-white text-right resize-none"
                  placeholder="أدخل وصف الخطر"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 justify-start pt-2">
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-lg transition-colors"
              >
                إرسال المقترح
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PredefinedDataForm;