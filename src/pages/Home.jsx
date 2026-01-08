import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, ShoppingCart, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Home() {
    const handleLogin = (role, redirectPath) => {
        // Store the intended role to be picked up by Layout.js after login
        localStorage.setItem('intended_role', role);
        base44.auth.redirectToLogin(redirectPath);
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Welcome to KG Hub
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    The central platform for vehicle production, parts procurement, and logistics management.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                {/* Client Portal */}
                <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-[#00C600] group cursor-pointer" onClick={() => handleLogin('client', '/Onboarding')}>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-[#00C600]/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-8 h-8 text-[#00C600]" />
                        </div>
                        <CardTitle className="text-2xl">Client Portal</CardTitle>
                        <CardDescription>For Training Centers & Schools</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            Order training vehicles, manage your fleet, and access technical documentation.
                        </p>
                        <Button className="w-full bg-[#00C600] hover:bg-[#00b300] text-white">
                            Login as Client
                        </Button>
                    </CardContent>
                </Card>

                {/* Supplier Portal */}
                <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-500 group cursor-pointer" onClick={() => handleLogin('supplier', '/SupplierDashboard')}>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Building2 className="w-8 h-8 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl">Supplier Portal</CardTitle>
                        <CardDescription>For Parts Providers</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            View requests, submit quotes, and manage orders from KG Protech.
                        </p>
                        <Button className="w-full bg-blue-500 hover:bg-blue-600">
                            Login as Supplier
                        </Button>
                    </CardContent>
                </Card>

                {/* Manager Portal */}
                <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-purple-500 group cursor-pointer" onClick={() => handleLogin('manager', '/ManagerDashboard')}>
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-8 h-8 text-purple-500" />
                        </div>
                        <CardTitle className="text-2xl">Manager Portal</CardTitle>
                        <CardDescription>KG Protech Internal</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            Production control, logistics, financial analysis, and administration.
                        </p>
                        <Button className="w-full bg-purple-500 hover:bg-purple-600">
                            Login as Manager
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <div className="mt-16 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} KG PROTECH SAS. All rights reserved.</p>
            </div>
        </div>
    );
}