import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function VehicleList({ vehicles, onAddVehicle, onSelectVehicle, onDeleteVehicle, onEditVehicle }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-[#2a2a2a] p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold uppercase tracking-wider">Vehicles</h3>
                <Button 
                    onClick={() => window.location.href = createPageUrl('VehicleCreate')}
                    className="bg-[#00C600] hover:bg-[#00b300] text-white font-bold uppercase"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    create new vehicle
                </Button>
            </div>
            
            <div className="flex flex-col gap-4">
                {vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="bg-white dark:bg-[#2a2a2a] border-none shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {vehicle.vehicle_number && (
                                        <span className="text-xs font-mono font-bold text-[#00C600] bg-[#00C600]/10 px-2 py-0.5 rounded border border-[#00C600]/20">
                                            {vehicle.vehicle_number}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-lg font-bold uppercase">
                                    {vehicle.brand} {vehicle.model} {vehicle.year} {vehicle.fuel}
                                </h4>
                                <p className="uppercase text-xs font-semibold text-muted-foreground mt-1">
                                    {vehicle.engine_size} {vehicle.engine_power} {vehicle.engine_code} {vehicle.number_gears}-GEAR {vehicle.transmission_type}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs"
                                    onClick={() => window.location.href = createPageUrl('VehicleDetail') + `?id=${vehicle.id}`}
                                >
                                    View Details
                                </Button>
                                <div className="flex gap-1 border-l pl-3 dark:border-gray-700">
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = createPageUrl('VehicleEdit') + `?vehicleId=${vehicle.id}`;
                                        }}
                                        title="Edit Vehicle"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteVehicle(vehicle.id);
                                        }}
                                        title="Delete Vehicle"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                {vehicles.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-white dark:bg-[#2a2a2a] rounded-lg">
                        No vehicles found. Click the button above to create one.
                    </div>
                )}
            </div>
        </div>
    );
}