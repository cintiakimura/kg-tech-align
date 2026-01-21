import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ArrowLeft, Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ClientsTable from '../components/manager/ClientsTable';
import InviteUserModal from '@/components/manager/InviteUserModal';
import CompanyForm from '@/components/onboarding/CompanyForm';
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Clients() {
    const navigate = useNavigate();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [inviteRole, setInviteRole] = useState('client');
    const queryClient = useQueryClient();

    const { data: companies, isLoading: isLoadingCompanies } = useQuery({
        queryKey: ['allCompanies'],
        queryFn: () => base44.entities.CompanyProfile.list(),
    });

    const { data: cars, isLoading: isLoadingCars } = useQuery({
        queryKey: ['allVehicles'],
        queryFn: () => base44.entities.Vehicle.list(),
    });

    if (isLoadingCompanies || isLoadingCars) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowManualAdd(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Manual Add
                    </Button>
                    <Button onClick={() => setShowInviteModal(true)} className="bg-[#00C600] hover:bg-[#00b300] text-white gap-2">
                        <UserPlus className="w-4 h-4" />
                        Invite Client
                    </Button>
                </div>
            </div>

            <ClientsTable 
                companies={companies || []} 
                cars={cars || []} 
            />

            <InviteUserModal 
                open={showInviteModal} 
                onOpenChange={setShowInviteModal}
                initialRole="client"
            />

            <Dialog open={showManualAdd} onOpenChange={setShowManualAdd}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <CompanyForm onComplete={() => {
                        setShowManualAdd(false);
                        queryClient.invalidateQueries(['allCompanies']);
                    }} />
                </DialogContent>
            </Dialog>
        </div>
    );
}