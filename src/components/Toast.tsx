import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 15000); // 15 seconds
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-4 p-4 bg-[#D9D8D5] border border-[#141414] shadow-md font-sans ${
        toast.type === 'success'
          ? 'border-l-4 border-l-green-600'
          : toast.type === 'error'
          ? 'border-l-4 border-l-red-600'
          : 'border-l-4 border-l-[#141414]'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-700" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-slate-800" />}
      </div>
      <div className="flex-1 text-xs font-mono text-[#141414] leading-relaxed">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-[#141414]/60 hover:text-[#141414] transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};
