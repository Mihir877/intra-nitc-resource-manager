import React, { createContext, useMemo, useState } from "react";

const SidebarContext = createContext(undefined);

export const SidebarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export { SidebarContext };
