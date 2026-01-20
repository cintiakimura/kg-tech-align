import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Package, Paperclip, Camera, LayoutGrid, List, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import EditProductModal from "@/components/catalogue/EditProductModal";

export default function Catalogue() {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list");
    const [editingProduct, setEditingProduct] = useState(null);
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
        queryFn: () => base44.entities.Catalogue.list(null, 1000),
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

    const handleImageUpload = async (id, file) => {
        if (!file) return;
        const toastId = toast.loading("Uploading image...");
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await base44.entities.Catalogue.update(id, { image_url: file_url });
            toast.success("Image updated", { id: toastId });
            queryClient.invalidateQueries(['catalogue']);
        } catch (e) {
            console.error(e);
            toast.error("Failed to upload", { id: toastId });
        }
    };

    const filteredItems = catalogue?.filter(item => {
        // Search by visible attributes only since PN is secret
        const search = searchTerm.toLowerCase();
        if (!search) return true;
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
                     <Button variant="outline" onClick={() => window.location.href = '/AdminImportCatalogue'}>
                        Upload CSV
                     </Button>
                )}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by pins, colour, type..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center px-3 py-2 bg-white border rounded text-xs font-medium text-gray-500">
                         {catalogue?.length || 0} Items
                    </div>
                    <div className="flex items-center border rounded-md bg-white">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className={`h-10 w-10 rounded-none rounded-l-md ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-200" />
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className={`h-10 w-10 rounded-none rounded-r-md ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
                    {[1,2,3,4,5,6].map(i => <Skeleton key={i} className={viewMode === 'grid' ? "h-48 w-full" : "h-24 w-full"} />)}
                </div>
            ) : (
                <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
                    {filteredItems.map((item) => (
                        <Card key={item.id} className={`overflow-hidden hover:shadow-md transition-all relative group ${viewMode === 'grid' ? 'flex h-48' : 'flex items-center p-2'}`}>
                            {/* Admin Controls */}
                            {user.role === 'admin' && (
                                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <label className="cursor-pointer bg-gray-900/10 hover:bg-gray-900/20 p-1.5 rounded-full transition-colors block backdrop-blur-sm" title="Upload new image">
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(item.id, e.target.files[0])}
                                            onClick={(e) => e.target.value = null} // Allow re-uploading same file
                                        />
                                        <Camera className="w-4 h-4 text-gray-700" />
                                    </label>
                                    <button 
                                        onClick={() => setEditingProduct(item)}
                                        className="bg-gray-900/10 hover:bg-gray-900/20 p-1.5 rounded-full transition-colors backdrop-blur-sm"
                                        title="Edit details"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-700" />
                                    </button>
                                </div>
                            )}

                            {/* Clean Product Image */}
                            <div className={`${viewMode === 'grid' ? 'w-48 border-r p-4' : 'w-24 h-20 p-2'} bg-white flex items-center justify-center shrink-0 relative`}>
                                {item.image_url ? (
                                    <img 
                                        src={item.image_url} 
                                        alt="Component" 
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                ) : (
                                    <Package className={`${viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'} text-gray-200`} />
                                )}
                            </div>
                            
                            {/* Details */}
                            <div className={`flex-1 p-4 flex ${viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row items-center justify-between gap-4'}`}>
                                <div className={`${viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-8'}`}>
                                    {viewMode === 'grid' ? (
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
                                    ) : (
                                        <>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 uppercase">Pins</span>
                                                <span className="font-bold">{item.pins || '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 uppercase">Colour</span>
                                                <span className="capitalize">{item.colour || '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 uppercase">Type</span>
                                                <Badge variant="secondary" className="font-normal capitalize">{item.type || 'Other'}</Badge>
                                            </div>
                                        </>
                                    )}
                                    
                                    {item.pdf_url && viewMode === 'grid' && (
                                        <div className="absolute top-4 right-4">
                                            <a 
                                                href={item.pdf_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="View Datasheet"
                                            >
                                                <Paperclip className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className={`${viewMode === 'grid' ? 'mt-2' : 'flex items-center gap-4'}`}>
                                    {item.pdf_url && viewMode === 'list' && (
                                        <a 
                                            href={item.pdf_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                                            title="View Datasheet"
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </a>
                                    )}

                                    {user?.user_type === 'supplier' ? (
                                        <div className="text-xs text-gray-400 italic px-2">
                                            View Only
                                        </div>
                                    ) : (
                                        <Button 
                                            size="sm"
                                            className={`${viewMode === 'grid' ? 'w-full' : ''} bg-[#00C600] hover:bg-[#00b300] h-8 text-xs`} 
                                            onClick={() => addToRequestMutation.mutate(item)}
                                            disabled={addToRequestMutation.isPending}
                                        >
                                            {addToRequestMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                            {viewMode === 'grid' ? 'Add to request' : 'Add'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            <EditProductModal 
                product={editingProduct} 
                open={!!editingProduct} 
                onOpenChange={(open) => !open && setEditingProduct(null)} 
            />
        </div>
    );
}