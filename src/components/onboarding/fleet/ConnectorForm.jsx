import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import FileUpload from '../FileUpload';

export default function ConnectorForm({ vehicle, onCancel, onSuccess }) {
    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            calculator_system: "",
            quantity: 1
        }
    });

    const onSubmit = async (data) => {
        try {
            console.log("Submitting connector:", { vehicle_id: vehicle.id, ...data });
            // Clean up payload to remove null/undefined values if they cause issues, 
            // though schema now supports nulls.
            const payload = {
                vehicle_id: vehicle.id,
                calculator_system: data.calculator_system,
                quantity: 1,
                image_1: data.image_1 || undefined,
                image_2: data.image_2 || undefined,
                image_3: data.image_3 || undefined,
                image_4: data.image_4 || undefined,
                image_5: data.image_5 || undefined,
                file_wiring_diagram: data.file_wiring_diagram || undefined,
                file_pinning_list: data.file_pinning_list || undefined,
                file_other_1: data.file_other_1 || undefined,
                file_other_2: data.file_other_2 || undefined
            };

            // Remove undefined keys
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            await base44.entities.VehicleConnector.create(payload);
            toast.success("Connector added successfully");
            onSuccess();
        } catch (error) {
            console.error("Connector creation failed:", error);
            toast.error(`Failed to add connector: ${error.message || "Unknown error"}`);
        }
    };

    return (
        <div className="flex gap-6 flex-col md:flex-row">
            {/* Vehicle Info Side Panel */}
            <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white dark:bg-[#2a2a2a] p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold uppercase mb-2">
                        {vehicle.brand} {vehicle.model} {vehicle.year} {vehicle.fuel}
                    </h2>
                    <p className="text-sm font-semibold text-muted-foreground uppercase leading-relaxed">
                        {vehicle.engine_size} {vehicle.engine_power}<br/>
                        {vehicle.engine_code}<br/>
                        {vehicle.number_gears}-GEAR {vehicle.transmission_type}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1">
                <Card className="border-none shadow-lg bg-white dark:bg-[#2a2a2a]">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="font-bold uppercase w-24">System</label>
                            <Input 
                                {...register("calculator_system", { required: true })} 
                                className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700 max-w-sm" 
                                placeholder="ABS"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold uppercase text-xs text-gray-500">Photos</label>
                            <div className="flex flex-wrap gap-4">
                                <Controller
                                    name="image_1"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-32">
                                            <FileUpload label="+ PHOTO 1" value={field.value} onChange={field.onChange} compact />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="image_2"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-32">
                                            <FileUpload label="+ PHOTO 2" value={field.value} onChange={field.onChange} compact />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="image_3"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-32">
                                            <FileUpload label="+ PHOTO 3" value={field.value} onChange={field.onChange} compact />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="image_4"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-32">
                                            <FileUpload label="+ PHOTO 4" value={field.value} onChange={field.onChange} compact />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="image_5"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-32">
                                            <FileUpload label="+ PHOTO 5" value={field.value} onChange={field.onChange} compact />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold uppercase text-xs text-gray-500">Documentation</label>
                            <div className="flex flex-wrap gap-4">
                                <Controller
                                    name="file_wiring_diagram"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-40">
                                            <FileUpload label="+ WIRING DIAGRAM" value={field.value} onChange={field.onChange} compact accept=".pdf,.png,.jpg" />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="file_pinning_list"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-40">
                                            <FileUpload label="+ PINNING LIST" value={field.value} onChange={field.onChange} compact accept=".pdf,.csv,.xlsx" />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="file_other_1"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-40">
                                            <FileUpload label="+ OTHER DOC 1" value={field.value} onChange={field.onChange} compact accept=".pdf,.csv,.xlsx,.doc,.docx" />
                                        </div>
                                    )}
                                />
                                <Controller
                                    name="file_other_2"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="w-40">
                                            <FileUpload label="+ OTHER DOC 2" value={field.value} onChange={field.onChange} compact accept=".pdf,.csv,.xlsx,.doc,.docx" />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="button" variant="ghost" onClick={onCancel} className="mr-4 uppercase font-bold text-xs">Cancel</Button>
                        <Button type="submit" className="bg-[#00C600] hover:bg-[#00b300] text-white uppercase font-bold text-lg px-8 py-6" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "SAVE"}
                        </Button>
                    </div>
                </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}