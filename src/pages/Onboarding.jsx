import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, PlayCircle, Car, Building2, MonitorPlay, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import CompanyForm from '../components/onboarding/CompanyForm';
import CarForm from '../components/onboarding/CarForm';
import { Skeleton } from "@/components/ui/skeleton";

export default function Onboarding() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("welcome");
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  // Fetch Company Profile
  const { data: companyProfileList, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: () => base44.entities.CompanyProfile.list({}, { limit: 1 }),
  });
  const companyProfile = companyProfileList?.[0];

  // Fetch Car Profiles
  const { data: carProfiles, isLoading: isLoadingCars } = useQuery({
    queryKey: ['carProfiles'],
    queryFn: () => base44.entities.CarProfile.list(),
  });

  const handleDeleteCar = async (id) => {
    if (window.confirm("Are you sure you want to delete this car profile?")) {
        await base44.entities.CarProfile.delete(id);
        queryClient.invalidateQueries(['carProfiles']);
    }
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setIsAddingCar(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Onboarding</h1>
            <p className="text-muted-foreground mt-1">Complete your profile and set up your fleet.</p>
        </div>
        {companyProfile && (
            <div className="flex items-center gap-2 text-sm bg-[#00C600]/10 text-[#00C600] px-3 py-1 rounded-full border border-[#00C600]/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>{companyProfile.company_name} Connected</span>
            </div>
        )}
      </div>

      <Tabs defaultValue="welcome" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-white dark:bg-[#2a2a2a]">
          <TabsTrigger value="welcome" className="data-[state=active]:bg-[#00C600] data-[state=active]:text-white">
            <MonitorPlay className="w-4 h-4 mr-2" /> Welcome
          </TabsTrigger>
          <TabsTrigger value="company" className="data-[state=active]:bg-[#00C600] data-[state=active]:text-white">
            <Building2 className="w-4 h-4 mr-2" /> Company
          </TabsTrigger>
          <TabsTrigger value="fleet" className="data-[state=active]:bg-[#00C600] data-[state=active]:text-white">
            <Car className="w-4 h-4 mr-2" /> Fleet
          </TabsTrigger>
        </TabsList>

        {/* WELCOME TAB */}
        <TabsContent value="welcome" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-[#2a2a2a]">
                    <div className="aspect-video bg-black relative group cursor-pointer">
                        <img 
                            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop" 
                            alt="Demo Video Thumbnail" 
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute bottom-4 left-4">
                            <span className="bg-[#00C600] text-white text-xs px-2 py-1 rounded">DEMO</span>
                        </div>
                    </div>
                    <CardHeader>
                        <CardTitle>Platform Overview</CardTitle>
                        <CardDescription>Watch how our solution integrates with your workflow.</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-[#2a2a2a]">
                    <div className="aspect-video bg-black relative group cursor-pointer">
                        <img 
                            src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1000&auto=format&fit=crop" 
                            alt="Setup Video Thumbnail" 
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute bottom-4 left-4">
                            <span className="bg-[#00C600] text-white text-xs px-2 py-1 rounded">TUTORIAL</span>
                        </div>
                    </div>
                    <CardHeader>
                        <CardTitle>Installation & Setup</CardTitle>
                        <CardDescription>Step-by-step guide to installing the connector.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
            
            <div className="flex justify-end">
                <Button onClick={() => setActiveTab("company")} className="bg-[#00C600] hover:bg-[#00b300] text-white">
                    Get Started <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
            </div>
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
                        onComplete={() => setActiveTab("fleet")} 
                    />
                )}
            </Card>
        </TabsContent>

        {/* FLEET TAB */}
        <TabsContent value="fleet" className="mt-6">
            {isAddingCar ? (
                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-lg">
                    <CarForm 
                        initialData={editingCar}
                        onCancel={() => {
                            setIsAddingCar(false);
                            setEditingCar(null);
                        }} 
                        onSuccess={() => {
                            setIsAddingCar(false);
                            setEditingCar(null);
                            queryClient.invalidateQueries(['carProfiles']);
                        }} 
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Your Vehicles</h2>
                        <Button onClick={() => setIsAddingCar(true)} className="bg-[#00C600] hover:bg-[#00b300] text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add New Vehicle
                        </Button>
                    </div>

                    {isLoadingCars ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    ) : carProfiles?.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-transparent">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-[#333] rounded-full flex items-center justify-center mb-4">
                                    <Car className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No vehicles added yet</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm">
                                    Create a profile for each car to manage specific configurations and documents.
                                </p>
                                <Button onClick={() => setIsAddingCar(true)} variant="outline" className="border-[#00C600] text-[#00C600] hover:bg-[#00C600] hover:text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Add Your First Car
                                </Button>
                            </CardContent>
                        </Card>
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
                                            <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 text-black hover:bg-white" onClick={() => handleEditCar(car)}>
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
                                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {car.transmission_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-[#00C600]" />
                                                Docs
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-[#00C600]" />
                                                Photos
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}