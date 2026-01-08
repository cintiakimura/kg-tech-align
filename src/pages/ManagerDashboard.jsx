import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2, AlertCircle, UserPlus, FileCheck, ShieldAlert, FileText, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardStats from '../components/manager/DashboardStats';
import ClientsTable from '../components/manager/ClientsTable';
import InviteUserModal from '@/components/manager/InviteUserModal';
import QuoteManager from '@/components/manager/QuoteManager';
import SupplierDashboard from './SupplierDashboard';
import Onboarding from './Onboarding';
import { useLanguage } from '../components/LanguageContext';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('client');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

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

  // Filter vehicles that need quote attention
  const activeQuoteVehicles = cars?.filter(car => 
      ['Open for Quotes', 'Quotes Received', 'Quote Selected'].includes(car.status)
  ) || [];

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
                <Button onClick={() => setShowInviteModal(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite User
                </Button>
            </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-[#2a2a2a] p-1 border">
                <TabsTrigger value="overview" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="quotes" className="gap-2">
                    <FileCheck className="w-4 h-4" /> Quotes & Fulfillment
                </TabsTrigger>
                <TabsTrigger value="supplier" className="gap-2">
                    <span className="text-xl">🏭</span> Supplier View
                </TabsTrigger>
                <TabsTrigger value="client" className="gap-2">
                    <span className="text-xl">🏢</span> Client View
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
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
                        onClick={() => openInvite('client')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <UserPlus className="w-8 h-8 text-green-500" />
                            <span className="font-semibold text-sm">Add Client</span>
                            <span className="text-xs text-muted-foreground">Invite a new client company to the platform</span>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-indigo-500 transition-all border-l-4 border-l-indigo-500 h-full transform hover:-translate-y-1"
                        onClick={() => navigate('/CreateClientQuote')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <FileText className="w-8 h-8 text-indigo-500" />
                            <span className="font-semibold text-sm">New Client Quotation</span>
                            <span className="text-xs text-muted-foreground">Create a sales quote for a client</span>
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
                        className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:shadow-lg hover:border-blue-500 transition-all border-l-4 border-l-blue-500 h-full transform hover:-translate-y-1"
                        onClick={() => openInvite('supplier')}
                    >
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                            <span className="text-3xl">🏭</span>
                            <span className="font-semibold text-sm">Add Supplier</span>
                            <span className="text-xs text-muted-foreground">Invite a new supplier to join the network</span>
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
                </div>
            </TabsContent>

            <TabsContent value="quotes" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List of Vehicles */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="h-[600px] flex flex-col">
                            <CardHeader>
                                <CardTitle>Active Requests</CardTitle>
                                <CardDescription>Vehicles requiring quote management</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto space-y-2">
                                {activeQuoteVehicles.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">No active quote requests.</p>
                                ) : (
                                    activeQuoteVehicles.map(car => (
                                        <div 
                                            key={car.id}
                                            onClick={() => setSelectedVehicleId(car.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedVehicleId === car.id ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-sm">{car.brand} {car.model}</span>
                                                <Badge variant="outline" className="text-[10px]">{car.status}</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                VIN: {car.vin}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {car.created_by}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quote Manager View */}
                    <div className="lg:col-span-2">
                        {selectedVehicleId ? (
                            <QuoteManager vehicleId={selectedVehicleId} />
                        ) : (
                            <Card className="h-[600px] flex items-center justify-center text-muted-foreground border-dashed">
                                <div className="text-center">
                                    <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Select a vehicle to manage quotes</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="supplier">
                <div className="border rounded-xl overflow-hidden p-4 bg-gray-50 dark:bg-gray-900">
                    <SupplierDashboard />
                </div>
            </TabsContent>

            <TabsContent value="client">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">All Clients</h2>
                    </div>
                    <ClientsTable 
                        companies={companies || []} 
                        cars={cars || []} 
                    />
                </div>
            </TabsContent>
        </Tabs>
        
        <InviteUserModal 
            open={showInviteModal} 
            onOpenChange={setShowInviteModal}
            initialRole={inviteRole}
        />
        </div>
        );
        }