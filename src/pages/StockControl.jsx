import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Save, Package, AlertTriangle, MapPin, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import TruncatedCell from '@/components/TruncatedCell';
import { exportToCSV } from '@/components/utils/exportUtils';

export default function StockControl() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [editingStock, setEditingStock] = useState({});

    // Fetch all catalogue items
    const { data: catalogue, isLoading } = useQuery({
        queryKey: ['catalogue_stock'],
        queryFn: () => base44.entities.Catalogue.list(null, 1000),
    });

    const updateStockMutation = useMutation({
        mutationFn: async ({ id, quantity, location, min_level }) => {
            await base44.entities.Catalogue.update(id, { 
                stock_quantity: parseInt(quantity),
                stock_location: location,
                min_stock_level: parseInt(min_level)
            });
        },
        onSuccess: () => {
            toast.success("Stock updated");
            queryClient.invalidateQueries(['catalogue_stock']);
            setEditingStock({});
        },
        onError: () => toast.error("Failed to update stock")
    });

    // Filter logic
    const filteredItems = catalogue?.filter(item => {
        const matchesSearch = 
            item.secret_part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.colour?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.stock_location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const hasStock = (item.stock_quantity || 0) > 0;
        
        // Show if matches search AND (is in stock OR we are showing all)
        return matchesSearch && (hasStock || showAll);
    }) || [];

    const handleQuickUpdate = (item, field, value) => {
        const currentEdit = editingStock[item.id] || { 
            quantity: item.stock_quantity || 0,
            location: item.stock_location || '',
            min_level: item.min_stock_level || 10
        };
        
        const updatedEdit = { ...currentEdit, [field]: value };
        setEditingStock({ ...editingStock, [item.id]: updatedEdit });
    };

    const saveChanges = (item) => {
        const changes = editingStock[item.id];
        if (!changes) return;

        updateStockMutation.mutate({
            id: item.id,
            quantity: changes.quantity,
            location: changes.location,
            min_level: changes.min_level
        });
    };

    const handleExport = () => {
        const data = filteredItems.map(item => ({
            PartNumber: item.secret_part_number,
            Type: item.type,
            Colour: item.colour,
            Pins: item.pins,
            Location: item.stock_location,
            Quantity: item.stock_quantity,
            MinLevel: item.min_stock_level,
            Status: item.stock_quantity === 0 ? 'Out of Stock' : (item.stock_quantity <= (item.min_stock_level || 10) ? 'Low' : 'In Stock')
        }));
        exportToCSV(data, 'stock_inventory_export');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#212121] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/ManagerDashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Stock Management</h1>
                            <p className="text-muted-foreground">Monitor inventory levels and locations</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border p-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search part number, type, location..." 
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="show-all" className="cursor-pointer">Show All (including 0 stock)</Label>
                            <Switch 
                                id="show-all" 
                                checked={showAll}
                                onCheckedChange={setShowAll}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table className="table-fixed min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead className="w-[200px]">Part Number / Details</TableHead>
                                    <TableHead className="w-[150px]">Location</TableHead>
                                    <TableHead className="w-[100px] text-right">Min. Level</TableHead>
                                    <TableHead className="w-[100px] text-right">Quantity</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No items found in stock. Toggle "Show All" to see out-of-stock items.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => {
                                        const isEditing = !!editingStock[item.id];
                                        const currentQty = isEditing ? editingStock[item.id].quantity : (item.stock_quantity || 0);
                                        const currentLoc = isEditing ? editingStock[item.id].location : (item.stock_location || '');
                                        const currentMin = isEditing ? editingStock[item.id].min_level : (item.min_stock_level || 10);
                                        const isLowStock = currentQty <= currentMin;

                                        return (
                                            <TableRow key={item.id} className="bg-white dark:bg-[#2a2a2a] hover:bg-transparent hover:shadow-md hover:border-l-4 hover:border-l-indigo-500 transition-all border-b">
                                                <TableCell>
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" className="w-10 h-10 object-contain mix-blend-multiply border rounded bg-white" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <TruncatedCell text={item.secret_part_number || 'N/A'} className="font-semibold" />
                                                    <TruncatedCell text={`${item.type} • ${item.colour} • ${item.pins} pins`} className="text-xs text-muted-foreground capitalize" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        <Input 
                                                            className="h-8 w-28 text-xs" 
                                                            value={currentLoc}
                                                            onChange={(e) => handleQuickUpdate(item, 'location', e.target.value)}
                                                            placeholder="A1-01"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input 
                                                        type="number" 
                                                        className="h-8 w-20 ml-auto text-right" 
                                                        value={currentMin}
                                                        onChange={(e) => handleQuickUpdate(item, 'min_level', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input 
                                                        type="number" 
                                                        className={`h-8 w-24 ml-auto text-right font-mono ${currentQty === 0 ? 'text-red-500 font-bold' : ''}`}
                                                        value={currentQty}
                                                        onChange={(e) => handleQuickUpdate(item, 'quantity', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {currentQty === 0 ? (
                                                        <Badge variant="destructive">Out of Stock</Badge>
                                                    ) : isLowStock ? (
                                                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> Low
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">In Stock</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing && (
                                                        <Button size="sm" onClick={() => saveChanges(item)} className="h-8 w-8 p-0">
                                                            <Save className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}