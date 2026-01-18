import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Truck, Printer, Info, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import PrintableOrder from '@/components/production/PrintableOrder';

export default function ProductionControl() {
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        brand: '', model: '', version: '', year: new Date().getFullYear(),
        fuel: 'Petrol', engine_size: '2.0L', engine_power: '150HP', engine_code: 'STD',
        transmission_type: 'Automatic', number_gears: 6, vin: '',
        serial_number: '', client_email: ''
    });

    const createVehicleMutation = useMutation({
        mutationFn: async (data) => {
            await base44.entities.Vehicle.create({
                ...data,
                purpose: 'Production',
                status: 'in_production',
                year: parseInt(data.year),
                number_gears: parseInt(data.number_gears)
            });
        },
        onSuccess: () => {
            toast.success("Production order created");
            setShowAddModal(false);
            setNewVehicle({
                brand: '', model: '', version: '', year: new Date().getFullYear(),
                fuel: 'Petrol', engine_size: '2.0L', engine_power: '150HP', engine_code: 'STD',
                transmission_type: 'Automatic', number_gears: 6, vin: '',
                serial_number: '', client_email: ''
            });
            queryClient.invalidateQueries({ queryKey: ['productionVehicles'] });
        },
        onError: (err) => toast.error("Failed to create: " + err.message)
    });

    // Fetch Vehicles (Production Orders)
    const { data: vehicles, isLoading } = useQuery({
        queryKey: ['productionVehicles'],
        queryFn: async () => {
            const ve = await base44.entities.Vehicle.list({ status: { $in: ['ordered', 'in_production', 'in_transit', 'delivered'] } });
            
            const enriched = await Promise.all(ve.map(async (v) => {
                const quotes = await base44.entities.ClientQuote.list({ vehicle_id: v.id });
                const quote = quotes[0];
                let client = null;
                if (v.client_email) {
                    const companies = await base44.entities.CompanyProfile.list({ contact_email: v.client_email });
                    client = companies[0];
                }
                
                const supplierQuotes = await base44.entities.Quote.list({ vehicle_id: v.id, is_winner: true });
                const supplierQuote = supplierQuotes[0];

                return { ...v, client, clientQuote: quote, supplierQuote };
            }));
            return enriched;
        }
    });

    // Auto-populate DB if empty
    React.useEffect(() => {
        const initData = async () => {
             try {
                // Check if data exists
                const existing = await base44.entities.CompanyProfile.list({ company_name: "Smith Auto Repairs" });
                if (existing.length > 0) return; // Already populated

                // Helper to ensure creation
                const createIfMissing = async (entity, query, data) => {
                    const exist = await base44.entities[entity].list(query);
                    if (exist.length > 0) return exist[0];
                    return await base44.entities[entity].create(data);
                };

                // --- 1. John Smith ---
                const client1 = await createIfMissing('CompanyProfile', { client_number: "CL-SMITH" }, {
                    company_name: "Smith Auto Repairs",
                    client_number: "CL-SMITH",
                    contact_email: "john@smithauto.com",
                    contact_person_name: "John Smith",
                    address: "101 Maple Street, London"
                });

                const v1 = await createIfMissing('Vehicle', { vehicle_number: "VEH-SMITH-001" }, {
                    brand: "Ford", model: "Focus", version: "ST", year: 2023,
                    vehicle_number: "VEH-SMITH-001",
                    serial_number: "SER-SMITH-001",
                    status: "in_production",
                    client_email: "john@smithauto.com",
                    purpose: "Production",
                    calculator_system: "Brakes",
                    brakes_type: "Disc",
                    fuel: "Petrol", engine_size: "2.3L", engine_power: "280HP", engine_code: "EcoBoost", 
                    transmission_type: "Manual", number_gears: 6, vin: "VF-SMITH-001"
                });

                await createIfMissing('VehicleConnector', { vehicle_id: v1.id, notes: "Standard" }, { 
                    vehicle_id: v1.id, custom_type_name: "OBD-II Connector", quantity: 1, notes: "Standard" 
                });
                
                await createIfMissing('ClientQuote', { vehicle_id: v1.id }, {
                    client_company_id: client1.id, vehicle_id: v1.id, client_email: "john@smithauto.com",
                    quote_number: "Q-SMITH-01", status: "accepted",
                    items: [{ description: "Brake System Overhaul", quantity: 1, unit_price: 1500 }]
                });

                await createIfMissing('Quote', { vehicle_id: v1.id }, {
                    vehicle_id: v1.id, supplier_email: "parts@europarts.com",
                    price: 800, shipping_cost: 100, total_gbp: 900,
                    status: "selected", is_winner: true, lead_time_days: 10
                });

                // --- 2. Sarah Lee ---
                const client2 = await createIfMissing('CompanyProfile', { client_number: "CL-LEE" }, {
                    company_name: "Lee Logistics",
                    client_number: "CL-LEE",
                    contact_email: "sarah@leelogistics.com",
                    contact_person_name: "Sarah Lee",
                    address: "42 Ocean Drive, Manchester"
                });

                const v2 = await createIfMissing('Vehicle', { vehicle_number: "VEH-LEE-002" }, {
                    brand: "BMW", model: "X5", version: "xDrive40i", year: 2024,
                    vehicle_number: "VEH-LEE-002",
                    serial_number: "SER-LEE-002",
                    status: "in_transit",
                    client_email: "sarah@leelogistics.com",
                    purpose: "Production",
                    calculator_system: "Engine",
                    brakes_type: "ABS",
                    fuel: "Hybrid", engine_size: "3.0L", engine_power: "335HP", engine_code: "B58", 
                    transmission_type: "Automatic", number_gears: 8, vin: "VF-LEE-002"
                });

                await createIfMissing('VehicleConnector', { vehicle_id: v2.id, notes: "Critical" }, { 
                    vehicle_id: v2.id, custom_type_name: "High Voltage Harness", quantity: 2, notes: "Critical" 
                });

                await createIfMissing('ClientQuote', { vehicle_id: v2.id }, {
                    client_company_id: client2.id, vehicle_id: v2.id, client_email: "sarah@leelogistics.com",
                    quote_number: "Q-LEE-01", status: "accepted",
                    items: [{ description: "Engine Replacement Unit", quantity: 1, unit_price: 4500 }]
                });

                await createIfMissing('Quote', { vehicle_id: v2.id }, {
                    vehicle_id: v2.id, supplier_email: "global@supplies.com",
                    price: 3000, shipping_cost: 250, total_gbp: 3250,
                    status: "selected", is_winner: true, lead_time_days: 7,
                    tracking_number: "DHL-998877", carrier: "DHL"
                });

                // --- 3. Tom Brown ---
                const client3 = await createIfMissing('CompanyProfile', { client_number: "CL-BROWN" }, {
                    company_name: "Brown Motors",
                    client_number: "CL-BROWN",
                    contact_email: "tom@brownmotors.co.uk",
                    contact_person_name: "Tom Brown",
                    address: "7 Industrial Estate, Birmingham"
                });

                const v3 = await createIfMissing('Vehicle', { vehicle_number: "VEH-BROWN-003" }, {
                    brand: "Audi", model: "A4", version: "S-Line", year: 2024,
                    vehicle_number: "VEH-BROWN-003",
                    serial_number: "SER-BROWN-003",
                    status: "delivered",
                    client_email: "tom@brownmotors.co.uk",
                    purpose: "Production",
                    calculator_system: "Electrics",
                    brakes_type: "Ceramic",
                    fuel: "Diesel", engine_size: "2.0L", engine_power: "190HP", engine_code: "TDI", 
                    transmission_type: "DCT", number_gears: 7, vin: "VF-BROWN-003"
                });

                await createIfMissing('VehicleConnector', { vehicle_id: v3.id, notes: "Pinout A" }, { 
                    vehicle_id: v3.id, custom_type_name: "ECU Main Connector", quantity: 1, notes: "Pinout A" 
                });

                await createIfMissing('ClientQuote', { vehicle_id: v3.id }, {
                    client_company_id: client3.id, vehicle_id: v3.id, client_email: "tom@brownmotors.co.uk",
                    quote_number: "Q-BROWN-01", status: "invoiced",
                    items: [{ description: "Full Electrical Rewire", quantity: 1, unit_price: 2200 }]
                });

                await createIfMissing('Quote', { vehicle_id: v3.id }, {
                    vehicle_id: v3.id, supplier_email: "local@parts.fr",
                    price: 1500, shipping_cost: 50, total_gbp: 1550,
                    status: "selected", is_winner: true, lead_time_days: 2,
                    tracking_number: "UPS-112233", carrier: "UPS"
                });

                queryClient.invalidateQueries(['productionVehicles']);

             } catch (e) {
                 console.error("Auto-population failed", e);
             }
        };

        // Run immediately
        initData();
    }, []);





    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Production Control</h1>
                    <p className="text-muted-foreground">Manage ongoing production orders</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddModal(true)} className="bg-[#00C600] hover:bg-[#00b300]">
                        <Plus className="w-4 h-4 mr-2" /> Add Production
                    </Button>
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

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Manual Production Order</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Serial Number</Label>
                            <Input value={newVehicle.serial_number} onChange={e => setNewVehicle({...newVehicle, serial_number: e.target.value})} placeholder="SER-..." />
                        </div>
                        <div className="space-y-2">
                            <Label>VIN</Label>
                            <Input value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value})} placeholder="VIN..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Brand</Label>
                            <Input value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} placeholder="Brand" />
                        </div>
                        <div className="space-y-2">
                            <Label>Model</Label>
                            <Input value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} placeholder="Model" />
                        </div>
                        <div className="space-y-2">
                            <Label>Version</Label>
                            <Input value={newVehicle.version} onChange={e => setNewVehicle({...newVehicle, version: e.target.value})} placeholder="Version" />
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input type="number" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fuel</Label>
                             <Select value={newVehicle.fuel} onValueChange={v => setNewVehicle({...newVehicle, fuel: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Client Email (Optional)</Label>
                            <Input value={newVehicle.client_email} onChange={e => setNewVehicle({...newVehicle, client_email: e.target.value})} placeholder="client@email.com" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button onClick={() => createVehicleMutation.mutate(newVehicle)} disabled={!newVehicle.brand || !newVehicle.vin}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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