import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, ImageIcon, FileText, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FileUpload from '../FileUpload';
import { createPageUrl } from '@/utils';

export default function VehicleSpecsForm({ onCancel, onSuccess, clientEmail, initialData }) {
    const navigate = useNavigate();
    const InputStyle = "bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";
    
    const [isDecoding, setIsDecoding] = React.useState(false);
    const [savedVehicle, setSavedVehicle] = React.useState(initialData || null);

    const { register, control, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            transmission_type: "Automatic",
            fuel: "Diesel",
            year: new Date().getFullYear(),
            ...(initialData || {})
        }
    });

    const queryClient = useQueryClient();
    const activeVehicleId = savedVehicle?.id || initialData?.id;

    const { data: connectors } = useQuery({
        queryKey: ['connectors', activeVehicleId],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: activeVehicleId }),
        enabled: !!activeVehicleId,
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    const deleteConnectorMutation = useMutation({
        mutationFn: (id) => base44.entities.VehicleConnector.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['connectors', activeVehicleId]);
            toast.success("Removed");
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
        // Strip system fields that cannot be updated
        const { id, created_date, updated_date, created_by, updated_by, audit_log, ...cleanData } = data;
        
        // Ensure numeric fields are valid or undefined
        if (isNaN(cleanData.year)) delete cleanData.year;
        if (isNaN(cleanData.number_gears)) delete cleanData.number_gears;

        let vehicleId = savedVehicle?.id || initialData?.id;

        if (vehicleId) {
            await base44.entities.Vehicle.update(vehicleId, cleanData);
            setSavedVehicle({ ...savedVehicle, ...cleanData, id: vehicleId });
            toast.success(`Vehicle saved. Number: ${savedVehicle?.vehicle_number || initialData?.vehicle_number}`);
        } else {
            // VEH- + 6 random digits
            const random6 = Math.floor(100000 + Math.random() * 900000);
            const vehicleNumber = `VEH-${random6}`;
            
            const newVehicle = await base44.entities.Vehicle.create({
                ...cleanData,
                vehicle_number: vehicleNumber,
                status: 'Open for Quotes',
                client_email: clientEmail || ""
            });
            setSavedVehicle(newVehicle);
            toast.success(`Vehicle created! Number: ${vehicleNumber}`);
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
                        {(savedVehicle?.vehicle_number || initialData?.vehicle_number) && (
                            <div className="col-span-1 md:col-span-2 space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-dashed border-[#00C600]">
                                <label className="text-sm font-bold uppercase flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#00C600]" /> Vehicle Number
                                </label>
                                <div className="flex gap-2">
                                    <code className="text-lg font-mono font-bold text-[#00C600]">
                                        {savedVehicle?.vehicle_number || initialData?.vehicle_number}
                                    </code>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(savedVehicle?.vehicle_number || initialData?.vehicle_number);
                                            toast.success("Copied");
                                        }}
                                        className="h-7 text-xs"
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Brand</label>
                            <Input {...register("brand")} className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]" placeholder="RENAULT" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Model</label>
                            <Input {...register("model")} className={InputStyle} placeholder="CAPTUR II" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Version</label>
                            <Input {...register("version")} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Year</label>
                            <Input type="number" {...register("year", { valueAsNumber: true })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Fuel</label>
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
                            <label className="text-sm font-bold uppercase">VIN</label>
                            <div className="flex gap-2">
                                <Input 
                                    {...register("vin")} 
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
                            <label className="text-sm font-bold uppercase">Engine Size</label>
                            <Input {...register("engine_size")} className={InputStyle} placeholder="1500cm3" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Engine Power</label>
                            <Input {...register("engine_power")} className={InputStyle} placeholder="120PS" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Engine Code</label>
                            <Input {...register("engine_code")} className={InputStyle} placeholder="K9K" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Transmission</label>
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
                            <label className="text-sm font-bold uppercase">Gears</label>
                            <Input type="number" {...register("number_gears", { valueAsNumber: true })} className={InputStyle} />
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
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            SAVE VEHICLE
                        </Button>

                        <Button 
                            type="button"
                            disabled={!savedVehicle?.id}
                            onClick={() => {
                                // Save to localStorage as backup for "No missing ID"
                                localStorage.setItem('lastVehicleId', savedVehicle.id);
                                navigate(`/VehicleConnectors?vehicleId=${savedVehicle.id}`);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white uppercase font-bold"
                        >
                            ADD CONNECTORS
                        </Button>
                    </div>
                </form>

                {/* Vehicle Connectors Grid */}
                {activeVehicleId && (
                    <div className="mt-8 border-t pt-8">
                        <h3 className="text-lg font-bold uppercase mb-4">Vehicle Connectors</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {connectors?.map((conn) => {
                                const catalogueItem = catalogueItems?.find(c => c.id === conn.catalogue_id);
                                return (
                                    <Card key={conn.id} className="relative group hover:shadow-md transition-all border-l-4 border-l-[#00C600] flex flex-col overflow-hidden">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-75"
                                            onClick={() => deleteConnectorMutation.mutate(conn.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                        
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
                            {!connectors?.length && (
                                <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                                    No connectors added yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}