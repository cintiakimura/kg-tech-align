import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, PlayCircle, Car, Building2, MonitorPlay, Trash2, Edit2, CheckCircle2, AlertCircle, Printer, Settings, Save, X, Download, Loader2 } from 'lucide-react';
import CompanyForm from '../components/onboarding/CompanyForm';
import VehicleForm from '../components/onboarding/VehicleForm';
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

  // Fetch Client Quotes
  const { data: myQuotes, refetch: refetchQuotes } = useQuery({
      queryKey: ['myClientQuotes'],
      queryFn: async () => {
          const user = await base44.auth.me();
          if (!user?.email) return [];
          return base44.entities.ClientQuote.list({ 
              client_email: user.email,
              status: { $in: ['sent', 'accepted', 'rejected', 'invoiced'] } 
          });
      }
  });

  const updateQuoteStatus = useMutation({
      mutationFn: async ({ id, status, vehicle_id }) => {
          await base44.entities.ClientQuote.update(id, { status });
          if (status === 'accepted' && vehicle_id) {
              // Trigger production
              await base44.entities.Vehicle.update(vehicle_id, { status: 'ordered' });
          }
      },
      onSuccess: () => {
          toast.success("Quote accepted! Production triggered.");
          refetchQuotes();
      },
      onError: (e) => {
          console.error(e);
          toast.error("Failed to update quote status");
      }
  });

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
                <h1 className="text-3xl font-bold tracking-tight">{t('onboarding_title')}</h1>
                <p className="text-muted-foreground mt-1">{t('onboarding_desc')}</p>
            </div>
            <div className="flex items-center gap-3">
                {companyProfile && (
                    <div 
                        onClick={() => setActiveTab('quotes')}
                        className="cursor-pointer flex items-center gap-2 text-sm bg-[#00C600]/10 text-[#00C600] px-3 py-1 rounded-full border border-[#00C600]/20 hover:bg-[#00C600]/20 transition-colors"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>My Quotations</span>
                    </div>
                )}
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

          <Tabs defaultValue="fleet" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px] bg-white dark:bg-[#2a2a2a]">
          <TabsTrigger value="company" className="data-[state=active]:bg-[#00C600] data-[state=active]:text-white">
            <Building2 className="w-4 h-4 mr-2" /> {t('tab_company')}
          </TabsTrigger>
          <TabsTrigger value="fleet" className="data-[state=active]:bg-[#00C600] data-[state=active]:text-white">
            <Car className="w-4 h-4 mr-2" /> {t('add_vehicle')}
          </TabsTrigger>
          <TabsTrigger value="quotes" className="data-[state=active]:bg-[#00C600] data-[state=active]:text-white">
            <Printer className="w-4 h-4 mr-2" /> My Quotations
          </TabsTrigger>
        </TabsList>



        {/* QUOTES TAB */}
        <TabsContent value="quotes" className="mt-6">
            <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-lg">
                <CardHeader>
                    <CardTitle>My Quotations</CardTitle>
                    <CardDescription>Review and approve quotes sent by KG Protech.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {myQuotes?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                No active quotations found.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {myQuotes?.map(quote => (
                                    <div key={quote.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-black/20">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{quote.quote_number}</h3>
                                                {quote.status === 'accepted' && <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Approved</Badge>}
                                                {quote.status === 'rejected' && <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Denied</Badge>}
                                                {quote.status === 'sent' && <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Pending Review</Badge>}
                                                {quote.status === 'invoiced' && <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Invoiced</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Date: {new Date(quote.date).toLocaleDateString()} • Valid Until: {new Date(quote.valid_until).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm">
                                                Total: <span className="font-bold text-lg">€{quote.items?.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0).toFixed(2)}</span>
                                                <span className="text-xs text-muted-foreground ml-1">(Excl. VAT)</span>
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="gap-2">
                                                        <Printer className="w-4 h-4" /> View & Print
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Quotation Details</DialogTitle>
                                                        <CardDescription>Quote #{quote.quote_number}</CardDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-4" id="printable-quote">
                                                        <div className="flex justify-between border-b pb-4">
                                                            <div>
                                                                <h3 className="font-bold text-lg">KG PROTECH SAS</h3>
                                                                <p className="text-sm text-muted-foreground">Supplier</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <h3 className="font-bold">Date</h3>
                                                                <p>{new Date(quote.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b">
                                                                    <th className="text-left py-2">Description</th>
                                                                    <th className="text-right py-2">Qty</th>
                                                                    <th className="text-right py-2">Unit Price</th>
                                                                    <th className="text-right py-2">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {quote.items?.map((item, idx) => (
                                                                    <tr key={idx} className="border-b">
                                                                        <td className="py-2">{item.description}</td>
                                                                        <td className="text-right py-2">{item.quantity}</td>
                                                                        <td className="text-right py-2">€{item.unit_price.toFixed(2)}</td>
                                                                        <td className="text-right py-2">€{(item.quantity * item.unit_price).toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        <div className="flex justify-end pt-4">
                                                            <div className="text-right space-y-1">
                                                                <div className="flex justify-between gap-8">
                                                                    <span>Subtotal:</span>
                                                                    <span>€{quote.items?.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-8 font-bold text-lg">
                                                                    <span>Total:</span>
                                                                    <span>€{quote.items?.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter className="gap-2">
                                                        <Button onClick={() => {
                                                            const printContent = document.getElementById('printable-quote').innerHTML;
                                                            const win = window.open('', '', 'height=700,width=700');
                                                            win.document.write('<html><head><title>Print Quote</title>');
                                                            win.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
                                                            win.document.write('</head><body class="p-8">');
                                                            win.document.write(printContent);
                                                            win.document.write('</body></html>');
                                                            win.document.close();
                                                            win.print();
                                                        }} variant="outline">
                                                            <Printer className="w-4 h-4 mr-2" /> Print
                                                        </Button>
                                                        {quote.status === 'sent' && (
                                                            <>
                                                                <Button 
                                                                    variant="destructive"
                                                                    onClick={() => updateQuoteStatus.mutate({ id: quote.id, status: 'rejected' })}
                                                                >
                                                                    Deny
                                                                </Button>
                                                                <Button 
                                                                    className="bg-[#00C600] hover:bg-[#00b300]"
                                                                    onClick={() => updateQuoteStatus.mutate({ id: quote.id, status: 'accepted', vehicle_id: quote.vehicle_id })}
                                                                >
                                                                    Approve & Order
                                                                </Button>
                                                            </>
                                                        )}
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* COMPANY TAB */}
        <TabsContent value="company" className="mt-6">
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
                        onComplete={() => {
                            queryClient.invalidateQueries(['companyProfile']);
                            setActiveTab("fleet");
                            toast.success("Company profile saved!");
                        }} 
                    />
                )}
            </Card>
        </TabsContent>

        {/* FLEET TAB */}
        <TabsContent value="fleet" className="mt-6">
            <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-lg">
                <VehicleForm 
                    initialData={editingCar}
                    onCancel={() => {
                        setEditingCar(null);
                        // If we are always showing the form, cancel might just clear the edit state to "new" mode
                        // or we might want to navigate elsewhere. For now, let's keep it resetting to "add new".
                        setEditingCar(null); 
                    }} 
                    onSuccess={() => {
                        setEditingCar(null);
                        queryClient.invalidateQueries(['vehicles']);
                        toast.success("Vehicle saved!");
                    }} 
                />
            </div>
            
            {/* List of existing vehicles below the form */}
            <div className="mt-12 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">My Fleet</h2>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            setEditingCar(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setIsAddingCar(true);
                        }}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Another Vehicle
                    </Button>
                </div>
                {isLoadingCars ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {carProfiles?.map((car) => (
                            <Card key={car.id} className="overflow-hidden bg-white dark:bg-[#2a2a2a] border-none shadow-md hover:shadow-xl transition-all group">
                                <div className="aspect-[4/3] relative bg-gray-100 dark:bg-black">
                                    {car.image_connector_front ? (
                                        <img 
                                            src={car.image_connector_front} 
                                            alt={car.model} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Car className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 text-black hover:bg-white" onClick={() => {
                                            setEditingCar(car);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteCar(car.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg">{car.brand} {car.model}</h3>
                                            <p className="text-sm text-muted-foreground">{car.engine_model || 'No engine info'}</p>
                                        </div>
                                        <Badge variant="secondary" className="font-mono">
                                            {car.transmission_type}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-[#00C600]" />
                                            {t('docs')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-[#00C600]" />
                                            {t('photos')}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}