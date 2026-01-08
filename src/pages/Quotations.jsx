import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Plus, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import moment from 'moment';
import TruncatedCell from '@/components/TruncatedCell';
import { Link } from 'react-router-dom';

export default function Quotations() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: quotes, isLoading: loadingQuotes } = useQuery({
        queryKey: ['clientQuotes'],
        queryFn: () => base44.entities.ClientQuote.list(),
    });

    const { data: companies, isLoading: loadingCompanies } = useQuery({
        queryKey: ['allCompanies'],
        queryFn: () => base44.entities.CompanyProfile.list(),
    });

    if (loadingQuotes || loadingCompanies) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    const getClientName = (id) => {
        const company = companies?.find(c => c.id === id);
        return company ? company.company_name : id;
    };

    const calculateTotal = (items) => {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    const filteredQuotes = quotes?.filter(q => {
        const clientName = getClientName(q.client_company_id).toLowerCase();
        const quoteNum = q.quote_number?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return clientName.includes(search) || quoteNum.includes(search);
    }) || [];

    const statusColors = {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800",
        accepted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        sale: "bg-purple-100 text-purple-800",
        invoiced: "bg-indigo-100 text-indigo-800"
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 min-h-screen bg-gray-50 dark:bg-[#212121] p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
                                <p className="text-muted-foreground">Manage client sales quotations</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/CreateClientQuote')} className="bg-[#00C600] hover:bg-[#00b300] text-white gap-2">
                        <Plus className="w-4 h-4" />
                        New Quotation
                    </Button>
                </div>

                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border overflow-hidden p-4">
                    <div className="mb-4 w-full md:w-72">
                         <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search quotes..." 
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50 h-12">
                                    <TableHead className="w-[150px]">Quote #</TableHead>
                                    <TableHead className="w-[200px]">Client</TableHead>
                                    <TableHead className="w-[120px]">Date</TableHead>
                                    <TableHead className="w-[120px]">Valid Until</TableHead>
                                    <TableHead className="w-[100px] text-right">Items</TableHead>
                                    <TableHead className="w-[120px] text-right">Total (ex. VAT)</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                            No quotations found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredQuotes.map((quote) => (
                                        <TableRow key={quote.id} className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <TableCell>
                                                <TruncatedCell text={quote.quote_number} className="font-medium" />
                                            </TableCell>
                                            <TableCell>
                                                <TruncatedCell text={getClientName(quote.client_company_id)} />
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{quote.date ? moment(quote.date).format('YYYY-MM-DD') : '-'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{quote.valid_until ? moment(quote.valid_until).format('YYYY-MM-DD') : '-'}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm">{quote.items?.length || 0}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                £{calculateTotal(quote.items).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${statusColors[quote.status] || 'bg-gray-100'} capitalize`}>
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/CreateClientQuote?id=${quote.id}`)}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}