import React, { useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function ManagerLogin() {
    useEffect(() => {
        localStorage.setItem('intended_role', 'manager');
        base44.auth.redirectToLogin('/ManagerDashboard');
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-muted-foreground">Redirecting to Manager Portal login...</p>
        </div>
    );
}