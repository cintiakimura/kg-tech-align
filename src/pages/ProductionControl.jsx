import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Save, AlertCircle, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import moment from 'moment';
import TruncatedCell from '@/components/TruncatedCell';
import { exportToCSV } from '@/components/utils/exportUtils';
import InviteUserModal from '@/components/manager/InviteUserModal';
import VehicleForm from '@/components/onboarding/VehicleForm';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, UserPlus } from 'lucide-react';

export default function ProductionControl() {
    const queryClient = useQueryClient();
    const [editingTax, setEditingTax] = useState({});
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);

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

    const updateVehicleFieldsMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            await base44.entities.Vehicle.update(id, data);
        },
        onSuccess: () => {
            toast.success("Updated");
            queryClient.invalidateQueries(['productionVehicles']);
        },
        onError: () => toast.error("Failed to update")
    });

    const handleExport = () => {
        const data = productionVehicles.map(v => {
            const quote = getWinningQuote(v.id);
            return {
                Client: getCompanyName(v.created_by),
                Product: `${v.brand} ${v.model}`,
                VIN: v.vin,
                Supplier: quote?.supplier_email || '-',
                DateOrdered: quote?.updated_date || v.updated_date,
                Courier: v.carrier,
                Tracking: v.tracking_number,
                Cost: quote?.price,
                Shipping: quote?.shipping_cost,
                Tax: quote?.importation_tax,
                Total: ((quote?.price || 0) + (quote?.shipping_cost || 0) + (quote?.importation_tax || 0)),
                Status: v.status
            };
        });
        exportToCSV(data, 'production_control_export');
    };

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
                    <div className="flex gap-2">
                        <Button onClick={() => setShowAddVehicle(true)} className="bg-[#00C600] hover:bg-[#00b300] text-white">
                            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
                        </Button>
                        <Button onClick={() => setShowAddSupplier(true)} variant="outline" className="border-[#00C600] text-[#00C600] hover:bg-[#00C600]/10">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Supplier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                    </div>
                </div>

                <InviteUserModal 
                    open={showAddSupplier} 
                    onOpenChange={setShowAddSupplier}
                    initialRole="supplier"
                />

                <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <VehicleForm 
                            onCancel={() => setShowAddVehicle(false)}
                            onSuccess={() => {
                                setShowAddVehicle(false);
                                queryClient.invalidateQueries(['productionVehicles']);
                                toast.success("Vehicle added manually");
                            }}
                        />
                    </DialogContent>
                </Dialog>

                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableHead className="w-[140px]">Client</TableHead>
                                    <TableHead className="w-[180px]">Product</TableHead>
                                    <TableHead className="w-[140px]">Supplier</TableHead>
                                    <TableHead className="w-[110px]">Ordered</TableHead>
                                    <TableHead className="w-[110px]">Del. Est.</TableHead>
                                    <TableHead className="w-[140px]">Courier</TableHead>
                                    <TableHead className="w-[140px]">Tracking</TableHead>
                                    <TableHead className="w-[100px] text-right">Cost</TableHead>
                                    <TableHead className="w-[100px] text-right">Ship</TableHead>
                                    <TableHead className="w-[100px] text-right">Tax</TableHead>
                                    <TableHead className="w-[100px] text-right">Total</TableHead>
                                    <TableHead className="w-[160px]">Status</TableHead>
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
                                            <TableRow key={vehicle.id} className="bg-white dark:bg-[#2a2a2a] hover:bg-transparent hover:shadow-[inset_4px_0_0_0_#6366f1] transition-all border-b">
                                                <TableCell>
                                                    <TruncatedCell text={getCompanyName(vehicle.created_by)} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <TruncatedCell text={`${vehicle.brand} ${vehicle.model}`} className="font-semibold" />
                                                        <TruncatedCell text={vehicle.vin} className="text-xs text-muted-foreground" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <TruncatedCell text={quote?.supplier_email || '-'} />
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {moment(dateOrdered).format('YYYY-MM-DD')}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {getDeliveryDate(quote, dateOrdered)}
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        className="h-8 w-full text-xs" 
                                                        placeholder="Courier..."
                                                        defaultValue={vehicle.carrier || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== vehicle.carrier) {
                                                                updateVehicleFieldsMutation.mutate({ id: vehicle.id, data: { carrier: e.target.value } });
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        className="h-8 w-full text-xs" 
                                                        placeholder="Tracking..."
                                                        defaultValue={vehicle.tracking_number || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== vehicle.tracking_number) {
                                                                updateVehicleFieldsMutation.mutate({ id: vehicle.id, data: { tracking_number: e.target.value } });
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {quote?.price ? `£${quote.price.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {quote?.shipping_cost ? `£${quote.shipping_cost.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {quote ? (
                                                        <Input 
                                                            type="number" 
                                                            className="h-8 w-full text-right text-xs"
                                                            defaultValue={quote.importation_tax || 0}
                                                            onBlur={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (val !== quote.importation_tax) {
                                                                    updateQuoteTaxMutation.mutate({ id: quote.id, tax: val });
                                                                }
                                                            }}
                                                        />
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-sm">
                                                    {quote ? `£${((quote.price || 0) + (quote.shipping_cost || 0) + (quote.importation_tax || 0)).toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Select 
                                                        value={vehicle.status} 
                                                        onValueChange={(val) => updateVehicleStatusMutation.mutate({ id: vehicle.id, status: val })}
                                                    >
                                                        <SelectTrigger className={`h-8 w-full text-xs ${statusColors[vehicle.status] || 'bg-gray-100'}`}>
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