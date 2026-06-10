import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  disabled = false,
  className = '',
  id,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-right ${className}`}
      id={id}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-right transition-all bg-white border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200'
            : 'hover:border-gray-400'
        }`}
      >
        <span className="flex-1 truncate ml-2 text-right">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto max-h-[240px] max-w-[500px] text-right right-0 left-0 lg:left-auto">
          {options.length === 0 ? (
            <div className="py-3 px-4 text-gray-400 text-sm">لا توجد خيارات</div>
          ) : (
            options.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              return (
                <div
                  key={`${option.value}-${index}`}
                  onClick={() => handleSelect(String(option.value))}
                  className={`py-3 px-4 text-sm cursor-pointer whitespace-normal break-words transition-colors border-b border-gray-100 last:border-b-0 ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
