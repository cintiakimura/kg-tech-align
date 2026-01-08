import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, FileText, Send, Building2, Upload, Download, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getFedExRates, appendAuditLog } from "../components/shippingUtils";
import FileUpload from "../components/onboarding/FileUpload"; // Using existing component
import { exportToCSV } from '@/components/utils/exportUtils';

export default function SupplierDashboard() {
    const queryClient = useQueryClient();
    const [selectedProject, setSelectedProject] = useState(null);
    const [quoteForm, setQuoteForm] = useState({ 
        shipping: '', 
        tax: '',
        note: '', 
        weight: '',
        width: '',
        height: '',
        depth: '',
        originPostcode: 'CN-200000',
        serviceType: '',
        pdf_url: '',
        items: {} // { connector_id: { unit_price: '', lead_time: '' } }
    });
    const [calculatingRates, setCalculatingRates] = useState(false);
    const [extracting, setExtracting] = useState(false);

    // Get current user
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me(),
    });

    // Fetch Catalogue items to show details
    const { data: catalogueItems } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    // Fetch Open Projects (Vehicles with status 'Open for Quotes')
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ['supplier-projects'],
        queryFn: async () => {
            // Fetch vehicles
            const vehicles = await base44.entities.Vehicle.list({ status: 'Open for Quotes' });
            
            // Fetch companies
            const companies = await base44.entities.CompanyProfile.list();

            // For each vehicle, fetch its connectors
            // In a real app with many vehicles, this would be optimized backend-side or batched.
            const enhancedVehicles = await Promise.all(vehicles.map(async (v) => {
                const company = companies.find(c => c.created_by === v.created_by);
                const connectors = await base44.entities.VehicleConnector.list({ vehicle_id: v.id });
                return { ...v, company, connectors };
            }));
            
            return enhancedVehicles;
        }
    });

    const submitQuoteMutation = useMutation({
        mutationFn: async (data) => {
            if (!user) throw new Error("Not logged in");

            const items = Object.values(data.items);
            if (items.length === 0) throw new Error("No items quoted");

            // Calculate totals
            let partsTotal = 0;
            let maxLeadTime = 0;
            
            // Validate items
            for (const conn of selectedProject.connectors) {
                const itemData = data.items[conn.id];
                if (!itemData || !itemData.unit_price) throw new Error("Missing price for some items");
                
                const price = parseFloat(itemData.unit_price);
                // Use quoted quantity if present, else requested quantity
                const qty = itemData.quantity ? parseFloat(itemData.quantity) : conn.quantity;
                
                partsTotal += price * qty;
                
                const lt = parseInt(itemData.lead_time || 0);
                if (lt > maxLeadTime) maxLeadTime = lt;
            }

            const shipping = parseFloat(data.shipping || 0);
            const tax = parseFloat(data.tax || 0);

            // 1. Create Quote
            const quote = await base44.entities.Quote.create({
                price: partsTotal,
                shipping_cost: shipping,
                importation_tax: tax,
                total_gbp: partsTotal + shipping + tax,
                lead_time_days: maxLeadTime,
                note: data.note,
                vehicle_id: selectedProject.id,
                supplier_email: user.email,
                status: 'pending',
                is_winner: false,
                weight_kg: parseFloat(data.weight),
                width_cm: parseFloat(data.width),
                height_cm: parseFloat(data.height),
                depth_cm: parseFloat(data.depth),
                pdf_url: data.pdf_url,
                audit_log: appendAuditLog([], 'Quote Submitted', user.email)
            });

            // 2. Create Quote Items
            await Promise.all(selectedProject.connectors.map(conn => {
                const itemData = data.items[conn.id];
                return base44.entities.QuoteItem.create({
                    quote_id: quote.id,
                    vehicle_connector_id: conn.id,
                    unit_price: parseFloat(itemData.unit_price),
                    lead_time_days: parseInt(itemData.lead_time || 0),
                    quoted_quantity: itemData.quantity ? parseInt(itemData.quantity) : conn.quantity,
                    quoted_part_number: itemData.part_number
                });
            }));

            // 3. Update Vehicle status
            await base44.entities.Vehicle.update(selectedProject.id, {
                status: 'Quotes Received'
            });
        },
        onSuccess: () => {
            toast.success("Quote submitted successfully");
            setSelectedProject(null);
            setQuoteForm({ 
                shipping: '', tax: '', note: '', weight: '', width: '', height: '', depth: '', 
                originPostcode: 'CN-200000', serviceType: '', pdf_url: '', items: {}
            });
            queryClient.invalidateQueries({ queryKey: ['supplier-projects'] });
        },
        onError: (err) => {
            console.error(err);
            toast.error("Failed to submit quote: " + err.message);
        }
    });

    const handleCalculateShipping = async () => {
        if (!quoteForm.weight || !quoteForm.width || !quoteForm.height || !quoteForm.depth) {
            toast.error("Please fill in weight and dimensions first");
            return;
        }
        
        setCalculatingRates(true);
        try {
            const destPostcode = 'SW1A 1AA'; // Mock destination
            const rates = await getFedExRates(
                parseFloat(quoteForm.weight),
                parseFloat(quoteForm.width),
                parseFloat(quoteForm.height),
                parseFloat(quoteForm.depth),
                quoteForm.originPostcode,
                destPostcode
            );
            
            if (rates && rates.length > 0) {
                const cheapest = rates[0];
                setQuoteForm(prev => ({
                    ...prev,
                    shipping: cheapest.price.toFixed(2),
                    serviceType: cheapest.service
                }));
                toast.success(`FedEx Rate: £${cheapest.price.toFixed(2)} (${cheapest.service})`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to calculate shipping rates");
        } finally {
            setCalculatingRates(false);
        }
    };

    const handleItemChange = (connectorId, field, value) => {
        setQuoteForm(prev => ({
            ...prev,
            items: {
                ...prev.items,
                [connectorId]: {
                    ...prev.items[connectorId],
                    [field]: value
                }
            }
        }));
    };

    // Calculate total on the fly for display
    const calculateTotal = () => {
        if (!selectedProject) return 0;
        let partsTotal = 0;
        selectedProject.connectors.forEach(conn => {
            const price = parseFloat(quoteForm.items[conn.id]?.unit_price || 0);
            const qty = quoteForm.items[conn.id]?.quantity !== undefined 
                ? parseFloat(quoteForm.items[conn.id]?.quantity) 
                : conn.quantity;
            partsTotal += price * (qty || 0);
        });
        return partsTotal + (parseFloat(quoteForm.shipping) || 0) + (parseFloat(quoteForm.tax) || 0);
    };

    const handleAutoFill = async () => {
        if (!quoteForm.pdf_url) {
            toast.error("Please upload a PDF quote first");
            return;
        }

        setExtracting(true);
        try {
            // Prepare context
            const contextItems = selectedProject.connectors.map(c => {
                 const catItem = catalogueItems?.find(i => i.id === c.catalogue_id);
                 return `ID: ${c.id}, Part: ${catItem ? catItem.type + ' ' + catItem.colour : 'Unknown'}, Pins: ${catItem?.pins || '?'}, Qty: ${c.quantity}`;
            }).join('\n');

            const prompt = `
                I have a quote PDF for the following requested items:
                ${contextItems}

                Please extract the following information from the PDF:
                1. Tax Amount (if any, labeled as Tax, VAT, or TVA).
                2. Shipping Cost.
                3. For each requested item ID listed above, find the matching:
                   - Unit Price
                   - Lead Time (days)
                   - Quoted Part Number (if they specify a part number)
                   - Quoted Quantity (if different from request)

                Return a JSON object:
                {
                    "tax": number,
                    "shipping": number,
                    "items": {
                        "CONNECTOR_ID": { 
                            "unit_price": number, 
                            "lead_time": number,
                            "part_number": "string",
                            "quantity": number
                        }
                    }
                }
                
                If a value is not found, use 0.
            `;

            const res = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                file_urls: [quoteForm.pdf_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        tax: { type: "number" },
                        shipping: { type: "number" },
                        items: { 
                            type: "object",
                            additionalProperties: {
                                type: "object",
                                properties: {
                                    unit_price: { type: "number" },
                                    lead_time: { type: "number" },
                                    part_number: { type: "string" },
                                    quantity: { type: "number" }
                                }
                            }
                        }
                    }
                }
            });

            if (res) {
                setQuoteForm(prev => {
                    const newItems = { ...prev.items };
                    if (res.items) {
                        Object.keys(res.items).forEach(id => {
                            if (newItems[id]) {
                                newItems[id] = { ...newItems[id], ...res.items[id] };
                            } else {
                                newItems[id] = res.items[id];
                            }
                        });
                    }
                    return {
                        ...prev,
                        tax: res.tax || prev.tax,
                        shipping: res.shipping || prev.shipping,
                        items: newItems
                    };
                });
                toast.success("Form auto-filled from quote!");
            }

        } catch (error) {
            console.error("Extraction failed", error);
            toast.error("Failed to extract data from PDF");
        } finally {
            setExtracting(false);
        }
    };

    if (projectsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    const handleExport = () => {
        const data = projects.map(p => ({
            Brand: p.brand,
            Model: p.model,
            Version: p.version,
            Year: p.year,
            Status: p.status,
            Client: p.company?.company_name || 'Unknown',
            ConnectorsCount: p.connectors?.length || 0,
            DateCreated: p.created_date
        }));
        exportToCSV(data, 'open_rfqs_export');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
                    <p className="text-muted-foreground">Review open vehicle requests and submit your quotes.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {projects?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No open requests available for quoting.
                    </div>
                )}

                {projects?.map((project) => (
                    <Card key={project.id} className="flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#2a2a2a] hover:shadow-lg border-l-4 border-l-transparent hover:border-l-indigo-500 transition-all">
                         {/* Project Info Column */}
                        <div className="p-6 md:w-1/3 bg-gray-50 dark:bg-gray-900 border-b md:border-b-0 md:border-r space-y-4">
                            <div>
                                <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700">{project.status}</Badge>
                                <h3 className="font-bold text-xl">{project.brand} {project.model}</h3>
                                <p className="text-sm text-muted-foreground">{project.version} • {project.year}</p>
                            </div>
                            
                            <div className="text-sm space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                    <Building2 className="w-3 h-3" /> 
                                    {project.company?.company_name || 'Unknown Client'}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {project.company?.address}
                                </div>
                            </div>

                             {/* Docs */}
                             <div className="flex flex-wrap gap-2 pt-2">
                                {project.file_electrical_scheme && (
                                    <a href={project.file_electrical_scheme} target="_blank" className="flex items-center gap-1 text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100">
                                        <FileText className="w-3 h-3" /> Electrical Scheme
                                    </a>
                                )}
                                {project.file_sensors_actuators && (
                                    <a href={project.file_sensors_actuators} target="_blank" className="flex items-center gap-1 text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100">
                                        <FileText className="w-3 h-3" /> Sensors List
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Connectors Column */}
                        <div className="p-6 md:w-2/3 space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4" /> Requested Connectors
                            </h4>
                            <div className="space-y-3">
                                {project.connectors?.map(conn => {
                                    const catItem = catalogueItems?.find(i => i.id === conn.catalogue_id);
                                    return (
                                        <div key={conn.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white dark:bg-black/20">
                                            {catItem?.image_url ? (
                                                <img src={catItem.image_url} className="w-12 h-12 object-contain bg-white rounded border" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {catItem ? `${catItem.type} - ${catItem.colour} (${catItem.pins} pins)` : 'Unknown Part'}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Qty: <span className="font-bold text-black dark:text-white">{conn.quantity}</span>
                                                    {conn.notes && <span className="ml-2 italic text-gray-500">— {conn.notes}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="pt-4 flex justify-end">
                                <Dialog open={selectedProject?.id === project.id} onOpenChange={(open) => {
                                    if (!open) setSelectedProject(null);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-[#00C600] hover:bg-[#00b300]" onClick={() => setSelectedProject(project)}>
                                            <Send className="w-4 h-4 mr-2" /> Submit Quotation
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Submit Quote for {project.brand} {project.model}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                            
                                            {/* Line Items Input */}
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-sm">Item Pricing</h3>
                                                {project.connectors?.map(conn => {
                                                    const catItem = catalogueItems?.find(i => i.id === conn.catalogue_id);
                                                    return (
                                                        <div key={conn.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded border">
                                                            <div className="col-span-4 space-y-1">
                                                                <label className="text-[10px] text-gray-500 uppercase">Part Number / Desc</label>
                                                                <Input 
                                                                    className="h-8 bg-white text-xs"
                                                                    placeholder={catItem ? `${catItem.type} ${catItem.colour}` : 'Part'}
                                                                    value={quoteForm.items[conn.id]?.part_number !== undefined ? quoteForm.items[conn.id]?.part_number : (catItem ? `${catItem.type} ${catItem.colour}` : '')}
                                                                    onChange={(e) => handleItemChange(conn.id, 'part_number', e.target.value)}
                                                                />
                                                                <div className="text-[10px] text-gray-400">Requested: {catItem ? `${catItem.type} ${catItem.colour}` : 'N/A'}</div>
                                                            </div>
                                                            <div className="col-span-2 space-y-1">
                                                                <label className="text-[10px] text-gray-500 uppercase">Qty</label>
                                                                <Input 
                                                                    type="number"
                                                                    className="h-8 bg-white text-xs"
                                                                    placeholder={conn.quantity}
                                                                    value={quoteForm.items[conn.id]?.quantity !== undefined ? quoteForm.items[conn.id]?.quantity : conn.quantity}
                                                                    onChange={(e) => handleItemChange(conn.id, 'quantity', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-span-3 space-y-1">
                                                                <label className="text-[10px] text-gray-500 uppercase">Unit Price (£)</label>
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="0.00" 
                                                                    className="h-8 bg-white"
                                                                    value={quoteForm.items[conn.id]?.unit_price || ''}
                                                                    onChange={(e) => handleItemChange(conn.id, 'unit_price', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-span-3 space-y-1">
                                                                <label className="text-[10px] text-gray-500 uppercase">Lead Time (Days)</label>
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="Days" 
                                                                    className="h-8 bg-white"
                                                                    value={quoteForm.items[conn.id]?.lead_time || ''}
                                                                    onChange={(e) => handleItemChange(conn.id, 'lead_time', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Shipping */}
                                            <div className="border rounded-md p-4 bg-blue-50/50 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold flex items-center gap-2">
                                                        <Truck className="w-4 h-4" /> FedEx Shipping Calculator
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-4 gap-3">
                                                    <div className="col-span-1">
                                                        <label className="text-xs">Weight (kg)</label>
                                                        <Input type="number" className="h-8 bg-white" value={quoteForm.weight} onChange={(e) => setQuoteForm({...quoteForm, weight: e.target.value})} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="text-xs">L (cm)</label>
                                                        <Input type="number" className="h-8 bg-white" value={quoteForm.width} onChange={(e) => setQuoteForm({...quoteForm, width: e.target.value})} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="text-xs">W (cm)</label>
                                                        <Input type="number" className="h-8 bg-white" value={quoteForm.height} onChange={(e) => setQuoteForm({...quoteForm, height: e.target.value})} />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <label className="text-xs">H (cm)</label>
                                                        <Input type="number" className="h-8 bg-white" value={quoteForm.depth} onChange={(e) => setQuoteForm({...quoteForm, depth: e.target.value})} />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end gap-4">
                                                     <Button type="button" size="sm" variant="secondary" onClick={handleCalculateShipping} disabled={calculatingRates}>
                                                        {calculatingRates ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Truck className="w-3 h-3 mr-2" />}
                                                        Get FedEx Rates
                                                    </Button>
                                                    <div className="w-32">
                                                        <label className="text-xs font-bold">Shipping Cost (£)</label>
                                                        <Input 
                                                            type="number" 
                                                            value={quoteForm.shipping}
                                                            onChange={(e) => setQuoteForm({...quoteForm, shipping: e.target.value})}
                                                            className="h-8 bg-white font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tax / VAT */}
                                            <div className="flex justify-end">
                                                <div className="w-48">
                                                    <label className="text-xs font-medium">Tax / VAT Amount (£)</label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="0.00"
                                                        value={quoteForm.tax}
                                                        onChange={(e) => setQuoteForm({...quoteForm, tax: e.target.value})}
                                                        className="h-8 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* PDF Upload & Auto-fill */}
                                             <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-medium">Detailed PDF Quote</label>
                                                    {quoteForm.pdf_url && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={handleAutoFill} 
                                                            disabled={extracting}
                                                            className="h-7 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                        >
                                                            {extracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                            Auto-fill Form from PDF
                                                        </Button>
                                                    )}
                                                </div>
                                                <FileUpload 
                                                    label="Upload PDF Quote" 
                                                    value={quoteForm.pdf_url} 
                                                    onChange={(url) => setQuoteForm({...quoteForm, pdf_url: url})} 
                                                    accept=".pdf,.png,.jpg"
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Upload your quote document to auto-extract prices, tax, and shipping details.
                                                </p>
                                            </div>

                                            {/* Notes */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Comments / Notes</label>
                                                <Textarea 
                                                    placeholder="Add details about parts, exceptions, etc."
                                                    value={quoteForm.note}
                                                    onChange={(e) => setQuoteForm({...quoteForm, note: e.target.value})}
                                                />
                                            </div>
                                            
                                            <div className="pt-4 border-t flex justify-between items-center font-bold text-lg">
                                                <span>Total Quote:</span>
                                                <span className="text-green-600">
                                                    £{calculateTotal().toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setSelectedProject(null)}>Cancel</Button>
                                            <Button onClick={() => submitQuoteMutation.mutate(quoteForm)} disabled={submitQuoteMutation.isPending}>
                                                {submitQuoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Submit Quote
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}