import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, ArrowLeft, Save, ImageIcon, FileText } from 'lucide-react';
import { toast } from "sonner";
import FileUpload from '../FileUpload';

export default function VehicleConnectorsPage({ vehicle, onBack }) {
    const queryClient = useQueryClient();
    const [newConnector, setNewConnector] = useState({
        calculator_system: '',
        connector_color: '',
        pin_quantity: '',
        catalogue_id: 'none',
        quantity: 1,
        // File/Image fields
        image_1: '',
        file_wiring_diagram: '',
        file_pinning_list: ''
    });

    const { data: connectors, isLoading: isLoadingConnectors } = useQuery({
        queryKey: ['connectors', vehicle.id],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: vehicle.id })
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    const createConnectorMutation = useMutation({
        mutationFn: (data) => base44.entities.VehicleConnector.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', vehicle.id]);
            toast.success("Connector added");
            setNewConnector({
                calculator_system: '',
                connector_color: '',
                pin_quantity: '',
                catalogue_id: 'none',
                quantity: 1,
                image_1: '',
                file_wiring_diagram: '',
                file_pinning_list: ''
            });
        },
        onError: () => toast.error("Failed to add connector")
    });

    const deleteConnectorMutation = useMutation({
        mutationFn: (id) => base44.entities.VehicleConnector.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', vehicle.id]);
            toast.success("Connector removed");
        }
    });

    const handleAddConnector = (e) => {
        e.preventDefault();
        const payload = {
            vehicle_id: vehicle.id,
            calculator_system: newConnector.calculator_system,
            connector_color: newConnector.connector_color,
            pin_quantity: newConnector.pin_quantity,
            quantity: parseInt(newConnector.quantity) || 1,
            image_1: newConnector.image_1,
            file_wiring_diagram: newConnector.file_wiring_diagram,
            file_pinning_list: newConnector.file_pinning_list
        };
        
        if (newConnector.catalogue_id !== 'none') {
            payload.catalogue_id = newConnector.catalogue_id;
        }

        createConnectorMutation.mutate(payload);
    };

    const InputStyle = "bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Vehicle Info */}
            <div className="flex items-center justify-between bg-white dark:bg-[#2a2a2a] p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold uppercase">{vehicle.brand} {vehicle.model} - Connectors</h2>
                        <p className="text-sm text-muted-foreground uppercase">{vehicle.engine_size} {vehicle.fuel} | {vehicle.vin}</p>
                    </div>
                </div>
            </div>

            {/* Add Connector Form */}
            <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="uppercase font-bold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#00C600]" /> Add New Connector
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddConnector} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    value={newConnector.pin_quantity}
                                    onChange={(e) => setNewConnector({...newConnector, pin_quantity: e.target.value})}
                                    placeholder="e.g. 16 or 8+2"
                                    className={InputStyle}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold">Catalogue Product</Label>
                                <Select 
                                    value={newConnector.catalogue_id} 
                                    onValueChange={(val) => setNewConnector({...newConnector, catalogue_id: val})}
                                >
                                    <SelectTrigger className={InputStyle}>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {catalogueItems?.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.secret_part_number} ({item.colour})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Quick File Uploads for convenience */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FileUpload 
                                value={newConnector.image_1}
                                onChange={(url) => setNewConnector({...newConnector, image_1: url})}
                                label="Photo"
                                compact
                                accept="image/*"
                            />
                            <FileUpload 
                                value={newConnector.file_wiring_diagram}
                                onChange={(url) => setNewConnector({...newConnector, file_wiring_diagram: url})}
                                label="Wiring Diagram"
                                compact
                                accept=".pdf,.png,.jpg"
                            />
                            <FileUpload 
                                value={newConnector.file_pinning_list}
                                onChange={(url) => setNewConnector({...newConnector, file_pinning_list: url})}
                                label="Pinning List"
                                compact
                                accept=".pdf,.csv,.xlsx"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button 
                                type="submit" 
                                disabled={createConnectorMutation.isPending}
                                className="bg-[#00C600] hover:bg-[#00b300] uppercase font-bold"
                            >
                                {createConnectorMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Add Connector"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Connectors List - 6 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {connectors?.map((conn) => (
                    <Card key={conn.id} className="relative group hover:shadow-md transition-all border-l-4 border-l-[#00C600]">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteConnectorMutation.mutate(conn.id)}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                        <CardContent className="p-3 space-y-2">
                            <h4 className="font-bold uppercase text-xs truncate" title={conn.calculator_system}>
                                {conn.calculator_system || "Unknown"}
                            </h4>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                                <p>Color: {conn.connector_color || '-'}</p>
                                <p>Pins: {conn.pin_quantity || '-'}</p>
                            </div>
                            <div className="flex gap-1 mt-2">
                                {conn.image_1 && <ImageIcon className="w-3 h-3 text-[#00C600]" />}
                                {(conn.file_wiring_diagram || conn.file_pinning_list) && <FileText className="w-3 h-3 text-blue-500" />}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {connectors?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    No connectors added yet. Use the form above to add one.
                </div>
            )}
        </div>
    );
}