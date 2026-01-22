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
// import VehicleSpecsForm from '../components/onboarding/fleet/VehicleSpecsForm'; // Removed as this page is now read-only specs
import FileUpload from '../components/onboarding/FileUpload';
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

    const backLink = user?.user_type === 'client' ? createPageUrl('ClientDashboard') : createPageUrl('Garage');

    const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
        queryKey: ['vehicle', queryVehicleId],
        queryFn: async () => {
            if (!queryVehicleId) return null;
            const res = await base44.entities.Vehicle.list({ id: queryVehicleId });
            if (!res || res.length === 0) {
                throw new Error("Vehicle not found yet");
            }
            return res[0];
        },
        enabled: !!queryVehicleId,
        staleTime: 1000 * 60 * 5,
        retry: 10,
        retryDelay: 500,
    });

    const { data: connectors, isLoading: isLoadingConnectors } = useQuery({
        queryKey: ['connectors', queryVehicleId],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: queryVehicleId }),
        enabled: !!queryVehicleId && !accessDenied
    });



    const deleteConnectorMutation = useMutation({
        mutationFn: (id) => base44.entities.VehicleConnector.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', queryVehicleId]);
            toast.success("Connector deleted");
        }
    });

    const updateVehicleMutation = useMutation({
        mutationFn: (data) => base44.entities.Vehicle.update(vehicle.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['vehicle', queryVehicleId]);
            toast.success("Updated");
        }
    });

    const handleAssetUpload = (field, url) => {
        // Force save uploaded asset to DB immediately
        updateVehicleMutation.mutate({ [field]: url });
    };

    // Security checks removed permanently
    useEffect(() => {
        setAccessDenied(false);
    }, []);

    if (!queryVehicleId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                   <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-lg font-bold">No Vehicle ID</h3>
                   <p className="text-muted-foreground max-w-sm">
                       No vehicle identifier was provided.
                   </p>
                </div>
                <Button onClick={() => window.location.href = backLink} variant="outline">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    if (isLoadingUser || isLoadingVehicle) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00C600]" /></div>;
    }

    if (!vehicle) {
         return (
             <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
                 <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-bold">Vehicle Not Found</h3>
                    <p className="text-muted-foreground max-w-sm">
                        The requested vehicle could not be found.
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">ID: {queryVehicleId}</p>
                 </div>
                 <Button onClick={() => window.location.href = backLink} variant="outline">
                     Back to Dashboard
                 </Button>
             </div>
         );
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
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = backLink}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">
                            Vehicle Information
                        </h1>
                        <div className="text-sm font-mono text-[#00C600] font-bold">
                            ID: {vehicle.vehicle_number || 'PENDING'}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <span className="font-bold">{vehicle.brand} {vehicle.model}</span>
                            <span>•</span>
                            <span>{vehicle.year}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <Button 
                        variant="outline" 
                        onClick={() => window.location.href = createPageUrl('VehicleConnectors') + `?vehicleId=${vehicle.id}`}
                        className="gap-2"
                     >
                        View Full Connectors Page
                     </Button>
                </div>
            </div>

            {/* Vehicle Details & Assets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Specs (Read Only) */}
                <Card className="border-none shadow-lg bg-white dark:bg-[#2a2a2a] h-fit">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase">Vehicle Specifications</CardTitle>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#00C600] hover:text-[#00C600] hover:bg-[#00C600]/10"
                            onClick={() => window.location.href = createPageUrl('VehicleEdit') + `?vehicleId=${vehicle.id}`}
                        >
                            <span className="font-bold text-xs uppercase">Edit</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Vehicle Number</label>
                                <div className="font-mono font-medium">{vehicle.vehicle_number || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">VIN</label>
                                <div className="font-mono font-medium truncate" title={vehicle.vin}>{vehicle.vin || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Brand</label>
                                <div className="font-medium">{vehicle.brand || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Model</label>
                                <div className="font-medium">{vehicle.model || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Year</label>
                                <div className="font-medium">{vehicle.year || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Fuel</label>
                                <div className="font-medium">{vehicle.fuel || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Engine</label>
                                <div className="font-medium">{vehicle.engine_size || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Version</label>
                                <div className="font-medium">{vehicle.version || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Serial Number</label>
                                <div className="font-medium">{vehicle.serial_number || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Transmission</label>
                                <div className="font-medium">{vehicle.transmission_type || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Gears</label>
                                <div className="font-medium">{vehicle.number_gears || '-'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Brakes Type</label>
                                <div className="font-medium">{vehicle.brakes_type || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Purpose</label>
                                <div className="font-medium">{vehicle.purpose || '-'}</div>
                            </div>
                        </div>
                        <div className="pt-2 border-t">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase block">Engine Code</label>
                                    <div className="font-medium font-mono text-sm">{vehicle.engine_code || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase block">Engine Power</label>
                                    <div className="font-medium">{vehicle.engine_power || '-'}</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase block">Engine Type</label>
                                    <div className="font-medium">{vehicle.engine_type || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-bold uppercase block">Engine Model</label>
                                    <div className="font-medium">{vehicle.engine_model || '-'}</div>
                                </div>
                             </div>
                             <div className="mt-2">
                                <label className="text-[10px] text-muted-foreground font-bold uppercase block">Status</label>
                                <div className="font-medium text-[#00C600] font-bold">{vehicle.status || '-'}</div>
                             </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Assets & Docs (Editable) */}
                <Card className="border-none shadow-lg bg-white dark:bg-[#2a2a2a] h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase">Assets & Docs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         {/* Documents */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase">Electrical Scheme</label>
                                 <FileUpload 
                                    value={vehicle.file_electrical_scheme}
                                    onChange={(url) => handleAssetUpload('file_electrical_scheme', url)}
                                    label="Upload Scheme"
                                    accept="image/*,.pdf"
                                 />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase">Sensors/Actuators List</label>
                                 <FileUpload 
                                    value={vehicle.file_sensors_actuators}
                                    onChange={(url) => handleAssetUpload('file_sensors_actuators', url)}
                                    label="Upload List"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                 />
                             </div>
                         </div>

                         {/* Images */}
                         <div className="space-y-4">
                            <label className="text-xs font-bold uppercase border-b block pb-2">Vehicle Photos</label>
                            <div className="grid grid-cols-2 gap-4">
                                <FileUpload 
                                    value={vehicle.image_connector_front}
                                    onChange={(url) => handleAssetUpload('image_connector_front', url)}
                                    label="Connector Front"
                                    accept="image/*"
                                />
                                <FileUpload 
                                    value={vehicle.image_lever_side}
                                    onChange={(url) => handleAssetUpload('image_lever_side', url)}
                                    label="Lever Side"
                                    accept="image/*"
                                />
                                <FileUpload 
                                    value={vehicle.image_ecu_front}
                                    onChange={(url) => handleAssetUpload('image_ecu_front', url)}
                                    label="ECU Front"
                                    accept="image/*"
                                />
                                <FileUpload 
                                    value={vehicle.image_ecu_part_number}
                                    onChange={(url) => handleAssetUpload('image_ecu_part_number', url)}
                                    label="ECU Part #"
                                    accept="image/*"
                                />
                                <FileUpload 
                                    value={vehicle.image_extra_1}
                                    onChange={(url) => handleAssetUpload('image_extra_1', url)}
                                    label="Extra Photo 1"
                                    accept="image/*"
                                />
                                <FileUpload 
                                    value={vehicle.image_extra_2}
                                    onChange={(url) => handleAssetUpload('image_extra_2', url)}
                                    label="Extra Photo 2"
                                    accept="image/*"
                                />
                            </div>
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
                                            {conn.image_1 ? (
                                                <ImageWithFallback src={conn.image_1} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-300 w-8 h-8" />
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <h4 className="font-bold uppercase text-xs truncate" title={conn.calculator_system}>
                                                {conn.calculator_system || "Unknown System"}
                                            </h4>
                                            
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