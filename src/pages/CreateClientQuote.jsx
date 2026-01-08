import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowLeft, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';

export default function CreateClientQuote() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [clientId, setClientId] = useState("");
    const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
    const [validUntil, setValidUntil] = useState(moment().add(30, 'days').format('YYYY-MM-DD'));
    const [tvaRate, setTvaRate] = useState(20);
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([
        { type: 'manual', catalogue_id: '', description: '', quantity: 1, unit_price: 0 }
    ]);

    // Fetch Clients (CompanyProfiles)
    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => base44.entities.CompanyProfile.list(null, 1000),
    });

    // Fetch Catalogue
    const { data: catalogue } = useQuery({
        queryKey: ['catalogue_items'],
        queryFn: () => base44.entities.Catalogue.list(null, 1000),
    });

    const createQuoteMutation = useMutation({
        mutationFn: async (quoteData) => {
            if (quoteId) {
                await base44.entities.ClientQuote.update(quoteId, quoteData);
            } else {
                await base44.entities.ClientQuote.create(quoteData);
            }
        },
        onSuccess: () => {
            toast.success(quoteId ? "Quote updated" : "Quote created");
            navigate('/ManagerDashboard');
        },
        onError: () => toast.error("Failed to save quote")
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus) => {
            if (!quoteId) return;
            await base44.entities.ClientQuote.update(quoteId, { status: newStatus });
        },
        onSuccess: (_, newStatus) => {
            setStatus(newStatus);
            toast.success(`Quote marked as ${newStatus}`);
        },
        onError: () => toast.error("Failed to update status")
    });

    const addItem = () => {
        setItems([...items, { type: 'manual', catalogue_id: '', description: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Auto-fill description if catalogue item selected
        if (field === 'catalogue_id' && catalogue) {
            const product = catalogue.find(c => c.id === value);
            if (product) {
                newItems[index].description = `${product.type} - ${product.colour} (${product.pins} pins)`;
                newItems[index].type = 'catalogue';
            }
        }

        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const calculateTVA = () => {
        return calculateSubtotal() * (tvaRate / 100);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTVA();
    };

    const handleSave = () => {
        if (!clientId) {
            toast.error("Please select a client");
            return;
        }
        
        createQuoteMutation.mutate({
            client_company_id: clientId,
            date,
            valid_until: validUntil,
            tva_rate: parseFloat(tvaRate),
            items: items.map(i => ({
                ...i,
                quantity: parseFloat(i.quantity),
                unit_price: parseFloat(i.unit_price)
            })),
            notes,
            status: 'draft',
            quote_number: `Q-${moment().format('YYYYMMDD')}-${Math.floor(Math.random() * 1000)}`
        });
    };

    const selectedClient = clients?.find(c => c.id === clientId);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#212121] p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/ManagerDashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Create Quotation</h1>
                            <p className="text-muted-foreground">New sales quote for client</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {quoteId && (
                            <>
                                {status === 'draft' && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => updateStatusMutation.mutate('sent')}
                                    >
                                        Mark as Sent
                                    </Button>
                                )}
                                {(status === 'sent' || status === 'accepted') && (
                                    <Button 
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => updateStatusMutation.mutate('sale')}
                                    >
                                        Promote to Sale
                                    </Button>
                                )}
                                {status === 'sale' && (
                                    <Button 
                                        className="bg-purple-600 hover:bg-purple-700"
                                        onClick={() => updateStatusMutation.mutate('invoiced')}
                                    >
                                        Generate Invoice
                                    </Button>
                                )}
                                {status === 'invoiced' && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                        Invoiced
                                    </Badge>
                                )}
                            </>
                        )}
                        <Button onClick={handleSave} disabled={createQuoteMutation.isPending} className="bg-[#00C600] hover:bg-[#00b300]">
                            {createQuoteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            {quoteId ? 'Update Quote' : 'Save Quote'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Header / Company Info */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-[#00C600]">KG Protech SAS</h3>
                                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                                        <p>112 Rue des Moines</p>
                                        <p>75017 - Paris</p>
                                        <p>France</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quoteNumber || 'NEW QUOTATION'}</h2>
                                    {status && <Badge variant="secondary" className="mb-2 uppercase">{status}</Badge>}
                                    <div className="mt-2 text-sm">
                                        <div className="flex justify-end gap-2 items-center mb-2">
                                            <Label>Date:</Label>
                                            <Input 
                                                type="date" 
                                                value={date} 
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-36 h-8"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 items-center">
                                            <Label>Valid Until:</Label>
                                            <Input 
                                                type="date" 
                                                value={validUntil} 
                                                onChange={(e) => setValidUntil(e.target.value)}
                                                className="w-36 h-8"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <Label className="mb-2 block font-semibold">Bill To:</Label>
                                    <Select value={clientId} onValueChange={setClientId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients?.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.company_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedClient && (
                                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                                            <p className="font-medium">{selectedClient.contact_person_name}</p>
                                            <p>{selectedClient.address}</p>
                                            <p>{selectedClient.contact_email}</p>
                                            <p>{selectedClient.phone}</p>
                                            {selectedClient.tax_id && <p>VAT: {selectedClient.tax_id}</p>}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label className="mb-2 block">Notes / Terms</Label>
                                    <Textarea 
                                        placeholder="Additional notes..." 
                                        className="h-32 resize-none"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Totals Side Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>€{calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span>TVA (%)</span>
                                    <Input 
                                        type="number" 
                                        value={tvaRate} 
                                        onChange={(e) => setTvaRate(e.target.value)}
                                        className="w-16 h-8"
                                    />
                                </div>
                                <span>€{calculateTVA().toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>€{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="w-[300px]">Product / Description</TableHead>
                                    <TableHead className="w-[120px] text-right">Qty</TableHead>
                                    <TableHead className="w-[150px] text-right">Unit Price (€)</TableHead>
                                    <TableHead className="w-[150px] text-right">Total (€)</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center text-muted-foreground text-xs">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <Select 
                                                    value={item.catalogue_id || "manual"} 
                                                    onValueChange={(val) => {
                                                        if (val === "manual") {
                                                            updateItem(index, 'catalogue_id', '');
                                                            updateItem(index, 'type', 'manual');
                                                            updateItem(index, 'description', '');
                                                        } else {
                                                            updateItem(index, 'catalogue_id', val);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 mb-1">
                                                        <SelectValue placeholder="Select Item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="manual">Manual Entry</SelectItem>
                                                        {catalogue?.map(prod => (
                                                            <SelectItem key={prod.id} value={prod.id}>
                                                                {prod.secret_part_number} - {prod.type} {prod.colour}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input 
                                                    placeholder="Description" 
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="h-8"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="h-8 text-right"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                                className="h-8 text-right"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            €{(item.quantity * item.unit_price).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeItem(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900/30">
                            <Button variant="outline" size="sm" onClick={addItem} className="gap-2">
                                <Plus className="w-4 h-4" /> Add Item
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}