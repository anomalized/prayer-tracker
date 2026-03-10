"use client";

import { createContext, useContext, useState, useCallback } from "react";
import SideDrawer from "./SideDrawer";

interface NavCtx {
  openDrawer: () => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

const NavContext = createContext<NavCtx>({ openDrawer: () => {}, closeDrawer: () => {}, isOpen: false });

export function useNav() {
  return useContext(NavContext);
}

interface Props {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export default function NavProvider({ children, userName, userEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer  = useCallback(() => setIsOpen(true),  []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  return (
    <NavContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      <SideDrawer open={isOpen} onClose={closeDrawer} userName={userName} userEmail={userEmail} />
      {children}
    </NavContext.Provider>
  );
}