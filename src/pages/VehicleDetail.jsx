import React, { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, FileText, ImageIcon, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from '@/utils';

export default function VehicleDetail() {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('id');
    const [accessDenied, setAccessDenied] = useState(false);

    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ['vehicle', vehicleId],
        queryFn: async () => {
            const res = await base44.entities.Vehicle.list({ id: vehicleId });
            return res[0] || null;
        },
        enabled: !!vehicleId
    });

    const { data: connectors, isLoading: isLoadingConnectors } = useQuery({
        queryKey: ['connectors', vehicleId],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: vehicleId }),
        enabled: !!vehicleId && !accessDenied
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    useEffect(() => {
        if (user && vehicle) {
            // Check ownership - allow admin and manager to view all
            const isManager = user.role === 'admin' || user.user_type === 'manager';
            if (!isManager && vehicle.client_id !== user.id) {
                setAccessDenied(true);
            } else {
                setAccessDenied(false);
            }
        }
    }, [user, vehicle]);

    if (isLoadingUser || isLoadingVehicle) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00C600]" /></div>;
    }

    if (!vehicleId || !vehicle) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-bold">Vehicle not found</div>;
    }

    if (accessDenied) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="text-xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You are not authorized to view this vehicle.</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-6">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight">
                        {vehicle.brand} {vehicle.model}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-muted-foreground">
                            VIN: {vehicle.vin}
                        </span>
                        {vehicle.vehicle_number && (
                            <span className="text-sm font-mono bg-[#00C600]/10 text-[#00C600] px-2 py-0.5 rounded border border-[#00C600]/20">
                                {vehicle.vehicle_number}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase">Specs</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs uppercase text-muted-foreground block">Engine Code</span>
                            <span className="font-bold">{vehicle.engine_code || '-'}</span>
                        </div>
                         <div>
                            <span className="text-xs uppercase text-muted-foreground block">Engine Size</span>
                            <span className="font-bold">{vehicle.engine_size || '-'}</span>
                        </div>
                         <div>
                            <span className="text-xs uppercase text-muted-foreground block">Power</span>
                            <span className="font-bold">{vehicle.engine_power || '-'}</span>
                        </div>
                         <div>
                            <span className="text-xs uppercase text-muted-foreground block">Fuel</span>
                            <span className="font-bold">{vehicle.fuel || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase">Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        {vehicle.file_electrical_scheme ? (
                            <a href={vehicle.file_electrical_scheme} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                <FileText className="w-8 h-8 text-[#00C600]" />
                                <div>
                                    <span className="text-xs font-bold uppercase block group-hover:underline">Electrical Scheme</span>
                                    <span className="text-[10px] text-muted-foreground">Click to view</span>
                                </div>
                            </a>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed opacity-50">
                                <FileText className="w-8 h-8 text-gray-400" />
                                <span className="text-xs font-bold uppercase text-gray-400">No Scheme</span>
                            </div>
                        )}

                        {vehicle.file_sensors_actuators ? (
                            <a href={vehicle.file_sensors_actuators} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                <FileText className="w-8 h-8 text-[#00C600]" />
                                <div>
                                    <span className="text-xs font-bold uppercase block group-hover:underline">Function List</span>
                                    <span className="text-[10px] text-muted-foreground">Click to view</span>
                                </div>
                            </a>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed opacity-50">
                                <FileText className="w-8 h-8 text-gray-400" />
                                <span className="text-xs font-bold uppercase text-gray-400">No Functions</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Photos */}
            {(vehicle.image_connector_front || vehicle.image_lever_side || vehicle.image_ecu_front) && (
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold uppercase">Vehicle Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { label: "Connector Front", src: vehicle.image_connector_front },
                            { label: "Lever Side", src: vehicle.image_lever_side },
                            { label: "ECU Front", src: vehicle.image_ecu_front },
                            { label: "ECU Part #", src: vehicle.image_ecu_part_number },
                        ].map((img, i) => img.src && (
                            <Card key={i} className="overflow-hidden border-none shadow-sm bg-white dark:bg-[#2a2a2a] group cursor-pointer" onClick={() => window.open(img.src, '_blank')}>
                                <div className="aspect-square relative">
                                    <img src={img.src} alt={img.label} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon className="text-white w-6 h-6" />
                                    </div>
                                </div>
                                <div className="p-2 text-xs font-bold uppercase text-center truncate">{img.label}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Connectors Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold uppercase flex items-center gap-2">
                        Connectors
                        <span className="bg-[#00C600] text-white text-xs px-2 py-0.5 rounded-full">{connectors?.length || 0}</span>
                    </h3>
                </div>

                {isLoadingConnectors ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 border-none" />
                        ))}
                    </div>
                ) : connectors?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg border border-dashed">
                        <p className="text-muted-foreground uppercase text-sm font-bold">No connectors found for this vehicle.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {connectors.map((conn) => {
                             const catalogueItem = catalogueItems?.find(c => c.id === conn.catalogue_id);
                             return (
                                <Card key={conn.id} className="relative group border-l-4 border-l-[#00C600] flex flex-col overflow-hidden hover:shadow-md transition-all border-y-0 border-r-0 bg-white dark:bg-[#2a2a2a]">
                                    <CardContent className="p-3 space-y-2 flex-grow">
                                        <div className="w-full h-24 mb-2 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                                            {catalogueItem?.image_url ? (
                                                <img src={catalogueItem.image_url} alt="" className="w-full h-full object-contain" />
                                            ) : conn.image_1 ? (
                                                <img src={conn.image_1} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-300 w-8 h-8" />
                                            )}
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-bold uppercase text-xs truncate" title={conn.calculator_system}>
                                                {conn.calculator_system || "Unknown"}
                                            </h4>
                                            
                                            {catalogueItem && (
                                                <div className="text-xs font-semibold text-blue-600 truncate mt-1">
                                                    {catalogueItem.secret_part_number}
                                                </div>
                                            )}
                                        </div>
        
                                        <div className="text-[10px] text-muted-foreground space-y-0.5 mt-2 border-t pt-2">
                                            <div className="flex justify-between">
                                                <span>Color:</span>
                                                <span className="font-medium text-foreground truncate ml-1">{conn.connector_color || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Pins:</span>
                                                <span className="font-medium text-foreground">{conn.pin_quantity || '-'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}