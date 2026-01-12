import React, { useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function SupplierLogin() {
    useEffect(() => {
        localStorage.setItem('intended_role', 'supplier');
        base44.auth.redirectToLogin('/SupplierDashboard');
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-muted-foreground">Redirecting to Supplier Portal login...</p>
        </div>
    );
}