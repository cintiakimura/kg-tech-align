import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function EditProductModal({ product, open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = React.useState({
        pins: '',
        colour: '',
        type: 'other',
        secret_part_number: '',
        pdf_url: ''
    });

    React.useEffect(() => {
        if (product) {
            setFormData({
                pins: product.pins || '',
                colour: product.colour || '',
                type: product.type || 'other',
                secret_part_number: product.secret_part_number || '',
                pdf_url: product.pdf_url || ''
            });
        }
    }, [product]);

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                pins: data.pins ? parseInt(data.pins) : null
            };
            await base44.entities.Catalogue.update(product.id, payload);
        },
        onSuccess: () => {
            toast.success("Product updated");
            queryClient.invalidateQueries(['catalogue']);
            onOpenChange(false);
        },
        onError: () => {
            toast.error("Failed to update product");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pn" className="text-right">Part No</Label>
                        <Input 
                            id="pn" 
                            value={formData.secret_part_number} 
                            onChange={(e) => setFormData({...formData, secret_part_number: e.target.value})}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pins" className="text-right">Pins</Label>
                        <Input 
                            id="pins" 
                            type="number"
                            value={formData.pins} 
                            onChange={(e) => setFormData({...formData, pins: e.target.value})}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="colour" className="text-right">Colour</Label>
                        <Input 
                            id="colour" 
                            value={formData.colour} 
                            onChange={(e) => setFormData({...formData, colour: e.target.value})}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select 
                            value={formData.type} 
                            onValueChange={(val) => setFormData({...formData, type: val})}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="connector">Connector</SelectItem>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pdf" className="text-right">PDF URL</Label>
                        <Input 
                            id="pdf" 
                            value={formData.pdf_url} 
                            onChange={(e) => setFormData({...formData, pdf_url: e.target.value})}
                            className="col-span-3" 
                        />
                    </div>
                    <DialogFooter>
                         <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}