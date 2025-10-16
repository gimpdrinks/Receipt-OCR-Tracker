import React, { useState, useCallback, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";
import { auth, db, googleProvider } from './firebase/config';

import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import TransactionHistory from './components/TransactionHistory';
import Login from './components/Login';
import { analyzeReceiptImage } from './services/geminiService';
import { ReceiptData, SavedReceiptData } from './types';
import { EyeIcon } from './components/icons/EyeIcon';


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [savedReceipts, setSavedReceipts] = useState<SavedReceiptData[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setIsDataLoading(true);
      const q = query(collection(db, 'receipts'), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const receiptsData: SavedReceiptData[] = [];
        querySnapshot.forEach((doc) => {
          receiptsData.push({ ...doc.data(), id: doc.id } as SavedReceiptData);
        });
        setSavedReceipts(receiptsData);
        setIsDataLoading(false);
      }, (error) => {
        console.error("Error fetching receipts: ", error);
        setError("Failed to load your saved receipts.");
        setIsDataLoading(false);
      });
      return () => unsubscribe();
    } else {
      setSavedReceipts([]);
      setIsDataLoading(false);
    }
  }, [user]);

  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [header, data] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
        resolve({ mimeType, data });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = useCallback((file: File) => {
    resetState();
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  }, []);

  const handleAnalyzeClick = async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setReceiptData(null);
    setIsSaved(false);

    try {
      const { mimeType, data } = await fileToBase64(imageFile);
      const result = await analyzeReceiptImage(mimeType, data);
      
      const currentYear = new Date().getFullYear();
      if (result.transaction_date) {
        const receiptYear = parseInt(result.transaction_date.split('-')[0], 10);
        if (receiptYear !== currentYear) {
          setError(`Invalid year. Only receipts for the calendar year ${currentYear} are accepted.`);
          setIsLoading(false);
          return;
        }
      }

      setReceiptData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the receipt. The API key might be missing or invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setImageFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setIsLoading(false);
    setError(null);
    setReceiptData(null);
    setIsSaved(false);
  };

  const handleSaveReceipt = async () => {
    if (!receiptData || !user) return;
    try {
      await addDoc(collection(db, "receipts"), {
        ...receiptData,
        userId: user.uid,
        createdAt: new Date(),
      });
      setIsSaved(true);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Could not save the transaction. Please try again.");
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    try {
      await deleteDoc(doc(db, "receipts", id));
    } catch (e) {
      console.error("Error deleting document: ", e);
      setError("Could not delete the transaction. Please try again.");
    }
  };

  if (isAuthLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Spinner className="w-10 h-10 text-indigo-600"/>
        </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} isLoading={isAuthLoading} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800 antialiased">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <EyeIcon className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-poppins font-semibold text-slate-900">
                Financial Eye
              </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-semibold text-sm text-slate-800">{user.displayName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                {user.photoURL && <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full"/>}
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                    Sign Out
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Upload Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300">
            <h2 className="text-2xl md:text-3xl font-poppins font-bold text-slate-900 mb-1">Upload a Receipt</h2>
            <p className="text-slate-500 mb-6">Drag & drop or click to upload an image for analysis.</p>

            {!imageUrl ? (
              <ImageUploader onImageSelect={handleImageSelect} />
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <div className="relative aspect-auto overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    <img src={imageUrl} alt="Receipt preview" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <button
                      onClick={handleAnalyzeClick}
                      disabled={isLoading}
                      className="flex-grow inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isLoading ? <Spinner /> : 'Extract Transaction Data'}
                    </button>
                    <button
                      onClick={resetState}
                      disabled={isLoading}
                      className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-all duration-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex-grow flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-grow flex items-center justify-center">
                      {isLoading && (
                        <div className="text-center">
                          <Spinner className="w-8 h-8 mx-auto mb-2 text-indigo-600"/>
                          <p className="text-slate-500">Analyzing, please wait...</p>
                        </div>
                      )}
                      {error && <p className="text-red-600 bg-red-100 p-4 rounded-lg text-center">{error}</p>}
                      {receiptData && <ResultDisplay data={receiptData} />}
                      {!isLoading && !error && !receiptData && (
                        <div className="text-center text-slate-500">
                          <p>Click "Extract" to see results here.</p>
                        </div>
                      )}
                    </div>
                    {receiptData && !isLoading && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        {!isSaved ? (
                          <button
                            onClick={handleSaveReceipt}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                          >
                            Save Transaction
                          </button>
                        ) : (
                          <div className="text-center py-2 px-4 bg-green-100 text-green-800 font-semibold rounded-lg">
                            Saved successfully!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction History Card */}
          <div className="mt-10">
              {isDataLoading ? (
                 <div className="flex items-center justify-center py-16">
                    <Spinner className="w-8 h-8 text-indigo-600"/>
                 </div>
              ) : (
                <TransactionHistory receipts={savedReceipts} onDelete={handleDeleteReceipt} />
              )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;