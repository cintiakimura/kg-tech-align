import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, ImageIcon, FileText, Plug, Plus, Trash2 } from 'lucide-react';
import FileUpload from '../FileUpload';
import { useQuery } from "@tanstack/react-query";

export default function VehicleSpecsForm({ onCancel, onSuccess, clientEmail, initialData }) {
    const InputStyle = "bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";
    
    const [isDecoding, setIsDecoding] = React.useState(false);
    const [connectors, setConnectors] = React.useState([]);

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    // Load existing connectors if editing
    React.useEffect(() => {
        if (initialData?.id) {
            base44.entities.VehicleConnector.list({ vehicle_id: initialData.id }).then(setConnectors);
        }
    }, [initialData]);

    const handleAddConnector = () => {
        setConnectors([...connectors, { 
            tempId: Date.now(), 
            calculator_system: '', 
            connector_color: '', 
            pin_quantity: '', 
            catalogue_id: 'none',
            quantity: 1
        }]);
    };

    const handleRemoveConnector = async (index) => {
        const connector = connectors[index];
        if (connector.id) {
             try {
                await base44.entities.VehicleConnector.delete(connector.id);
                toast.success("Connector removed");
             } catch (e) {
                console.error(e);
                toast.error("Failed to remove connector");
                return;
             }
        }
        const newConnectors = [...connectors];
        newConnectors.splice(index, 1);
        setConnectors(newConnectors);
    };

    const handleConnectorChange = (index, field, value) => {
        const newConnectors = [...connectors];
        newConnectors[index][field] = value;
        setConnectors(newConnectors);
    };

    const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            transmission_type: "Automatic",
            fuel: "Diesel",
            year: new Date().getFullYear(),
            ...(initialData || {})
        }
    });

    const decodeVin = async () => {
        const vin = getValues("vin");
        if (!vin || vin.length < 17) {
            toast.error("Please enter a valid 17-character VIN");
            return;
        }

        setIsDecoding(true);
        try {
            const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
            const data = await response.json();
            
            if (data.Results && data.Results.length > 0) {
                const vehicle = data.Results[0];
                
                if (vehicle.ErrorCode && vehicle.ErrorCode !== "0") {
                     toast.warning(`VIN Decode Warning: ${vehicle.ErrorText}`);
                }

                // Map fields
                if (vehicle.Make) setValue("brand", vehicle.Make);
                if (vehicle.Model) setValue("model", vehicle.Model);
                if (vehicle.ModelYear) setValue("year", parseInt(vehicle.ModelYear));
                
                // Fuel Mapping
                if (vehicle.FuelTypePrimary) {
                    const fuelMap = {
                        "Gasoline": "Gasoline",
                        "Diesel": "Diesel",
                        "Electric": "Electric",
                        "Hybrid": "Hybrid" 
                    };
                    // Simple fuzzy match or default to Other
                    const fuelLower = vehicle.FuelTypePrimary.toLowerCase();
                    if (fuelLower.includes("gas")) setValue("fuel", "Gasoline");
                    else if (fuelLower.includes("diesel")) setValue("fuel", "Diesel");
                    else if (fuelLower.includes("electric")) setValue("fuel", "Electric");
                    else if (fuelLower.includes("hybrid")) setValue("fuel", "Hybrid");
                    else setValue("fuel", "Other");
                }

                // Engine Size
                if (vehicle.DisplacementCC) {
                    setValue("engine_size", `${vehicle.DisplacementCC}cc`);
                } else if (vehicle.DisplacementL) {
                    setValue("engine_size", `${vehicle.DisplacementL}L`);
                }

                // Engine Power
                if (vehicle.EngineHP) {
                    setValue("engine_power", `${vehicle.EngineHP}HP`);
                } else if (vehicle.EngineKW) {
                    setValue("engine_power", `${vehicle.EngineKW}kW`);
                }

                // Engine Code - often not in public VIN decode, but sometimes in EngineConfiguration
                if (vehicle.EngineConfiguration) {
                     // Best effort
                }

                // Transmission
                if (vehicle.TransmissionStyle) {
                    const transLower = vehicle.TransmissionStyle.toLowerCase();
                    if (transLower.includes("auto")) setValue("transmission_type", "Automatic");
                    else if (transLower.includes("manual")) setValue("transmission_type", "Manual");
                    else if (transLower.includes("cvt")) setValue("transmission_type", "CVT");
                    else if (transLower.includes("dual")) setValue("transmission_type", "DCT");
                }

                // Gears
                if (vehicle.TransmissionSpeeds) {
                    setValue("number_gears", parseInt(vehicle.TransmissionSpeeds));
                }

                toast.success("Vehicle details decoded from VIN!");
            } else {
                toast.error("Could not decode VIN");
            }
        } catch (error) {
            console.error("VIN Decode Error", error);
            toast.error("Failed to connect to NHTSA database");
        } finally {
            setIsDecoding(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            // Strip system fields that cannot be updated
            const { id, created_date, updated_date, created_by, updated_by, audit_log, ...cleanData } = data;
            
            let vehicleId = initialData?.id;

            if (vehicleId) {
                await base44.entities.Vehicle.update(vehicleId, cleanData);
            } else {
                const vehicleNumber = `VEH-${Date.now().toString().slice(-6)}`;
                const newVehicle = await base44.entities.Vehicle.create({
                    ...cleanData,
                    vehicle_number: vehicleNumber,
                    status: 'Open for Quotes',
                    client_email: clientEmail
                });
                vehicleId = newVehicle.id;
            }

            // Save connectors
            for (const conn of connectors) {
                const connectorData = {
                    vehicle_id: vehicleId,
                    calculator_system: conn.calculator_system,
                    connector_color: conn.connector_color,
                    pin_quantity: conn.pin_quantity, // Keep as string as requested
                    catalogue_id: conn.catalogue_id !== 'none' ? conn.catalogue_id : null,
                    quantity: parseInt(conn.quantity) || 1
                };

                if (conn.id) {
                    await base44.entities.VehicleConnector.update(conn.id, connectorData);
                } else {
                    await base44.entities.VehicleConnector.create(connectorData);
                }
            }

            toast.success("Saved successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save vehicle");
        }
    };

    return (
        <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-lg">
            <CardHeader>
                <CardTitle className="uppercase font-bold">{initialData ? "Edit Vehicle" : "New Vehicle"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Brand <span className="text-[#00C600]">*</span></label>
                            <Input {...register("brand", { required: true })} className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]" placeholder="RENAULT" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Model <span className="text-[#00C600]">*</span></label>
                            <Input {...register("model", { required: true })} className={InputStyle} placeholder="CAPTUR II" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Version <span className="text-[#00C600]">*</span></label>
                            <Input {...register("version", { required: true })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Year <span className="text-[#00C600]">*</span></label>
                            <Input type="number" {...register("year", { required: true, valueAsNumber: true })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Fuel <span className="text-[#00C600]">*</span></label>
                            <Controller
                                name="fuel"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className={InputStyle}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Gasoline", "Diesel", "Electric", "Hybrid", "Other"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">VIN <span className="text-[#00C600]">*</span></label>
                            <div className="flex gap-2">
                                <Input 
                                    {...register("vin", { required: true })} 
                                    className={InputStyle} 
                                    placeholder="Enter 17-char VIN" 
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            await decodeVin();
                                            // Focus the save button after decoding
                                            setTimeout(() => document.getElementById('save-vehicle-btn')?.focus(), 100);
                                        }
                                    }}
                                />
                                <Button 
                                    type="button" 
                                    onClick={decodeVin} 
                                    disabled={isDecoding}
                                    variant="outline"
                                    className="border-[#00C600] text-[#00C600] hover:bg-[#00C600] hover:text-white uppercase font-bold text-xs"
                                >
                                    {isDecoding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Decode"}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Engine Size <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_size", { required: true })} className={InputStyle} placeholder="1500cm3" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Engine Power <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_power", { required: true })} className={InputStyle} placeholder="120PS" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Engine Code <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_code", { required: true })} className={InputStyle} placeholder="K9K" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Transmission <span className="text-[#00C600]">*</span></label>
                            <Controller
                                name="transmission_type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className={InputStyle}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Automatic", "Manual", "CVT", "DCT", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Gears <span className="text-[#00C600]">*</span></label>
                            <Input type="number" {...register("number_gears", { required: true, valueAsNumber: true })} className={InputStyle} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><ImageIcon className="w-4 h-4"/> Front View</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Controller
                                    name="image_connector_front"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} accept="image/*" label="Upload Front View" />
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><ImageIcon className="w-4 h-4"/> Side View (Lever)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Controller
                                    name="image_lever_side"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} accept="image/*" label="Upload Side View" />
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><ImageIcon className="w-4 h-4"/> ECU Front View</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Controller
                                    name="image_ecu_front"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} accept="image/*" label="Upload ECU Front" />
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><ImageIcon className="w-4 h-4"/> ECU Showing PN</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Controller
                                    name="image_ecu_part_number"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} accept="image/*" label="Upload ECU PN" />
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><ImageIcon className="w-4 h-4"/> Additional Photos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Controller
                                    name="image_extra_1"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} accept="image/*" label="Additional Photo 1" />
                                    )}
                                />
                                <Controller
                                    name="image_extra_2"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} accept="image/*" label="Additional Photo 2" />
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><FileText className="w-4 h-4"/> Electrical Scheme</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Controller
                                    name="file_electrical_scheme"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} label="Upload Scheme" />
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase"><FileText className="w-4 h-4"/> List of Functions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Controller
                                    name="file_sensors_actuators"
                                    control={control}
                                    render={({ field }) => (
                                        <FileUpload value={field.value} onChange={field.onChange} label="Upload List" />
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="pt-8 border-t">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold uppercase flex items-center gap-2">
                                <Plug className="w-5 h-5"/> Connectors
                            </h3>
                            <Button type="button" onClick={handleAddConnector} variant="outline" size="sm" className="uppercase font-bold text-xs border-[#00C600] text-[#00C600] hover:bg-[#00C600] hover:text-white">
                                <Plus className="w-4 h-4 mr-2" /> Add Connector
                            </Button>
                        </div>

                        <div className="space-y-4">
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Calculator System</label>
                                            <Input 
                                                value={conn.calculator_system} 
                                                onChange={(e) => handleConnectorChange(index, 'calculator_system', e.target.value)}
                                                className={InputStyle}
                                                placeholder="e.g. ABS"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Connector Color</label>
                                            <Input 
                                                value={conn.connector_color} 
                                                onChange={(e) => handleConnectorChange(index, 'connector_color', e.target.value)}
                                                className={InputStyle}
                                                placeholder="e.g. Black"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Pin Quantity</label>
                                            <Input 
                                                value={conn.pin_quantity} 
                                                onChange={(e) => handleConnectorChange(index, 'pin_quantity', e.target.value)}
                                                className={InputStyle}
                                                placeholder="e.g. 16 or 8+2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase">Catalogue Product</label>
                                            <Select 
                                                value={conn.catalogue_id || 'none'} 
                                                onValueChange={(val) => handleConnectorChange(index, 'catalogue_id', val)}
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
                                </div>
                            ))}
                            {connectors.length === 0 && (
                                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                                    No connectors added yet. Click "Add Connector" to start.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>CANCEL</Button>
                        <Button 
                            id="save-vehicle-btn"
                            type="submit" 
                            className="bg-[#00C600] hover:bg-[#00b300] text-white uppercase font-bold" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "save"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}