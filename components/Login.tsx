import React from 'react';
import { GoogleIcon } from './icons/GoogleIcon';
import { EyeIcon } from './icons/EyeIcon';

interface LoginProps {
  onLogin: () => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100/50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200">
            <EyeIcon className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-slate-900 mb-2">Welcome to Financial Eye</h1>
            <p className="text-slate-500 mb-8">Sign in to securely save and manage your transaction history.</p>
            <button
                onClick={onLogin}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
                {isLoading ? (
                    <span>Signing in...</span>
                ) : (
                    <>
                        <GoogleIcon className="w-5 h-5" />
                        Sign in with Google
                    </>
                )}
            </button>
        </div>
        <p className="text-xs text-slate-400 mt-6">Your data is stored securely and is only accessible by you.</p>
      </div>
    </div>
  );
};

export default Login;