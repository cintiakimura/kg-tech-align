import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Package, Truck, Printer, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PrintableOrder from '@/components/production/PrintableOrder';

export default function ProductionControl() {
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Fetch Vehicles (Production Orders)
    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['productionVehicles'],
        queryFn: async () => {
            // Fetch all related data manually since we can't join in one query easily
            const ve = await base44.entities.Vehicle.list({ status: { $in: ['ordered', 'in_production', 'in_transit', 'delivered'] } });
            
            // Enrich with Client and Supplier/Order info
            // This might be heavy, in real app use backend function or improved query
            const enriched = await Promise.all(ve.map(async (v) => {
                const quotes = await base44.entities.ClientQuote.list({ vehicle_id: v.id, status: 'accepted' });
                const quote = quotes[0];
                let client = null;
                if (quote) {
                    const companies = await base44.entities.CompanyProfile.list({ contact_email: quote.client_email });
                    client = companies[0];
                }
                
                // Supplier Quote (Winner)
                const supplierQuotes = await base44.entities.Quote.list({ vehicle_id: v.id, is_winner: true });
                const supplierQuote = supplierQuotes[0];

                return { ...v, client, clientQuote: quote, supplierQuote };
            }));
            return enriched;
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }) => {
            await base44.entities.Vehicle.update(id, { status });
            // Sync logic: In a real backend, this would trigger updates to Stock/Logistics entities
            // For now we simulate persistence by just updating the record
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['productionVehicles']);
            toast.success("Status updated");
        }
    });





    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Production Control</h1>
                    <p className="text-muted-foreground">Manage ongoing production orders</p>
                </div>
                <div className="flex gap-2">
                    {/* Controls removed as requested */}
                </div>
            </div>

            <div className="grid gap-4">
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles?.length === 0 && (
                             <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
                                 <p className="text-muted-foreground">No production orders found.</p>
                             </div>
                        )}
                        {vehicles?.map(v => (
                            <Card 
                                key={v.id} 
                                className="cursor-pointer hover:border-[#00C600] transition-colors"
                                onClick={() => { setSelectedOrder(v); setShowOrderModal(true); }}
                            >
                                <CardHeader>
                                    <CardTitle className="font-mono text-xl text-[#00C600]">
                                        {v.serial_number || "PENDING-SERIAL"}
                                    </CardTitle>
                                    <CardDescription>
                                        Status: <Badge variant="outline" className="uppercase">{v.status.replace('_', ' ')}</Badge>
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Order Details: {selectedOrder?.serial_number}</DialogTitle>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <h3 className="font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Client Info</h3>
                                    <p className="text-sm">Name: {selectedOrder.client?.company_name || 'N/A'}</p>
                                    <p className="text-sm">Email: {selectedOrder.client_email}</p>
                                    <p className="text-sm">Client #: {selectedOrder.client?.client_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold flex items-center gap-2"><Truck className="w-4 h-4" /> Supplier Info</h3>
                                    <p className="text-sm">Supplier: {selectedOrder.supplierQuote?.supplier_email || 'Pending Selection'}</p>
                                    <p className="text-sm">Cost: €{selectedOrder.supplierQuote?.price || 0}</p>
                                    <p className="text-sm">Delivery requested on: {selectedOrder.supplierQuote?.lead_time_days ? new Date(Date.now() + selectedOrder.supplierQuote.lead_time_days * 86400000).toLocaleDateString() : 'TBD'}</p>
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-slate-50">
                                <h3 className="font-bold mb-2">Vehicle Specification</h3>
                                <p className="text-sm">{selectedOrder.brand} {selectedOrder.model} ({selectedOrder.year})</p>
                                <p className="text-sm">VIN: {selectedOrder.vin}</p>
                                <p className="text-sm">System: {selectedOrder.calculator_system} | Purpose: {selectedOrder.purpose}</p>
                            </div>

                            <div className="flex justify-end gap-2 no-print">
                                <Button variant="outline" onClick={() => window.print()}>
                                    <Printer className="w-4 h-4 mr-2" /> Print Order Sheet
                                </Button>
                            </div>

                            <div className="hidden print:block">
                                <PrintableOrder order={selectedOrder} />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}