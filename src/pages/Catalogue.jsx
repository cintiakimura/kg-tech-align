import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Catalogue() {
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        base44.auth.me().then(setUser).catch(() => {});
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
                catalogue_part_number: part.part_number,
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

    const filteredItems = catalogue?.filter(item => 
        item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Component Catalogue</h1>
                    <p className="text-muted-foreground">Browse and request parts for your project.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search parts..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all">
                            <div className="aspect-square bg-white p-4 flex items-center justify-center border-b">
                                {item.image_url ? (
                                    <img 
                                        src={item.image_url} 
                                        alt={item.part_number} 
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Package className="w-16 h-16 text-gray-300" />
                                )}
                            </div>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-bold">{item.part_number}</CardTitle>
                                    <Badge variant="outline">{item.type}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 py-2 flex-grow space-y-2">
                                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded">Pin: {item.pins || '-'}</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded">Color: {item.color || '-'}</span>
                                </div>
                                {item.technical_pdf_url && (
                                    <a 
                                        href={item.technical_pdf_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-2 block"
                                    >
                                        View Technical Datasheet (PDF)
                                    </a>
                                )}
                            </CardContent>
                            <CardFooter className="p-4 pt-2">
                                {user?.user_type === 'supplier' ? (
                                    <Button variant="ghost" disabled className="w-full text-xs">
                                        View Only
                                    </Button>
                                ) : (
                                    <Button 
                                        className="w-full bg-[#00C600] hover:bg-[#00b300]" 
                                        onClick={() => addToRequestMutation.mutate(item)}
                                        disabled={addToRequestMutation.isPending}
                                    >
                                        {addToRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                                        Add to my request
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}