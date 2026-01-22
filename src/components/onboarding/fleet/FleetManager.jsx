import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VehicleList from './VehicleList';
import VehicleSpecsForm from './VehicleSpecsForm';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import _ from 'lodash';

export default function FleetManager({ clientEmail, vehicles: propVehicles }) {
    const [view, setView] = useState("list"); // list, add-vehicle
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: fetchedVehicles, isLoading } = useQuery({
        queryKey: ['vehicles', user?.id, user?.company_id, user?.email],
        queryFn: async () => {
            if (!user) return [];
            const isManager = user.role === 'admin' || user.user_type === 'manager';
            if (isManager) {
                return base44.entities.Vehicle.list();
            }

            // Robust Fetching Strategy:
            // 1. By Company ID (if exists)
            // 2. By User ID (personal/legacy)
            // 3. By Creator Email (safety net for items created but not linked correctly)
            
            const queries = [];
            
            if (user.company_id) {
                queries.push(base44.entities.Vehicle.list({ client_id: user.company_id }));
            }
            
            // Always fetch by personal ID just in case
            queries.push(base44.entities.Vehicle.list({ client_id: user.id }));
            
            // Safety net: fetch everything created by this user
            if (user.email) {
                queries.push(base44.entities.Vehicle.list({ created_by: user.email }));
                queries.push(base44.entities.Vehicle.list({ client_email: user.email }));
            }

            // Also fetch by the clientEmail prop if provided (for when manager views a client)
            if (clientEmail) {
                queries.push(base44.entities.Vehicle.list({ client_email: clientEmail }));
            }

            const results = await Promise.all(queries);
            const allVehicles = results.flat();
            
            // Deduplicate by ID
            const uniqueVehicles = _.uniqBy(allVehicles, 'id');
            // Sort by created_date descending to show newest first
            return uniqueVehicles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        },
        enabled: !propVehicles && !!user,
        retry: 5,
        retryDelay: 1000,
        staleTime: 0, // Ensure we always fetch fresh data when mounting
    });

    const vehicles = propVehicles || fetchedVehicles;

    const handleAddVehicle = () => {
        setSelectedVehicle(null);
        setView("add-vehicle");
    };

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setView("add-vehicle");
    };

    const handleSelectVehicle = (vehicle) => {
        window.location.href = createPageUrl('VehicleView') + `?vehicleId=${vehicle.id}`;
    };



    const handleDeleteVehicle = async (id) => {
        if (confirm("Are you sure you want to delete this vehicle and all its connectors?")) {
            await base44.entities.Vehicle.delete(id);
            // Also delete connectors
            const conns = await base44.entities.VehicleConnector.list({ vehicle_id: id });
            await Promise.all(conns.map(c => base44.entities.VehicleConnector.delete(c.id)));
            queryClient.invalidateQueries(['vehicles']);
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-[#00C600]" /></div>;

    return (
        <div className="animate-in fade-in duration-300">
            {view === "list" && (
                <VehicleList 
                    vehicles={vehicles || []} 
                    onAddVehicle={handleAddVehicle} 
                    onSelectVehicle={handleSelectVehicle}
                    onDeleteVehicle={handleDeleteVehicle}
                    onEditVehicle={handleEditVehicle}
                />
            )}

            {view === "add-vehicle" && (
                <VehicleSpecsForm 
                    clientEmail={clientEmail}
                    initialData={selectedVehicle}
                    onCancel={() => setView("list")} 
                    onSuccess={(vehicle) => {
                        queryClient.invalidateQueries(['vehicles']);
                        // After saving, go to connectors page
                        if (vehicle) {
                            window.location.href = createPageUrl('VehicleConnectors') + `?vehicleId=${vehicle.id}`;
                        } else {
                            setView("list");
                        }
                    }}
                />
            )}

            {/* Removed embedded vehicle detail view */}
        </div>
    );
}