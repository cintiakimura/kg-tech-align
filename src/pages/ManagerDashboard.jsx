import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, DollarSign, Package, Users } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['managerStats'],
    queryFn: async () => {
        // Parallel fetch for dashboard stats
        const [requests, quotes, cars, companies] = await Promise.all([
            base44.entities.PartRequest.list(),
            base44.entities.Quote.list(),
            base44.entities.CarProfile.list(),
            base44.entities.CompanyProfile.list()
        ]);
        return { requests, quotes, cars, companies };
    }
  });

  const getStatusColor = (status) => {
    switch(status) {
        case 'open': return 'bg-blue-500';
        case 'quoted': return 'bg-yellow-500';
        case 'ordered': return 'bg-purple-500';
        case 'shipped': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold">Mission Control</h1>
        <p className="text-muted-foreground">Overview of production, orders, and quotes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.requests?.length || 0}</div>
                <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.quotes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Waiting approval</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fleet Size</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.cars?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Vehicles managed</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients & Suppliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.companies?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Registered entities</p>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="production" className="w-full">
        <TabsList>
            <TabsTrigger value="production">Production Kanban</TabsTrigger>
            <TabsTrigger value="quotes">Quote Review</TabsTrigger>
        </TabsList>
        <TabsContent value="production" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {['open', 'quoted', 'ordered', 'in_production', 'shipped'].map(stage => (
                    <div key={stage} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[400px]">
                        <h3 className="font-semibold mb-4 uppercase text-xs text-gray-500 tracking-wider flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(stage)}`}></span>
                            {stage.replace('_', ' ')}
                        </h3>
                        <div className="space-y-3">
                            {stats?.requests?.filter(r => r.status === stage).map(req => (
                                <Card key={req.id} className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                                    <CardHeader className="p-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-mono text-xs text-muted-foreground">#{req.id.slice(-4)}</span>
                                            {req.priority === 'high' && <Badge variant="destructive" className="h-1.5 w-1.5 p-0 rounded-full" />}
                                        </div>
                                        <CardTitle className="text-sm font-medium mt-1 line-clamp-2">{req.description}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                            <span>{new Date(req.created_date).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </TabsContent>
        <TabsContent value="quotes">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Supplier Quotes</CardTitle>
                    <CardDescription>Review AI-parsed data and approve bids.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.quotes?.map(quote => (
                            <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">{quote.supplier_name}</p>
                                    <p className="text-sm text-muted-foreground">Bid: {quote.total_amount} {quote.currency}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={quote.status === 'approved' ? 'default' : 'outline'}>{quote.status}</Badge>
                                    <p className="text-xs text-muted-foreground mt-1">Lead time: {quote.lead_time_days} days</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.quotes || stats.quotes.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">No quotes received yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}