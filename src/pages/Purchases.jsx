import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
    ShoppingCart, 
    Plus, 
    Search, 
    Loader2, 
    Printer, 
    Download,
    ArrowLeft,
    Calendar,
    Edit2,
    Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { exportToCSV } from '../components/utils/exportUtils';
import TruncatedCell from '@/components/TruncatedCell';

function PurchaseForm({ open, onOpenChange, purchase, onSuccess }) {
    const { register, handleSubmit, reset, setValue } = useForm();
    const queryClient = useQueryClient();
    
    React.useEffect(() => {
        if (purchase) {
            Object.keys(purchase).forEach(key => {
                setValue(key, purchase[key]);
            });
        } else {
            reset({
                product: '',
                supplier: '',
                cost: '',
                tracking_number: '',
                courier: '',
                delivery_date: '',
                status: 'ordered'
            });
        }
    }, [purchase, open, reset, setValue]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const formattedData = {
                ...data,
                cost: parseFloat(data.cost) || 0
            };
            
            if (purchase) {
                return await base44.entities.Purchase.update(purchase.id, formattedData);
            } else {
                return await base44.entities.Purchase.create(formattedData);
            }
        },
        onSuccess: () => {
            toast.success(purchase ? "Purchase updated" : "Purchase created");
            queryClient.invalidateQueries(['purchases']);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        },
        onError: (err) => {
            toast.error("Failed to save purchase: " + err.message);
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{purchase ? 'Edit Purchase' : 'New Purchase'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(mutation.mutate)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="product">Product</Label>
                        <Input id="product" {...register('product', { required: true })} placeholder="Product Name" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input id="supplier" {...register('supplier', { required: true })} placeholder="Supplier Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cost">Cost</Label>
                            <Input id="cost" type="number" step="0.01" {...register('cost')} placeholder="0.00" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="delivery_date">Delivery Date</Label>
                            <Input id="delivery_date" type="date" {...register('delivery_date')} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="courier">Courier</Label>
                        <Input id="courier" {...register('courier')} placeholder="DHL, FedEx, etc." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tracking_number">Tracking Number</Label>
                        <Input id="tracking_number" {...register('tracking_number')} placeholder="Tracking #" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <select 
                            id="status" 
                            {...register('status')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="ordered">Ordered</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Purchases() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['purchases'],
        queryFn: () => base44.entities.Purchase.list({
            sort: { created_date: -1 }
        })
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Purchase.delete(id),
        onSuccess: () => {
            toast.success("Purchase deleted");
            queryClient.invalidateQueries(['purchases']);
        }
    });

    const handleEdit = (purchase) => {
        setSelectedPurchase(purchase);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedPurchase(null);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this purchase?")) {
            deleteMutation.mutate(id);
        }
    };

    const filteredPurchases = purchases?.filter(p => 
        p.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreate} className="bg-primary-green hover:opacity-90 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Purchase
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline" onClick={() => exportToCSV(filteredPurchases, 'purchases_export')}>
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
                            placeholder="Search product, supplier, tracking..."
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
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Delivery Info</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPurchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No purchases found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPurchases.map((purchase) => (
                                        <TableRow key={purchase.id} className="group">
                                            <TableCell className="font-medium">
                                                <TruncatedCell text={purchase.product} />
                                            </TableCell>
                                            <TableCell>
                                                <TruncatedCell text={purchase.supplier} />
                                            </TableCell>
                                            <TableCell>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(purchase.cost || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        {purchase.delivery_date ? format(new Date(purchase.delivery_date), 'PPP') : 'No date'}
                                                    </div>
                                                    {purchase.courier && <div>via {purchase.courier}</div>}
                                                    {purchase.tracking_number && (
                                                        <div className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 w-fit px-1 rounded">
                                                            {purchase.tracking_number}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    purchase.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    purchase.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    purchase.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }>
                                                    {purchase.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(purchase)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(purchase.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <PurchaseForm 
                open={isFormOpen} 
                onOpenChange={setIsFormOpen} 
                purchase={selectedPurchase} 
            />
        </div>
    );
}