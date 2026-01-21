import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, ArrowLeft, Image as ImageIcon, FileText, X } from 'lucide-react';
import { toast } from "sonner";
import { createPageUrl } from '@/utils';
import FileUpload from '../components/onboarding/FileUpload';

export default function VehicleConnectors() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('vehicleId');

    const [newConnector, setNewConnector] = useState({
        calculator_system: '',
        connector_color: '',
        pin_quantity: '',
        file_wiring_diagram: '',
        list_of_functions: '',
        image_front: '',
        image_lever: '',
        ecu_images: [],
        catalogue_id: 'none'
    });

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

    const createConnectorMutation = useMutation({
        mutationFn: (data) => base44.entities.VehicleConnector.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', vehicleId]);
            toast.success("Saved");
            setNewConnector({
                calculator_system: '',
                connector_color: '',
                pin_quantity: '',
                file_wiring_diagram: '',
                list_of_functions: '',
                image_front: '',
                image_lever: '',
                ecu_images: [],
                catalogue_id: 'none'
            });
        },
        onError: (err) => {
            console.error("Save error", err);
        }
    });

    const deleteConnectorMutation = useMutation({
        mutationFn: (id) => base44.entities.VehicleConnector.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', vehicleId]);
            toast.success("Removed");
        }
    });

    const handleAddConnector = (e) => {
        e.preventDefault();
        const payload = {
            vehicle_id: vehicleId,
            client_email: vehicle?.client_email || "", // Required for RLS
            calculator_system: newConnector.calculator_system || "",
            connector_color: newConnector.connector_color || "",
            pin_quantity: newConnector.pin_quantity || "",
            quantity: 1,
            file_wiring_diagram: newConnector.file_wiring_diagram || "",
            list_of_functions: newConnector.list_of_functions || "",
            image_1: newConnector.image_front || "",
            image_2: newConnector.image_lever || "",
            ecu_images: newConnector.ecu_images || []
        };
        
        if (newConnector.catalogue_id && newConnector.catalogue_id !== 'none') {
            payload.catalogue_id = newConnector.catalogue_id;
        }

        createConnectorMutation.mutate(payload);
    };

    const handleAddEcuImage = (url) => {
        if (url) {
            setNewConnector(prev => ({
                ...prev,
                ecu_images: [...prev.ecu_images, url]
            }));
        }
    };

    const removeEcuImage = (index) => {
        setNewConnector(prev => ({
            ...prev,
            ecu_images: prev.ecu_images.filter((_, i) => i !== index)
        }));
    };

    const InputStyle = "bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";

    if (isLoadingVehicle) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    if (!vehicle && !isLoadingVehicle) {
        return <div className="p-8 text-center text-red-500">Vehicle ID missing or not found.</div>;
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
                        <h2 className="text-xl font-bold uppercase">{vehicle?.brand} {vehicle?.model} - Connectors</h2>
                        <p className="text-sm text-muted-foreground uppercase">{vehicle?.engine_size} {vehicle?.fuel} | {vehicle?.vin}</p>
                    </div>
                </div>
            </div>

            {/* Add Connector Form */}
            <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="uppercase font-bold text-sm flex items-center gap-2">
                        Add New Connector
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddConnector} className="space-y-6">
                        <input type="hidden" name="vehicle_id" value={vehicleId || ''} />
                        
                        {/* First Section: Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold">Calculator System</Label>
                                <Input 
                                    value={newConnector.calculator_system}
                                    onChange={(e) => setNewConnector({...newConnector, calculator_system: e.target.value})}
                                    placeholder="e.g. ABS"
                                    className={InputStyle}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold">Connector Color</Label>
                                <Input 
                                    value={newConnector.connector_color}
                                    onChange={(e) => setNewConnector({...newConnector, connector_color: e.target.value})}
                                    placeholder="e.g. Black"
                                    className={InputStyle}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold">Pin Quantity</Label>
                                <Input 
                                    type="number"
                                    value={newConnector.pin_quantity}
                                    onChange={(e) => setNewConnector({...newConnector, pin_quantity: e.target.value})}
                                    placeholder="e.g. 16"
                                    className={InputStyle}
                                />
                            </div>
                        </div>

                        {/* Second Section: Technical Data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold">Electrical Scheme</Label>
                                <FileUpload 
                                    value={newConnector.file_wiring_diagram}
                                    onChange={(url) => setNewConnector({...newConnector, file_wiring_diagram: url})}
                                    label="Upload Scheme"
                                    accept="image/*,.pdf"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold">List of Functions</Label>
                                <Textarea 
                                    value={newConnector.list_of_functions}
                                    onChange={(e) => setNewConnector({...newConnector, list_of_functions: e.target.value})}
                                    placeholder="Enter functions list..."
                                    className={`${InputStyle} min-h-[100px]`}
                                />
                            </div>
                        </div>

                        {/* Third Section: Images */}
                        <div className="space-y-4 border-t pt-4 dark:border-gray-700">
                            <Label className="text-sm font-bold uppercase">Connector Images</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground">Front View</Label>
                                    <FileUpload 
                                        value={newConnector.image_front}
                                        onChange={(url) => setNewConnector({...newConnector, image_front: url})}
                                        label="Front View"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground">View (Lever)</Label>
                                    <FileUpload 
                                        value={newConnector.image_lever}
                                        onChange={(url) => setNewConnector({...newConnector, image_lever: url})}
                                        label="View (Lever)"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground">ECU Front (Part Number)</Label>
                                    <div className="space-y-2">
                                        <FileUpload 
                                            value=""
                                            onChange={handleAddEcuImage}
                                            label="Add ECU Image"
                                            accept="image/*"
                                        />
                                        {newConnector.ecu_images.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {newConnector.ecu_images.map((img, idx) => (
                                                    <div key={idx} className="relative group w-16 h-16 border rounded overflow-hidden">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEcuImage(idx)}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fourth Section: Catalogue */}
                        <div className="space-y-2 border-t pt-4 dark:border-gray-700">
                            <Label className="text-xs uppercase font-bold">Catalogue Product</Label>
                            <Select 
                                value={newConnector.catalogue_id} 
                                onValueChange={(val) => setNewConnector({...newConnector, catalogue_id: val})}
                            >
                                <SelectTrigger className={InputStyle}>
                                    <SelectValue placeholder="Select from Catalogue..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {catalogueItems?.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            <div className="flex items-center gap-2">
                                                {item.image_url && (
                                                    <img src={item.image_url} alt="" className="w-6 h-6 object-cover rounded" />
                                                )}
                                                <span>{item.secret_part_number} ({item.colour})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button 
                                type="submit" 
                                className="bg-[#00C600] hover:bg-[#00b300] uppercase font-bold w-full md:w-auto"
                            >
                                {createConnectorMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Add Connector
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Connectors Grid - 6 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {isLoadingConnectors ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800"></Card>
                    ))
                ) : connectors?.map((conn) => {
                    const catalogueItem = catalogueItems?.find(c => c.id === conn.catalogue_id);
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
            
            {(!isLoadingConnectors && connectors?.length === 0) && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                    No connectors added yet. Use the form above to add one.
                </div>
            )}
        </div>
    );
}