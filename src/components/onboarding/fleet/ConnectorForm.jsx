import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
            await base44.entities.VehicleConnector.create({
                vehicle_id: vehicle.id,
                calculator_system: data.calculator_system,
                quantity: 1, // Default to 1 as per screenshot flow implied
                image_1: data.image_1,
                image_2: data.image_2,
                image_3: data.image_3,
                file_wiring_diagram: data.file_wiring_diagram,
                file_pinning_list: data.file_pinning_list
            });
            toast.success("Connector added successfully");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add connector");
        }
    };

    return (
        <div className="flex gap-6 flex-col md:flex-row">
            {/* Vehicle Info Side Panel */}
            <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-gray-200 p-6 rounded-lg">
                    <h2 className="text-xl font-bold uppercase mb-2">
                        {vehicle.brand} {vehicle.model} {vehicle.year} {vehicle.fuel}
                    </h2>
                    <p className="text-sm font-semibold text-gray-700 uppercase leading-relaxed">
                        {vehicle.engine_size} {vehicle.engine_power}<br/>
                        {vehicle.engine_code}<br/>
                        {vehicle.number_gears}-GEAR {vehicle.transmission_type}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1">
                <Card className="border-none shadow-sm bg-gray-50 dark:bg-white/5">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="font-bold uppercase w-24">System</label>
                            <Input 
                                {...register("calculator_system", { required: true })} 
                                className="bg-white max-w-sm" 
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
            </div>
        </div>
    );
}