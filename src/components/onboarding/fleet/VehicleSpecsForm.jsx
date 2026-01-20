import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

export default function VehicleSpecsForm({ onCancel, onSuccess, clientEmail, initialData }) {
    const InputStyle = "bg-white border-gray-200 focus:ring-[#00C600] focus:border-[#00C600]";
    
    const [isDecoding, setIsDecoding] = React.useState(false);

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

            if (initialData) {
                await base44.entities.Vehicle.update(initialData.id, cleanData);
                toast.success("Vehicle updated successfully");
            } else {
                const vehicleNumber = `VEH-${Date.now().toString().slice(-6)}`;
                await base44.entities.Vehicle.create({
                    ...cleanData,
                    vehicle_number: vehicleNumber,
                    status: 'Open for Quotes',
                    client_email: clientEmail
                });
                toast.success("Vehicle created successfully");
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create vehicle");
        }
    };

    return (
        <Card className="bg-gray-100 border-none shadow-none">
            <CardHeader>
                <CardTitle className="uppercase font-bold">{initialData ? "Edit Vehicle" : "New Vehicle"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase">Brand <span className="text-[#00C600]">*</span></label>
                            <Input {...register("brand", { required: true })} className={InputStyle} placeholder="RENAULT" />
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
                                <Input {...register("vin", { required: true })} className={InputStyle} placeholder="Enter 17-char VIN" />
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

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>CANCEL</Button>
                        <Button type="submit" className="bg-[#00C600] hover:bg-[#00b300] text-white uppercase font-bold" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Vehicle"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}