import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SupplierLogin() {
    const handleLogin = () => {
        localStorage.setItem('intended_role', 'supplier');
        base44.auth.redirectToLogin('/SupplierDashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#212121] p-4">
            <Card className="w-full max-w-md shadow-2xl border-blue-500/20">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🏭</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">Supplier Portal</CardTitle>
                    <CardDescription className="text-lg">
                        Manage quotes and product catalogues
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleLogin}
                        className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-[1.02]"
                    >
                        Login as Supplier
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}