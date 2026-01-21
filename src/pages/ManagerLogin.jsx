import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ManagerLogin() {
    const handleLogin = () => {
        localStorage.setItem('intended_role', 'manager');
        base44.auth.redirectToLogin('/ManagerDashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#212121] p-4">
            <Card className="w-full max-w-md shadow-2xl border-purple-500/20">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">👔</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">Manager Portal</CardTitle>
                    <CardDescription className="text-lg">
                        Administration and Logistics Control
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleLogin}
                        className="w-full h-14 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all hover:scale-[1.02]"
                    >
                        Login as Manager
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}