import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Download, Loader2 } from 'lucide-react';
import CompanyForm from '../components/onboarding/CompanyForm';
import PrintableReport from '../components/onboarding/PrintableReport';
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from '../components/LanguageContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from "sonner";

export default function Onboarding() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isZipping, setIsZipping] = useState(false);

  // Fetch Current User
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch Company Profile based on User's Company ID
  const { data: companyProfileList, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['companyProfile', user?.company_id],
    queryFn: async () => {
        // Strict: If no company_id, DO NOT fetch anything. Form must be blank.
        if (!user?.company_id) return [];
        return base44.entities.CompanyProfile.list({ id: user.company_id });
    },
    enabled: !!user?.company_id, // Only fetch if ID exists
  });
  const companyProfile = companyProfileList?.[0];

  // Fetch Vehicle Profiles for export
  const { data: carProfiles } = useQuery({
    queryKey: ['vehicles'], 
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadZip = async () => {
    if (!carProfiles || carProfiles.length === 0) {
        toast.error(t('no_vehicles'));
        return;
    }

    setIsZipping(true);
    const zip = new JSZip();

    try {
        // Add company info if available
        if (companyProfile) {
            const companyInfo = `
Company Name: ${companyProfile.company_name}
Tax ID: ${companyProfile.tax_id || 'N/A'}
Address: ${companyProfile.address || 'N/A'}
Email: ${companyProfile.contact_email || 'N/A'}
Phone: ${companyProfile.phone || 'N/A'}
            `.trim();
            zip.file("company_info.txt", companyInfo);
        }

        // Process each car
        const carsFolder = zip.folder("fleet");
        
        for (const car of carProfiles) {
            const carFolderName = `${car.brand}_${car.model}_${car.id.slice(-4)}`.replace(/[^a-z0-9]/gi, '_');
            const carFolder = carsFolder.folder(carFolderName);

            // Fetch connectors for this car to include in details
            const connectors = await base44.entities.VehicleConnector.list({ vehicle_id: car.id });
            const connectorDetails = connectors.map(c => `- Qty ${c.quantity}: ${c.notes || 'No notes'} (ID: ${c.catalogue_id})`).join('\n');

            // Car details text file
            const carDetails = `
Brand: ${car.brand}
Model: ${car.model}
Engine: ${car.engine_model || 'N/A'}
Transmission: ${car.transmission_type || 'N/A'}
Brakes: ${car.brakes_type || 'N/A'}

Requested Connectors:
${connectorDetails}
            `.trim();
            carFolder.file("details.txt", carDetails);

            // Helper to fetch and add file to zip
            const addFileToZip = async (url, filename) => {
                if (!url) return;
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    carFolder.file(filename, blob);
                } catch (e) {
                    console.error(`Failed to download ${filename}`, e);
                }
            };

            // Add photos
            await Promise.all([
                addFileToZip(car.image_connector_front, "connector_front.jpg"),
                addFileToZip(car.image_lever_side, "lever_side.jpg"),
                addFileToZip(car.image_ecu_part_number, "ecu_part_number.jpg"),
                addFileToZip(car.image_ecu_front, "ecu_front.jpg"),
                addFileToZip(car.image_extra_1, "extra_1.jpg"),
                addFileToZip(car.image_extra_2, "extra_2.jpg"),
                addFileToZip(car.file_electrical_scheme, `electrical_scheme${car.file_electrical_scheme?.split('.').pop().match(/^[a-z0-9]+$/i) ? '.' + car.file_electrical_scheme.split('.').pop() : '.pdf'}`),
                addFileToZip(car.file_sensors_actuators, `sensors_actuators${car.file_sensors_actuators?.split('.').pop().match(/^[a-z0-9]+$/i) ? '.' + car.file_sensors_actuators.split('.').pop() : '.pdf'}`)
            ]);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `onboarding_export_${new Date().toISOString().split('T')[0]}.zip`);
        toast.success(t('zip_ready'));

    } catch (error) {
        console.error("ZIP creation failed", error);
        toast.error(t('download_error'));
    } finally {
        setIsZipping(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Printable Report (Hidden by default, visible on print) */}
      <PrintableReport companyProfile={companyProfile} carProfiles={carProfiles} />

      {/* Main App Content (Hidden on print) */}
      <div className="print:hidden space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {companyProfile ? "Company Profile" : "Create Your Company Profile"}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {companyProfile ? "Manage your company details and settings." : "Please complete your company profile to continue."}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" /> Export Report
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadZip}
                        disabled={isZipping}
                        className="gap-2"
                    >
                        {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isZipping ? t('preparing_zip') : t('download_zip')}
                    </Button>
                </div>
            </div>
          </div>

        {/* Progress Indicator for New Users */}
        {!companyProfile && (
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-[#00C600] font-semibold">
                    <div className="w-8 h-8 rounded-full bg-[#00C600] text-white flex items-center justify-center">1</div>
                    <span>Company Profile</span>
                </div>
                <div className="h-px bg-gray-200 w-16" />
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">2</div>
                    <span>Add Your First Vehicle</span>
                </div>
            </div>
        )}

        {/* Company Form Container */}
        <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-lg p-6">
            {isLoadingCompany ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <CompanyForm 
                    initialData={companyProfile} 
                    onComplete={(newCompanyId) => {
                        queryClient.invalidateQueries(['companyProfile']);
                        queryClient.invalidateQueries(['me']);
                        if (!companyProfile && newCompanyId) {
                            // First time creation -> Redirect to Vehicle Creation for the next step
                            window.location.href = '/VehicleCreate';
                        }
                    }} 
                />
            )}
        </Card>
      </div>
    </div>
  );
}