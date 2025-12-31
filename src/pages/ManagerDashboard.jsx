import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import DashboardStats from '../components/manager/DashboardStats';
import ClientsTable from '../components/manager/ClientsTable';
import InviteUserModal from '@/components/manager/InviteUserModal';
import { useLanguage } from '../components/LanguageContext';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Check auth/role
  const { data: user, isLoading: isLoadingUser } = useQuery({
      queryKey: ['me'],
      queryFn: () => base44.auth.me(),
      retry: false
  });

  const isManagerOrAdmin = user?.role === 'admin' || user?.user_type === 'manager';

  useEffect(() => {
      if (!isLoadingUser && (!user || !isManagerOrAdmin)) {
          navigate('/'); // Redirect if not admin or manager
      }
  }, [user, isLoadingUser, navigate, isManagerOrAdmin]);

  // Fetch All Companies (admin/manager can see all)
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.CompanyProfile.list(),
    enabled: !!isManagerOrAdmin
  });

  // Fetch All Cars (admin/manager can see all)
  const { data: cars, isLoading: isLoadingCars } = useQuery({
    queryKey: ['allCars'],
    queryFn: () => base44.entities.CarProfile.list(),
    enabled: !!isManagerOrAdmin
  });

  if (isLoadingUser || (isManagerOrAdmin && (isLoadingCompanies || isLoadingCars))) {
      return (
          <div className="flex h-[80vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
          </div>
      );
  }

  if (!isManagerOrAdmin) {
      return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <LayoutDashboard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
                    <p className="text-muted-foreground">Overview of all clients, companies, and fleets.</p>
                </div>
            </div>
            <Button onClick={() => setShowInviteModal(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invite User
            </Button>
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
        
        <InviteUserModal 
            open={showInviteModal} 
            onOpenChange={setShowInviteModal} 
        />
    </div>
  );
}