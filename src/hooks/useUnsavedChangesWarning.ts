import { useState, useCallback, useRef, useEffect } from "react";

interface UseUnsavedChangesWarningReturn {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  showConfirmDialog: boolean;
  pendingClose: boolean;
  handleCloseAttempt: (shouldClose: boolean) => boolean;
  confirmClose: () => void;
  cancelClose: () => void;
  resetDirtyState: () => void;
}

export function useUnsavedChangesWarning(
  onConfirmClose?: () => void
): UseUnsavedChangesWarningReturn {
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const onConfirmCloseRef = useRef(onConfirmClose);

  // Keep ref updated
  useEffect(() => {
    onConfirmCloseRef.current = onConfirmClose;
  }, [onConfirmClose]);

  const handleCloseAttempt = useCallback(
    (shouldClose: boolean): boolean => {
      // If trying to close and there are unsaved changes
      if (!shouldClose && isDirty) {
        setShowConfirmDialog(true);
        setPendingClose(true);
        return false; // Prevent close
      }
      
      // If trying to close with no changes, allow it
      if (!shouldClose && !isDirty) {
        return true; // Allow close
      }

      return shouldClose;
    },
    [isDirty]
  );

  const confirmClose = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingClose(false);
    setIsDirty(false);
    onConfirmCloseRef.current?.();
  }, []);

  const cancelClose = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingClose(false);
  }, []);

  const resetDirtyState = useCallback(() => {
    setIsDirty(false);
    setShowConfirmDialog(false);
    setPendingClose(false);
  }, []);

  return {
    isDirty,
    setIsDirty,
    showConfirmDialog,
    pendingClose,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
    resetDirtyState,
  };
}
