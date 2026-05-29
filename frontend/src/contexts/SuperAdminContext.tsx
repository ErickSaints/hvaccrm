import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import SuperAdminConfirm from '../components/SuperAdminConfirm';

interface SuperAdminContextType {
  confirmSuperAdmin: (action: () => void) => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const confirmSuperAdmin = useCallback((action: () => void) => {
    setPendingAction(() => action);
  }, []);

  return (
    <SuperAdminContext.Provider value={{ confirmSuperAdmin }}>
      {children}
      <SuperAdminConfirm
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirmed={() => {
          pendingAction?.();
          setPendingAction(null);
        }}
      />
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdminConfirm() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error('useSuperAdminConfirm must be used within SuperAdminProvider');
  return ctx.confirmSuperAdmin;
}
