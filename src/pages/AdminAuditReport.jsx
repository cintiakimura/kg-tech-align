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

        // Overall Status
        if (report.checks.some(c => c.status === "Fail")) report.status = "Critical";
        else if (report.checks.some(c => c.status === "Warning")) report.status = "Warning";

        setDiagnosticsReport(report);
        setRunningDiagnostics(false);
    };

    // Aggregate and normalize logs
    const allLogs = React.useMemo(() => {
        let logs = [];

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
                        <div className="text-2xl font-bold">{cars.length + companies.length + quotes.length}</div>
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