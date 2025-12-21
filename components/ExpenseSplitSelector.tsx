'use client';

import { useState } from 'react';
import { User, DollarSign } from 'lucide-react';

interface Member {
  id: string;
  name: string;
}

interface ExpenseSplitSelectorProps {
  members: Member[];
  totalAmount: number;
  splitType: 'equal' | 'custom';
  customSplits: { [key: string]: string };
  onSplitTypeChange: (type: 'equal' | 'custom') => void;
  onCustomSplitsChange: (splits: { [key: string]: string }) => void;
  formatVND: (value: string) => string;
  formatVNDNumber: (value: number) => string | number;
  parseVND: (value: string) => number;
}

export function ExpenseSplitSelector({
  members,
  totalAmount,
  splitType,
  customSplits,
  onSplitTypeChange,
  onCustomSplitsChange,
  formatVND,
  formatVNDNumber,
  parseVND,
}: ExpenseSplitSelectorProps) {
  const getTotalCustomSplit = () => {
    return Object.values(customSplits).reduce((sum, val) => sum + parseVND(val), 0);
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    const formatted = formatVND(value);
    onCustomSplitsChange({
      ...customSplits,
      [memberId]: formatted,
    });
  };

  return (
    <div className="border-t-2 border-gray-200 pt-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        How to split this expense?
      </label>

      {/* Split Type Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => {
            onSplitTypeChange('equal');
            onCustomSplitsChange({});
          }}
          className={`p-4 rounded-xl border-2 transition-all ${
            splitType === 'equal'
              ? 'border-green-500 bg-green-50 text-green-900'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-semibold mb-1">Equal Split</div>
          <div className="text-xs text-gray-600">Divide equally among all members</div>
        </button>
        <button
          type="button"
          onClick={() => onSplitTypeChange('custom')}
          className={`p-4 rounded-xl border-2 transition-all ${
            splitType === 'custom'
              ? 'border-green-500 bg-green-50 text-green-900'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-semibold mb-1">Custom Split</div>
          <div className="text-xs text-gray-600">Set custom amount for each member</div>
        </button>
      </div>

      {/* Equal Split Info */}
      {splitType === 'equal' && members && members.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Expense Splitting</p>
              <p>
                This expense will be automatically split equally among all {members.length} trip members.
                Each member will owe {members.length > 0 ? new Intl.NumberFormat('vi-VN').format(Math.floor(totalAmount / members.length)) : '0'} ₫.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Split Details */}
      {splitType === 'custom' && members && members.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            Set amount for each member
          </h4>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">{member.name}</span>
                </div>
                <div className="w-48">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customSplits[member.id] || ''}
                      onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                      className="w-full pl-9 pr-12 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₫</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Split Summary */}
          <div className="mt-4 p-4 bg-white rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Total Split:</span>
              <span className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('vi-VN').format(getTotalCustomSplit())} ₫
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Expense Amount:</span>
              <span className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Remaining:</span>
              <span className={`text-lg font-bold ${
                totalAmount - getTotalCustomSplit() === 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {new Intl.NumberFormat('vi-VN').format(Math.abs(totalAmount - getTotalCustomSplit()))} ₫
              </span>
            </div>
          </div>

          {/* Error Message when splits don't match */}
          {totalAmount > 0 && getTotalCustomSplit() !== totalAmount && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                !
              </div>
              <div className="text-sm text-red-700">
                <p className="font-semibold">Invalid Split Amount</p>
                <p>
                  The total split must equal the expense amount. Please adjust the amounts so the remaining is 0 ₫.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
