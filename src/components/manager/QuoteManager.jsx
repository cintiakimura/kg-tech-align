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
import { createFedExShipment, appendAuditLog } from "../../components/shippingUtils";
import { format } from "date-fns";

function QuoteCard({ quote, isWinner, onSelect, disabled }) {
    return (
        <div className={`border rounded p-3 flex flex-col gap-3 ${isWinner ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                        {quote.supplier_email}
                        {isWinner && <Badge className="bg-green-600 h-5 text-[10px]">WINNER</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-gray-700">Max Lead Time: {quote.lead_time_days} Days</span>
                        <span className="mx-2">•</span>
                        <span>{quote.note || 'No comments'}</span>
                        {quote.pdf_url && (
                             <a href={quote.pdf_url} target="_blank" className="ml-2 text-blue-600 underline">View PDF</a>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-lg">£{quote.total_gbp?.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                        Parts: £{quote.price?.toFixed(2)} • Ship: £{quote.shipping_cost?.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end">
                {!isWinner && !disabled && (
                    <Button size="sm" onClick={() => onSelect(quote)} className="bg-[#00C600] hover:bg-[#00b300]">
                        Select Winner
                    </Button>
                )}
            </div>
        </div>
    );
}

function ShippingModal({ car, quote }) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [shipmentResult, setShipmentResult] = useState(null);

    const handleCreateFedExShipment = async () => {
        setLoading(true);
        try {
            // 1. Create Label via FedEx
            const result = await createFedExShipment('INTERNATIONAL_PRIORITY', {
                weight: quote.weight_kg,
                dimensions: { l: quote.width_cm, w: quote.height_cm, h: quote.depth_cm }
            });
            setShipmentResult(result);
            
            // 2. Update Vehicle
            const user = await base44.auth.me();
            const newAuditLog = appendAuditLog(car.audit_log, `Shipped via ${result.carrier} (${result.trackingNumber})`, user.email);
            
            await base44.entities.Vehicle.update(car.id, {
                status: 'Shipped',
                tracking_number: result.trackingNumber,
                carrier: result.carrier,
                label_url: result.labelUrl,
                audit_log: newAuditLog
            });

            // 3. Send Emails (Integration)
            // Notify Client & Supplier
            await base44.integrations.SendEmail.SendEmail({
                to: car.created_by,
                subject: `Your Order for ${car.brand} ${car.model} has Shipped`,
                body: `Good news! Your order has been shipped via ${result.carrier}.\nTracking Number: ${result.trackingNumber}\nDownload Label: ${result.labelUrl}`
            });
             await base44.integrations.SendEmail.SendEmail({
                to: quote.supplier_email,
                subject: `Shipment Created for ${car.brand} ${car.model}`,
                body: `A label has been generated for your winning quote.\nTracking Number: ${result.trackingNumber}\nDownload Label: ${result.labelUrl}`
            });
            
            setStep(2);
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
                <DialogTitle>Create FedEx Shipment</DialogTitle>
            </DialogHeader>

            {step === 1 && (
                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Package Details from Quote
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 grid grid-cols-2 gap-2">
                            <div>Weight: <span className="font-bold">{quote.weight_kg} kg</span></div>
                            <div>Dims: <span className="font-bold">{quote.width_cm}x{quote.height_cm}x{quote.depth_cm} cm</span></div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                        This will generate a production shipping label using the FedEx Ship API and notify the client.
                    </p>

                    <Button className="w-full mt-4 bg-[#4D148C] hover:bg-[#3d0f70]" onClick={handleCreateFedExShipment} disabled={loading}>
                        {loading ? "Connecting to FedEx..." : "Generate FedEx Label"}
                    </Button>
                </div>
            )}

            {step === 2 && (
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
                                <Printer className="w-4 h-4 mr-2" /> Download Label
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
                is_winner: true,
                audit_log: appendAuditLog(quote.audit_log, 'Selected as Winner', user.email)
            });
            
            // 2. Update Vehicle Status
            await base44.entities.Vehicle.update(carId, { 
                status: 'Quote Selected',
                audit_log: appendAuditLog(cars.find(c => c.id === carId).audit_log, 'Quote Selected', user.email)
            });
        },
        onSuccess: () => {
            toast.success("Winner selected!");
            queryClient.invalidateQueries({ queryKey: ['admin-cars'] });
            queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
        }
    });

    const activeCars = cars.filter(c => ['Open', 'Quote Selected', 'Shipped'].includes(c.status));

    return (
        <div className="space-y-6">
             {activeCars.map(car => {
                 const carQuotes = quotes.filter(q => q.vehicle_id === car.id);
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
                                 {car.status === 'Quote Selected' && (
                                                                     <Dialog>
                                                                         <DialogTrigger asChild>
                                                                             <Button className="bg-[#4D148C] hover:bg-[#3d0f70]">
                                                                                 <Package className="w-4 h-4 mr-2" /> FedEx Shipment
                                                                             </Button>
                                                                         </DialogTrigger>
                                                                         <ShippingModal car={car} quote={carQuotes.find(q => q.is_winner)} />
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