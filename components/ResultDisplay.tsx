import React from 'react';
import { ReceiptData } from '../types';

interface ResultDisplayProps {
  data: ReceiptData;
}

const getCategoryStyles = (category: string | null) => {
    const defaultStyles = "bg-slate-100 text-slate-700";
    if (!category) return defaultStyles;

    switch (category.toLowerCase()) {
        case 'food & drink': return "bg-orange-100 text-orange-800";
        case 'groceries': return "bg-green-100 text-green-800";
        case 'transportation': return "bg-blue-100 text-blue-800";
        case 'shopping': return "bg-pink-100 text-pink-800";
        case 'utilities': return "bg-yellow-100 text-yellow-800";
        case 'entertainment': return "bg-purple-100 text-purple-800";
        case 'health & wellness': return "bg-teal-100 text-teal-800";
        case 'travel': return "bg-indigo-100 text-indigo-800";
        default: return defaultStyles;
    }
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
    const displayValue = (value: string | number | null) => {
        if (value === null || value === undefined) {
            return <span className="italic text-slate-400">Not found</span>;
        }
        return <span className="font-semibold text-slate-800">{value}</span>;
    }

    const categoryStyles = getCategoryStyles(data.category);

  return (
    <div className="w-full space-y-4 text-left font-sans">
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">Transaction</p>
        <p className="text-xl font-bold font-poppins text-slate-900 truncate">{displayValue(data.transaction_name)}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Total Amount</p>
            <p className="text-xl font-bold font-poppins text-green-600">
                {data.total_amount !== null ? `$${data.total_amount.toFixed(2)}` : displayValue(null)}
            </p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">Date</p>
            <p className="text-xl font-poppins">{displayValue(data.transaction_date)}</p>
        </div>
      </div>
      <div className="p-4 bg-white rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">Category</p>
        <div className={`inline-block px-3 py-1 mt-1 text-sm font-medium rounded-full ${categoryStyles}`}>
          {displayValue(data.category)}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;