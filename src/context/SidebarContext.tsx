import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextType {
  isOpen: boolean;
  isDesktop: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const DESKTOP_BREAKPOINT = 900;

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches,
  );
  const [isOpen, setIsOpen] = useState(isDesktop);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

    const apply = (matches: boolean) => {
      setIsDesktop(matches);
      setIsOpen(matches);
    };

    apply(media.matches);

    const listener = (event: MediaQueryListEvent) => apply(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    if (!isDesktop) setIsOpen(false);
  }, [isDesktop]);
  const toggle = useCallback(() => {
    if (isDesktop) return;
    setIsOpen((prev) => !prev);
  }, [isDesktop]);

  const value = useMemo(
    () => ({ isOpen, isDesktop, open, close, toggle }),
    [isOpen, isDesktop, open, close, toggle],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};
