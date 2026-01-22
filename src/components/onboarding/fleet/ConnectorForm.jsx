import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from "sonner";
import FileUpload from '../FileUpload';
import { getProxiedImageUrl } from "@/components/utils/imageUtils";

export default function ConnectorForm({ vehicleId, clientEmail, onSuccess, onCancel }) {
    const queryClient = useQueryClient();
    const [imageErrors, setImageErrors] = useState({});
    const [newConnector, setNewConnector] = useState({
        calculator_system: '',
        connector_color: '',
        pin_quantity: '',
        file_wiring_diagram: '',
        list_of_functions: '',
        image_front: '',
        image_lever: '',
        ecu_images: []
    });

    const resetForm = () => {
        setNewConnector({
            calculator_system: '',
            connector_color: '',
            pin_quantity: '',
            file_wiring_diagram: '',
            list_of_functions: '',
            image_front: '',
            image_lever: '',
            ecu_images: []
        });
    };

    const createConnectorMutation = useMutation({
        mutationFn: (data) => base44.entities.VehicleConnector.create(data),
        onSuccess: (savedConnector) => {
            queryClient.invalidateQueries(['connectors', vehicleId]);
            toast.success("Added successfully");
            resetForm();
            if (onSuccess) onSuccess(savedConnector);
        },
        onError: (err) => {
            console.error("Save error", err);
            toast.error("Failed to save connector");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            vehicle_id: vehicleId,
            client_email: clientEmail || "", 
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FileUpload 
                        value={newConnector.list_of_functions}
                        onChange={(url) => setNewConnector({...newConnector, list_of_functions: url})}
                        label="Upload Functions List"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                </div>
            </div>

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
                                        <div key={idx} className="relative group w-16 h-16 border rounded overflow-hidden bg-gray-50">
                                            <img 
                                                src={getProxiedImageUrl(img)} 
                                                alt="" 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                                    e.target.parentElement.innerHTML += '<span class="text-[8px] text-gray-400">Error</span>';
                                                }}
                                                referrerPolicy="no-referrer"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeEcuImage(idx)}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-10"
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

            <div className="flex justify-end pt-2 gap-2">
                {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
                <Button 
                    type="submit" 
                    className="bg-[#00C600] hover:bg-[#00b300] uppercase font-bold"
                    disabled={createConnectorMutation.isPending}
                >
                    {createConnectorMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Save Connector
                </Button>
            </div>
        </form>
    );
}