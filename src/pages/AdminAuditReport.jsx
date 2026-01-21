import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import DashboardShell from '../components/DashboardShell';
import SharedDataGrid from '../components/SharedDataGrid';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminAuditReport() {
  const { data: cars = [] } = useQuery({ queryKey: ['auditCars'], queryFn: () => base44.entities.CarProfile.list() });
  const { data: quotes = [] } = useQuery({ queryKey: ['auditQuotes'], queryFn: () => base44.entities.Quote.list() });
  const { data: invoices = [] } = useQuery({ queryKey: ['auditInvoices'], queryFn: () => base44.entities.Invoice.list() });

  const documents = useMemo(() => {
    let docs = [];

    // Process Car Files
    cars.forEach(car => {
        if (car.file_electrical_scheme) {
            docs.push({
                id: `car-elec-${car.id}`,
                type: 'Schematic',
                entity: 'Vehicle',
                entityName: `${car.brand} ${car.model} (${car.vin || 'No VIN'})`,
                date: car.created_date,
                url: car.file_electrical_scheme,
                status: 'Active'
            });
        }
        if (car.file_sensors_actuators) {
            docs.push({
                id: `car-sens-${car.id}`,
                type: 'Sensor List',
                entity: 'Vehicle',
                entityName: `${car.brand} ${car.model} (${car.vin || 'No VIN'})`,
                date: car.created_date,
                url: car.file_sensors_actuators,
                status: 'Active'
            });
        }
    });

    // Process Quotes
    quotes.forEach(quote => {
        if (quote.file_url) {
            docs.push({
                id: `quote-${quote.id}`,
                type: 'Supplier Quote',
                entity: 'Quote',
                entityName: `Bid from ${quote.supplier_name}`,
                date: quote.created_date,
                url: quote.file_url,
                status: quote.status
            });
        }
    });

    // Process Invoices
    invoices.forEach(inv => {
        if (inv.file_url) {
            docs.push({
                id: `inv-${inv.id}`,
                type: 'Invoice',
                entity: 'Invoice',
                entityName: `Inv #${inv.invoice_number} - ${inv.supplier_name}`,
                date: inv.created_date,
                url: inv.file_url,
                status: inv.status
            });
        }
    });

    return docs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cars, quotes, invoices]);

  const columns = [
    { key: 'type', label: 'Document Type', render: (row) => <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground"/> {row.type}</div> },
    { key: 'entity', label: 'Related Entity' },
    { key: 'entityName', label: 'Description' },
    { key: 'date', label: 'Date Uploaded', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (row) => <Badge variant="outline">{row.status}</Badge> },
    { key: 'actions', label: 'Actions', render: (row) => (
        <a href={row.url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ExternalLink className="h-4 w-4" />
            </Button>
        </a>
    )}
  ];

  return (
    <DashboardShell 
      title="Audit Trail" 
      userRole="Admin" 
      sidebarItems={[
          { id: 'audit', label: 'Document Repository', icon: FileText }
      ]}
      activeTab='audit'
      onTabChange={() => {}} // Single view page
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Centralized Document Repository</h1>
                <p className="text-muted-foreground">Complete audit trail of all technical and financial documents.</p>
            </div>
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export Audit Log
            </Button>
        </div>
        <SharedDataGrid data={documents} columns={columns} />
      </div>
    </DashboardShell>
  );
}