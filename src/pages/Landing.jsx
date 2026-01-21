import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Users, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#212121] dark:to-[#1a1a1a] flex flex-col">
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-[#00C600] blur-[100px] opacity-20 rounded-full w-64 h-64 mx-auto"></div>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691ced529360bd8b67161013/ed2352d66_LOGOKG.png" 
            alt="KG Hub" 
            className="h-32 w-auto relative z-10 mx-auto"
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 relative z-10">
          Welcome to <span className="text-[#00C600]">KG Hub</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-12 relative z-10">
          The central platform for vehicle production, parts procurement, and logistics management.
          Select your role to get started.
        </p>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10">
          
          {/* Client Card */}
          <Card className="border-2 hover:border-[#00C600] transition-all duration-300 group bg-white dark:bg-[#2a2a2a]">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Client Portal</CardTitle>
              <CardDescription>For vehicle owners and buyers</CardDescription>
            </CardHeader>
            <CardContent className="text-left text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">✓ View vehicle status</li>
                <li className="flex items-center gap-2">✓ Approve quotes</li>
                <li className="flex items-center gap-2">✓ Track shipments</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link to="/ClientLogin" className="w-full">
                <Button className="w-full group-hover:bg-blue-600 group-hover:text-white" variant="outline">
                  Enter as Client <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Supplier Card */}
          <Card className="border-2 hover:border-[#00C600] transition-all duration-300 group bg-white dark:bg-[#2a2a2a]">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Supplier Portal</CardTitle>
              <CardDescription>For parts and logistics partners</CardDescription>
            </CardHeader>
            <CardContent className="text-left text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">✓ Submit quotations</li>
                <li className="flex items-center gap-2">✓ Manage orders</li>
                <li className="flex items-center gap-2">✓ Update stock</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link to="/SupplierLogin" className="w-full">
                <Button className="w-full group-hover:bg-orange-600 group-hover:text-white" variant="outline">
                  Enter as Supplier <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Manager Card */}
          <Card className="border-2 hover:border-[#00C600] transition-all duration-300 group bg-white dark:bg-[#2a2a2a]">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Management</CardTitle>
              <CardDescription>For KG Protech staff</CardDescription>
            </CardHeader>
            <CardContent className="text-left text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">✓ Production control</li>
                <li className="flex items-center gap-2">✓ User administration</li>
                <li className="flex items-center gap-2">✓ System analytics</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link to="/ManagerLogin" className="w-full">
                <Button className="w-full group-hover:bg-purple-600 group-hover:text-white" variant="outline">
                  Enter as Manager <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

        </div>
      </div>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure Platform</span>
        </div>
        <p>&copy; {new Date().getFullYear()} KG Protech SAS. All rights reserved.</p>
      </footer>
    </div>
  );
}