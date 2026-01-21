import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import FileUpload from '../FileUpload';
import { useQuery } from "@tanstack/react-query";

export default function ConnectorForm({ vehicle, onCancel, onSuccess }) {
    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            calculator_system: "",
            quantity: 1,
            connector_color: "",
            pin_quantity: "",
            catalogue_id: "none"
        }
    });

    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    const onSubmit = async (data) => {
        try {
            await base44.entities.VehicleConnector.create({
                vehicle_id: vehicle.id,
                calculator_system: data.calculator_system,
                connector_color: data.connector_color,
                pin_quantity: parseInt(data.pin_quantity) || 0,
                catalogue_id: data.catalogue_id === "none" ? null : data.catalogue_id,
                quantity: 1, 
                image_1: data.image_1,
                image_2: data.image_2,
                image_3: data.image_3,
                image_4: data.image_4,
                image_5: data.image_5,
                file_wiring_diagram: data.file_wiring_diagram,
                file_pinning_list: data.file_pinning_list,
                file_other_1: data.file_other_1,
                file_other_2: data.file_other_2
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="font-bold uppercase text-xs">Calculator System</label>
                                <Input 
                                    {...register("calculator_system", { required: true })} 
                                    className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700" 
                                    placeholder="ABS"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold uppercase text-xs">Connector Color</label>
                                <Input 
                                    {...register("connector_color")} 
                                    className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700" 
                                    placeholder="Black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold uppercase text-xs">Pin Quantity</label>
                                <Input 
                                    type="number"
                                    {...register("pin_quantity")} 
                                    className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700" 
                                    placeholder="16"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-bold uppercase text-xs">Catalogue Product</label>
                                <Controller
                                    name="catalogue_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="bg-white dark:bg-[#333] border-gray-200 dark:border-gray-700">
                                                <SelectValue placeholder="Select product..." />
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
                                    )}
                                />
                            </div>
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
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "add connector"}
                        </Button>
                    </div>
                </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}