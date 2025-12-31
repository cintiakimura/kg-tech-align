import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Car, Building2, ClipboardList } from "lucide-react";
import moment from 'moment';

export default function AdminAuditReport() {
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch all relevant entities that have audit logs
    const { data: cars, isLoading: loadingCars } = useQuery({
        queryKey: ['cars_audit'],
        queryFn: () => base44.entities.CarProfile.list(),
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

    // Aggregate and normalize logs
    const allLogs = React.useMemo(() => {
        let logs = [];

        // Process Car Logs
        cars.forEach(car => {
            if (car.audit_log && Array.isArray(car.audit_log)) {
                car.audit_log.forEach(log => {
                    logs.push({
                        ...log,
                        id: `car-${car.id}-${log.date}`,
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
                    // Find related car for better context if possible
                    const relatedCar = cars.find(c => c.id === quote.car_profile_id);
                    const carName = relatedCar ? `${relatedCar.brand} ${relatedCar.model}` : 'Unknown Car';
                    
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