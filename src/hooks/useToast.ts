import { useState, useCallback } from 'react';
import { ToastMessage } from '../components/Toast';

export const useToast = () => {
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' = 'info', 
    duration?: number
  ) => {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, message, type, duration };
    setToastMessages(prev => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToastMessages(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toastMessages,
    showToast,
    removeToast
  };
};
