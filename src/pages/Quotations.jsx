import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Plus, ArrowLeft, Loader2, Printer, Download, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';
import { exportToCSV } from '@/components/utils/exportUtils';
import TruncatedCell from '@/components/TruncatedCell';

export default function Quotations() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch Quotes
    const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
        queryKey: ['allClientQuotes'],
        queryFn: () => base44.entities.ClientQuote.list({ sort: { date: -1 } }),
    });

    // Fetch Clients for mapping
    const { data: clients, isLoading: isLoadingClients } = useQuery({
        queryKey: ['allClients'],
        queryFn: () => base44.entities.CompanyProfile.list(),
    });

    if (isLoadingQuotes || isLoadingClients) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    const getClientName = (id) => {
        const client = clients?.find(c => c.id === id);
        return client ? client.company_name : 'Unknown Client';
    };

    const calculateTotal = (quote) => {
        const subtotal = quote.items?.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0) || 0;
        return subtotal * (1 + (quote.tva_rate / 100));
    };

    const filteredQuotes = quotes?.filter(quote => {
        const clientName = getClientName(quote.client_company_id).toLowerCase();
        const quoteNum = (quote.quote_number || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return clientName.includes(search) || quoteNum.includes(search);
    }) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Quotations / Sales</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to="/CreateClientQuote">
                        <Button className="bg-[#00C600] hover:bg-[#00b300] text-white gap-2">
                            <Plus className="w-4 h-4" />
                            New Quotation
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button variant="outline" onClick={() => exportToCSV(filteredQuotes, 'quotations_export')}>
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search client or quote number..."
                            className="pl-8 bg-white dark:bg-[#2a2a2a]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-md border bg-white dark:bg-[#2a2a2a] overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Quote Number</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No quotations found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredQuotes.map((quote) => (
                                        <TableRow 
                                            key={quote.id} 
                                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                            onClick={() => navigate(`/CreateClientQuote?id=${quote.id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                {moment(quote.date).format('MMM D, YYYY')}
                                            </TableCell>
                                            <TableCell>
                                                <TruncatedCell text={quote.quote_number || 'Draft'} />
                                            </TableCell>
                                            <TableCell>
                                                <TruncatedCell text={getClientName(quote.client_company_id)} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {quote.items?.length || 0}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                €{calculateTotal(quote).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`uppercase ${
                                                    quote.status === 'invoiced' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    quote.status === 'sale' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    quote.status === 'sent' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}>
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}