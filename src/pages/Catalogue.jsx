import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Loader2, Package, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Catalogue() {
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        base44.auth.me().then(u => {
            if (!u) base44.auth.redirectToLogin();
            setUser(u);
        }).catch(() => base44.auth.redirectToLogin());
    }, []);

    const { data: catalogue, isLoading } = useQuery({
        queryKey: ['catalogue'],
        queryFn: () => base44.entities.Catalogue.list(),
    });

    const addToRequestMutation = useMutation({
        mutationFn: async (part) => {
            await base44.entities.RequestItem.create({
                user_email: user.email,
                catalogue_id: part.id,
                catalogue_part_number: "SECRET", // Don't expose part number
                status: 'pending'
            });
        },
        onSuccess: () => {
            toast.success("Added to your request");
            queryClient.invalidateQueries(['myRequests']);
        },
        onError: () => {
            toast.error("Failed to add to request");
        }
    });

    const filteredItems = catalogue?.filter(item => {
        // Search by visible attributes only since PN is secret
        const search = searchTerm.toLowerCase();
        return (
            (item.colour && item.colour.toLowerCase().includes(search)) ||
            (item.type && item.type.toLowerCase().includes(search)) ||
            (item.pins && item.pins.toString().includes(search))
        );
    }) || [];

    if (!user) return null;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Catalogue</h1>
                    <p className="text-muted-foreground">Select components for your project.</p>
                </div>
                {/* Admin Import Button - Only visible to admins */}
                {user.role === 'admin' && (
                     <Button variant="outline" onClick={() => window.location.href = '/admin/import-catalogue'}>
                        Import from Google Sheet
                     </Button>
                )}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by pins, colour, type..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden flex h-48 hover:shadow-md transition-all">
                            {/* Left: Clean Product Image */}
                            <div className="w-48 bg-white p-4 flex items-center justify-center border-r shrink-0">
                                {item.image_url ? (
                                    <img 
                                        src={item.image_url} 
                                        alt="Component" 
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                ) : (
                                    <Package className="w-12 h-12 text-gray-200" />
                                )}
                            </div>
                            
                            {/* Right: Details */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-gray-500 w-14">Pins:</span>
                                                <span className="font-bold">{item.pins || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-gray-500 w-14">Colour:</span>
                                                <span className="capitalize">{item.colour || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-gray-500 w-14">Type:</span>
                                                <Badge variant="secondary" className="font-normal capitalize">{item.type || 'Other'}</Badge>
                                            </div>
                                        </div>
                                        
                                        {item.pdf_url && (
                                            <a 
                                                href={item.pdf_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="View Datasheet"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2">
                                    {user?.user_type === 'supplier' ? (
                                        <div className="text-xs text-gray-400 text-center py-2 italic">
                                            View Only
                                        </div>
                                    ) : (
                                        <Button 
                                            size="sm"
                                            className="w-full bg-[#00C600] hover:bg-[#00b300] h-8 text-xs" 
                                            onClick={() => addToRequestMutation.mutate(item)}
                                            disabled={addToRequestMutation.isPending}
                                        >
                                            {addToRequestMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3 mr-2" />}
                                            Add to request
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}