import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import DashboardShell from '../components/DashboardShell';
import SharedDataGrid from '../components/SharedDataGrid';
import { Package, FileText, Upload, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';

export default function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState('open_requests');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
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
    </DashboardShell>
  );
}