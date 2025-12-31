import React, { useState } from 'react';
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Plus, Car, Settings, Zap, ArrowLeft, Trash2, Package } from 'lucide-react';
import FileUpload from './FileUpload';
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useLanguage } from '../LanguageContext';

export default function CarForm({ onCancel, onSuccess, initialData }) {
  const { t } = useLanguage();
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initialData || {
        transmission_type: "Automatic"
    }
  });

  const { data: catalogueItems } = useQuery({
      queryKey: ['catalogue'],
      queryFn: () => base44.entities.Catalogue.list(),
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
                <CardTitle className="text-2xl font-bold">{t('car_profile')}</CardTitle>
                <CardDescription>{t('car_desc')}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onCancel} size="sm" className="text-gray-500">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
            </Button>
        </CardHeader>
        <CardContent className="px-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Car Details Section */}
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
                            <Input {...register("version", { required: "Version is required" })} placeholder="e.g. SE, LE, XLE" className={InputStyle} />
                            {errors.version && <span className="text-xs text-red-500">{errors.version.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Year <span className="text-[#00C600]">*</span></label>
                            <Input 
                                type="number" 
                                {...register("year", { 
                                    required: "Year is required",
                                    valueAsNumber: true,
                                    min: { value: 1900, message: "Invalid year" },
                                    max: { value: new Date().getFullYear() + 1, message: "Invalid year" }
                                })} 
                                placeholder="e.g. 2023" 
                                className={InputStyle} 
                            />
                            {errors.year && <span className="text-xs text-red-500">{errors.year.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">VIN <span className="text-[#00C600]">*</span></label>
                            <Input {...register("vin", { required: "VIN is required" })} placeholder="Vehicle Identification Number" className={InputStyle} />
                            {errors.vin && <span className="text-xs text-red-500">{errors.vin.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fuel Type <span className="text-[#00C600]">*</span></label>
                            <Controller
                                name="fuel"
                                control={control}
                                rules={{ required: "Fuel type is required" }}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className={InputStyle}>
                                            <SelectValue placeholder="Select fuel type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Petrol">Petrol</SelectItem>
                                            <SelectItem value="Diesel">Diesel</SelectItem>
                                            <SelectItem value="Electric">Electric</SelectItem>
                                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.fuel && <span className="text-xs text-red-500">{errors.fuel.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Size <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_size", { required: "Engine size is required" })} placeholder="e.g. 2.0L" className={InputStyle} />
                            {errors.engine_size && <span className="text-xs text-red-500">{errors.engine_size.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Power <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_power", { required: "Engine power is required" })} placeholder="e.g. 150HP" className={InputStyle} />
                            {errors.engine_power && <span className="text-xs text-red-500">{errors.engine_power.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Engine Code <span className="text-[#00C600]">*</span></label>
                            <Input {...register("engine_code", { required: "Engine code is required" })} placeholder="e.g. CDNC" className={InputStyle} />
                            {errors.engine_code && <span className="text-xs text-red-500">{errors.engine_code.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('transmission')} <span className="text-[#00C600]">*</span></label>
                            <Controller
                                name="transmission_type"
                                control={control}
                                rules={{ required: "Transmission is required" }}
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
                            {errors.transmission_type && <span className="text-xs text-red-500">{errors.transmission_type.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Number of Gears <span className="text-[#00C600]">*</span></label>
                            <Input 
                                type="number"
                                {...register("number_gears", { required: "Number of gears is required", valueAsNumber: true, min: 1 })} 
                                placeholder="e.g. 6" 
                                className={InputStyle} 
                            />
                            {errors.number_gears && <span className="text-xs text-red-500">{errors.number_gears.message}</span>}
                        </div>
                    </div>
                </div>

                {/* Catalogue Selection */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Package className="w-5 h-5" /> Catalogue Part
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Select Part</label>
                             <Controller
                                name="catalogue_id"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className={InputStyle}>
                                            <SelectValue placeholder="Select a part..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {catalogueItems?.map(item => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.type} - {item.colour} ({item.pins} pins)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Images Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Zap className="w-5 h-5" /> {t('required_photos')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {t('photos_desc')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Controller
                            name="image_connector_front"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={t('conn_front')} value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_lever_side"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={t('lever_side')} value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_ecu_part_number"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={t('ecu_part')} value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_ecu_front"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={t('ecu_front')} value={field.value} onChange={field.onChange} required />
                            )}
                        />
                        <Controller
                            name="image_extra_1"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={`${t('extra_photo')} 1`} value={field.value} onChange={field.onChange} />
                            )}
                        />
                        <Controller
                            name="image_extra_2"
                            control={control}
                            render={({ field }) => (
                                <FileUpload label={`${t('extra_photo')} 2`} value={field.value} onChange={field.onChange} />
                            )}
                        />
                    </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-[#00C600]">
                        <Settings className="w-5 h-5" /> {t('tech_docs')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="file_electrical_scheme"
                            control={control}
                            render={({ field }) => (
                                <FileUpload 
                                    label={t('elec_scheme')} 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    helperText={t('elec_desc')}
                                />
                            )}
                        />
                        <Controller
                            name="file_sensors_actuators"
                            control={control}
                            render={({ field }) => (
                                <FileUpload 
                                    label={t('sensors_list')} 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                    accept=".pdf,.csv,.xlsx,.png,.jpg"
                                    helperText={t('sensors_desc')}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        {t('cancel')}
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-[#00C600] hover:bg-[#00b300] text-white min-w-[140px]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save_car')}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}