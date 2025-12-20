import React, { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2, AlertCircle } from 'lucide-react';
import DashboardStats from '../components/manager/DashboardStats';
import ClientsTable from '../components/manager/ClientsTable';
import { useLanguage } from '../components/LanguageContext';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  // We can't use 't' from LanguageContext easily here for dynamic content unless we add keys, 
  // but let's assume dashboard is internal/admin and fine in English or we reuse some keys.
  
  // Check auth/role
  const { data: user, isLoading: isLoadingUser } = useQuery({
      queryKey: ['me'],
      queryFn: () => base44.auth.me(),
      retry: false
  });

  useEffect(() => {
      if (!isLoadingUser && (!user || user.role !== 'admin')) {
          navigate('/'); // Redirect if not admin
      }
  }, [user, isLoadingUser, navigate]);

  // Fetch All Companies (admin can see all)
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.CompanyProfile.list(),
    enabled: !!user && user.role === 'admin'
  });

  // Fetch All Cars (admin can see all)
  const { data: cars, isLoading: isLoadingCars } = useQuery({
    queryKey: ['allCars'],
    queryFn: () => base44.entities.CarProfile.list(),
    enabled: !!user && user.role === 'admin'
  });

  if (isLoadingUser || (user?.role === 'admin' && (isLoadingCompanies || isLoadingCars))) {
      return (
          <div className="flex h-[80vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
          </div>
      );
  }

  if (user?.role !== 'admin') {
      return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <LayoutDashboard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
                <p className="text-muted-foreground">Overview of all clients, companies, and fleets.</p>
            </div>
        </div>

        <DashboardStats 
            companies={companies || []} 
            cars={cars || []} 
        />

        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                Client Overview
            </h2>
            <ClientsTable 
                companies={companies || []} 
                cars={cars || []} 
            />
        </div>
    </div>
  );
}