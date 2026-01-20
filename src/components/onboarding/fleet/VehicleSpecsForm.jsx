import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

export default function VehicleSpecsForm({ onCancel, onSuccess, clientEmail }) {
    const InputStyle = "bg-white border-gray-200 focus:ring-[#00C600] focus:border-[#00C600]";
    
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            transmission_type: "Automatic",
            fuel: "Diesel",
            year: new Date().getFullYear()
        }
    });

    const onSubmit = async (data) => {
        try {
            const vehicleNumber = `VEH-${Date.now().toString().slice(-6)}`;
            await base44.entities.Vehicle.create({
                ...data,
                vehicle_number: vehicleNumber,
                status: 'Open for Quotes',
                client_email: clientEmail
            });
            toast.success("Vehicle created successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create vehicle");
        }
    };

    return (
        <Card className="bg-gray-100 border-none shadow-none">
            <CardHeader>
                <CardTitle className="uppercase font-bold">New Vehicle</CardTitle>
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
                            <Input {...register("vin", { required: true })} className={InputStyle} />
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