import { useState, useEffect, useCallback } from "react";

const FORM_STORAGE_KEY = "client_form_draft";

interface FormDraft {
  data: Record<string, any>;
  timestamp: number;
  clientId?: string;
}

export const useFormPersistence = (clientId?: string) => {
  const [hasDraft, setHasDraft] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = getDraft();
    if (draft && (!clientId || draft.clientId === clientId)) {
      setHasDraft(true);
    }
  }, [clientId]);

  const saveDraft = useCallback((data: Record<string, any>) => {
    try {
      const draft: FormDraft = {
        data,
        timestamp: Date.now(),
        clientId,
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
    } catch (error) {
      console.error("Error saving form draft:", error);
    }
  }, [clientId]);

  const getDraft = useCallback((): FormDraft | null => {
    try {
      const stored = localStorage.getItem(FORM_STORAGE_KEY);
      if (!stored) return null;

      const draft: FormDraft = JSON.parse(stored);
      
      // Check if draft is less than 24 hours old
      const MAX_AGE = 24 * 60 * 60 * 1000;
      if (Date.now() - draft.timestamp > MAX_AGE) {
        clearDraft();
        return null;
      }

      return draft;
    } catch (error) {
      console.error("Error reading form draft:", error);
      return null;
    }
  }, []);

  const loadDraft = useCallback((): Record<string, any> | null => {
    const draft = getDraft();
    if (draft && (!clientId || draft.clientId === clientId)) {
      return draft.data;
    }
    return null;
  }, [clientId, getDraft]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
      setHasDraft(false);
    } catch (error) {
      console.error("Error clearing form draft:", error);
    }
  }, []);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
  };
};
