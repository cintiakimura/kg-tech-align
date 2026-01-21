import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FleetManager from '../components/onboarding/fleet/FleetManager';
import { Loader2, Warehouse } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function Garage() {
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: companyProfileList, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['companyProfile'],
        queryFn: () => base44.entities.CompanyProfile.list(undefined, 1),
    });
    
    const companyProfile = companyProfileList?.[0];

    if (isLoadingUser || isLoadingCompany) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00C600]" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Warehouse className="w-8 h-8 text-[#00C600]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">My Garage</h1>
                    <p className="text-muted-foreground mt-1">
                        {companyProfile?.company_name ? `Garage for ${companyProfile.company_name}` : 'Manage your fleet vehicles'}
                    </p>
                </div>
            </div>

            {/* Reuse FleetManager for consistent functionality (Add, Edit, Delete, List) */}
            <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border">
                <FleetManager clientEmail={user?.email} />
            </div>
        </div>
    );
}