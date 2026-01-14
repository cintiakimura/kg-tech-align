import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Car, Building2, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from 'moment';

export default function AdminAuditReport() {
    const [searchTerm, setSearchTerm] = useState("");
    const [diagnosticsReport, setDiagnosticsReport] = useState(null);
    const [runningDiagnostics, setRunningDiagnostics] = useState(false);

    // Fetch all relevant entities that have audit logs
    const { data: cars, isLoading: loadingCars } = useQuery({
        queryKey: ['vehicles_audit'],
        queryFn: () => base44.entities.Vehicle.list(),
        initialData: []
    });

    const { data: companies, isLoading: loadingCompanies } = useQuery({
        queryKey: ['companies_audit'],
        queryFn: () => base44.entities.CompanyProfile.list(),
        initialData: []
    });

    const { data: quotes, isLoading: loadingQuotes } = useQuery({
        queryKey: ['quotes_audit'],
        queryFn: () => base44.entities.Quote.list(),
        initialData: []
    });

    const { data: catalogue, isLoading: loadingCatalogue } = useQuery({
        queryKey: ['catalogue_audit'],
        queryFn: () => base44.entities.Catalogue.list(),
        initialData: []
    });

    const { data: clientQuotes, isLoading: loadingClientQuotes } = useQuery({
        queryKey: ['client_quotes_audit'],
        queryFn: () => base44.entities.ClientQuote.list(),
        initialData: []
    });

    const { data: vehicleConnectors, isLoading: loadingConnectors } = useQuery({
        queryKey: ['vehicle_connectors_audit'],
        queryFn: () => base44.entities.VehicleConnector.list(),
        initialData: []
    });

    const { data: quoteItems, isLoading: loadingQuoteItems } = useQuery({
        queryKey: ['quote_items_audit'],
        queryFn: () => base44.entities.QuoteItem.list(),
        initialData: []
    });

    const runDiagnostics = async () => {
        setRunningDiagnostics(true);
        
        // Simulate checking delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const report = {
            timestamp: new Date().toISOString(),
            status: "Healthy",
            checks: []
        };

        // 1. Check Data Integrity: Cars
        const carsWithoutDocs = cars.filter(c => !c.file_electrical_scheme && !c.file_sensors_actuators);
        report.checks.push({
            name: "Vehicle Documentation",
            status: carsWithoutDocs.length > 0 ? "Warning" : "Pass",
            details: carsWithoutDocs.length > 0 
                ? `${carsWithoutDocs.length} vehicles missing technical documents` 
                : "All vehicles have documentation"
        });

        // 2. Check Data Integrity: Quotes
        const orphanedQuotes = quotes.filter(q => !cars.find(c => c.id === q.car_profile_id));
        report.checks.push({
            name: "Quote References",
            status: orphanedQuotes.length > 0 ? "Fail" : "Pass",
            details: orphanedQuotes.length > 0 
                ? `${orphanedQuotes.length} quotes linked to non-existent cars` 
                : "All quotes linked to valid cars"
        });

        // 3. Check Data Integrity: Companies
        // Check if cars belong to users with profiles (loose check)
        const companyOwners = new Set(companies.map(c => c.created_by));
        const carsWithoutCompany = cars.filter(c => !companyOwners.has(c.created_by));
        report.checks.push({
            name: "User Onboarding",
            status: carsWithoutCompany.length > 0 ? "Warning" : "Pass",
            details: carsWithoutCompany.length > 0 
                ? `${carsWithoutCompany.length} vehicles created by users without company profile` 
                : "All vehicle owners have company profiles"
        });

        // 4. Check Catalogue
        const itemsWithoutImages = catalogue.filter(i => !i.image_url);
        report.checks.push({
            name: "Catalogue Completeness",
            status: itemsWithoutImages.length > 0 ? "Warning" : "Pass",
            details: itemsWithoutImages.length > 0 
                ? `${itemsWithoutImages.length} catalogue items missing images` 
                : "All catalogue items have images"
        });

        // 5. Check Vehicle Requirements (Connectors)
        const vehiclesWithoutConnectors = cars.filter(c => !vehicleConnectors.some(vc => vc.vehicle_id === c.id));
        report.checks.push({
            name: "Vehicle Parts Request",
            status: vehiclesWithoutConnectors.length > 0 ? "Warning" : "Pass",
            details: vehiclesWithoutConnectors.length > 0
                ? `${vehiclesWithoutConnectors.length} vehicles have no requested parts (connectors)`
                : "All vehicles have requested parts"
        });

        // 6. Check Client Quotes Integrity
        const emptyClientQuotes = clientQuotes.filter(cq => !cq.items || cq.items.length === 0);
        report.checks.push({
            name: "Client Quotes Content",
            status: emptyClientQuotes.length > 0 ? "Fail" : "Pass",
            details: emptyClientQuotes.length > 0
                ? `${emptyClientQuotes.length} client quotes have no items`
                : "All client quotes have items"
        });

        // 7. Check Supplier Quote Items
        const quotesWithoutItems = quotes.filter(q => !quoteItems.some(qi => qi.quote_id === q.id));
        report.checks.push({
            name: "Supplier Quote Detail",
            status: quotesWithoutItems.length > 0 ? "Warning" : "Pass",
            details: quotesWithoutItems.length > 0
                ? `${quotesWithoutItems.length} supplier quotes have no detailed line items`
                : "All supplier quotes have line items"
        });

        // 8. Check Production Status Consistency
        const orderedVehicles = cars.filter(c => ['ordered', 'in_production', 'shipped', 'delivered'].includes(c.status));
        const vehiclesWithWinner = new Set(quotes.filter(q => q.is_winner).map(q => q.vehicle_id));
        const inconsistentProduction = orderedVehicles.filter(c => !vehiclesWithWinner.has(c.id));
        
        report.checks.push({
            name: "Production Consistency",
            status: inconsistentProduction.length > 0 ? "Warning" : "Pass",
            details: inconsistentProduction.length > 0
                ? `${inconsistentProduction.length} vehicles in production without a winning supplier quote`
                : "All production vehicles have winning quotes"
        });

        // 9. Demo Data Verification
        const john = companies.find(c => c.company_name?.includes("Smith Auto"));
        const sarah = companies.find(c => c.company_name?.includes("Lee Logistics"));
        const tom = companies.find(c => c.company_name?.includes("Brown Motors"));
        const missingDemo = [];
        if (!john) missingDemo.push("John Smith");
        if (!sarah) missingDemo.push("Sarah Lee");
        if (!tom) missingDemo.push("Tom Brown");

        report.checks.push({
            name: "Demo Data Integrity",
            status: missingDemo.length > 0 ? "Fail" : "Pass",
            details: missingDemo.length > 0
                ? `Missing demo flows: ${missingDemo.join(", ")}`
                : "All 3 demo flows (John, Sarah, Tom) are present and active"
        });

        // Overall Status
        if (report.checks.some(c => c.status === "Fail")) report.status = "Critical";
        else if (report.checks.some(c => c.status === "Warning")) report.status = "Warning";

        setDiagnosticsReport(report);
        setRunningDiagnostics(false);
    };

    // Aggregate and normalize logs
    const allLogs = React.useMemo(() => {
        let logs = [];

        // Process Client Quote Logs
        clientQuotes.forEach(cq => {
             // For client quotes, we might not have audit_log property if it wasn't defined in schema or added later, 
             // but assuming standard entity behavior or if I added it. 
             // Looking at snapshot, ClientQuote has properties but audit_log wasn't explicitly in the snapshot schema for ClientQuote? 
             // Wait, I should check the schema for ClientQuote in snapshot.
             // Snapshot says: ClientQuote properties... no "audit_log" in the list?
             // Actually, the snapshot says "audit_log" IS in CompanyProfile, Vehicle, Quote.
             // But ClientQuote schema in snapshot: 
             /* 
             <entity name="ClientQuote">
                ...
                "properties": { ... },
                "required": [ ... ],
                "rls": { ... }
             }
             */
             // It does NOT list audit_log explicitly in properties in the snapshot for ClientQuote.
             // However, `base44` entities might have it if I added it or if it's there but not in snapshot.
             // But wait, the system prompt says "built_in_attributes... created_date, updated_date, created_by". 
             // "audit_log" is NOT a built-in attribute. It must be defined in the schema.
             // If it's not in the schema, I can't read it.
             // I'll skip ClientQuote logs for now to avoid errors if the property doesn't exist, 
             // OR I can check if it exists before iterating.
             
             // However, checking the snapshot again for ClientQuote:
             /*
             "properties": {
                "client_company_id": ...,
                "vehicle_id": ...,
                ...
                "status": ...,
                "notes": ...
              }
              */
             // No audit_log. So I won't add it to the logs section to avoid breaking it.
             // But I'll keep the diagnostics check I added since that uses `items` which IS in the schema.
        });

        // Process Car Logs
        cars.forEach(car => {
            if (car.audit_log && Array.isArray(car.audit_log)) {
                car.audit_log.forEach(log => {
                    logs.push({
                        ...log,
                        id: `vehicle-${car.id}-${log.date}`,
                        entityType: 'Vehicle',
                        entityName: `${car.brand} ${car.model}`,
                        entityId: car.id,
                        icon: Car
                    });
                });
            }
        });

        // Process Company Logs
        companies.forEach(company => {
            if (company.audit_log && Array.isArray(company.audit_log)) {
                company.audit_log.forEach(log => {
                    logs.push({
                        ...log,
                        id: `comp-${company.id}-${log.date}`,
                        entityType: 'Company',
                        entityName: company.company_name,
                        entityId: company.id,
                        icon: Building2
                    });
                });
            }
        });

        // Process Quote Logs
        quotes.forEach(quote => {
            if (quote.audit_log && Array.isArray(quote.audit_log)) {
                quote.audit_log.forEach(log => {
                    // Find related vehicle for better context if possible
                    const relatedCar = cars.find(c => c.id === quote.vehicle_id);
                    const carName = relatedCar ? `${relatedCar.brand} ${relatedCar.model}` : 'Unknown Vehicle';
                    
                    logs.push({
                        ...log,
                        id: `quote-${quote.id}-${log.date}`,
                        entityType: 'Quote',
                        entityName: `Quote for ${carName} (${quote.price} GBP)`,
                        entityId: quote.id,
                        icon: ClipboardList
                    });
                });
            }
        });

        // Sort by date descending (newest first)
        return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [cars, companies, quotes]);

    const filteredLogs = allLogs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLoading = loadingCars || loadingCompanies || loadingQuotes;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">System Audit Report</h1>
                    <p className="text-muted-foreground">Comprehensive log of all system activities and functionalities.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button 
                        onClick={runDiagnostics} 
                        disabled={runningDiagnostics || isLoading}
                        variant={diagnosticsReport?.status === 'Critical' ? 'destructive' : 'default'}
                    >
                        {runningDiagnostics ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                        {runningDiagnostics ? 'Running Tests...' : 'Run System Diagnostics'}
                    </Button>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search logs..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {diagnosticsReport && (
                <Card className={`border-l-4 ${
                    diagnosticsReport.status === 'Critical' ? 'border-l-red-500' : 
                    diagnosticsReport.status === 'Warning' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Diagnostics Report</span>
                            <Badge variant={diagnosticsReport.status === 'Healthy' || diagnosticsReport.status === 'Pass' ? 'default' : 'destructive'} className={
                                diagnosticsReport.status === 'Warning' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                            }>
                                System Status: {diagnosticsReport.status}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {diagnosticsReport.checks.map((check, idx) => (
                                <div key={idx} className="p-4 rounded bg-slate-50 dark:bg-slate-900 border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-sm">{check.name}</span>
                                        <Badge variant="outline" className={
                                            check.status === 'Pass' ? 'text-green-600 border-green-200' : 
                                            check.status === 'Warning' ? 'text-yellow-600 border-yellow-200' : 'text-red-600 border-red-200'
                                        }>{check.status}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{check.details}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground text-right">
                            Generated at: {moment(diagnosticsReport.timestamp).format('LLL')}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allLogs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Users (in logs)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Set(allLogs.map(l => l.by)).size}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Entities Tracked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cars.length + companies.length + quotes.length + clientQuotes.length}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {cars.length} Cars, {quotes.length} S.Quotes, {clientQuotes.length} C.Quotes
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading audit data...</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px]">Date & Time</TableHead>
                                        <TableHead>Entity</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Details (Prop Info)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No audit logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {moment(log.date).format('MMM D, YYYY HH:mm:ss')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="flex gap-1 items-center">
                                                            <log.icon className="h-3 w-3" />
                                                            {log.entityType}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {log.action}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                                                        {log.by}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {log.entityName}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}