import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Loader2, AlertCircle, UserPlus, FileCheck, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardStats from '../components/manager/DashboardStats';
import ClientsTable from '../components/manager/ClientsTable';
import InviteUserModal from '@/components/manager/InviteUserModal';
import QuoteManager from '@/components/manager/QuoteManager';
import AdminAuditReport from './AdminAuditReport'; // Importing the page component to embed
import { useLanguage } from '../components/LanguageContext';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  
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

        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white dark:bg-[#2a2a2a] p-1 border">
                <TabsTrigger value="overview" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="quotes" className="gap-2">
                    <FileCheck className="w-4 h-4" /> Quotes & Fulfillment
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                    <ShieldAlert className="w-4 h-4" /> System Audit
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
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

            <TabsContent value="audit">
                {/* Embedding the Audit Report Page */}
                <div className="border rounded-xl overflow-hidden">
                    <AdminAuditReport /> 
                </div>
            </TabsContent>
        </Tabs>
        
        <InviteUserModal 
            open={showInviteModal} 
            onOpenChange={setShowInviteModal} 
        />
    </div>
  );
}