import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function DashboardShell({ children, sidebarItems, activeTab, onTabChange, title, userRole }) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-gray-50 dark:bg-[#121212]">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 hidden md:block">
        <div className="p-6">
          <h2 className="text-lg font-bold tracking-tight mb-1">{title}</h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{userRole} View</span>
        </div>
        <nav className="space-y-1 px-3">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === item.id ? "bg-gray-100 dark:bg-[#2a2a2a] font-semibold" : "font-normal"
              )}
              onClick={() => onTabChange(item.id)}
            >
              {item.icon && <item.icon className="mr-2 h-4 w-4" />}
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
            {children}
        </div>
      </main>
    </div>
  );
}