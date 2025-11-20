import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Plus, Car, Settings, Zap, ArrowLeft, Trash2 } from 'lucide-react';
import FileUpload from './FileUpload';
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function CarForm({ onCancel, onSuccess, initialData }) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initialData || {
        transmission_type: "Automatic"
    }
  });

  const onSubmit = async (data) => {
    try {
        if (initialData?.id) {
             await base44.entities.CarProfile.update(initialData.id, data);
        } else {
             await base44.entities.CarProfile.create(data);
        }
        onSuccess();
    } catch (error) {
        console.error("Failed to save car profile", error);
    }
  };

  const InputStyle = "bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";

  return (
    <Card className="border-none shadow-none bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-bold">Car Profile</CardTitle>
                <CardDescription>Add a new vehicle to your fleet.</CardDescription>
            </div>
            <Button variant="ghost" onClick={onCancel} size="sm" className="text-gray-500">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
        </CardHeader>
        <CardContent className="px-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Car Details Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Car className="w-5 h-5" /> Vehicle Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Brand <span className="text-[#00C600]">*</span></label>
                            <Input {...register("brand", { required: "Brand is required" })} placeholder="e.g. Toyota" className={InputStyle} />
                            {errors.brand && <span className="text-xs text-red-500">{errors.brand.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Model <span className="text-[#00C600]">*</span></label>
                            <Input {...register("model", { required: "Model is required" })} placeholder="e.g. Camry" className={InputStyle} />
                            {errors.model && <span className="text-xs text-red-500">{errors.model.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Model</label>
                            <Input {...register("engine_model")} placeholder="e.g. V6 3.5L" className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Transmission</label>
                            <Controller
                                name="transmission_type"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className={InputStyle}>
                                            <SelectValue placeholder="Select transmission" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Automatic">Automatic</SelectItem>
                                            <SelectItem value="Manual">Manual</SelectItem>
                                            <SelectItem value="CVT">CVT</SelectItem>
                                            <SelectItem value="DCT">DCT</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Brakes Type</label>
                            <Input {...register("brakes_type")} placeholder="e.g. Disc/Drum" className={InputStyle} />
                        </div>
                    </div>
                </div>

                {/* Images Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Zap className="w-5 h-5" /> Required Photos
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Please upload clear photos for verification.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Controller
                            name="image_connector_front"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label="Connector Front View" value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_lever_side"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label="Lever Side View" value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_ecu_part_number"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label="ECU Part Number" value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_ecu_front"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label="ECU Front View" value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_extra_1"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label="Additional Photo 1" value={field.value} onChange={field.onChange} />
                            )}
                        />
                        <Controller
                            name="image_extra_2"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label="Additional Photo 2" value={field.value} onChange={field.onChange} />
                            )}
                        />
                    </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Settings className="w-5 h-5" /> Technical Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="file_electrical_scheme"
                            control={control}
                            render={({ field }) => (
                                <FileUpload 
                                    label="Electrical Scheme" 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    helperText="Upload PDF or Image of the electrical scheme"
                                />
                            )}
                        />
                        <Controller
                            name="file_sensors_actuators"
                            control={control}
                            render={({ field }) => (
                                <FileUpload 
                                    label="Sensors & Actuators List" 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                    accept=".pdf,.csv,.xlsx,.png,.jpg"
                                    helperText="Upload list of sensors and actuators"
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-[#00C600] hover:bg-[#00b300] text-white min-w-[140px]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Car Profile"}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}