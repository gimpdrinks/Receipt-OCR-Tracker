import React, { useState, useMemo } from 'react';
import { SavedReceiptData } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface TransactionHistoryProps {
  receipts: SavedReceiptData[];
  onDelete: (id: number) => void;
}

type FilterPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'All';
type SummaryData = { category: string; total: number; transactionCount: number };

const getPeriodDateRange = (period: FilterPeriod): { start: Date; end: Date; title: string } => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    let title = '';

    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    switch (period) {
        case 'Daily':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            title = `Summary for ${formatDate(now)}`;
            break;
        case 'Weekly':
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
            start = new Date(now.setDate(diff));
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            title = `Summary for ${formatDate(start)} - ${formatDate(end)}`;
            break;
        case 'Monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            title = `Summary for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            break;
        case 'Quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1);
            end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            end.setHours(23, 59, 59, 999);
            title = `Summary for Q${quarter + 1} ${now.getFullYear()}`;
            break;
        case 'Yearly':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            end.setHours(23, 59, 59, 999);
            title = `Summary for ${now.getFullYear()}`;
            break;
    }
    return { start, end, title };
};


const TransactionHistory: React.FC<TransactionHistoryProps> = ({ receipts, onDelete }) => {
  const [filter, setFilter] = useState<FilterPeriod>('All');

  const { filteredReceipts, summaryData, periodTitle } = useMemo(() => {
    if (filter === 'All') {
        const sorted = [...receipts].sort((a, b) => {
            const dateA = a.transaction_date ? new Date(a.transaction_date).getTime() : 0;
            const dateB = b.transaction_date ? new Date(b.transaction_date).getTime() : 0;
            return dateB - dateA;
        });
        return { filteredReceipts: sorted, summaryData: [], periodTitle: 'All Transactions' };
    }

    const { start, end, title } = getPeriodDateRange(filter);
    
    const relevantReceipts = receipts.filter(r => {
        if (!r.transaction_date) return false;
        const receiptDate = new Date(r.transaction_date);
        return receiptDate >= start && receiptDate <= end;
    });

    const summary: Record<string, { total: number; count: number }> = {};
    for (const receipt of relevantReceipts) {
        const category = receipt.category || 'Uncategorized';
        const amount = receipt.total_amount || 0;
        if (!summary[category]) {
            summary[category] = { total: 0, count: 0 };
        }
        summary[category].total += amount;
        summary[category].count += 1;
    }

    const summaryArray: SummaryData[] = Object.entries(summary)
        .map(([category, data]) => ({
            category,
            total: data.total,
            transactionCount: data.count,
        }))
        .sort((a, b) => b.total - a.total);

    return { filteredReceipts: relevantReceipts, summaryData: summaryArray, periodTitle: title };
  }, [receipts, filter]);


  const downloadCSV = () => {
    let headers: string[], rows: string[], filename: string;
    const safeFilterName = filter.toLowerCase().replace(/ /g, '_');
    
    if (filter === 'All') {
        headers = ['Date', 'Transaction', 'Amount', 'Category'];
        rows = filteredReceipts.map(r => 
          [
            r.transaction_date || 'N/A',
            `"${(r.transaction_name || 'N/A').replace(/"/g, '""')}"`,
            r.total_amount?.toFixed(2) || '0.00',
            r.category || 'N/A'
          ].join(',')
        );
        filename = `all_transactions.csv`;
    } else {
        headers = ['Category', 'Total Amount', 'Transaction Count'];
        rows = summaryData.map(s => 
          [
            s.category,
            s.total.toFixed(2),
            s.transactionCount.toString()
          ].join(',')
        );
        filename = `summary_${safeFilterName}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const filterButtons: FilterPeriod[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'All'];

  const hasData = filter === 'All' ? filteredReceipts.length > 0 : summaryData.length > 0;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-poppins font-bold text-slate-900">Transaction History</h2>
                <p className="text-slate-500 mt-1">View summaries or manage individual transactions.</p>
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
      
      {hasData ? (
        <div className="overflow-x-auto">
          <h3 className="text-lg font-poppins font-semibold text-slate-700 mb-4">{periodTitle}</h3>
          {filter === 'All' ? (
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
                {filteredReceipts.map(receipt => (
                  <tr key={receipt.id} className="border-b border-slate-100 hover:bg-slate-50/75 transition-colors">
                    <td className="p-3 whitespace-nowrap font-medium text-slate-500">{receipt.transaction_date || <span className="font-normal italic">N/A</span>}</td>
                    <td className="p-3 font-medium text-slate-800 truncate max-w-xs" title={receipt.transaction_name ?? undefined}>
                      {receipt.transaction_name || <span className="text-slate-400 italic">N/A</span>}
                    </td>
                    <td className="p-3 text-right font-semibold text-green-600 whitespace-nowrap">
                      {receipt.total_amount !== null ? `$${receipt.total_amount.toFixed(2)}` : <span className="text-slate-400 italic">N/A</span>}
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
          ) : (
             <table className="w-full text-left">
                <thead className="border-b border-slate-200 text-sm text-slate-500">
                    <tr>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Transactions</th>
                        <th className="p-3 font-semibold text-right">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {summaryData.map(summary => (
                        <tr key={summary.category} className="border-b border-slate-100 hover:bg-slate-50/75 transition-colors">
                            <td className="p-3 font-medium text-slate-800">{summary.category}</td>
                            <td className="p-3 font-medium text-slate-500">{summary.transactionCount}</td>
                            <td className="p-3 text-right font-semibold text-green-600 whitespace-nowrap">
                                {`$${summary.total.toFixed(2)}`}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          )}
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
