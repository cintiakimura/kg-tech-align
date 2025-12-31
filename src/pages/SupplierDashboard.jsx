import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, FileText, Send, Building2 } from "lucide-react";
import { toast } from "sonner";
import { appendAuditLog } from "../components/shippingUtils";

export default function SupplierDashboard() {
    const queryClient = useQueryClient();
    const [selectedProject, setSelectedProject] = useState(null);
    const [quoteForm, setQuoteForm] = useState({ price: '', shipping: '', note: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get current user for audit logs
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me(),
    });

    // Fetch Open Projects (CarProfiles with status 'Open')
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ['supplier-projects'],
        queryFn: async () => {
            // Fetch cars
            const cars = await base44.entities.CarProfile.list({ status: 'Open' });
            
            // Fetch companies to map client data
            const companies = await base44.entities.CompanyProfile.list();
            
            // Map companies to cars by created_by
            return cars.map(car => {
                const company = companies.find(c => c.created_by === car.created_by);
                return { ...car, company };
            });
        }
    });

    const submitQuoteMutation = useMutation({
        mutationFn: async (data) => {
            await base44.entities.Quote.create({
                price: parseFloat(data.price),
                shipping_cost: parseFloat(data.shipping),
                note: data.note,
                car_profile_id: selectedProject.id,
                supplier_email: user.email,
                status: 'pending',
                audit_log: appendAuditLog([], 'Quote Submitted', user.email)
            });
        },
        onSuccess: () => {
            toast.success("Quote submitted successfully");
            setSelectedProject(null);
            setQuoteForm({ price: '', shipping: '', note: '' });
            queryClient.invalidateQueries({ queryKey: ['supplier-projects'] });
        },
        onError: () => {
            toast.error("Failed to submit quote");
        }
    });

    const handleSubmit = () => {
        if (!quoteForm.price || !quoteForm.shipping) {
            toast.error("Price and Shipping are required");
            return;
        }
        submitQuoteMutation.mutate(quoteForm);
    };

    if (projectsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
                <p className="text-muted-foreground">Review open projects and submit your quotes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No open projects available for quoting.
                    </div>
                )}

                {projects?.map((project) => (
                    <Card key={project.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700">Open for Quote</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(project.created_date).toLocaleDateString()}</span>
                            </div>
                            <CardTitle>{project.brand} {project.model}</CardTitle>
                            <CardDescription>{project.engine_model} • {project.transmission_type}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            {/* Client Data */}
                            <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                    <Building2 className="w-3 h-3" /> 
                                    {project.company?.company_name || 'Unknown Client'}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {project.company?.address || 'No address provided'}
                                </div>
                            </div>

                            {/* Docs */}
                            <div className="space-y-2">
                                <div className="text-xs font-semibold uppercase text-muted-foreground">Specifications</div>
                                <div className="flex flex-wrap gap-2">
                                    {project.file_electrical_scheme && (
                                        <a href={project.file_electrical_scheme} target="_blank" className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
                                            <FileText className="w-3 h-3" /> Electrical Scheme
                                        </a>
                                    )}
                                    {project.file_sensors_actuators && (
                                        <a href={project.file_sensors_actuators} target="_blank" className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
                                            <FileText className="w-3 h-3" /> Sensors List
                                        </a>
                                    )}
                                    {!project.file_electrical_scheme && !project.file_sensors_actuators && (
                                        <span className="text-xs text-gray-400 italic">No documents attached</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Dialog open={selectedProject?.id === project.id} onOpenChange={(open) => !open && setSelectedProject(null)}>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-[#00C600] hover:bg-[#00b300]" onClick={() => setSelectedProject(project)}>
                                        <Send className="w-4 h-4 mr-2" /> Submit Quote
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Submit Quote for {project.brand} {project.model}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Price (£)</label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="0.00" 
                                                    value={quoteForm.price}
                                                    onChange={(e) => setQuoteForm({...quoteForm, price: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Shipping (£)</label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="0.00"
                                                    value={quoteForm.shipping}
                                                    onChange={(e) => setQuoteForm({...quoteForm, shipping: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Note (Optional)</label>
                                            <Textarea 
                                                placeholder="Add details about lead time, parts, etc."
                                                value={quoteForm.note}
                                                onChange={(e) => setQuoteForm({...quoteForm, note: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSelectedProject(null)}>Cancel</Button>
                                        <Button onClick={handleSubmit} disabled={submitQuoteMutation.isPending}>
                                            {submitQuoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Submit Quote
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}