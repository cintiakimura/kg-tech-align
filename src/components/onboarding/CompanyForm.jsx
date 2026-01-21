import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, Building2, Mail, Phone, MapPin, FileText, User, Briefcase, Truck, CreditCard, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from './FileUpload';

export default function CompanyForm({ onComplete, initialData }) {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: initialData || {
        company_name: "",
        payment_terms: "Prepaid",
        logo_url: ""
    }
  });

  // If initialData loads later
  useEffect(() => {
    if (initialData) {
        // If first/last names are missing but full name exists, try to split it for display
        if (!initialData.contact_person_first_name && initialData.contact_person_name) {
            const parts = initialData.contact_person_name.split(' ');
            const last = parts.pop();
            const first = parts.join(' ');
            reset({
                ...initialData,
                contact_person_first_name: first,
                contact_person_last_name: last
            });
        } else {
            reset(initialData);
        }
    }
  }, [initialData, reset]);

  const onSubmit = async (data) => {
      // Compute composite fields
      const computedData = {
          ...data,
          contact_person_name: `${data.contact_person_first_name || ''} ${data.contact_person_last_name || ''}`.trim()
      };

      // Strip system fields that cannot be updated
      const { id, created_date, updated_date, created_by, updated_by, audit_log, ...cleanData } = computedData;

      if (initialData?.id) {
           await base44.entities.CompanyProfile.update(initialData.id, cleanData);
           toast.success("Profile updated successfully");
           if (onComplete) onComplete(initialData.id);
      } else {
           // Create new Company
           const random6 = Math.floor(100000 + Math.random() * 900000);
           const clientNumber = `KGCL-${random6}`;
           
           const newCompany = await base44.entities.CompanyProfile.create({ 
               ...cleanData, 
               client_number: clientNumber 
           });
           
           // Link user to company immediately
           await base44.auth.updateMe({ company_id: newCompany.id });
           
           toast.success(`Company profile created successfully!`);
           
           // Redirect to Garage immediately for new users
           if (onComplete) onComplete(newCompany.id);
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
                            <Building2 className="w-4 h-4 text-[#00C600]" /> {t('company_name')} <span className="text-red-500">*</span>
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
                            <ImageIcon className="w-4 h-4 text-[#00C600]" /> Company Logo
                        </label>
                        <div className="mt-1">
                             <FileUpload 
                                label="Upload Logo"
                                onUploadComplete={(url) => {
                                    const event = { target: { name: 'logo_url', value: url } };
                                    register('logo_url').onChange(event);
                                }}
                                accept="image/*"
                             />
                        </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#00C600]" /> Payment Terms
                        </label>
                        <Select onValueChange={(val) => {
                            const event = { target: { name: 'payment_terms', value: val } };
                            register('payment_terms').onChange(event);
                        }} defaultValue={initialData?.payment_terms || "Prepaid"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Prepaid">Prepaid</SelectItem>
                                <SelectItem value="Net 30">Net 30</SelectItem>
                                <SelectItem value="Net 60">Net 60</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {initialData?.client_number && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#00C600]" /> Client Number
                            </label>
                            <div className="flex gap-2">
                                <Input 
                                    value={initialData.client_number} 
                                    readOnly 
                                    className="bg-gray-100 dark:bg-gray-800 font-mono font-bold"
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(initialData.client_number);
                                        toast.success("Copied to clipboard");
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>
                    )}

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

                    <div className="space-y-4 md:col-span-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#00C600]" /> {t('delivery_address')}
                        </label>
                        <Input 
                            {...register("delivery_address")} 
                            placeholder="Street Address"
                            className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                {...register("delivery_country")} 
                                placeholder="Country"
                                className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                            />
                            <Input 
                                {...register("delivery_province")} 
                                placeholder="Province / State"
                                className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                            />
                        </div>
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
                                    <User className="w-4 h-4 text-[#00C600]" /> First Name
                                </label>
                                <Input 
                                    {...register("contact_person_first_name")} 
                                    placeholder="First Name"
                                    className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-gray-700 focus:ring-[#00C600] focus:border-[#00C600]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#00C600]" /> Last Name
                                </label>
                                <Input 
                                    {...register("contact_person_last_name")} 
                                    placeholder="Last Name"
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
                        className="bg-[#00C600] hover:bg-[#00b300] text-white min-w-[200px] h-12 text-lg font-semibold shadow-lg shadow-[#00C600]/20"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData?.id ? "Save Changes" : "Save & Continue to Garage")}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}