import Swal from 'sweetalert2';

interface ConfirmationDialogProps {
  title: string;
  text: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
}

export const ConfirmationDialog = async ({
  title,
  text,
  icon = 'warning',
  confirmButtonText = 'Yes',
  cancelButtonText = 'Cancel',
  confirmButtonColor = '#ef4444',
  cancelButtonColor = '#6b7280'
}: ConfirmationDialogProps): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
    // Mobile-friendly configurations
    customClass: {
      popup: 'swal2-mobile-popup',
      title: 'swal2-mobile-title',
      htmlContainer: 'swal2-mobile-content',
      actions: 'swal2-mobile-actions',
      confirmButton: 'swal2-mobile-confirm-btn',
      cancelButton: 'swal2-mobile-cancel-btn'
    },
    // Responsive width
    width: 'auto',
    padding: '1.5rem',
    // Better mobile positioning
    position: 'center',
    // Prevent backdrop scrolling on mobile
    allowOutsideClick: false,
    allowEscapeKey: true,
    // Mobile-specific settings
    showClass: {
      popup: 'animate__animated animate__fadeInUp animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutDown animate__faster'
    }
  });

  return result.isConfirmed;
};

interface ErrorDialogProps {
  title?: string;
  text: string;
  confirmButtonColor?: string;
}

export const ErrorDialog = async ({
  title = 'Error',
  text,
  confirmButtonColor = '#3b82f6'
}: ErrorDialogProps): Promise<void> => {
  await Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor,
    // Mobile-friendly configurations
    customClass: {
      popup: 'swal2-mobile-popup',
      title: 'swal2-mobile-title',
      htmlContainer: 'swal2-mobile-content',
      actions: 'swal2-mobile-actions',
      confirmButton: 'swal2-mobile-confirm-btn'
    },
    // Responsive width
    width: 'auto',
    padding: '1.5rem',
    // Better mobile positioning
    position: 'center',
    // Prevent backdrop scrolling on mobile
    allowOutsideClick: false,
    allowEscapeKey: true,
    // Mobile-specific settings
    showClass: {
      popup: 'animate__animated animate__fadeInUp animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutDown animate__faster'
    }
  });
};