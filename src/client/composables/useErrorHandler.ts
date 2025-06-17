import { useToast } from '#imports';

export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = (error: unknown, defaultMessage = '發生錯誤，請稍後再試') => {

    let errorMessage = defaultMessage;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    alert(errorMessage);
    console.error(error);
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