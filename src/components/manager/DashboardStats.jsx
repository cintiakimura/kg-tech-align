import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Car, FileText } from 'lucide-react';

export default function DashboardStats({ companies = [], cars = [] }) {
  const stats = useMemo(() => {
    const totalCompanies = companies.length;
    const totalCars = cars.length;
    const totalDocs = cars.reduce((acc, car) => {
        let count = 0;
        if (car.file_electrical_scheme) count++;
        if (car.file_sensors_actuators) count++;
        return acc + count;
    }, 0);
    
    // Unique clients (based on created_by email)
    const clients = new Set([
        ...companies.map(c => c.created_by),
        ...cars.map(c => c.created_by)
    ]);

    return {
        clients: clients.size,
        companies: totalCompanies,
        cars: totalCars,
        documents: totalDocs
    };
  }, [companies, cars]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.clients}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Registered Companies</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.companies}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.cars}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents}</div>
        </CardContent>
      </Card>
    </div>
  );
}