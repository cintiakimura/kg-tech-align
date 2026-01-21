import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import DashboardShell from '../components/DashboardShell';
import SharedDataGrid from '../components/SharedDataGrid';
import { Activity, DollarSign, Package, Users, Truck, AlertTriangle, FileText, ArrowRight, CheckCircle, Ship, Settings } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({ queryKey: ['mgrRequests'], queryFn: () => base44.entities.PartRequest.list() });
  const { data: quotes = [] } = useQuery({ queryKey: ['mgrQuotes'], queryFn: () => base44.entities.Quote.list() });
  const { data: companies = [] } = useQuery({ queryKey: ['mgrCompanies'], queryFn: () => base44.entities.CompanyProfile.list() });
  
  // Production Kanban Stats
  const prodStats = {
      open: requests.filter(r => r.status === 'open').length,
      ordered: requests.filter(r => r.status === 'ordered').length,
      production: requests.filter(r => r.status === 'in_production').length,
      shipped: requests.filter(r => r.status === 'shipped').length,
  };

  const updateStatus = useMutation({
      mutationFn: ({ id, status }) => base44.entities.PartRequest.update(id, { status }),
      onSuccess: () => queryClient.invalidateQueries(['mgrRequests'])
  });

  const createClientQuote = useMutation({
      mutationFn: (data) => base44.entities.ClientQuote.create(data),
      onSuccess: () => {
          alert("Client Quote Sent!");
          queryClient.invalidateQueries(['mgrQuotes']); // Refresh if needed
      }
  });

  const sidebarItems = [
    { id: 'overview', label: 'Mission Control', icon: Activity },
    { id: 'production', label: 'Production Control', icon: Settings },
    { id: 'quotes', label: 'Sales Engine', icon: DollarSign },
    { id: 'logistics', label: 'Logistics & Stock', icon: Truck },
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'audit', label: 'Audit Report', icon: FileText },
  ];

  const handleTabChange = (tabId) => {
    if (tabId === 'audit') {
        navigate('/admin-audit-report');
    } else {
        setActiveTab(tabId);
    }
  };

  const requestColumns = [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-xs">#{row.id.slice(-6)}</span> },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: (row) => <Badge className="uppercase">{row.status}</Badge> },
    { key: 'priority', label: 'Priority', render: (row) => row.priority === 'high' ? <Badge variant="destructive">High</Badge> : <Badge variant="outline">Normal</Badge> },
    { key: 'created_date', label: 'Date', render: (row) => new Date(row.created_date).toLocaleDateString() }
  ];

  const quoteColumns = [
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'total_amount', label: 'Bid Amount', render: (row) => `${row.total_amount} ${row.currency}` },
    { key: 'lead_time_days', label: 'Lead Time' },
    { key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8">Generate Client Quote</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create Client Quote</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        createClientQuote.mutate({
                            request_id: row.request_id,
                            client_email: row.created_by, // Assuming supplier quote created_by is NOT the client, but we need the client email. This is tricky. 
                            // Actually, supplier quotes are created by suppliers. We need to fetch the REQUEST to get the client email.
                            // For this MVP, let's assume the manager manually inputs the client email or we fetch it.
                            // Better: Let's just ask for email for now.
                            client_email: formData.get('email'),
                            total_amount: Number(formData.get('amount')),
                            currency: row.currency,
                            status: 'pending'
                        });
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Client Email</label>
                            <Input name="email" placeholder="client@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Client Price (Margin Applied)</label>
                            <Input name="amount" type="number" defaultValue={row.total_amount * 1.2} required />
                            <p className="text-xs text-muted-foreground">Default: 20% Markup</p>
                        </div>
                        <Button type="submit" className="w-full">Send Quote</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )}
  ];

  const companyColumns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'type', label: 'Type', render: (row) => <Badge variant="outline">{row.type}</Badge> },
    { key: 'contact_email', label: 'Email' },
    { key: 'phone', label: 'Phone' }
  ];

  return (
    <DashboardShell 
      title="KG Manager" 
      userRole="Admin" 
      sidebarItems={sidebarItems} 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
    >
      {activeTab === 'overview' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border shadow-sm">
                 <h3 className="text-muted-foreground text-sm font-medium">Pending Requests</h3>
                 <p className="text-3xl font-bold mt-2">{requests.filter(r => r.status === 'open').length}</p>
             </div>
             <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border shadow-sm">
                 <h3 className="text-muted-foreground text-sm font-medium">Pending Quotes</h3>
                 <p className="text-3xl font-bold mt-2">{quotes.filter(q => q.status === 'pending').length}</p>
             </div>
             <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border shadow-sm">
                 <h3 className="text-muted-foreground text-sm font-medium">Total Users</h3>
                 <p className="text-3xl font-bold mt-2">{companies.length}</p>
             </div>
         </div>
      )}

      {activeTab === 'production' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Production Control</h1>
                <div className="flex gap-2">
                     <Badge variant="outline">Open: {prodStats.open}</Badge>
                     <Badge variant="secondary">In Prod: {prodStats.production}</Badge>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['open', 'ordered', 'in_production', 'shipped'].map(status => (
                    <div key={status} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                        <h3 className="font-semibold mb-3 uppercase text-xs text-muted-foreground">{status.replace('_', ' ')}</h3>
                        <div className="space-y-2">
                            {requests.filter(r => r.status === status).map(req => (
                                <div key={req.id} className="bg-white dark:bg-slate-800 p-3 rounded border shadow-sm text-sm">
                                    <div className="font-medium mb-1">#{req.id.slice(-6)}</div>
                                    <div className="text-muted-foreground text-xs mb-2 truncate">{req.description}</div>
                                    
                                    <div className="flex justify-end gap-1">
                                        {status !== 'shipped' && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                                const next = {open: 'ordered', ordered: 'in_production', in_production: 'shipped'};
                                                updateStatus.mutate({id: req.id, status: next[status]});
                                            }}>
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Sales Engine</h1>
            <p className="text-muted-foreground">Review Supplier Bids & Generate Client Quotes</p>
            <SharedDataGrid data={quotes} columns={quoteColumns} />
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Company Directory</h1>
            <SharedDataGrid data={companies} columns={companyColumns} />
        </div>
      )}
      
       {activeTab === 'logistics' && (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Logistics & Internal Stock</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Truck className="w-4 h-4"/> Incoming Shipments</h3>
                    <div className="text-3xl font-bold text-green-600">3</div>
                    <p className="text-sm text-muted-foreground">Arriving this week</p>
                </div>
                <div className="border rounded-lg p-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Package className="w-4 h-4"/> Stock Alerts</h3>
                    <div className="text-3xl font-bold text-amber-500">12</div>
                    <p className="text-sm text-muted-foreground">Items below min. level</p>
                </div>
            </div>
            
            <div className="border rounded-lg p-6 mt-6">
                <h3 className="font-semibold mb-4">Inventory Overview</h3>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="p-3">Part #</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">CONN-MX-12</td>
                            <td className="p-3">Bin A-12</td>
                            <td className="p-3">1,450</td>
                            <td className="p-3"><Badge variant="outline">OK</Badge></td>
                        </tr>
                        <tr className="border-b">
                            <td className="p-3">TERM-FEM-04</td>
                            <td className="p-3">Bin B-03</td>
                            <td className="p-3 text-red-500 font-bold">45</td>
                            <td className="p-3"><Badge variant="destructive">Low Stock</Badge></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </DashboardShell>
  );
}