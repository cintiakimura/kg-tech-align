import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function FinancialAnalysis() {
    const { data: quotes, isLoading: loadingQuotes } = useQuery({
        queryKey: ['financialQuotes'],
        queryFn: () => base44.entities.ClientQuote.list(null, 1000),
    });

    const { data: vehicles, isLoading: loadingVehicles } = useQuery({
        queryKey: ['financialVehicles'],
        queryFn: () => base44.entities.Vehicle.list(null, 1000),
    });

    const { data: supplierQuotes, isLoading: loadingSupplierQuotes } = useQuery({
        queryKey: ['financialSupplierQuotes'],
        queryFn: () => base44.entities.Quote.list(null, 1000),
    });

    if (loadingQuotes || loadingVehicles || loadingSupplierQuotes) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    // 1. Calculate Income (From ClientQuotes where status is 'sale' or 'invoiced')
    const incomeQuotes = quotes?.filter(q => ['sale', 'invoiced'].includes(q.status)) || [];
    const totalIncome = incomeQuotes.reduce((sum, q) => {
        const itemsTotal = q.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) || 0;
        return sum + itemsTotal; // Excluding Tax for revenue? Or including? Usually revenue is ex VAT.
    }, 0);

    // 2. Calculate Costs (From Supplier Quotes that are 'selected' or 'is_winner')
    // Link Vehicle -> Winning Quote
    // Assuming 'ordered', 'in_production', 'shipped', 'delivered' vehicles have incurred costs
    const productionVehicles = vehicles?.filter(v => 
        ['ordered', 'in_production', 'in_transit', 'Shipped', 'delivered'].includes(v.status)
    ) || [];

    let totalCosts = 0;
    const costDetails = [];

    productionVehicles.forEach(v => {
        // Find winning quote for this vehicle
        const winningQuote = supplierQuotes?.find(sq => sq.vehicle_id === v.id && (sq.is_winner || sq.status === 'selected'));
        if (winningQuote) {
            // Cost = Price + Shipping + Import Tax
            const cost = (winningQuote.price || 0) + (winningQuote.shipping_cost || 0) + (winningQuote.importation_tax || 0);
            totalCosts += cost;
            costDetails.push({
                vehicle: `${v.brand} ${v.model}`,
                vin: v.vin,
                cost: cost,
                date: winningQuote.updated_date
            });
        }
    });

    const netProfit = totalIncome - totalCosts; // Currency mismatch potential here (EUR vs GBP), assuming 1:1 for simplicity or same currency

    // Prepare chart data (Monthly)
    const chartData = [];
    const months = {};

    // Aggregate Income by Month
    incomeQuotes.forEach(q => {
        const month = moment(q.date).format('YYYY-MM');
        if (!months[month]) months[month] = { name: month, income: 0, costs: 0 };
        const itemsTotal = q.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) || 0;
        months[month].income += itemsTotal;
    });

    // Aggregate Costs by Month
    costDetails.forEach(c => {
        const month = moment(c.date).format('YYYY-MM');
        if (!months[month]) months[month] = { name: month, income: 0, costs: 0 };
        months[month].costs += c.cost;
    });

    // Sort and convert to array
    Object.keys(months).sort().forEach(key => {
        chartData.push(months[key]);
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#212121] p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link to="/ManagerDashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Financial Analysis</h1>
                        <p className="text-muted-foreground">Overview of income, costs, and profit</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">€{totalIncome.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">From {incomeQuotes.length} sales</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">€{totalCosts.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">From {productionVehicles.length} supplier orders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <TrendingUp className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                €{netProfit.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Margin: {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value) => `€${value.toFixed(2)}`}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" name="Income" fill="#00C600" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="costs" name="Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sales Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>Latest invoiced or sold quotes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Quote #</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incomeQuotes.slice(0, 5).map(q => (
                                    <TableRow key={q.id}>
                                        <TableCell>{moment(q.date).format('YYYY-MM-DD')}</TableCell>
                                        <TableCell>{q.quote_number}</TableCell>
                                        <TableCell>
                                            <Badge variant={q.status === 'invoiced' ? 'default' : 'secondary'}>
                                                {q.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            €{(q.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) || 0).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}