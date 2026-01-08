import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function ProductionControl() {
    const queryClient = useQueryClient();
    const [editingTax, setEditingTax] = useState({});

    // Fetch all vehicles
    const { data: vehicles, isLoading: loadingVehicles } = useQuery({
        queryKey: ['productionVehicles'],
        queryFn: () => base44.entities.Vehicle.list(null, 1000),
    });

    // Fetch all quotes
    const { data: quotes, isLoading: loadingQuotes } = useQuery({
        queryKey: ['productionQuotes'],
        queryFn: () => base44.entities.Quote.list(null, 1000),
    });

    // Fetch company profiles for mapping
    const { data: companies, isLoading: loadingCompanies } = useQuery({
        queryKey: ['productionCompanies'],
        queryFn: () => base44.entities.CompanyProfile.list(null, 1000),
    });

    const updateVehicleStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            await base44.entities.Vehicle.update(id, { status });
        },
        onSuccess: () => {
            toast.success("Status updated");
            queryClient.invalidateQueries(['productionVehicles']);
        },
        onError: () => toast.error("Failed to update status")
    });

    const updateQuoteTaxMutation = useMutation({
        mutationFn: async ({ id, tax }) => {
            await base44.entities.Quote.update(id, { importation_tax: parseFloat(tax) });
        },
        onSuccess: () => {
            toast.success("Tax updated");
            queryClient.invalidateQueries(['productionQuotes']);
            setEditingTax({});
        },
        onError: () => toast.error("Failed to update tax")
    });

    if (loadingVehicles || loadingQuotes || loadingCompanies) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    // Filter for vehicles that are in production flow
    // Including "Quote Selected" (which we might map to ordered) and the new statuses
    const productionVehicles = vehicles?.filter(v => 
        ['Quote Selected', 'Shipped', 'ordered', 'in_production', 'in_transit', 'delivered', 'problem'].includes(v.status)
    ) || [];

    const getWinningQuote = (vehicleId) => {
        return quotes?.find(q => q.vehicle_id === vehicleId && (q.is_winner || q.status === 'selected'));
    };

    const getCompanyName = (email) => {
        const company = companies?.find(c => c.created_by === email || c.contact_email === email);
        return company ? company.company_name : email;
    };

    const getDeliveryDate = (quote, orderedDate) => {
        if (!quote?.lead_time_days || !orderedDate) return '-';
        return moment(orderedDate).add(quote.lead_time_days, 'days').format('YYYY-MM-DD');
    };

    const statusColors = {
        'Quote Selected': 'bg-blue-100 text-blue-800',
        'ordered': 'bg-blue-100 text-blue-800',
        'in_production': 'bg-yellow-100 text-yellow-800',
        'in_transit': 'bg-purple-100 text-purple-800',
        'Shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'problem': 'bg-red-100 text-red-800',
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#212121] p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link to="/ManagerDashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Production Control</h1>
                        <p className="text-muted-foreground">Manage orders, production status, and logistics</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableHead className="min-w-[150px]">Client</TableHead>
                                    <TableHead className="min-w-[200px]">Product</TableHead>
                                    <TableHead className="min-w-[200px]">Supplier</TableHead>
                                    <TableHead>Ordered</TableHead>
                                    <TableHead>Delivery Est.</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Shipping</TableHead>
                                    <TableHead className="text-right">Imp. Tax</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="min-w-[180px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productionVehicles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                            No active production orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    productionVehicles.map((vehicle) => {
                                        const quote = getWinningQuote(vehicle.id);
                                        const dateOrdered = quote?.updated_date || vehicle.updated_date;
                                        
                                        return (
                                            <TableRow key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <TableCell className="font-medium">
                                                    {getCompanyName(vehicle.created_by)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{vehicle.brand} {vehicle.model}</span>
                                                        <span className="text-xs text-muted-foreground">{vehicle.vin}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {quote?.supplier_email || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {moment(dateOrdered).format('YYYY-MM-DD')}
                                                </TableCell>
                                                <TableCell>
                                                    {getDeliveryDate(quote, dateOrdered)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {quote?.price ? `£${quote.price.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {quote?.shipping_cost ? `£${quote.shipping_cost.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {quote ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="relative w-24">
                                                                <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">£</span>
                                                                <Input 
                                                                    type="number" 
                                                                    className="h-8 pl-5 text-right"
                                                                    defaultValue={quote.importation_tax || 0}
                                                                    onBlur={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (val !== quote.importation_tax) {
                                                                            updateQuoteTaxMutation.mutate({ id: quote.id, tax: val });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {quote ? `£${((quote.price || 0) + (quote.shipping_cost || 0) + (quote.importation_tax || 0)).toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Select 
                                                        value={vehicle.status} 
                                                        onValueChange={(val) => updateVehicleStatusMutation.mutate({ id: vehicle.id, status: val })}
                                                    >
                                                        <SelectTrigger className={`h-8 w-full ${statusColors[vehicle.status] || 'bg-gray-100'}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Quote Selected">Quote Selected</SelectItem>
                                                            <SelectItem value="ordered">Ordered</SelectItem>
                                                            <SelectItem value="in_production">In Production</SelectItem>
                                                            <SelectItem value="Shipped">Shipped (Legacy)</SelectItem>
                                                            <SelectItem value="in_transit">In Transit</SelectItem>
                                                            <SelectItem value="delivered">Delivered</SelectItem>
                                                            <SelectItem value="problem">Problem</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}