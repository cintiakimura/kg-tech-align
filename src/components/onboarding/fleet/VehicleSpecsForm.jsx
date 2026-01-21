import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, ImageIcon, FileText } from 'lucide-react';
import FileUpload from '../FileUpload';
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from '@/utils';

export default function VehicleSpecsForm({ onCancel, onSuccess, clientEmail, initialData }) {
    const navigate = useNavigate();
    const InputStyle = "bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";
    
    const [isDecoding, setIsDecoding] = React.useState(false);
    const [savedVehicle, setSavedVehicle] = React.useState(initialData || null);

    const { data: connectors } = useQuery({
        queryKey: ['vehicle-connectors', savedVehicle?.id],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: savedVehicle.id }),
        enabled: !!savedVehicle?.id
    });

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
            // VEH- + padded number
            const randomNum = Math.floor(Math.random() * 1000000);
            const vehicleNumber = `VEH-${randomNum.toString().padStart(6, '0')}`;
            
            // Get current user ID
            const currentUser = await base44.auth.me();

            const newVehicle = await base44.entities.Vehicle.create({
                ...cleanData,
                vehicle_number: vehicleNumber,
                status: 'Open for Quotes',
                client_email: clientEmail || "",
                client_id: currentUser?.id
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





                    {/* Connectors Section */}
                    {savedVehicle?.id && connectors?.length > 0 && (
                        <div className="col-span-1 md:col-span-2 space-y-4 pt-6 border-t dark:border-gray-700">
                            <h3 className="text-sm font-bold uppercase flex items-center gap-2">
                                Linked Connectors
                                <span className="bg-[#00C600] text-white text-[10px] px-2 py-0.5 rounded-full">{connectors.length}</span>
                            </h3>
                            <div className="grid gap-2">
                                {connectors.map((conn, idx) => (
                                    <div key={conn.id || idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                                            <div>
                                                <span className="text-[10px] uppercase text-muted-foreground block">System</span>
                                                <span className="font-bold">{conn.calculator_system || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase text-muted-foreground block">Pins</span>
                                                <span className="font-bold">{conn.pin_quantity || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase text-muted-foreground block">Color</span>
                                                <span className="font-bold">{conn.connector_color || "-"}</span>
                                            </div>
                                        </div>
                                        <a 
                                            href={createPageUrl('VehicleDetail') + `?id=${savedVehicle.id}`}
                                            className="ml-4 text-[#00C600] hover:underline text-xs font-bold uppercase"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
            </CardContent>
        </Card>
    );
}