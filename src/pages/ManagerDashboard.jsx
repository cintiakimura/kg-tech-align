import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import DashboardShell from '../components/DashboardShell';
import SharedDataGrid from '../components/SharedDataGrid';
import { Activity, DollarSign, Package, Users, Truck, AlertTriangle, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const { data: requests = [] } = useQuery({ queryKey: ['mgrRequests'], queryFn: () => base44.entities.PartRequest.list() });
  const { data: quotes = [] } = useQuery({ queryKey: ['mgrQuotes'], queryFn: () => base44.entities.Quote.list() });
  const { data: companies = [] } = useQuery({ queryKey: ['mgrCompanies'], queryFn: () => base44.entities.CompanyProfile.list() });

  const sidebarItems = [
    { id: 'overview', label: 'Mission Control', icon: Activity },
    { id: 'requests', label: 'All Requests', icon: Package },
    { id: 'quotes', label: 'Quote Review', icon: DollarSign },
    { id: 'logistics', label: 'Logistics', icon: Truck },
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
    { key: 'total_amount', label: 'Amount', render: (row) => `${row.total_amount} ${row.currency}` },
    { key: 'lead_time_days', label: 'Lead Time' },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={row.status === 'approved' ? 'default' : 'secondary'}>{row.status}</Badge> }
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

      {activeTab === 'requests' && (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">All Requests</h1>
            <SharedDataGrid data={requests} columns={requestColumns} />
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Quote Review</h1>
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
            <h1 className="text-2xl font-bold">Logistics</h1>
            <p className="text-muted-foreground">Tracking dashboard coming soon.</p>
        </div>
      )}
    </DashboardShell>
  );
}