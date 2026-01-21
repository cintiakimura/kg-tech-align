import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function InviteUserModal({ open, onOpenChange, initialRole = 'client' }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = React.useState({
        email: '',
        target_user_type: initialRole
    });

    React.useEffect(() => {
        if (open) {
            setFormData(prev => ({ ...prev, target_user_type: initialRole }));
        }
    }, [open, initialRole]);

    const inviteMutation = useMutation({
        mutationFn: async (data) => {
            // 1. Create Invitation Record
            await base44.entities.Invitation.create({
                email: data.email,
                target_user_type: data.target_user_type,
                status: 'pending'
            });

            // 2. Trigger System Invite (sends email)
            // Note: Managers (regular users) invite as 'user', Admins can invite as 'admin' if needed, 
            // but for safety we invite everyone as 'user' role first, and let the app logic handle the 'user_type'.
            // If the target is 'manager', we might want to invite as 'admin' role if they need admin privileges, 
            // but the prompt implies custom logic. We'll stick to 'user' role for everyone to be safe, 
            // unless the inviter is admin and inviting a manager/admin.
            
            // For simplicity and safety: Invite as 'user'. The Layout.js logic upgrades permissions based on user_type.
            await base44.users.inviteUser(data.email, "user");
        },
        onSuccess: () => {
            toast.success(`Invitation sent to ${formData.email}`);
            setFormData({ email: '', target_user_type: 'client' });
            onOpenChange(false);
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to send invitation. User might already exist.");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        inviteMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                    <DialogDescription>
                        Send an invitation email. The user will be automatically assigned the selected role upon login.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input 
                            id="email" 
                            type="email"
                            required
                            placeholder="colleague@example.com"
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select 
                            value={formData.target_user_type} 
                            onValueChange={(val) => setFormData({...formData, target_user_type: val})}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="supplier">Supplier</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                         <Button type="submit" disabled={inviteMutation.isPending}>
                            {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}