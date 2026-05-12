import { toast as sonner } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function toast(message: string, type: ToastType = 'info'): void {
  switch (type) {
    case 'success':
      sonner.success(message);
      return;
    case 'error':
      sonner.error(message);
      return;
    case 'warning':
      sonner.warning(message);
      return;
    case 'info':
    default:
      sonner.info(message);
  }
}

toast.success = (message: string): void => void sonner.success(message);
toast.error = (message: string): void => void sonner.error(message);
toast.info = (message: string): void => void sonner.info(message);
toast.warning = (message: string): void => void sonner.warning(message);

export { sonner as rawToast };
