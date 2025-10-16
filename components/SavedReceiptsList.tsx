import React, { useState } from 'react';
import { SavedReceiptData } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { SearchIcon } from './icons/SearchIcon';

interface SavedReceiptsListProps {
  receipts: SavedReceiptData[];
  onDelete: (id: number) => void;
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

const SavedReceiptsList: React.FC<SavedReceiptsListProps> = ({ receipts, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (receipts.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-4">
        <ReceiptIcon className="w-16 h-16 text-slate-300" />
        <p className="text-lg">You haven't saved any receipts yet.</p>
        <p className="max-w-xs">Analyze a new receipt and click "Save" to start building your history.</p>
      </div>
    );
  }

  const filteredReceipts = receipts.filter(receipt => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      (receipt.transaction_name && receipt.transaction_name.toLowerCase().includes(term)) ||
      (receipt.category && receipt.category.toLowerCase().includes(term)) ||
      (receipt.total_amount && receipt.total_amount.toString().includes(term))
    );
  });
  
  const sortedReceipts = filteredReceipts.sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Saved Receipts</h2>
      
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search by name, category, or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="Search saved receipts"
        />
      </div>

      {sortedReceipts.length > 0 ? (
        <ul className="space-y-3">
          {sortedReceipts.map((receipt) => {
            const categoryStyles = getCategoryStyles(receipt.category);
            return (
              <li key={receipt.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <div className="truncate col-span-2 md:col-span-1">
                    <p className="text-sm text-slate-500">Transaction</p>
                    <p className="font-semibold text-slate-800 truncate" title={receipt.transaction_name ?? ''}>
                      {receipt.transaction_name || <span className="italic text-slate-400">N/A</span>}
                    </p>
                  </div>
                  <div className="text-right md:text-left">
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="font-semibold text-green-600">
                      {receipt.total_amount !== null ? `$${receipt.total_amount.toFixed(2)}` : <span className="italic text-slate-400">N/A</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-semibold text-slate-800">
                      {receipt.transaction_date || <span className="italic text-slate-400">N/A</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Category</p>
                    <div className={`inline-block px-2 py-0.5 mt-1 text-xs font-medium rounded-full ${categoryStyles}`}>
                      {receipt.category || <span className="italic text-slate-400">N/A</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(receipt.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Delete receipt"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
         <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-4">
            <SearchIcon className="w-16 h-16 text-slate-300" />
            <p className="text-lg">No results found for "{searchTerm}"</p>
            <p>Try searching for something else.</p>
        </div>
      )}
    </div>
  );
};

export default SavedReceiptsList;
