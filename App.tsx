import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import TransactionHistory from './components/TransactionHistory';
import { ReceiptData, SavedReceiptData } from './types';
import { analyzeReceipt } from './services/geminiService';
import ManualEntry from './components/ManualEntry';
import { PlusCircleIcon } from './components/icons/PlusCircleIcon';

function App() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceiptData[]>([]);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  useEffect(() => {
    try {
      const storedReceipts = localStorage.getItem('savedReceipts');
      if (storedReceipts) {
        setSavedReceipts(JSON.parse(storedReceipts));
      }
    } catch (e) {
      console.error("Failed to parse receipts from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('savedReceipts', JSON.stringify(savedReceipts));
    } catch (e)      {
      console.error("Failed to save receipts to localStorage", e);
    }
  }, [savedReceipts]);
  
  const handleAnalyzeClick = async (file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setIsLoading(true);
    
    try {
      const analysisResult = await analyzeReceipt(file);
       const currentYear = new Date().getFullYear();
      if (analysisResult.transaction_date) {
        const transactionYear = new Date(analysisResult.transaction_date).getFullYear();
        if (transactionYear !== currentYear) {
            setError(`Receipt date is not from the current year (${currentYear}). Only transactions from the current calendar year are accepted.`);
            setResult(null);
            return;
        }
      }
      setResult(analysisResult);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReceipt = () => {
    if (result) {
      const newReceipt: SavedReceiptData = {
        ...result,
        id: Date.now(),
      };
      setSavedReceipts(prevReceipts => [newReceipt, ...prevReceipts]);
      handleReset();
    }
  };

  const handleSaveManualTransaction = (data: ReceiptData) => {
    const currentYear = new Date().getFullYear();
    if (data.transaction_date) {
        const transactionYear = new Date(data.transaction_date).getFullYear();
        if (transactionYear !== currentYear) {
            alert(`Transaction date must be in the current year (${currentYear}).`);
            return;
        }
    } else {
        alert('Transaction date is required.');
        return;
    }

    const newReceipt: SavedReceiptData = {
        ...data,
        id: Date.now(),
    };
    setSavedReceipts(prevReceipts => [newReceipt, ...prevReceipts]);
    setIsManualEntryOpen(false);
  };


  const handleDeleteReceipt = (id: number) => {
    setSavedReceipts(prevReceipts => prevReceipts.filter(receipt => receipt.id !== id));
  };
  
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
  
  const renderScanner = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-full flex flex-col">
        <h1 className="text-3xl font-bold font-poppins text-slate-800 text-center mb-2">Upload a Receipt</h1>
        <p className="text-slate-500 text-center mb-6">Extract transaction data using AI.</p>
        
        {!selectedImage && (
          <div className="flex-grow flex flex-col">
            <div className="flex-grow">
              <ImageUploader onImageSelect={handleAnalyzeClick} className="h-full" />
            </div>
            <div className="flex items-center text-slate-400 text-sm my-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
             <button 
                onClick={() => setIsManualEntryOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                <PlusCircleIcon className="w-5 h-5" />
                Add Manual Entry
              </button>
          </div>
        )}

        {previewUrl && (
          <div className="mb-6 text-center">
            <img src={previewUrl} alt="Receipt preview" className="max-w-full max-h-80 mx-auto rounded-lg shadow-md" />
          </div>
        )}
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Spinner className="w-12 h-12 text-indigo-500" />
            <p className="mt-4 text-lg font-semibold text-slate-700">Analyzing your receipt...</p>
            <p className="text-slate-500">This might take a moment.</p>
          </div>
        )}

        {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
                <div className="flex">
                    <div className="py-1">
                        <p className="font-bold text-red-700">An Error Occurred</p>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        )}
        
        {result && !isLoading && (
          <div className="mt-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-slate-800 text-center mb-4">Extracted Details</h2>
            <ResultDisplay data={result} />
            <div className="flex items-center justify-center gap-4 mt-6">
                <button
                    onClick={handleReset}
                    className="px-6 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                >
                    Scan Another
                </button>
                <button
                    onClick={handleSaveReceipt}
                    className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors shadow-sm"
                >
                    Save Transaction
                </button>
            </div>
          </div>
        )}
      </div>
  );
  
  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
            <img src="https://res.cloudinary.com/dbylka4xx/image/upload/v1751883360/AiForPinoys_Logo_ttg2id.png" alt="ResiboKo Logo" className="h-12 w-auto mb-2" />
            <h1 className="text-2xl font-bold font-poppins text-slate-800">ResiboKo</h1>
            <p className="text-sm text-slate-500">Master your cash flow, one receipt at a time.</p>
        </div>
      </header>

      <main className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
            <div>
                {renderScanner()}
            </div>
            <div>
                <TransactionHistory receipts={savedReceipts} onDelete={handleDeleteReceipt} />
            </div>
        </div>
      </main>

      {isManualEntryOpen && (
          <ManualEntry
              onClose={() => setIsManualEntryOpen(false)}
              onSave={handleSaveManualTransaction}
          />
      )}
    </div>
  );
}

export default App;