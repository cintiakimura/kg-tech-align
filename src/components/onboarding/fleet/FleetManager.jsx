import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import VehicleList from './VehicleList';
import VehicleSpecsForm from './VehicleSpecsForm';
import VehicleDetail from './VehicleDetail';
import ConnectorForm from './ConnectorForm';
import { Loader2 } from 'lucide-react';

export default function FleetManager({ clientEmail, vehicles: propVehicles }) {
    const [view, setView] = useState("list"); // list, add-vehicle, vehicle-detail, add-connector
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const queryClient = useQueryClient();

    const { data: fetchedVehicles, isLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => base44.entities.Vehicle.list(),
        enabled: !propVehicles
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
        setSelectedVehicle(vehicle);
        setView("vehicle-detail");
    };

    const handleAddConnector = () => {
        setView("add-connector");
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
                        // After saving, go to detail view to manage connectors
                        if (vehicle) {
                            setSelectedVehicle(vehicle);
                            setView("vehicle-detail");
                        } else {
                            setView("list");
                        }
                    }}
                />
            )}

            {view === "vehicle-detail" && selectedVehicle && (
                <VehicleDetail 
                    vehicle={selectedVehicle} 
                    onBack={() => setView("list")} 
                    onAddConnector={handleAddConnector}
                />
            )}

            {view === "add-connector" && selectedVehicle && (
                <ConnectorForm 
                    vehicle={selectedVehicle} 
                    onCancel={() => setView("vehicle-detail")} 
                    onSuccess={() => {
                        queryClient.invalidateQueries(['connectors', selectedVehicle.id]);
                        setView("vehicle-detail");
                    }}
                />
            )}
        </div>
    );
}