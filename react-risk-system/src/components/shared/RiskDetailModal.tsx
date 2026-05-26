import React, { useCallback } from 'react';
import {
  X, AlertCircle, MapPin, User, Activity, Phone, Mail,
  ShieldCheck, ClipboardList, Siren, Target, FileDown
} from 'lucide-react';
import { calculateRiskScore, getRiskColor, getRiskLabel } from '../../utils/riskCalculations';

export interface RiskFull {
  id: number;
  riskName: string;
  riskDescription: string;
  location: string;
  likelihood: number;
  impact: number;
  custom: boolean;
  userId: number;
  categoryName: string;
  categoryID: number;
  responsibleId: number;
  department: string;
  riskCauses?: string[] | null;
  riskActions?: string[] | null;
  riskGoals?: string[] | null;
  strategicGoals?: string[] | null;
}

export interface ResponsibleEntity {
  id: number;
  entityName: string;
  contactName: string;
  contactEmail: string;
  contactPhoneNumber: string;
}

interface Props {
  risk: RiskFull;
  responsibleEntities: ResponsibleEntity[];
  onClose: () => void;
}

const toArray = (value?: string[] | null) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
};

const RiskDetailModal: React.FC<Props> = ({ risk, responsibleEntities, onClose }) => {
  const getResponsibleEntity = (responsibleId: number) =>
    responsibleEntities.find(e => e.id === responsibleId);

  const responsible = getResponsibleEntity(risk.responsibleId);

  const generatePDF = useCallback(() => {
    const causes = toArray(risk.riskCauses);
    const actions = toArray(risk.riskActions);
    const goals = toArray(risk.riskGoals);
    const sGoals = toArray(risk.strategicGoals);

    const bulletList = (items: string[]) =>
      items.length > 0
        ? `<ul style="margin:0;padding-right:20px;list-style-type:disc;">${items.map(i => `<li style="margin-bottom:4px;">${i}</li>`).join('')}</ul>`
        : '<span style="color:#999;">لا يوجد</span>';

    const htmlContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>${risk.riskName}</title>
<style>@page{size:A4;margin:20mm}*{box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;padding:20px;color:#222;font-size:14px;line-height:1.6}
h1{text-align:center;font-size:22px;margin-bottom:20px;font-weight:bold}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:10px 14px;text-align:right;vertical-align:top}
th{background-color:#f5f5f5;font-weight:bold;text-align:center}.section-header{background-color:#f0f0f0;font-weight:bold;text-align:center;font-size:15px}.value-cell{text-align:center}ul{text-align:right}
@media print{body{padding:0}}</style></head><body><h1>${risk.riskName}</h1><table>
<tr><th style="width:50%">احتمالية الخطر</th><th style="width:50%">شدة أثر الخطر</th></tr>
<tr><td class="value-cell">${risk.likelihood}</td><td class="value-cell">${risk.impact}</td></tr>
<tr><th>المؤشر / الغاية الإستراتيجية</th><th>الجهة المسؤولة عن معالجة الخطر</th></tr>
<tr><td>${sGoals.length > 0 ? sGoals.join('<br/>') : (goals.length > 0 ? goals.join('<br/>') : 'لا يوجد')}</td><td class="value-cell">${responsible?.entityName || 'غير محددة'}</td></tr>
<tr><th>الشخص المسؤول للاتصال</th><th>وسائل الاتصال</th></tr>
<tr><td class="value-cell">${responsible?.contactName || 'غير محدد'}</td><td class="value-cell">${responsible?.contactPhoneNumber || 'غير متوفر'}</td></tr>
<tr><td colspan="2" class="section-header">مكان الخطر</td></tr><tr><td colspan="2" class="value-cell">${risk.location}</td></tr>
<tr><td colspan="2" class="section-header">الأسباب المحتملة لحدوث الخطر</td></tr><tr><td colspan="2">${bulletList(causes)}</td></tr>
<tr><td colspan="2" class="section-header">الإجراءات عند وقوع الخطر</td></tr><tr><td colspan="2">${bulletList(actions)}</td></tr>
<tr><td colspan="2" class="section-header">الإجراءات الوقائية</td></tr><tr><td colspan="2">${bulletList(goals)}</td></tr>
</table></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(htmlContent); w.document.close(); w.onload = () => w.print(); }
  }, [risk, responsible]);

  const renderListSection = (title: string, items: string[], icon: React.ReactNode, emptyText: string) => (
    <div className="bg-gray-50 rounded-xl p-6">
      <h4 className="text-lg font-bold text-right mb-4 flex items-center justify-start gap-2">{icon}{title}</h4>
      {items.length > 0 ? (
        <ul className="space-y-3 text-right">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-gray-700 leading-relaxed border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-right">{emptyText}</p>
      )}
    </div>
  );

  const score = calculateRiskScore(risk.impact, risk.likelihood);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-right">تفاصيل الخطر</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-right">
            <h3 className="text-3xl font-bold text-gray-800 mb-2">{risk.riskName}</h3>
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">{risk.categoryName}</div>
          </div>

          <div className={`${getRiskColor(score)} text-white rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-lg opacity-90 mb-1">درجة الخطر</p>
                <p className="text-5xl font-bold">{score}</p>
                <p className="text-xl mt-2">{getRiskLabel(score)}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-1">شدة أثر الخطر</p>
                  <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3"><p className="text-4xl font-bold">{risk.impact}</p></div>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-1">احتمالية الخطر</p>
                  <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3"><p className="text-4xl font-bold">{risk.likelihood}</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-right mb-4 flex items-center justify-start gap-2">
              <Target size={20} />
              الغايات الإستراتيجية المرتبطة بالخطر
            </h4>
            <div className="space-y-2 text-right">
              {toArray(risk.strategicGoals).length > 0 ? (
                toArray(risk.strategicGoals).map((goal, index) => (
                  <p key={`sg-${index}`} className="text-gray-700 text-lg leading-relaxed">
                    {goal}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 text-lg">لا توجد غايات إستراتيجية مرتبطة بهذا الخطر</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-start gap-2"><User size={20} />الجهة المسؤولة عن معالجة الخطر</h4>
              <p className="text-gray-700 text-right text-lg">{responsible?.entityName || 'غير محددة'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-start gap-2"><User size={20} />الشخص المسؤول للاتصال به عند حدوث الخطر</h4>
              <p className="text-gray-700 text-right text-lg">{responsible?.contactName || 'غير محدد'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-start gap-2"><Phone size={20} />وسائل الاتصال</h4>
              <div className="space-y-2 text-right">
                <p className="text-gray-700 text-lg">{responsible?.contactPhoneNumber || 'غير متوفر'}</p>
                <p className="text-gray-700 text-base break-all" dir="ltr">{responsible?.contactEmail || 'غير متوفر'}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-start gap-2"><MapPin size={20} />مكان الخطر</h4>
              <p className="text-gray-700 text-right text-lg">{risk.location}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-start gap-2"><Activity size={20} />القسم</h4>
            <p className="text-gray-700 text-right text-lg">{risk.department}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-right mb-3 flex items-center justify-start gap-2"><AlertCircle size={20} />وصف الخطر</h4>
            <p className="text-gray-700 text-right leading-relaxed">{risk.riskDescription}</p>
          </div>

          {renderListSection('الأسباب المحتملة لحدوث الخطر', toArray(risk.riskCauses), <AlertCircle size={20} />, 'لا توجد أسباب مسجلة لهذا الخطر')}
          {renderListSection('الإجراءات التي تتخذها الجهة المسؤولة عند وقوع الخطر', toArray(risk.riskActions), <Siren size={20} />, 'لا توجد إجراءات مسجلة عند وقوع الخطر')}
          {renderListSection('الإجراءات الواجب اتباعها لتفادي حدوث تلك المخاطر', toArray(risk.riskGoals), <ShieldCheck size={20} />, 'لا توجد إجراءات وقائية مسجلة لهذا الخطر')}

          {responsible && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="text-lg font-bold text-right mb-4 flex items-center justify-start gap-2 text-blue-900"><ClipboardList size={20} />ملخص جهة التواصل</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                <div className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-start gap-2 text-gray-500 mb-2"><User size={16} /><span>اسم الجهة</span></div>
                  <div className="font-bold text-blue-900">{responsible.entityName}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-start gap-2 text-gray-500 mb-2"><Phone size={16} /><span>الهاتف</span></div>
                  <div className="font-bold text-blue-900" dir="ltr">{responsible.contactPhoneNumber || '-'}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-start gap-2 text-gray-500 mb-2"><Mail size={16} /><span>الإيميل</span></div>
                  <div className="font-bold text-blue-900 break-all" dir="ltr">{responsible.contactEmail || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-4">
          <button onClick={generatePDF} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
            <FileDown size={20} />حفظ كملف PDF
          </button>
          <button onClick={onClose} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors">إغلاق</button>
        </div>
      </div>
    </div>
  );
};

export default RiskDetailModal;
