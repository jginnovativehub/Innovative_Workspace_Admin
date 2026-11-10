import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalToastHandler: {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
} | null = null;

export const toast = {
  success: (message: string, title?: string) => globalToastHandler?.showToast('success', message, title),
  error: (message: string, title?: string) => globalToastHandler?.showToast('error', message, title),
  warning: (message: string, title?: string) => globalToastHandler?.showToast('warning', message, title),
  info: (message: string, title?: string) => globalToastHandler?.showToast('info', message, title),
  confirm: (options: ConfirmOptions) => globalToastHandler?.confirm(options) ?? Promise.resolve(false)
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, title?: string, duration = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, message, title, duration };
    setToasts(prev => [...prev.slice(-4), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  const success = useCallback((message: string, title?: string) => showToast('success', message, title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast('error', message, title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast('warning', message, title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast('info', message, title), [showToast]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmDialog({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  useEffect(() => {
    globalToastHandler = { showToast, confirm };

    const originalAlert = window.alert;
    window.alert = (msg: any) => {
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      if (text.toLowerCase().includes('fail') || text.toLowerCase().includes('error')) {
        error(text, 'Admin Alert');
      } else if (text.toLowerCase().includes('success') || text.toLowerCase().includes('complete') || text.toLowerCase().includes('provisioned') || text.toLowerCase().includes('deleted')) {
        success(text, 'Admin Confirmed');
      } else if (text.toLowerCase().includes('mandatory') || text.toLowerCase().includes('required')) {
        warning(text, 'Governance Notice');
      } else {
        info(text, 'System Notice');
      }
    };

    return () => {
      window.alert = originalAlert;
      globalToastHandler = null;
    };
  }, [showToast, confirm, error, success, warning, info]);

  const handleConfirmChoice = (choice: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(choice);
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, confirm, dismiss }}>
      {children}

      {/* Floating System Toasts Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto transform transition-all duration-300 ease-out flex items-start p-4 rounded-xl border shadow-lg bg-white relative overflow-hidden animate-in slide-in-from-top-2 fade-in ${
              t.type === 'success'
                ? 'border-emerald-300 text-gray-900 border-l-4 border-l-emerald-600' :
              t.type === 'error'
                ? 'border-rose-300 text-gray-900 border-l-4 border-l-rose-600' :
              t.type === 'warning'
                ? 'border-amber-300 text-gray-900 border-l-4 border-l-amber-600' :
                'border-blue-300 text-gray-900 border-l-4 border-l-blue-600'
            }`}
          >
            {/* Icon Container */}
            <div className={`p-1.5 rounded-lg shrink-0 mr-3 mt-0.5 ${
              t.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              t.type === 'error' ? 'bg-rose-50 text-rose-600' :
              t.type === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {t.type === 'info' && <Info className="w-5 h-5" />}
            </div>

            {/* Body */}
            <div className="flex-1 pr-2 space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-bold font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border ${
                  t.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  t.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  t.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {t.type === 'success' ? 'Confirmed' :
                   t.type === 'error' ? 'Alert' :
                   t.type === 'warning' ? 'Notice' : 'System'}
                </span>
                {t.title && <span className="text-xs font-bold text-gray-900 tracking-tight">{t.title}</span>}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-normal pt-1">{t.message}</p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                confirmDialog.options.variant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                confirmDialog.options.variant === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-blue-50 text-blue-600 border border-blue-200'
              }`}>
                {confirmDialog.options.variant === 'danger' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                  confirmDialog.options.variant === 'danger' ? 'text-rose-600' : 'text-blue-600'
                }`}>
                  {confirmDialog.options.variant === 'danger' ? 'Confirmation Required' : 'Governance Notice'}
                </span>
                <h3 className="text-base font-bold text-gray-900">{confirmDialog.options.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                  {confirmDialog.options.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2.5 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleConfirmChoice(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                {confirmDialog.options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmChoice(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-all ${
                  confirmDialog.options.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.options.confirmText || 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
