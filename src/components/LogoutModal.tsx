import React, { useEffect } from 'react';
import { LogOut, X, Shield, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  currentUser: User | null;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  currentUser
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl space-y-5 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-400 shadow-lg shadow-red-600/10">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Exit Admin Console?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirm administrative session termination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Admin Identity Card */}
        {currentUser && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-white block leading-tight">{currentUser.fullName}</span>
                <span className="text-xs text-slate-400 font-mono">{currentUser.email}</span>
              </div>
            </div>

            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Informative message */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Are you sure you want to log out of the Enterprise Governance Console? All unsaved governance edits will be discarded. Your database records in MongoDB Atlas remain intact.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={onConfirmLogout}
            className="cursor-pointer flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/25 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Yes, Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

