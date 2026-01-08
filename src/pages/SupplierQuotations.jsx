import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp, Search, Package, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

export default function SupplierQuotations() {
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    // Fetch Data
    const { data: quotes, isLoading: quotesLoading } = useQuery({
        queryKey: ['admin-quotes'],
        queryFn: () => base44.entities.Quote.list(),
    });

    const { data: quoteItems, isLoading: itemsLoading } = useQuery({
        queryKey: ['admin-quote-items'],
        queryFn: () => base44.entities.QuoteItem.list(),
    });

    const { data: vehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => base44.entities.Vehicle.list(),
    });

    const { data: catalogue } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    // Mutations for accepting/rejecting quotes
    const updateQuoteStatus = useMutation({
        mutationFn: async ({ id, status }) => {
            await base44.entities.Quote.update(id, { status });
            // If accepted, update vehicle status? Maybe logic for later.
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
        }
    });

    if (quotesLoading || itemsLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#00C600]" /></div>;
    }

    // Join data
    const enrichedQuotes = quotes?.map(quote => {
        const vehicle = vehicles?.find(v => v.id === quote.vehicle_id);
        const items = quoteItems?.filter(i => i.quote_id === quote.id).map(item => {
            // we need to find the vehicle connector to find the catalogue id?
            // Actually QuoteItem links to VehicleConnector.
            // But we don't have VehicleConnector list here efficiently unless we fetch all.
            // For now let's just use what we have in QuoteItem. 
            // We might need to fetch VehicleConnectors to know what the original part was if quoted_part_number is empty?
            // Let's rely on quoted_part_number or just display "Item".
            // To be precise, let's fetch VehicleConnectors too if needed, but maybe we can survive without for now or fetch all.
            return item;
        });

        return {
            ...quote,
            vehicle,
            items
        };
    }).filter(q => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            q.supplier_email?.toLowerCase().includes(searchLower) ||
            q.vehicle?.brand?.toLowerCase().includes(searchLower) ||
            q.vehicle?.model?.toLowerCase().includes(searchLower) ||
            q.status?.toLowerCase().includes(searchLower)
        );
    }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Supplier Quotations</h1>
                    <p className="text-muted-foreground">Review quotes received from suppliers.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search supplier, vehicle..."
                        className="pl-8 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {enrichedQuotes?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
                        No quotations found.
                    </div>
                ) : (
                    enrichedQuotes?.map((quote) => (
                        <QuoteCard key={quote.id} quote={quote} catalogue={catalogue} onUpdateStatus={updateQuoteStatus.mutate} />
                    ))
                )}
            </div>
        </div>
    );
}

function QuoteCard({ quote, catalogue, onUpdateStatus }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card className={`overflow-hidden transition-all bg-transparent border border-[#00c600] ${isOpen ? 'ring-2 ring-indigo-500/20' : ''}`}>
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant={
                                quote.status === 'selected' ? 'success' : 
                                quote.status === 'rejected' ? 'destructive' : 'secondary'
                            } className={
                                quote.status === 'selected' ? 'bg-green-100 text-green-800 border-green-200' : ''
                            }>
                                {quote.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {format(new Date(quote.created_date), 'MMM dd, yyyy')}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold">
                            {quote.vehicle ? `${quote.vehicle.brand} ${quote.vehicle.model} (${quote.vehicle.year})` : 'Unknown Vehicle'}
                        </h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>Supplier: <span className="font-medium text-foreground">{quote.supplier_email}</span></span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="text-2xl font-bold text-indigo-600">£{quote.total_gbp?.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground text-right">
                            Includes Shipping: £{quote.shipping_cost?.toFixed(2)} <br/>
                            Tax: £{quote.importation_tax?.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex gap-2">
                         <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="gap-2">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                {isOpen ? 'Hide Details' : 'View Details & Items'}
                            </Button>
                        </CollapsibleTrigger>
                        {quote.pdf_url && (
                             <a href={quote.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="gap-2 text-indigo-600">
                                    <Download className="w-4 h-4" /> Original PDF
                                </Button>
                            </a>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {quote.status === 'pending' && (
                            <>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => onUpdateStatus({ id: quote.id, status: 'rejected' })}
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Reject
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-[#00C600] hover:bg-[#00b300]"
                                    onClick={() => onUpdateStatus({ id: quote.id, status: 'selected' })}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Accept Quote
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <div className="border-t bg-gray-50/50 p-6 space-y-6">
                        
                        {/* Additional Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-white rounded border">
                                <span className="text-muted-foreground block text-xs uppercase mb-1">Lead Time</span>
                                <span className="font-medium">{quote.lead_time_days} Days</span>
                            </div>
                            <div className="p-3 bg-white rounded border">
                                <span className="text-muted-foreground block text-xs uppercase mb-1">Weight</span>
                                <span className="font-medium">{quote.weight_kg} kg</span>
                            </div>
                            <div className="p-3 bg-white rounded border">
                                <span className="text-muted-foreground block text-xs uppercase mb-1">Dimensions</span>
                                <span className="font-medium">{quote.width_cm} x {quote.height_cm} x {quote.depth_cm} cm</span>
                            </div>
                            <div className="p-3 bg-white rounded border">
                                <span className="text-muted-foreground block text-xs uppercase mb-1">Note</span>
                                <span className="font-medium truncate" title={quote.note}>{quote.note || '-'}</span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-lg border overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 border-b font-medium text-sm flex items-center gap-2">
                                <Package className="w-4 h-4" /> Quoted Items
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quoted Part Number</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Lead Time</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quote.items?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.quoted_part_number || <span className="text-muted-foreground italic">As requested</span>}
                                            </TableCell>
                                            <TableCell>
                                                {item.quoted_quantity}
                                            </TableCell>
                                            <TableCell>£{item.unit_price?.toFixed(2)}</TableCell>
                                            <TableCell>{item.lead_time_days} days</TableCell>
                                            <TableCell className="text-right font-medium">
                                                £{((item.unit_price || 0) * (item.quoted_quantity || 0)).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!quote.items || quote.items.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                No items found in this quote.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}