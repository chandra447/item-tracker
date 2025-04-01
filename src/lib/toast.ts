import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: 500,
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

/**
 * Show an error toast notification
 */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: 500,
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

/**
 * Show an info toast notification
 */
export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: 500,
    },
    icon: '📢',
  });
};

/**
 * Show a warning toast notification
 */
export const showWarning = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontWeight: 500,
    },
    icon: '⚠️',
  });
};
