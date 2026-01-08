import React, { useMemo, useState } from 'react';
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
    ExternalLink,
    Plus,
    DollarSign,
    Printer,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import FileUpload from '@/components/onboarding/FileUpload';
import VehicleForm from '@/components/onboarding/VehicleForm';


export default function ClientDetails() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get('email');
    const queryClient = useQueryClient();
    const [showAddDocModal, setShowAddDocModal] = useState(false);
    const [newDoc, setNewDoc] = useState({ name: '', type: 'Other', date: new Date().toISOString().split('T')[0], description: '', file_url: '' });

    // Fetch Company Profile for this user
    const { data: companies, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['company', email],
        queryFn: () => base44.entities.CompanyProfile.list(),
        select: (data) => data.filter(c => c.created_by === email),
        enabled: !!email
    });

    // Fetch Fleet for this user
    const { data: cars, isLoading: isLoadingCars } = useQuery({
        queryKey: ['vehicles', email],
        queryFn: () => base44.entities.Vehicle.list(),
        select: (data) => data.filter(c => c.created_by === email || c.client_email === email),
        enabled: !!email
    });

    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);

    const company = companies?.[0];
    const fleet = cars || [];

    // Fetch Quotes for this client
    const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
        queryKey: ['clientQuotes', company?.id],
        enabled: !!company?.id,
        queryFn: () => base44.entities.ClientQuote.list({ client_company_id: company.id })
    });

    // Fetch Manual Documents
    const { data: manualDocs, isLoading: isLoadingDocs } = useQuery({
        queryKey: ['companyDocuments', company?.id],
        enabled: !!company?.id,
        queryFn: () => base44.entities.CompanyDocument.list({ company_id: company.id })
    });

    const createDocMutation = useMutation({
        mutationFn: (data) => base44.entities.CompanyDocument.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['companyDocuments']);
            setShowAddDocModal(false);
            setNewDoc({ name: '', type: 'Other', date: new Date().toISOString().split('T')[0], description: '', file_url: '' });
            toast.success("Document added successfully");
        },
        onError: () => toast.error("Failed to add document")
    });

    const deleteDocMutation = useMutation({
        mutationFn: (id) => base44.entities.CompanyDocument.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['companyDocuments']);
            toast.success("Document deleted");
        }
    });

    // Aggregate all documents
    const documents = useMemo(() => {
        const docs = [];
        
        // Add manual documents
        if (manualDocs) {
            manualDocs.forEach(doc => {
                docs.push({
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    date: doc.date,
                    url: doc.file_url,
                    source: 'Manual Entry',
                    isManual: true,
                    description: doc.description
                });
            });
        }

        // Add car documents
        fleet.forEach(car => {
            if (car.file_electrical_scheme) {
                docs.push({
                    id: `elec_${car.id}`,
                    name: `Electrical Scheme - ${car.brand} ${car.model}`,
                    type: 'Scheme',
                    date: car.updated_date,
                    url: car.file_electrical_scheme,
                    source: 'Vehicle Profile'
                });
            }
            if (car.file_sensors_actuators) {
                docs.push({
                    id: `sens_${car.id}`,
                    name: `Sensors & Actuators - ${car.brand} ${car.model}`,
                    type: 'List',
                    date: car.updated_date,
                    url: car.file_sensors_actuators,
                    source: 'Vehicle Profile'
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
                <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden ml-auto">
                    <Printer className="w-4 h-4 mr-2" /> Print Profile
                </Button>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="fleet">Fleet ({fleet.length})</TabsTrigger>
                    <TabsTrigger value="quotes">Quotes & Sales ({quotes?.length || 0})</TabsTrigger>
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

                {/* QUOTES TAB */}
                <TabsContent value="quotes">
                     <div className="grid gap-4">
                        <div className="flex justify-end">
                            <Link to={`/CreateClientQuote?clientId=${company?.id}`}>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" /> New Quote
                                </Button>
                            </Link>
                        </div>
                        {quotes?.length > 0 ? (
                            quotes.map(quote => (
                                <Card key={quote.id} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                    <Link to={`/CreateClientQuote?id=${quote.id}`}>
                                        <CardHeader className="flex flex-row items-center justify-between py-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {quote.quote_number || 'Draft Quote'}
                                                </CardTitle>
                                                <CardDescription>{moment(quote.date).format('DD MMM YYYY')}</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">
                                                        €{(quote.items?.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0) * (1 + (quote.tva_rate/100))).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {quote.items?.length} items
                                                    </div>
                                                </div>
                                                <Badge variant={quote.status === 'invoiced' ? 'default' : 'secondary'} className="uppercase">
                                                    {quote.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                    </Link>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No quotes found for this client.</p>
                            </div>
                        )}
                     </div>
                </TabsContent>

                {/* FLEET TAB */}
                <TabsContent value="fleet">
                    {isAddingVehicle ? (
                        <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border shadow-sm">
                            <VehicleForm 
                                clientEmail={email}
                                initialData={editingVehicle}
                                onCancel={() => {
                                    setIsAddingVehicle(false);
                                    setEditingVehicle(null);
                                }}
                                onSuccess={() => {
                                    setIsAddingVehicle(false);
                                    setEditingVehicle(null);
                                    queryClient.invalidateQueries(['vehicles', email]);
                                    toast.success("Vehicle saved to fleet");
                                }}
                            />
                        </div>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Car className="w-5 h-5" /> Vehicle Fleet
                                    </CardTitle>
                                    <CardDescription>List of all vehicles registered by this client.</CardDescription>
                                </div>
                                <Button onClick={() => setIsAddingVehicle(true)} className="bg-[#00C600] hover:bg-[#00b300]">
                                    <Plus className="w-4 h-4 mr-2" /> Add Vehicle
                                </Button>
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

                                                <div className="pt-2 flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                                        setEditingVehicle(car);
                                                        setIsAddingVehicle(true);
                                                    }}>
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Document Vault
                                </CardTitle>
                                <CardDescription>All technical documents and manual entries.</CardDescription>
                            </div>
                            <Dialog open={showAddDocModal} onOpenChange={setShowAddDocModal}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-[#00C600] hover:bg-[#00b300]">
                                        <Plus className="w-4 h-4 mr-2" /> Add Document
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Manual Document</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Document Name</Label>
                                            <Input 
                                                value={newDoc.name}
                                                onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                                                placeholder="e.g. Invoice #123"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select 
                                                    value={newDoc.type} 
                                                    onValueChange={(val) => setNewDoc({...newDoc, type: val})}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Invoice">Invoice</SelectItem>
                                                        <SelectItem value="Contract">Contract</SelectItem>
                                                        <SelectItem value="Technical">Technical</SelectItem>
                                                        <SelectItem value="Scheme">Scheme</SelectItem>
                                                        <SelectItem value="List">List</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <Input 
                                                    type="date"
                                                    value={newDoc.date}
                                                    onChange={(e) => setNewDoc({...newDoc, date: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description / Notes</Label>
                                            <Input 
                                                value={newDoc.description}
                                                onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                                                placeholder="Optional details..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>File (Optional)</Label>
                                            <FileUpload 
                                                value={newDoc.file_url}
                                                onChange={(url) => setNewDoc({...newDoc, file_url: url})}
                                                label="Upload Document"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowAddDocModal(false)}>Cancel</Button>
                                        <Button onClick={() => {
                                            if (!newDoc.name) {
                                                toast.error("Name is required");
                                                return;
                                            }
                                            createDocMutation.mutate({
                                                company_id: company.id,
                                                ...newDoc
                                            });
                                        }} disabled={createDocMutation.isPending}>
                                            {createDocMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Add Document
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
                                                    <td className="px-4 py-3 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                            <div>
                                                                <div>{doc.name}</div>
                                                                {doc.description && <div className="text-xs text-muted-foreground font-normal">{doc.description}</div>}
                                                            </div>
                                                        </div>
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
                                                        <div className="flex items-center justify-end gap-2">
                                                            {doc.url && (
                                                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                        <Download className="w-4 h-4" />
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            {doc.isManual && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                                    onClick={() => {
                                                                        if (confirm('Delete this document?')) {
                                                                            deleteDocMutation.mutate(doc.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
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