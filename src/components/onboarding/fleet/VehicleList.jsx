import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from 'lucide-react';

export default function VehicleList({ vehicles, onAddVehicle, onSelectVehicle, onDeleteVehicle, onEditVehicle }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-wider">Vehicles</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="bg-gray-100 border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold uppercase">
                                {vehicle.brand} {vehicle.model} {vehicle.year} {vehicle.fuel}
                            </CardTitle>
                            <CardDescription className="uppercase text-xs font-semibold text-gray-600">
                                {vehicle.engine_size} {vehicle.engine_power} {vehicle.engine_code} {vehicle.number_gears}-GEAR {vehicle.transmission_type}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="flex flex-wrap gap-2">
                                <Button 
                                    className="bg-[#00C600] hover:bg-[#00b300] text-white font-bold uppercase text-xs"
                                    onClick={() => onSelectVehicle(vehicle)}
                                >
                                    Connectors
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="uppercase text-xs font-bold"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditVehicle(vehicle);
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="uppercase text-xs font-bold"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteVehicle(vehicle.id);
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                <div className="flex items-center justify-start p-6">
                    <Button 
                        onClick={onAddVehicle}
                        className="bg-[#00C600] hover:bg-[#00b300] text-white font-bold uppercase"
                    >
                        + Vehicle
                    </Button>
                </div>
            </div>
        </div>
    );
}