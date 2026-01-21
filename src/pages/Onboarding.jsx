import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, PlayCircle, Car, Building2, MonitorPlay, Trash2, Edit2, CheckCircle2, AlertCircle, Printer, Settings, Save, X, Download, Loader2 } from 'lucide-react';
import CompanyForm from '../components/onboarding/CompanyForm';
import FleetManager from '../components/onboarding/fleet/FleetManager';
import PrintableReport from '../components/onboarding/PrintableReport';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '../components/LanguageContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from "sonner";

export default function Onboarding() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [isZipping, setIsZipping] = useState(false);



  // Fetch Company Profile
  const { data: companyProfileList, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: () => base44.entities.CompanyProfile.list(undefined, 1),
  });
  const companyProfile = companyProfileList?.[0];

  // Fetch Vehicle Profiles
  const { data: carProfiles, isLoading: isLoadingCars } = useQuery({
    queryKey: ['vehicles'], // Updated query key
    queryFn: () => base44.entities.Vehicle.list(),
  });



  // If user already has a company, this page acts as the "Edit" page
  // If user does NOT have a company, this is the "Create" page
  // Logic handled by CompanyForm passing initialData or not

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
                // Add docs - try to keep original extension or default to pdf/jpg based on url if possible, 
                // but for simplicity we'll just download the blob. 
                // To get correct extension we might need to parse URL or content-type, 
                // but let's assume they are identifiable files or just save with generic name if unknown.
                // Actually, let's try to guess extension from URL
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

  const handleDeleteCar = async (id) => {
    if (window.confirm(t('delete_car_confirmation'))) {
        await base44.entities.Vehicle.delete(id);
        queryClient.invalidateQueries(['vehicles']);
    }
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setIsAddingCar(true);
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
                            // First time creation -> Redirect to Garage
                            window.location.href = '/Garage';
                        }
                    }} 
                />
            )}
        </Card>
      </div>
    </div>
  );
}