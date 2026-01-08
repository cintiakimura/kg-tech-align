import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
    Truck, 
    Search, 
    Loader2, 
    Printer, 
    Download,
    ArrowLeft,
    Calendar,
    ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { exportToCSV } from '../components/utils/exportUtils';
import TruncatedCell from '@/components/TruncatedCell';

export default function Logistics() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['purchases'],
        queryFn: () => base44.entities.Purchase.list({
            sort: { delivery_date: 1 } // Sort by delivery date ascending
        })
    });

    const filteredPurchases = purchases?.filter(p => 
        p.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.courier?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Filter only items that are not yet delivered for the main view? 
    // Or just show all with status? User said "fetch all info regarding delivery".
    // I'll show all but highlight pending.

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                            <Truck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Logistics</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" onClick={() => exportToCSV(filteredPurchases, 'logistics_export')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search product, tracking, courier..."
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
                                    <TableHead>Product</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Courier & Tracking</TableHead>
                                    <TableHead>Delivery Date</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPurchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No logistics data found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPurchases.map((purchase) => {
                                        const date = purchase.delivery_date ? new Date(purchase.delivery_date) : null;
                                        const isLate = date && isPast(date) && !isToday(date) && purchase.status !== 'delivered';
                                        
                                        return (
                                            <TableRow key={purchase.id}>
                                                <TableCell className="font-medium">
                                                    <TruncatedCell text={purchase.product} />
                                                </TableCell>
                                                <TableCell>
                                                    <TruncatedCell text={purchase.supplier} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium">{purchase.courier || '-'}</div>
                                                        {purchase.tracking_number && (
                                                            <div className="flex items-center gap-1">
                                                                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                                                    {purchase.tracking_number}
                                                                </code>
                                                                {/* Potential link to tracking if courier is known could go here */}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {date ? (
                                                        <div className={`flex items-center gap-2 ${isLate ? 'text-red-500 font-medium' : ''}`}>
                                                            <Calendar className="w-4 h-4" />
                                                            {format(date, 'PPP')}
                                                            {isLate && <span className="text-xs bg-red-100 text-red-600 px-1 rounded ml-1">Overdue</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className={
                                                        purchase.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        purchase.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        purchase.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }>
                                                        {purchase.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}