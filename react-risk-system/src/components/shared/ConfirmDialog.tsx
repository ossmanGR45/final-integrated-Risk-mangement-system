import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
  confirmLabel = 'نعم، احذف',
  cancelLabel = 'إلغاء',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Dialog */}
      <div
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 left-4 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mb-5">
            <AlertTriangle size={28} className="text-red-500" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>

          {/* Message */}
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 rounded-2xl px-5 py-3 hover:bg-slate-50 font-bold transition-all text-gray-700 text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white rounded-2xl px-5 py-3 hover:bg-red-700 font-bold shadow-sm transition-all text-center"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
