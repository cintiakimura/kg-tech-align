import React, { useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function ClientLogin() {
    useEffect(() => {
        localStorage.setItem('intended_role', 'client');
        base44.auth.redirectToLogin('/Onboarding');
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#00C600]" />
            <p className="text-muted-foreground">Redirecting to Client Portal login...</p>
        </div>
    );
}