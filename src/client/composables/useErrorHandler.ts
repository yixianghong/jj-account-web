import { useToast } from '#imports';

export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = (error: unknown, defaultMessage = '發生錯誤，請稍後再試') => {
    console.error('錯誤詳情：', error);

    let errorMessage = defaultMessage;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    toast.add({
      title: '錯誤',
      description: errorMessage,
      color: 'error',
      timeout: 5000,
      icon: 'i-heroicons-exclamation-circle'
    });
  };

  return {
    handleError
  };
}; 