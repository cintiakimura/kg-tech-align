import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ArrowLeft, 
    Building2, 
    Car, 
    FileText, 
    Mail, 
    Phone, 
    MapPin, 
    CreditCard, 
    Calendar,
    Download,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function ClientDetails() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email');

    // Fetch Company Profile for this user
    const { data: companies, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['company', email],
        queryFn: () => base44.entities.CompanyProfile.list(),
        select: (data) => data.filter(c => c.created_by === email),
        enabled: !!email
    });

    // Fetch Fleet for this user
    const { data: cars, isLoading: isLoadingCars } = useQuery({
        queryKey: ['cars', email],
        queryFn: () => base44.entities.CarProfile.list(),
        select: (data) => data.filter(c => c.created_by === email),
        enabled: !!email
    });

    const company = companies?.[0];
    const fleet = cars || [];

    // Aggregate all documents
    const documents = useMemo(() => {
        const docs = [];
        
        // Add car documents
        fleet.forEach(car => {
            if (car.file_electrical_scheme) {
                docs.push({
                    id: `elec_${car.id}`,
                    name: `Electrical Scheme - ${car.brand} ${car.model}`,
                    type: 'Scheme',
                    date: car.updated_date,
                    url: car.file_electrical_scheme,
                    source: 'Car Profile'
                });
            }
            if (car.file_sensors_actuators) {
                docs.push({
                    id: `sens_${car.id}`,
                    name: `Sensors & Actuators - ${car.brand} ${car.model}`,
                    type: 'List',
                    date: car.updated_date,
                    url: car.file_sensors_actuators,
                    source: 'Car Profile'
                });
            }
        });
        
        return docs;
    }, [fleet]);

    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <p className="text-muted-foreground">No client specified.</p>
                <Button onClick={() => navigate('/ManagerDashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    if (isLoadingCompany || isLoadingCars) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {company?.company_name || 'Unknown Company'}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Mail className="w-3 h-3" /> {email}
                        </div>
                    </div>
                </div>
                {company && (
                    <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200 px-3 py-1">
                        Active Account
                    </Badge>
                )}
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="fleet">Fleet ({fleet.length})</TabsTrigger>
                    <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Building2 className="w-5 h-5 text-indigo-500" /> Company Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {company ? (
                                    <>
                                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                            <span className="text-muted-foreground font-medium">Company Name</span>
                                            <span>{company.company_name}</span>
                                        </div>
                                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                            <span className="text-muted-foreground font-medium">Tax / VAT ID</span>
                                            <span>{company.tax_id || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                            <span className="text-muted-foreground font-medium">Address</span>
                                            <span>{company.address || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                            <span className="text-muted-foreground font-medium">Contact Email</span>
                                            <span>{company.contact_email || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                            <span className="text-muted-foreground font-medium">Phone</span>
                                            <span>{company.phone || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                                            <span className="text-muted-foreground font-medium">Last Update</span>
                                            <span>{company.updated_date ? format(new Date(company.updated_date), 'PPP') : '-'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <Building2 className="w-10 h-10 mb-2 opacity-20" />
                                        <p>No company profile created.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stats / Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CreditCard className="w-5 h-5 text-green-500" /> Account Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg text-center">
                                    <span className="block text-3xl font-bold text-indigo-600 dark:text-indigo-400">{fleet.length}</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Vehicles</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg text-center">
                                    <span className="block text-3xl font-bold text-green-600 dark:text-green-400">{documents.length}</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Documents</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* FLEET TAB */}
                <TabsContent value="fleet">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Car className="w-5 h-5" /> Vehicle Fleet
                            </CardTitle>
                            <CardDescription>List of all vehicles registered by this client.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {fleet.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {fleet.map(car => (
                                        <div key={car.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-[#1e1e1e]">
                                            {/* Car Image Preview */}
                                            <div className="h-40 bg-gray-100 dark:bg-gray-800 w-full relative">
                                                {car.image_connector_front ? (
                                                    <img src={car.image_connector_front} alt={car.model} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400">
                                                        <Car className="w-10 h-10" />
                                                    </div>
                                                )}
                                                <Badge className="absolute top-2 right-2 bg-white/90 text-black hover:bg-white">
                                                    {car.transmission_type}
                                                </Badge>
                                            </div>
                                            
                                            <div className="p-4 space-y-3">
                                                <div>
                                                    <h3 className="font-bold text-lg">{car.brand} {car.model}</h3>
                                                    <p className="text-xs text-muted-foreground">{car.engine_model}</p>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-gray-50 dark:bg-white/5 p-2 rounded">
                                                        <span className="block text-muted-foreground">Brakes</span>
                                                        <span className="font-medium">{car.brakes_type || 'N/A'}</span>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-white/5 p-2 rounded">
                                                        <span className="block text-muted-foreground">Created</span>
                                                        <span className="font-medium">{format(new Date(car.created_date), 'MMM d, yyyy')}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-2 flex gap-2">
                                                    {/* We could add edit/delete here for admin if needed */}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No vehicles in fleet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DOCUMENTS TAB */}
                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Document Repository
                            </CardTitle>
                            <CardDescription>All technical documents and schemes uploaded for this client's fleet.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {documents.length > 0 ? (
                                <div className="rounded-md border">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-white/5 border-b">
                                            <tr>
                                                <th className="px-4 py-3 font-medium text-muted-foreground">Document Name</th>
                                                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                                                <th className="px-4 py-3 font-medium text-muted-foreground">Source</th>
                                                <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                                                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {documents.map(doc => (
                                                <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                        {doc.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="secondary" className="text-xs font-normal">
                                                            {doc.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{doc.source}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {doc.date ? format(new Date(doc.date), 'MMM d, yyyy') : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-blue-600 hover:text-blue-700">
                                                                <Download className="w-3 h-3" /> Download
                                                            </Button>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No documents found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}