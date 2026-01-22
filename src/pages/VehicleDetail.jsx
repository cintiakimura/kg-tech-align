import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, FileText, ImageIcon, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPageUrl } from '@/utils';
import { toast } from "sonner";
import ConnectorForm from '../components/onboarding/fleet/ConnectorForm';
import { getProxiedImageUrl } from "@/components/utils/imageUtils";

export default function VehicleDetail() {
    const params = new URLSearchParams(window.location.search);
    const queryVehicleId = params.get('vehicleId') || params.get('id');
    const [accessDenied, setAccessDenied] = useState(false);
    const [showConnectorModal, setShowConnectorModal] = useState(false);
    const queryClient = useQueryClient();

    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ['vehicle', queryVehicleId],
        queryFn: async () => {
            if (!queryVehicleId) return null;
            const res = await base44.entities.Vehicle.list({ id: queryVehicleId });
            return res[0] || null;
        },
        enabled: !!queryVehicleId
    });

    const { data: connectors, isLoading: isLoadingConnectors } = useQuery({
        queryKey: ['connectors', queryVehicleId],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: queryVehicleId }),
        enabled: !!queryVehicleId && !accessDenied
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    const deleteConnectorMutation = useMutation({
        mutationFn: (id) => base44.entities.VehicleConnector.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', queryVehicleId]);
            toast.success("Connector deleted");
        }
    });

    useEffect(() => {
        if (user && vehicle) {
            const isManager = user.role === 'admin' || user.user_type === 'manager';
            // Allow access if it's the user's company's vehicle OR user's own vehicle (legacy)
            const isOwner = vehicle.client_id === user.company_id || vehicle.client_id === user.id;
            
            if (!isManager && !isOwner) {
                setAccessDenied(true);
            } else {
                setAccessDenied(false);
            }
        }
    }, [user, vehicle]);

    if (isLoadingUser || isLoadingVehicle) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00C600]" /></div>;
    }

    if (!queryVehicleId || !vehicle) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-bold">Vehicle not found</div>;
    }

    if (accessDenied) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-bold">Not your vehicle</div>;
    }

    const ImageWithFallback = ({ src, alt, className }) => {
        const [error, setError] = useState(false);
        
        if (!src || error) {
            return (
                <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
                    <span className="text-[10px] text-muted-foreground p-1 text-center">No Image</span>
                </div>
            );
        }

        return (
            <img 
                src={getProxiedImageUrl(src)} 
                alt={alt} 
                className={className} 
                onError={() => setError(true)}
                referrerPolicy="no-referrer"
            />
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">
                            Vehicle Detail - {vehicle.vehicle_number || 'VEH-XXXXX'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <span className="font-bold">{vehicle.brand} {vehicle.model}</span>
                            <span>•</span>
                            <span>{vehicle.year}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase">Specs</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <span className="text-xs uppercase text-muted-foreground block">VIN</span>
                            <span className="font-bold font-mono">{vehicle.vin || '-'}</span>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-muted-foreground block">Engine Code</span>
                            <span className="font-bold">{vehicle.engine_code || '-'}</span>
                        </div>
                         <div>
                            <span className="text-xs uppercase text-muted-foreground block">Engine Size/Power</span>
                            <span className="font-bold">{vehicle.engine_size || '-'} / {vehicle.engine_power || '-'}</span>
                        </div>
                         <div>
                            <span className="text-xs uppercase text-muted-foreground block">Fuel</span>
                            <span className="font-bold">{vehicle.fuel || '-'}</span>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-muted-foreground block">Transmission</span>
                            <span className="font-bold">{vehicle.transmission_type || '-'}</span>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-muted-foreground block">Gears</span>
                            <span className="font-bold">{vehicle.number_gears || '-'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-[#2a2a2a]">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase">Assets & Docs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {/* Electrical Scheme */}
                         <div className="flex items-center justify-between p-2 border rounded">
                             <div className="flex items-center gap-2">
                                 <FileText className="w-4 h-4 text-[#00C600]" />
                                 <span className="text-sm font-medium">Electrical Schemes</span>
                             </div>
                             {vehicle.file_electrical_scheme ? (
                                 <a href={vehicle.file_electrical_scheme} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">View PDF/Image</a>
                             ) : (
                                 <span className="text-xs text-muted-foreground">Not uploaded</span>
                             )}
                         </div>

                         {/* Sensors List */}
                         <div className="flex items-center justify-between p-2 border rounded">
                             <div className="flex items-center gap-2">
                                 <FileText className="w-4 h-4 text-[#00C600]" />
                                 <span className="text-sm font-medium">Sensors/Actuators List</span>
                             </div>
                             {vehicle.file_sensors_actuators ? (
                                 <a href={vehicle.file_sensors_actuators} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">View List</a>
                             ) : (
                                 <span className="text-xs text-muted-foreground">Not uploaded</span>
                             )}
                         </div>

                         {/* Photos Thumbnails */}
                         <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                            {[
                                { src: vehicle.image_connector_front, label: "Front" },
                                { src: vehicle.image_lever_side, label: "Side" },
                                { src: vehicle.image_ecu_front, label: "ECU" },
                                { src: vehicle.image_ecu_part_number, label: "Part #" }
                            ].map((img, i) => img.src && (
                                <div key={i} className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border cursor-pointer" onClick={() => window.open(img.src, '_blank')}>
                                    <ImageWithFallback src={img.src} alt={img.label} className="w-full h-full object-cover" />
                                </div>
                            ))}
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Connectors Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold uppercase flex items-center gap-2">
                        Connectors
                        <span className="bg-[#00C600] text-white text-xs px-2 py-0.5 rounded-full">{connectors?.length || 0}</span>
                    </h3>
                    <Dialog open={showConnectorModal} onOpenChange={setShowConnectorModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#00C600] hover:bg-[#00b300] uppercase font-bold text-xs">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Connector
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Connector</DialogTitle>
                            </DialogHeader>
                            <ConnectorForm 
                                vehicleId={vehicle.id} 
                                clientEmail={vehicle.client_email}
                                onSuccess={() => setShowConnectorModal(false)}
                                onCancel={() => setShowConnectorModal(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoadingConnectors ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="h-64 animate-pulse bg-gray-100 dark:bg-gray-800 border-none" />
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
                                <Card key={conn.id} className="relative group flex flex-col overflow-hidden hover:shadow-md transition-all border bg-white dark:bg-[#2a2a2a]">
                                    <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={() => {
                                                if (confirm('Delete this connector?')) {
                                                    deleteConnectorMutation.mutate(conn.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    <CardContent className="p-3 space-y-3 flex-grow flex flex-col">
                                        {/* Main Image */}
                                        <div className="w-full h-32 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                                            {catalogueItem?.image_url ? (
                                                <ImageWithFallback src={catalogueItem.image_url} className="w-full h-full object-contain" />
                                            ) : conn.image_1 ? (
                                                <ImageWithFallback src={conn.image_1} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-300 w-8 h-8" />
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <h4 className="font-bold uppercase text-xs truncate" title={conn.calculator_system}>
                                                {conn.calculator_system || "Unknown System"}
                                            </h4>
                                            
                                            {catalogueItem && (
                                                <div className="text-[10px] font-bold text-blue-600 truncate flex items-center gap-1">
                                                    <span>CAT:</span>
                                                    {catalogueItem.secret_part_number}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground mt-2">
                                                <div>
                                                    <span className="block opacity-70">Color</span>
                                                    <span className="font-medium text-foreground">{conn.connector_color || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="block opacity-70">Pins</span>
                                                    <span className="font-medium text-foreground">{conn.pin_quantity || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Thumbnails Row */}
                                        <div className="flex gap-1 mt-auto pt-2 border-t">
                                            {/* Front */}
                                            <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                                                <ImageWithFallback src={conn.image_1} className="w-full h-full object-cover" />
                                            </div>
                                            {/* Lever */}
                                            <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                                                <ImageWithFallback src={conn.image_2} className="w-full h-full object-cover" />
                                            </div>
                                            {/* ECU */}
                                            {conn.ecu_images && conn.ecu_images[0] && (
                                                <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                                                    <ImageWithFallback src={conn.ecu_images[0]} className="w-full h-full object-cover" />
                                                </div>
                                            )}
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