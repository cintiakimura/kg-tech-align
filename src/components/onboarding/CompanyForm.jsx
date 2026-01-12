import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, Building2, Mail, Phone, MapPin, FileText, User, Briefcase, Truck } from 'lucide-react';
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../LanguageContext';

export default function CompanyForm({ onComplete, initialData }) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: initialData || {}
  });

  // If initialData loads later
  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const onSubmit = async (data) => {
    try {
        // Check if exists to update, or create new
        // For simplicity in this flow, we'll create or assume update if passed
        if (initialData?.id) {
             await base44.entities.CompanyProfile.update(initialData.id, data);
        } else {
             const clientNumber = `CL-${Date.now().toString().slice(-5)}`;
             await base44.entities.CompanyProfile.create({ ...data, client_number: clientNumber });
        }
        if (onComplete) onComplete();
    } catch (error) {
        console.error("Failed to save company info", error);
        toast.error("Failed to save company info. Please try again.");
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-bold">{t('company_info')}</CardTitle>
            <CardDescription>{t('company_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#00C600]" /> {t('company_name')}
                        </label>
                        <Input 
                            {...register("company_name", { required: "Company name is required" })} 
                            placeholder="e.g. KG Mobility Solutions"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                        {errors.company_name && <span className="text-xs text-red-500">{errors.company_name.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#00C600]" /> {t('tax_id')}
                        </label>
                        <Input 
                            {...register("tax_id")} 
                            placeholder="e.g. US-123456789"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#00C600]" /> {t('billing_address')}
                        </label>
                        <Input 
                            {...register("address")} 
                            placeholder="Full street address, city, zip, country"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#00C600]" /> {t('delivery_address')}
                        </label>
                        <Input 
                            {...register("delivery_address")} 
                            placeholder="If different from billing address"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#00C600]" /> {t('contact_email')}
                        </label>
                        <Input 
                            {...register("contact_email", { 
                                pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                            })} 
                            placeholder="billing@company.com"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                        {errors.contact_email && <span className="text-xs text-red-500">{errors.contact_email.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#00C600]" /> {t('phone_number')}
                        </label>
                        <Input 
                            {...register("phone")} 
                            placeholder="+1 (555) 000-0000"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                            <User className="w-5 h-5" /> {t('contact_person')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#00C600]" /> {t('contact_person_name')}
                                </label>
                                <Input 
                                    {...register("contact_person_name")} 
                                    placeholder="Full Name"
                                    className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#00C600]" /> {t('position')}
                                </label>
                                <Input 
                                    {...register("contact_person_position")} 
                                    placeholder="Job Title"
                                    className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#00C600]" /> {t('contact_person_email')}
                                </label>
                                <Input 
                                    {...register("contact_person_email", { 
                                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                                    })} 
                                    placeholder="person@company.com"
                                    className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#00C600]" /> {t('contact_person_phone')}
                                </label>
                                <Input 
                                    {...register("contact_person_phone")} 
                                    placeholder="Direct Phone / Mobile"
                                    className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-[#00C600] hover:bg-[#00b300] text-white min-w-[140px]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save_continue')}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}