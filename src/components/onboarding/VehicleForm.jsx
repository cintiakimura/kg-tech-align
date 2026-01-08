import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Car, Settings, Zap, ArrowLeft, Trash2, Package } from 'lucide-react';
import FileUpload from './FileUpload';
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../LanguageContext';

export default function VehicleForm({ onCancel, onSuccess, initialData }) {
  const { t } = useLanguage();
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initialData || {
        transmission_type: "Automatic",
        connectors: [{ catalogue_id: "", quantity: 1, notes: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "connectors"
  });

  const { data: catalogueItems } = useQuery({
      queryKey: ['catalogue'],
      queryFn: () => base44.entities.Catalogue.list(),
  });

  const onSubmit = async (data) => {
    try {
        let vehicleId = initialData?.id;

        // 1. Save Vehicle
        if (initialData?.id) {
             await base44.entities.Vehicle.update(initialData.id, {
                 ...data,
                 status: data.status || 'Open for Quotes' // Ensure status is set
             });
        } else {
             const newVehicle = await base44.entities.Vehicle.create({
                 ...data,
                 status: 'Open for Quotes'
             });
             vehicleId = newVehicle.id;
        }

        // 2. Save Connectors (Delete existing and recreate for simplicity on edit, or just add new)
        // For simplicity: If editing, we might want to be smarter, but let's just create them for now. 
        // Real implementation would diff. Given "replace any single product field", let's assume create flow mostly.
        
        if (data.connectors && data.connectors.length > 0) {
            // If editing, we should probably clear old ones first or update. 
            // Since we don't have bulk delete by query easily exposed in this context without finding them first:
            if (initialData?.id) {
                const existing = await base44.entities.VehicleConnector.list({ vehicle_id: vehicleId });
                await Promise.all(existing.map(c => base44.entities.VehicleConnector.delete(c.id)));
            }
            
            await Promise.all(data.connectors.map(conn => 
                base44.entities.VehicleConnector.create({
                    vehicle_id: vehicleId,
                    catalogue_id: conn.catalogue_id,
                    quantity: parseInt(conn.quantity),
                    notes: conn.notes
                })
            ));
        }

        onSuccess();
    } catch (error) {
        console.error("Failed to save vehicle request", error);
    }
  };

  const InputStyle = "bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]";

  return (
    <Card className="border-none shadow-none bg-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-bold">My Training Vehicles</CardTitle>
                <CardDescription>Add specifications for your training vehicle.</CardDescription>
            </div>
            <Button variant="ghost" onClick={onCancel} size="sm" className="text-gray-500">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
            </Button>
        </CardHeader>
        <CardContent className="px-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Vehicle Specs */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Car className="w-5 h-5" /> {t('vehicle_specs')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('brand')} <span className="text-[#00C600]">*</span></label>
                            <Input {...register("brand", { required: "Brand is required" })} placeholder="e.g. Toyota" className={InputStyle} />
                            {errors.brand && <span className="text-xs text-red-500">{errors.brand.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('model')} <span className="text-[#00C600]">*</span></label>
                            <Input {...register("model", { required: "Model is required" })} placeholder="e.g. Camry" className={InputStyle} />
                            {errors.model && <span className="text-xs text-red-500">{errors.model.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Version <span className="text-[#00C600]">*</span></label>
                            <Input {...register("version", { required: "Version is required" })} placeholder="e.g. SE" className={InputStyle} />
                            {errors.version && <span className="text-xs text-red-500">{errors.version.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Year <span className="text-[#00C600]">*</span></label>
                            <Input type="number" {...register("year", { required: "Year is required", valueAsNumber: true })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">VIN <span className="text-[#00C600]">*</span></label>
                            <Input {...register("vin", { required: "VIN is required" })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fuel Type <span className="text-[#00C600]">*</span></label>
                            <Controller
                                name="fuel"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className={InputStyle}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["Petrol", "Diesel", "Electric", "Hybrid", "Other"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Size <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_size", { required: "Required" })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Power <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_power", { required: "Required" })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Code <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_code", { required: "Required" })} className={InputStyle} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Transmission <span className="text-[#00C600]">*</span></label>
                            <Controller
                                name="transmission_type"
                                control={control}
                                rules={{ required: "Required" }}
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
                            <label className="text-sm font-medium">Gears <span className="text-[#00C600]">*</span></label>
                            <Input type="number" {...register("number_gears", { required: "Required", valueAsNumber: true })} className={InputStyle} />
                        </div>
                    </div>
                </div>

                {/* Connectors Needed (Repeating Group) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                            <Package className="w-5 h-5" /> Connectors Needed
                        </h3>
                        <Button type="button" onClick={() => append({ catalogue_id: "", quantity: 1, notes: "" })} size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-2" /> Add Connector
                        </Button>
                    </div>
                    
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 flex flex-col md:flex-row gap-4 items-start relative group">
                                <div className="flex-1 w-full md:w-auto">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Connector</label>
                                    <Controller
                                        name={`connectors.${index}.catalogue_id`}
                                        control={control}
                                        rules={{ required: "Required" }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select connector..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {catalogueItems?.map(item => (
                                                        <SelectItem key={item.id} value={item.id}>
                                                            <div className="flex items-center gap-2">
                                                                {item.image_url && <img src={item.image_url} className="w-6 h-6 object-contain" />}
                                                                <span>{item.type} - {item.colour} ({item.pins} pins)</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {/* Preview selected item */}
                                    {(() => {
                                        const selectedId = control._formValues.connectors?.[index]?.catalogue_id;
                                        const item = catalogueItems?.find(i => i.id === selectedId);
                                        if (item && item.image_url) {
                                            return <img src={item.image_url} className="w-16 h-16 object-contain mt-2 border bg-white rounded" />;
                                        }
                                    })()}
                                </div>
                                <div className="w-full md:w-24">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Qty</label>
                                    <Input 
                                        type="number" 
                                        {...register(`connectors.${index}.quantity`, { valueAsNumber: true, min: 1 })} 
                                        className="bg-white" 
                                    />
                                </div>
                                <div className="flex-1 w-full md:w-auto">
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">Notes (Optional)</label>
                                    <Input 
                                        {...register(`connectors.${index}.notes`)} 
                                        placeholder="e.g. Specific coding" 
                                        className="bg-white" 
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-gray-400 hover:text-red-500 mt-6"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Zap className="w-5 h-5" /> {t('required_photos')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                         {['image_connector_front', 'image_lever_side', 'image_ecu_part_number', 'image_ecu_front', 'image_extra_1', 'image_extra_2'].map(fieldName => (
                             <Controller
                                 key={fieldName}
                                 name={fieldName}
                                 control={control}
                                 render={({ field }) => (
                                     <FileUpload 
                                         label={t(fieldName.replace('image_', '').replace('_', '_')) || fieldName.split('_').slice(1).join(' ')} 
                                         value={field.value} 
                                         onChange={field.onChange} 
                                         required={['image_extra_1', 'image_extra_2'].indexOf(fieldName) === -1}
                                     />
                                 )}
                             />
                         ))}
                    </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Settings className="w-5 h-5" /> {t('tech_docs')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="file_electrical_scheme"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={t('elec_scheme')} value={field.value} onChange={field.onChange} accept=".pdf,.png,.jpg" />
                            )}
                        />
                        <Controller
                            name="file_sensors_actuators"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={t('sensors_list')} value={field.value} onChange={field.onChange} accept=".pdf,.csv,.xlsx" />
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[#00C600] hover:bg-[#00b300] text-white">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Vehicle Request"}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}