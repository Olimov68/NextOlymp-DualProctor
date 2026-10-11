import React, { useState } from 'react';
import { EgaSidebar } from './EgaSidebar';
import { EgaNavbar } from './EgaNavbar';

interface EgaLayoutProps {
  children: React.ReactNode;
}

export const EgaLayout: React.FC<EgaLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <EgaSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 bg-zinc-950 custom-scrollbar">
        <EgaNavbar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => {
            if (window.innerWidth < 1024) {
              setIsMobileOpen(!isMobileOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
        />
        <main className="p-3.5 sm:p-5 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 md:space-y-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EgaLayout;
