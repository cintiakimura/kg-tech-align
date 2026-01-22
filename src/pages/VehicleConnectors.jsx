import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, ArrowLeft, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from "sonner";
import { createPageUrl } from '@/utils';
import { getProxiedImageUrl } from "@/components/utils/imageUtils";
import ConnectorForm from '@/components/onboarding/fleet/ConnectorForm';

export default function VehicleConnectors() {
    const queryClient = useQueryClient();
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('vehicleId');

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: vehicle, isLoading: isLoadingVehicle, refetch: refetchVehicle } = useQuery({
        queryKey: ['vehicle', vehicleId],
        queryFn: () => base44.entities.Vehicle.list({ id: vehicleId }).then(res => res[0]),
        enabled: !!vehicleId,
        staleTime: 1000 * 60 * 5, // Keep vehicle data fresh for 5 minutes
        retry: 3,
    });

    const backLink = user?.user_type === 'client' ? createPageUrl('ClientDashboard') : createPageUrl('Garage');

    const { data: connectors, isLoading: isLoadingConnectors, refetch: getConnectors } = useQuery({
        queryKey: ['connectors', vehicleId],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: vehicleId }),
        enabled: !!vehicleId,
        staleTime: 1000 * 60, // Keep data fresh for 1 minute to avoid flickering
    });

    const deleteConnectorMutation = useMutation({
        mutationFn: (id) => base44.entities.VehicleConnector.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', vehicleId]);
            toast.success("Removed");
        }
    });

    const ImageWithFallback = ({ src, alt, className, contain = false }) => {
        const [error, setError] = useState(false);
        
        if (!src || error) {
            return (
                <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded overflow-hidden ${className}`}>
                    <ImageIcon className="text-gray-300 w-8 h-8" />
                </div>
            );
        }

        return (
            <img 
                src={getProxiedImageUrl(src)} 
                alt={alt} 
                className={`${className} ${contain ? 'object-contain' : 'object-cover'}`}
                onError={() => setError(true)}
                referrerPolicy="no-referrer"
            />
        );
    };

    if (isLoadingVehicle) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    if (!vehicleId) {
        return <div className="p-8 text-center text-red-500">Go back and save a vehicle first</div>;
    }

    // Handle case where vehicleId exists but query returned no data
    if (!vehicle && !isLoadingVehicle) {
         return (
             <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
                 <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <Loader2 className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-bold">Vehicle Data Not Found</h3>
                    <p className="text-muted-foreground max-w-sm">
                        We couldn't load the vehicle details. This might be due to a network issue or the vehicle was deleted.
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">ID: {vehicleId}</p>
                 </div>
                 <div className="flex gap-4">
                    <Button onClick={() => refetchVehicle()} variant="outline">
                        Retry Loading
                    </Button>
                    <Button onClick={() => window.location.href = backLink}>
                        Back to {user?.user_type === 'client' ? 'Dashboard' : 'Garage'}
                    </Button>
                 </div>
             </div>
         );
    }

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            {/* Header / Vehicle Info */}
            <div className="flex items-center justify-between bg-white dark:bg-[#2a2a2a] p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = backLink}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold uppercase">{vehicle.brand} {vehicle.model} - Connectors</h2>
                          {vehicle.vehicle_number && (
                              <span className="text-xs bg-[#00C600]/10 text-[#00C600] px-2 py-0.5 rounded border border-[#00C600]/20 font-mono font-bold">
                                  {vehicle.vehicle_number}
                              </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground uppercase">
                            {vehicle.engine_size || '-'} {vehicle.fuel || '-'} | {vehicle.vin || '-'}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={() => window.location.href = createPageUrl('VehicleDetail') + `?id=${vehicleId}`}
                    className="bg-[#00C600] hover:bg-[#00b300] text-white uppercase font-bold"
                >
                    Finish & View Info
                </Button>
            </div>

            {/* Add Connector Form */}
            <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="uppercase font-bold text-sm flex items-center gap-2">
                        Add New Connector
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ConnectorForm 
                        vehicleId={vehicleId}
                        clientEmail={vehicle?.client_email}
                        onSuccess={() => {
                            // Only invalidate, don't force manual fetch to avoid race conditions
                            queryClient.invalidateQueries(['connectors', vehicleId]);
                        }}
                    />
                </CardContent>
            </Card>

            {/* Connectors Grid - 6 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {isLoadingConnectors ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800"></Card>
                    ))
                ) : connectors?.map((conn) => {
                    return (
                        <Card key={conn.id} className="relative group hover:shadow-md transition-all border-l-4 border-l-[#00C600] flex flex-col overflow-hidden">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-75"
                                onClick={() => deleteConnectorMutation.mutate(conn.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                            
                            <CardContent className="p-3 space-y-2 flex-grow">
                                {/* Prefer catalogue image, else uploaded front view */}
                                <div className="w-full h-24 mb-2 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                                    {conn.image_1 ? (
                                        <ImageWithFallback src={conn.image_1} className="w-full h-full" />
                                    ) : (
                                        <ImageIcon className="text-gray-300 w-8 h-8" />
                                    )}
                                </div>
                                
                                <div>
                                    <h4 className="font-bold uppercase text-xs truncate" title={conn.calculator_system}>
                                        {conn.calculator_system || "Unknown"}
                                    </h4>
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