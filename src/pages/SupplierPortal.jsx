import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Upload, CheckCircle2 } from 'lucide-react';
import FileUpload from '../components/onboarding/FileUpload';

export default function SupplierPortal() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch Open Requests (In a real app, this would be a filtered view for suppliers)
  // For now, fetching all requests where user has read access (Sanitization would happen on backend or careful RLS)
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['openRequests'],
    queryFn: () => base44.entities.PartRequest.list({ status: 'open' }),
  });

  const uploadQuoteMutation = useMutation({
    mutationFn: async ({ requestId, fileUrl, file }) => {
      // 1. Extract Data from PDF using integration
      let parsedData = {};
      try {
        const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: {
                type: "object",
                properties: {
                    supplier_name: { type: "string" },
                    total_amount: { type: "number" },
                    currency: { type: "string" },
                    lead_time_days: { type: "number" },
                    shipping_cost: { type: "number" },
                    line_items: { type: "array", items: { type: "object", properties: { part_number: {type: "string"}, price: {type: "number"} } } }
                }
            }
        });
        if (extraction.status === 'success') {
            parsedData = extraction.output;
        }
      } catch (e) {
          console.error("AI Parsing failed", e);
      }

      // 2. Create Quote Record
      return base44.entities.Quote.create({
        request_id: requestId,
        file_url: fileUrl,
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
      alert("Quote submitted successfully!");
      setSelectedRequest(null);
    }
  });

  const handleFileUpload = async (file) => {
    if (!selectedRequest) return;
    
    // Upload file first
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    
    // Trigger mutation
    uploadQuoteMutation.mutate({
        requestId: selectedRequest.id,
        fileUrl: uploadRes.file_url,
        file: file // passed if needed but url is enough for extraction usually
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Supplier Portal</h1>
            <p className="text-muted-foreground">View open requests and submit quotes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Open Requests</h2>
            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : requests.length === 0 ? (
                <p>No open requests at the moment.</p>
            ) : (
                requests.map(req => (
                    <Card key={req.id} className={`cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'border-[#00C600] ring-1 ring-[#00C600]' : ''}`} onClick={() => setSelectedRequest(req)}>
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardTitle className="text-lg">Request #{req.id.slice(-6)}</CardTitle>
                                <Badge>{req.status}</Badge>
                            </div>
                            <CardDescription>{req.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm mb-2">{req.requested_parts?.length || 0} Line Items</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>Created: {new Date(req.created_date).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>

        <div>
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle>Submit Quote</CardTitle>
                    <CardDescription>Select a request to upload your bid.</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedRequest ? (
                        <div className="space-y-4">
                            <div className="bg-muted p-3 rounded-md text-sm">
                                <p className="font-medium">Selected: Request #{selectedRequest.id.slice(-6)}</p>
                                <p className="text-xs mt-1 text-muted-foreground">{selectedRequest.description}</p>
                            </div>
                            
                            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-[#333] transition-colors relative">
                                {uploadQuoteMutation.isPending ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#00C600] mb-2" />
                                        <p className="text-sm font-medium">Analyzing PDF...</p>
                                        <p className="text-xs text-muted-foreground">Extracting prices & lead times</p>
                                    </div>
                                ) : (
                                    <>
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept=".pdf"
                                            onChange={(e) => handleFileUpload(e.target.files[0])}
                                        />
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm font-medium">Upload PDF Quote</p>
                                        <p className="text-xs text-muted-foreground">AI will auto-fill details</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-2 opacity-20" />
                            <p className="text-sm">Select a request from the list</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}