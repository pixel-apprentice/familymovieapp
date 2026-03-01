import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'alert' | 'confirm' | 'prompt';
  defaultValue?: string;
  placeholder?: string;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => Promise<any>;
  hideModal: () => void;
  modalState: ModalState | null;
}

interface ModalState extends ModalOptions {
  resolve: (value: any) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const showModal = useCallback((options: ModalOptions) => {
    return new Promise<any>((resolve) => {
      setModalState({
        ...options,
        resolve,
      });
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, modalState }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
