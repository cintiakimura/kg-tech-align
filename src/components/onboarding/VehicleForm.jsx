import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import FileUpload from './FileUpload';
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Car, Plug, FileText, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function VehicleForm({ initialData, onSuccess, onCancel }) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [connectors, setConnectors] = useState(initialData?.connectors || []); 
    const [currentVehicleId, setCurrentVehicleId] = useState(initialData?.id || null);

    // Because connectors are a separate entity, we handle them slightly differently if we are editing an existing vehicle.
    // However, for simplicity in this form, we might want to fetch them if initialData is provided.
    // If initialData is passed, we assume it's the Vehicle entity. We need to fetch its connectors.

    const { data: existingConnectors } = useQuery({
        queryKey: ['vehicleConnectors', initialData?.id],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: initialData.id }),
        enabled: !!initialData?.id,
    });

    // Merge existing connectors into state when loaded
    React.useEffect(() => {
        if (existingConnectors && currentVehicleId === initialData?.id) {
            setConnectors(existingConnectors);
        }
    }, [existingConnectors, currentVehicleId, initialData]);

    const { register, handleSubmit, setValue, watch, control, reset, formState: { errors } } = useForm({
        defaultValues: initialData || {
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            vin: '',
            fuel: 'Gasoline',
            transmission_type: 'Manual',
            engine_size: '',
            engine_power: '',
            engine_code: '',
            brakes_type: '',
            image_connector_front: '',
            image_lever_side: '',
            image_ecu_part_number: '',
            image_ecu_front: '',
            image_extra_1: '',
            image_extra_2: '',
            file_electrical_scheme: '',
            file_sensors_actuators: ''
        }
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    const handleAddConnector = () => {
        setConnectors([...connectors, { 
            tempId: Date.now(), 
            calculator_system: '', 
            connector_color: '', 
            pin_quantity: '', 
            catalogue_id: '',
            quantity: 1
        }]);
    };

    const handleRemoveConnector = (index) => {
        const newConnectors = [...connectors];
        // If it has a real ID, we might want to track deletion, but for now let's just remove from UI and delete on save or just ignore (simplification)
        // Better approach: if it has an ID, call delete immediately or mark for deletion?
        // User asked for "save" button, so probably batch save.
        // But deleting entities is tricky in batch without explicit API.
        // Let's just remove from state. If it's an existing one, we should delete it.
        const connector = newConnectors[index];
        if (connector.id) {
             // If it exists in DB, delete it
             base44.entities.VehicleConnector.delete(connector.id).then(() => {
                 toast.success("Connector removed");
             });
        }
        newConnectors.splice(index, 1);
        setConnectors(newConnectors);
    };

    const handleConnectorChange = (index, field, value) => {
        const newConnectors = [...connectors];
        newConnectors[index][field] = value;
        setConnectors(newConnectors);
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            let vehicleId = currentVehicleId;
            const currentUser = await base44.auth.me();
            const userEmail = currentUser?.email;

            // Ensure client_email is set for the vehicle if not present
            const vehicleData = {
                ...data,
                client_email: data.client_email || userEmail
            };

            if (vehicleId) {
                await base44.entities.Vehicle.update(vehicleId, vehicleData);
            } else {
                const newVehicle = await base44.entities.Vehicle.create(vehicleData);
                vehicleId = newVehicle.id;
                setCurrentVehicleId(vehicleId);
            }

            // Save connectors
            for (const conn of connectors) {
                const connectorData = {
                    vehicle_id: vehicleId,
                    calculator_system: conn.calculator_system,
                    connector_color: conn.connector_color,
                    pin_quantity: parseInt(conn.pin_quantity) || 0,
                    catalogue_id: conn.catalogue_id,
                    quantity: parseInt(conn.quantity) || 1,
                    owner_email: userEmail // Add ownership field for RLS
                };

                if (conn.id) {
                    await base44.entities.VehicleConnector.update(conn.id, connectorData);
                } else {
                    await base44.entities.VehicleConnector.create(connectorData);
                }
            }

            toast.success("Saved successfully"); // Specific text requested
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save vehicle");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateNew = () => {
        reset({
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            vin: '',
            fuel: 'Gasoline',
            transmission_type: 'Manual',
            engine_size: '',
            engine_power: '',
            engine_code: '',
            brakes_type: '',
            image_connector_front: '',
            image_lever_side: '',
            image_ecu_part_number: '',
            image_ecu_front: '',
            image_extra_1: '',
            image_extra_2: '',
            file_electrical_scheme: '',
            file_sensors_actuators: ''
        });
        setConnectors([]);
        if (onCancel) onCancel(); // Or just clear state locally if we want to stay
        // The requirement "add buttons: 'create new vehicle'" suggests a way to reset
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Vehicle Profile</h2>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleCreateNew}>
                        Create New Vehicle
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Brand</Label>
                        <Input {...register("brand", { required: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Input {...register("model", { required: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Year</Label>
                        <Input type="number" {...register("year", { required: true, valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>VIN</Label>
                        <Input {...register("vin", { required: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Fuel</Label>
                         <Select onValueChange={(val) => setValue("fuel", val)} defaultValue={initialData?.fuel || "Gasoline"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Gasoline">Gasoline</SelectItem>
                                <SelectItem value="Diesel">Diesel</SelectItem>
                                <SelectItem value="Electric">Electric</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                                <SelectItem value="Petrol">Petrol</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Engine Code</Label>
                        <Input {...register("engine_code")} />
                    </div>
                    <div className="space-y-2">
                        <Label>Engine Size</Label>
                        <Input {...register("engine_size")} />
                    </div>
                    <div className="space-y-2">
                        <Label>Engine Power</Label>
                        <Input {...register("engine_power")} />
                    </div>
                    <div className="space-y-2">
                        <Label>Transmission</Label>
                         <Select onValueChange={(val) => setValue("transmission_type", val)} defaultValue={initialData?.transmission_type || "Manual"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select transmission" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Automatic">Automatic</SelectItem>
                                <SelectItem value="CVT">CVT</SelectItem>
                                <SelectItem value="DCT">DCT</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Number of Gears</Label>
                        <Input type="number" {...register("number_gears", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Brakes Type</Label>
                        <Input {...register("brakes_type")} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Front View</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload 
                            value={watch('image_connector_front')}
                            onChange={(url) => setValue('image_connector_front', url)}
                            accept="image/*"
                            label="Upload Front View"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Side View (Lever)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload 
                            value={watch('image_lever_side')}
                            onChange={(url) => setValue('image_lever_side', url)}
                            accept="image/*"
                            label="Upload Side View"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> ECU Front View</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload 
                            value={watch('image_ecu_front')}
                            onChange={(url) => setValue('image_ecu_front', url)}
                            accept="image/*"
                            label="Upload ECU Front"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> ECU Showing PN</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload 
                            value={watch('image_ecu_part_number')}
                            onChange={(url) => setValue('image_ecu_part_number', url)}
                            accept="image/*"
                            label="Upload ECU PN"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Additional Photos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FileUpload 
                            value={watch('image_extra_1')}
                            onChange={(url) => setValue('image_extra_1', url)}
                            accept="image/*"
                            label="Additional Photo 1"
                        />
                         <FileUpload 
                            value={watch('image_extra_2')}
                            onChange={(url) => setValue('image_extra_2', url)}
                            accept="image/*"
                            label="Additional Photo 2"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Electrical Scheme</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload 
                            value={watch('file_electrical_scheme')}
                            onChange={(url) => setValue('file_electrical_scheme', url)}
                            label="Upload Scheme"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> List of Functions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload 
                            value={watch('file_sensors_actuators')}
                            onChange={(url) => setValue('file_sensors_actuators', url)}
                            label="Upload List"
                        />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Plug className="w-5 h-5"/> Connectors</CardTitle>
                    <Button type="button" onClick={handleAddConnector} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Connector
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {connectors.map((conn, index) => (
                        <div key={conn.id || conn.tempId} className="p-4 border rounded-lg bg-gray-50 dark:bg-black/20 space-y-4 relative">
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                onClick={() => handleRemoveConnector(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Calculator System</Label>
                                    <Input 
                                        value={conn.calculator_system} 
                                        onChange={(e) => handleConnectorChange(index, 'calculator_system', e.target.value)}
                                        placeholder="e.g. ABS, Engine"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Connector Color</Label>
                                    <Input 
                                        value={conn.connector_color} 
                                        onChange={(e) => handleConnectorChange(index, 'connector_color', e.target.value)}
                                        placeholder="e.g. Black, Grey"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pin Quantity</Label>
                                    <Input 
                                        type="number"
                                        value={conn.pin_quantity} 
                                        onChange={(e) => handleConnectorChange(index, 'pin_quantity', e.target.value)}
                                        placeholder="e.g. 16"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Catalogue Product</Label>
                                    <Select 
                                        value={conn.catalogue_id} 
                                        onValueChange={(val) => handleConnectorChange(index, 'catalogue_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select from catalog..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {catalogueItems?.map(item => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.secret_part_number} ({item.colour}) - {item.type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    ))}
                    {connectors.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            No connectors added. Click "Add Connector" to start.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#00C600] hover:bg-[#00b300]">
                    {isSubmitting ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
                </Button>
            </div>
        </form>
    );
}