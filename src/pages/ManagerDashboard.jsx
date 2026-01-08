import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2, AlertCircle, UserPlus, FileCheck, ShieldAlert, FileText, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardStats from '../components/manager/DashboardStats';
// import ClientsTable from '../components/manager/ClientsTable';
import InviteUserModal from '@/components/manager/InviteUserModal';
import Onboarding from './Onboarding';
import { useLanguage } from '../components/LanguageContext';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('client');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const openInvite = (role) => {
      setInviteRole(role);
      setShowInviteModal(true);
  };

  // Check auth/role
  const { data: user, isLoading: isLoadingUser } = useQuery({
      queryKey: ['me'],
      queryFn: () => base44.auth.me(),
      retry: false
  });

  const isManagerOrAdmin = user?.role === 'admin' || user?.user_type === 'manager' || user?.email === 'georg@kgprotech.com';

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

  // Fetch All Vehicles (admin/manager can see all)
  const { data: cars, isLoading: isLoadingCars } = useQuery({
    queryKey: ['allVehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
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
            <div className="flex gap-2">
                <Button onClick={() => setShowInviteModal(true)} className="gap-2 bg-[#00C600] hover:bg-[#00b300] text-white">
                    <UserPlus className="w-4 h-4" />
                    Invite User
                </Button>
            </div>
            </div>

            <div className="space-y-6">
            {/* Menu Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-purple-600 transition-all border-l-4 border-l-purple-600 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/ProductionControl')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <span className="text-3xl">🏭</span>
                            <span className="font-semibold text-sm">Production Control</span>
                            <span className="text-xs text-muted-foreground">Manage orders, production and logistics</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-green-500 transition-all border-l-4 border-l-green-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/Clients')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <UserPlus className="w-8 h-8 text-green-500" />
                            <span className="font-semibold text-sm">Clients</span>
                            <span className="text-xs text-muted-foreground">View all registered clients</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-indigo-500 transition-all border-l-4 border-l-indigo-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/Quotations')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <FileText className="w-8 h-8 text-indigo-500" />
                            <span className="font-semibold text-sm">Quotations</span>
                            <span className="text-xs text-muted-foreground">Manage client quotations</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-orange-500 transition-all border-l-4 border-l-orange-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/StockControl')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <Package className="w-8 h-8 text-orange-500" />
                            <span className="font-semibold text-sm">Stock Control</span>
                            <span className="text-xs text-muted-foreground">Manage inventory levels and locations</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-emerald-500 transition-all border-l-4 border-l-emerald-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/Purchases')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <span className="text-3xl">🛒</span>
                            <span className="font-semibold text-sm">Purchases</span>
                            <span className="text-xs text-muted-foreground">Manage supplier orders</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-cyan-500 transition-all border-l-4 border-l-cyan-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/Logistics')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <span className="text-3xl">🚚</span>
                            <span className="font-semibold text-sm">Logistics</span>
                            <span className="text-xs text-muted-foreground">Track deliveries</span>
                        </CardContent>
                    </Card>



                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-emerald-600 transition-all border-l-4 border-l-emerald-600 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/FinancialAnalysis')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <span className="text-3xl">📈</span>
                            <span className="font-semibold text-sm">Financials</span>
                            <span className="text-xs text-muted-foreground">Analyze costs and income</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-slate-500 transition-all border-l-4 border-l-slate-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/DocumentVault')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <span className="text-3xl">🗄️</span>
                            <span className="font-semibold text-sm">Document Vault</span>
                            <span className="text-xs text-muted-foreground">Manage and share important documents</span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        
        <InviteUserModal 
            open={showInviteModal} 
            onOpenChange={setShowInviteModal}
            initialRole={inviteRole}
        />
        </div>
        );
        }