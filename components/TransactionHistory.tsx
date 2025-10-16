import React, { useState, useMemo } from 'react';
import { SavedReceiptData } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface TransactionHistoryProps {
  receipts: SavedReceiptData[];
  onDelete: (id: string) => void;
}

type FilterPeriod = 'Daily' | 'Monthly' | 'Quarterly' | 'Yearly' | 'All';

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ receipts, onDelete }) => {
  const [filter, setFilter] = useState<FilterPeriod>('All');

  const filterReceipts = (period: FilterPeriod): SavedReceiptData[] => {
    if (period === 'All') return receipts;

    const getStartDate = (p: FilterPeriod): Date => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); 
      
      switch (p) {
        case 'Daily':
          break;
        case 'Monthly':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'Quarterly':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'Yearly':
          startDate.setDate(startDate.getDate() - 365);
          break;
      }
      return startDate;
    };

    const startDate = getStartDate(period);

    return receipts.filter(r => {
      if (!r.transaction_date) return false;
      // Note: Using new Date() with a YYYY-MM-DD string might interpret it as UTC.
      // For consistency, let's parse it manually to treat it as local time.
      const [year, month, day] = r.transaction_date.split('-').map(Number);
      const receiptDate = new Date(year, month - 1, day);
      
      if (period === 'Daily') {
        return receiptDate.getTime() === startDate.getTime();
      }
      
      return receiptDate >= startDate;
    });
  };

  const filteredReceipts = useMemo(() => filterReceipts(filter), [receipts, filter]);
  const sortedReceipts = useMemo(() => {
    return [...filteredReceipts].sort((a, b) => {
        const dateA = a.transaction_date ? new Date(a.transaction_date).getTime() : 0;
        const dateB = b.transaction_date ? new Date(b.transaction_date).getTime() : 0;
        return dateB - dateA;
    });
  }, [filteredReceipts]);

  const downloadCSV = () => {
    const headers = ['Date', 'Transaction', 'Amount', 'Category'];
    const rows = sortedReceipts.map(r => 
      [
        r.transaction_date || 'N/A',
        `"${(r.transaction_name || 'N/A').replace(/"/g, '""')}"`,
        r.total_amount?.toFixed(2) || '0.00',
        r.category || 'N/A'
      ].join(',')
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_history_${filter.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const filterButtons: FilterPeriod[] = ['Daily', 'Monthly', 'Quarterly', 'Yearly', 'All'];

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-poppins font-bold text-slate-900">Transaction History</h2>
                <p className="text-slate-500 mt-1">View and manage your extracted transactions.</p>
            </div>
            {receipts.length > 0 && (
                 <button
                    onClick={downloadCSV}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg border border-slate-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download CSV
                </button>
            )}
        </div>

        {receipts.length > 0 && (
            <div className="bg-slate-100 p-1.5 rounded-lg flex flex-wrap items-center mb-6">
                {filterButtons.map(period => (
                    <button 
                        key={period} 
                        onClick={() => setFilter(period)}
                        className={`w-1/3 md:w-auto md:flex-1 text-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${filter === period ? 'bg-white text-indigo-600 shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                        {period}
                    </button>
                ))}
            </div>
        )}

      {sortedReceipts.length > 0 ? (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-slate-200 text-sm text-slate-500">
                    <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Transaction</th>
                        <th className="p-3 font-semibold text-right">Amount</th>
                        <th className="p-3 font-semibold text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedReceipts.map(receipt => (
                        <tr key={receipt.id} className="border-b border-slate-100 hover:bg-slate-50/75 transition-colors">
                            <td className="p-3 whitespace-nowrap font-medium text-slate-800">{receipt.transaction_date || <span className="font-normal text-slate-400">N/A</span>}</td>
                            <td className="p-3 font-medium text-slate-800 truncate max-w-xs" title={receipt.transaction_name ?? undefined}>
                                {receipt.transaction_name || <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="p-3 text-right font-semibold text-green-600 whitespace-nowrap">
                                {receipt.total_amount !== null ? `$${receipt.total_amount.toFixed(2)}` : <span className="text-slate-400">N/A</span>}
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => onDelete(receipt.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                    aria-label="Delete receipt"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      ) : (
        <div className="text-center py-12 md:py-16 text-slate-500 flex flex-col items-center gap-4">
          <BookOpenIcon className="w-16 h-16 text-slate-300" />
          <p className="text-lg font-semibold font-poppins text-slate-700">
            {receipts.length > 0 ? 'No transactions found for this period.' : 'No transactions found.'}
          </p>
          <p className="max-w-xs">
            {receipts.length > 0 ? 'Try selecting a different time period or upload a new receipt.' : 'Upload a receipt to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;