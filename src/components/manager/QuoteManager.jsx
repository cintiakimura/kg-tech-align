import React, { useState } from 'react';
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Check, Truck, ChevronDown, Package, Printer, Send, Info } from "lucide-react";
import { toast } from "sonner";
import { getShippingRates, createShipmentLabel, appendAuditLog } from "@/utils/shippingUtils";
import { format } from "date-fns";

function QuoteCard({ quote, isWinner, onSelect, disabled }) {
    return (
        <div className={`border rounded p-3 flex justify-between items-center ${isWinner ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
            <div>
                <div className="font-semibold text-sm">{quote.supplier_email}</div>
                <div className="text-xs text-muted-foreground">{quote.note || 'No notes provided'}</div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-bold">£{quote.price}</div>
                    <div className="text-xs text-muted-foreground">+ £{quote.shipping_cost} shipping</div>
                </div>
                {!isWinner && !disabled && (
                    <Button size="sm" onClick={() => onSelect(quote)} className="bg-[#00C600] hover:bg-[#00b300]">
                        Select Winner
                    </Button>
                )}
                {isWinner && (
                    <Badge className="bg-green-600">Selected</Badge>
                )}
            </div>
        </div>
    );
}

function ShippingModal({ car, companies }) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [details, setDetails] = useState({ weight: '', width: '', height: '', depth: '' });
    const [rates, setRates] = useState([]);
    const [selectedRate, setSelectedRate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [shipmentResult, setShipmentResult] = useState(null);

    const clientCompany = companies.find(c => c.created_by === car.created_by);

    const handleGetRates = async () => {
        setLoading(true);
        try {
            const result = await getShippingRates(details.weight, details.width, details.height, details.depth, clientCompany?.address);
            setRates(result);
            setStep(2);
        } catch (e) {
            toast.error("Failed to fetch rates");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShipment = async () => {
        if (!selectedRate) return;
        setLoading(true);
        try {
            // 1. Create Label
            const result = await createShipmentLabel(selectedRate.id, details);
            setShipmentResult(result);
            
            // 2. Update Car Profile
            const user = await base44.auth.me();
            const newAuditLog = appendAuditLog(car.audit_log, `Shipped via ${result.carrier} (${result.trackingNumber})`, user.email);
            
            await base44.entities.CarProfile.update(car.id, {
                status: 'Shipped',
                tracking_number: result.trackingNumber,
                audit_log: newAuditLog
            });

            // 3. Send Emails (Integration)
            // Notify Client
            await base44.integrations.SendEmail.SendEmail({
                to: car.created_by,
                subject: `Your Order for ${car.brand} ${car.model} has Shipped`,
                body: `Good news! Your order has been shipped via ${result.carrier}.\nTracking Number: ${result.trackingNumber}\n\nTrack your package here: ${result.labelUrl}` // simplified link
            });
            
            setStep(3);
            queryClient.invalidateQueries(['admin-cars']);
        } catch (e) {
            console.error(e);
            toast.error("Failed to create shipment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Create Shipment</DialogTitle>
            </DialogHeader>

            {step === 1 && (
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <Input value={details.weight} onChange={e => setDetails({...details, weight: e.target.value})} type="number" placeholder="0.5" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Width (cm)</label>
                            <Input value={details.width} onChange={e => setDetails({...details, width: e.target.value})} type="number" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Height (cm)</label>
                            <Input value={details.height} onChange={e => setDetails({...details, height: e.target.value})} type="number" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Depth (cm)</label>
                            <Input value={details.depth} onChange={e => setDetails({...details, depth: e.target.value})} type="number" />
                        </div>
                    </div>
                    <Button className="w-full mt-4" onClick={handleGetRates} disabled={loading || !details.weight}>
                        {loading ? "Fetching Rates..." : "Get Live Rates"}
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 py-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Select a Service</h3>
                    <div className="space-y-2">
                        {rates.map(rate => (
                            <div 
                                key={rate.id} 
                                onClick={() => setSelectedRate(rate)}
                                className={`p-3 border rounded cursor-pointer flex justify-between items-center ${selectedRate?.id === rate.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                <div>
                                    <div className="font-bold">{rate.carrier} - {rate.service}</div>
                                    <div className="text-xs text-muted-foreground">ETA: {rate.eta}</div>
                                </div>
                                <div className="font-bold">£{rate.price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                    <Button className="w-full mt-4" onClick={handleCreateShipment} disabled={loading || !selectedRate}>
                        {loading ? "Generating Label..." : `Ship with ${selectedRate?.carrier || ''}`}
                    </Button>
                </div>
            )}

            {step === 3 && (
                <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Shipment Created!</h3>
                        <p className="text-sm text-muted-foreground">Tracking: {shipmentResult?.trackingNumber}</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" asChild>
                            <a href={shipmentResult?.labelUrl} target="_blank">
                                <Printer className="w-4 h-4 mr-2" /> Print Label
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
    );
}

export default function QuoteManager({ cars, quotes, companies }) {
    const queryClient = useQueryClient();
    
    // Select winner mutation
    const selectWinnerMutation = useMutation({
        mutationFn: async ({ quote, carId }) => {
            const user = await base44.auth.me();
            
            // 1. Update Quote status
            await base44.entities.Quote.update(quote.id, { 
                status: 'selected',
                audit_log: appendAuditLog(quote.audit_log, 'Selected as Winner', user.email)
            });
            
            // 2. Update Car Profile Status
            await base44.entities.CarProfile.update(carId, { 
                status: 'Selected',
                audit_log: appendAuditLog(cars.find(c => c.id === carId).audit_log, 'Quote Selected', user.email)
            });
        },
        onSuccess: () => {
            toast.success("Winner selected!");
            queryClient.invalidateQueries({ queryKey: ['admin-cars'] });
            queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
        }
    });

    const activeCars = cars.filter(c => ['Open', 'Selected', 'Shipped'].includes(c.status));

    return (
        <div className="space-y-6">
             {activeCars.map(car => {
                 const carQuotes = quotes.filter(q => q.car_profile_id === car.id);
                 const hasWinner = carQuotes.some(q => q.status === 'selected');
                 
                 return (
                     <Card key={car.id}>
                         <CardHeader className="pb-3">
                             <div className="flex justify-between">
                                 <div>
                                     <CardTitle className="text-lg">{car.brand} {car.model}</CardTitle>
                                     <div className="text-xs text-muted-foreground mt-1">
                                         Status: <Badge variant="outline" className={car.status === 'Shipped' ? 'bg-green-100' : ''}>{car.status}</Badge>
                                         {car.tracking_number && <span className="ml-2">Tracking: {car.tracking_number}</span>}
                                     </div>
                                 </div>
                                 {car.status === 'Selected' && (
                                     <Dialog>
                                         <DialogTrigger asChild>
                                             <Button className="bg-blue-600 hover:bg-blue-700">
                                                 <Package className="w-4 h-4 mr-2" /> Create Shipment
                                             </Button>
                                         </DialogTrigger>
                                         <ShippingModal car={car} companies={companies} />
                                     </Dialog>
                                 )}
                             </div>
                         </CardHeader>
                         <CardContent>
                             <div className="space-y-4">
                                 <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                     Quotes Received ({carQuotes.length})
                                 </h4>
                                 
                                 {carQuotes.length > 0 ? (
                                     <div className="space-y-2">
                                         {carQuotes.map(quote => (
                                             <QuoteCard 
                                                 key={quote.id} 
                                                 quote={quote} 
                                                 isWinner={quote.status === 'selected'}
                                                 disabled={hasWinner}
                                                 onSelect={(q) => selectWinnerMutation.mutate({ quote: q, carId: car.id })}
                                             />
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="text-sm text-gray-400 italic">No quotes yet.</div>
                                 )}
                                 
                                 {/* Audit Log Peek */}
                                 {car.audit_log && car.audit_log.length > 0 && (
                                     <Collapsible>
                                         <CollapsibleTrigger className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600">
                                             <Info className="w-3 h-3" /> View Audit Log
                                         </CollapsibleTrigger>
                                         <CollapsibleContent className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                             {car.audit_log.map((log, i) => (
                                                 <div key={i} className="flex justify-between border-b last:border-0 py-1">
                                                     <span>{log.action}</span>
                                                     <span className="text-gray-400">{new Date(log.date).toLocaleString()}</span>
                                                 </div>
                                             ))}
                                         </CollapsibleContent>
                                     </Collapsible>
                                 )}
                             </div>
                         </CardContent>
                     </Card>
                 );
             })}
        </div>
    );
}