import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VehicleList from './VehicleList';
import VehicleSpecsForm from './VehicleSpecsForm';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function FleetManager({ clientEmail, vehicles: propVehicles }) {
    const [view, setView] = useState("list"); // list, add-vehicle
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: fetchedVehicles, isLoading } = useQuery({
        queryKey: ['vehicles', user?.id, user?.company_id],
        queryFn: async () => {
            if (!user) return [];
            const isManager = user.role === 'admin' || user.user_type === 'manager';
            if (isManager) {
                return base44.entities.Vehicle.list();
            } else if (user.company_id) {
                return base44.entities.Vehicle.list({ client_id: user.company_id });
            } else {
                // Fallback for users without company_id (legacy)
                return base44.entities.Vehicle.list({ client_id: user.id });
            }
        },
        enabled: !propVehicles && !!user
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
        window.location.href = createPageUrl('VehicleDetail') + `?id=${vehicle.id}`;
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