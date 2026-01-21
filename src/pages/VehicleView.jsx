import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Image as ImageIcon, FileText, Pencil } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function VehicleView() {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('vehicleId');

    const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ['vehicle', vehicleId],
        queryFn: () => base44.entities.Vehicle.list({ id: vehicleId }).then(res => res[0]),
        enabled: !!vehicleId,
    });

    const { data: connectors, isLoading: isLoadingConnectors } = useQuery({
        queryKey: ['connectors', vehicleId],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: vehicleId }),
        enabled: !!vehicleId,
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    if (isLoadingVehicle) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    if (!vehicleId || !vehicle) {
        return <div className="p-8 text-center text-red-500">Vehicle not found</div>;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header / Vehicle Info */}
            <div className="flex items-center justify-between bg-white dark:bg-[#2a2a2a] p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = createPageUrl('Onboarding')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold uppercase">{vehicle.brand} {vehicle.model} - View Only</h2>
                            {vehicle.vehicle_number && (
                                <span className="text-xs bg-[#00C600]/10 text-[#00C600] px-2 py-0.5 rounded border border-[#00C600]/20 font-mono font-bold">
                                    {vehicle.vehicle_number}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground uppercase">
                            {vehicle.engine_size} {vehicle.fuel} | {vehicle.year} | {vehicle.vin}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline"
                    onClick={() => window.location.href = createPageUrl('VehicleEdit') + `?vehicleId=${vehicleId}`}
                    className="gap-2"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Vehicle
                </Button>
            </div>

            {/* Vehicle Details Card */}
            <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-sm">
                <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span className="text-xs uppercase text-muted-foreground block">Transmission</span>
                        <span className="font-bold">{vehicle.transmission_type}</span>
                    </div>
                    <div>
                        <span className="text-xs uppercase text-muted-foreground block">Gears</span>
                        <span className="font-bold">{vehicle.number_gears}</span>
                    </div>
                    <div>
                        <span className="text-xs uppercase text-muted-foreground block">Engine Power</span>
                        <span className="font-bold">{vehicle.engine_power}</span>
                    </div>
                    <div>
                        <span className="text-xs uppercase text-muted-foreground block">Engine Code</span>
                        <span className="font-bold">{vehicle.engine_code}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Connectors Grid - Read Only */}
            <h3 className="text-sm font-bold uppercase flex items-center gap-2 mt-8 mb-4">
                Linked Connectors
                <span className="bg-[#00C600] text-white text-[10px] px-2 py-0.5 rounded-full">{connectors?.length || 0}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {isLoadingConnectors ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800"></Card>
                    ))
                ) : connectors?.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground bg-white dark:bg-[#2a2a2a] rounded-lg">
                        No connectors linked to this vehicle.
                    </div>
                ) : connectors?.map((conn) => {
                    const catalogueItem = catalogueItems?.find(c => c.id === conn.catalogue_id);
                    return (
                        <Card key={conn.id} className="relative group border-l-4 border-l-[#00C600] flex flex-col overflow-hidden hover:shadow-md transition-all">
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
                                    {conn.file_wiring_diagram && (
                                        <div className="flex items-center gap-1 text-[#00C600]">
                                            <FileText className="w-3 h-3" />
                                            <span>Scheme</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}