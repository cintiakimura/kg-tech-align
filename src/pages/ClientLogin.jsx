import React from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ClientLogin() {
    const handleLogin = () => {
        localStorage.setItem('intended_role', 'client');
        base44.auth.redirectToLogin('/Onboarding');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#212121] p-4">
            <Card className="w-full max-w-md shadow-2xl border-[#00C600]/20">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-[#00C600]/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🏢</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-[#00C600]">Client Portal</CardTitle>
                    <CardDescription className="text-lg">
                        Access your vehicle fleet and orders
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleLogin}
                        className="w-full h-14 text-lg font-semibold bg-[#00C600] hover:bg-[#00C600]/90 text-white shadow-lg transition-all hover:scale-[1.02]"
                    >
                        Login as Client
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}