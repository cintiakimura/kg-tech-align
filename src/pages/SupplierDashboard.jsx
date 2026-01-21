import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import DashboardShell from '../components/DashboardShell';
import SharedDataGrid from '../components/SharedDataGrid';
import { Package, FileText, Upload, DollarSign, Truck, Calculator } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";

export default function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState('open_requests');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [shippingEst, setShippingEst] = useState(null);
  const queryClient = useQueryClient();

  const { data: openRequests = [] } = useQuery({
    queryKey: ['openRequests'],
    queryFn: () => base44.entities.PartRequest.list({ status: 'open' }),
  });

  const { data: myQuotes = [] } = useQuery({
    queryKey: ['myQuotes'],
    queryFn: () => base44.entities.Quote.list(),
  });

  const uploadQuoteMutation = useMutation({
    mutationFn: async ({ requestId, file }) => {
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        
        // AI Parsing logic
        let parsedData = {};
        try {
            const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
                file_url: uploadRes.file_url,
                json_schema: {
                    type: "object",
                    properties: {
                        supplier_name: { type: "string" },
                        total_amount: { type: "number" },
                        currency: { type: "string" },
                        lead_time_days: { type: "number" },
                        shipping_cost: { type: "number" },
                    }
                }
            });
            if (extraction.status === 'success') parsedData = extraction.output;
        } catch(e) { console.error(e); }

        return base44.entities.Quote.create({
            request_id: requestId,
            file_url: uploadRes.file_url,
            supplier_name: parsedData.supplier_name || "Unknown Supplier",
            total_amount: parsedData.total_amount || 0,
            currency: parsedData.currency || "USD",
            lead_time_days: parsedData.lead_time_days || 0,
            shipping_cost: parsedData.shipping_cost || 0,
            parsed_data: parsedData,
            status: 'pending'
        });
    },
    onSuccess: () => {
        setIsQuoteModalOpen(false);
        queryClient.invalidateQueries(['myQuotes']);
        alert("Quote uploaded successfully");
    }
  });

  const sidebarItems = [
    { id: 'open_requests', label: 'Open Requests', icon: Package },
    { id: 'my_quotes', label: 'My Quotes', icon: DollarSign },
    { id: 'shipping', label: 'FedEx Shipping', icon: Truck },
    { id: 'invoices', label: 'Invoices', icon: FileText },
  ];

  const requestColumns = [
    { key: 'id', label: 'Request ID', render: (row) => <span className="font-mono text-xs">#{row.id.slice(-6)}</span> },
    { key: 'description', label: 'Description' },
    { key: 'requested_parts', label: 'Items', render: (row) => row.requested_parts?.length || 0 },
    { key: 'actions', label: '', render: (row) => (
        <Button size="sm" onClick={() => { setSelectedRequest(row); setIsQuoteModalOpen(true); }}>
            Submit Quote
        </Button>
    )}
  ];

  const quoteColumns = [
    { key: 'id', label: 'Quote ID', render: (row) => <span className="font-mono text-xs">#{row.id.slice(-6)}</span> },
    { key: 'request_id', label: 'Ref Request', render: (row) => <span className="font-mono text-xs">#{row.request_id?.slice(-6)}</span> },
    { key: 'total_amount', label: 'Amount', render: (row) => `${row.total_amount} ${row.currency}` },
    { key: 'lead_time_days', label: 'Lead Time' },
    { key: 'status', label: 'Status', render: (row) => <Badge>{row.status}</Badge> }
  ];

  return (
    <DashboardShell 
      title="Supplier Portal" 
      userRole="Vendor" 
      sidebarItems={sidebarItems} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Submit Quote for Request #{selectedRequest?.id.slice(-6)}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="border-2 border-dashed p-8 text-center rounded-lg">
                    {uploadQuoteMutation.isPending ? (
                        <div className="flex flex-col items-center"><Loader2 className="animate-spin mb-2" /> Parsing PDF...</div>
                    ) : (
                        <Input type="file" accept=".pdf" onChange={(e) => uploadQuoteMutation.mutate({ requestId: selectedRequest.id, file: e.target.files[0] })} />
                    )}
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {activeTab === 'open_requests' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Open Requests</h1>
          <SharedDataGrid data={openRequests} columns={requestColumns} />
        </div>
      )}

      {activeTab === 'my_quotes' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">My Quotes</h1>
          <SharedDataGrid data={myQuotes} columns={quoteColumns} />
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Invoice management coming soon.</p>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6"/> FedEx Shipping Calculator</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
                    <h3 className="font-semibold mb-4">Estimate Shipping Cost</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const w = Number(e.target.weight.value);
                        setShippingEst({
                            service: "FedEx International Priority",
                            cost: (w * 12.5) + 45, // Mock calculation
                            days: 3
                        });
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input name="weight" type="number" placeholder="0.0" step="0.1" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Dimensions (LxWxH cm)</Label>
                            <div className="flex gap-2">
                                <Input name="l" placeholder="L" />
                                <Input name="w" placeholder="W" />
                                <Input name="h" placeholder="H" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Destination Country</Label>
                            <Input name="country" placeholder="e.g. Germany" />
                        </div>
                        <Button type="submit" className="w-full"><Calculator className="w-4 h-4 mr-2"/> Calculate Rate</Button>
                    </form>
                </div>

                {shippingEst && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border flex flex-col justify-center items-center text-center animate-in fade-in">
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">Estimated Rate</h3>
                        <div className="text-4xl font-bold text-[#00C600] mb-1">${shippingEst.cost.toFixed(2)}</div>
                        <div className="text-sm font-semibold">{shippingEst.service}</div>
                        <div className="text-sm text-muted-foreground mt-1">Delivery in ~{shippingEst.days} days</div>
                        <Button className="mt-6 w-full" variant="outline">Print Label</Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </DashboardShell>
  );
}