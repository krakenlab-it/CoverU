"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CoveragePlanContext = {
  planVersionId: string;
  planName: string;
};

type CoverageAssistantContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  planContext: CoveragePlanContext | null;
  setPlanContext: (context: CoveragePlanContext | null) => void;
};

const CoverageAssistantContext =
  createContext<CoverageAssistantContextValue | null>(null);

export function CoverageAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [planContext, setPlanContext] = useState<CoveragePlanContext | null>(
    null,
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      planContext,
      setPlanContext,
    }),
    [isOpen, open, close, toggle, planContext],
  );

  return (
    <CoverageAssistantContext.Provider value={value}>
      {children}
    </CoverageAssistantContext.Provider>
  );
}

export function useCoverageAssistantPanel() {
  const context = useContext(CoverageAssistantContext);
  if (!context) {
    throw new Error(
      "useCoverageAssistantPanel must be used within CoverageAssistantProvider",
    );
  }
  return context;
}
