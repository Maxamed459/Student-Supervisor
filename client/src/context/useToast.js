import { useContext } from 'react';
import { ToastContext } from './toastContextValue';

export function useToast() {
  return useContext(ToastContext) || { success: () => {}, error: () => {} };
}

export default useToast;
