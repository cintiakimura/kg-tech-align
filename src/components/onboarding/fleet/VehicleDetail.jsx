import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Image as ImageIcon } from 'lucide-react';

export default function VehicleDetail({ vehicle, onBack, onAddConnector }) {
    const { data: connectors, isLoading } = useQuery({
        queryKey: ['connectors', vehicle.id],
        queryFn: () => base44.entities.VehicleConnector.list({ vehicle_id: vehicle.id })
    });

    return (
        <div className="flex gap-6 flex-col md:flex-row">
            {/* Vehicle Info Side Panel */}
            <div className="w-full md:w-1/3 space-y-4">
                <Card className="bg-gray-50 dark:bg-white/5 border-none shadow-sm">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold uppercase mb-2">
                            {vehicle.brand} {vehicle.model} {vehicle.year} {vehicle.fuel}
                        </h2>
                        <p className="text-sm font-semibold text-muted-foreground uppercase leading-relaxed">
                            {vehicle.engine_size} {vehicle.engine_power}<br/>
                            {vehicle.engine_code}<br/>
                            {vehicle.number_gears}-GEAR {vehicle.transmission_type}
                        </p>
                        <Button onClick={onBack} variant="outline" className="mt-6 w-full uppercase font-bold text-xs">
                            Back to Vehicles
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Connectors List */}
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-500 uppercase">Connectors</h3>
                </div>

                {isLoading ? (
                    <Loader2 className="animate-spin w-8 h-8 text-[#00C600]" />
                ) : connectors && connectors.length > 0 ? (
                    <div className="space-y-6">
                        {connectors.map((conn, index) => (
                            <div key={conn.id} className="bg-gray-100 p-6 rounded-lg space-y-4">
                                <h4 className="font-bold uppercase text-lg">
                                    {conn.calculator_system || "Unknown System"}
                                </h4>
                                {conn.notes && <p className="text-sm text-gray-600">{conn.notes}</p>}
                                
                                <div className="flex flex-wrap gap-2">
                                    {[conn.image_1, conn.image_2, conn.image_3].filter(Boolean).map((img, i) => (
                                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="bg-[#00C600] hover:bg-[#00b300] text-white text-xs font-bold uppercase px-3 py-2 rounded inline-flex items-center gap-2">
                                            <ImageIcon className="w-3 h-3" /> Photo {i+1}
                                        </a>
                                    ))}
                                    
                                    {conn.file_wiring_diagram && (
                                        <a href={conn.file_wiring_diagram} target="_blank" rel="noopener noreferrer" className="bg-[#00C600] hover:bg-[#00b300] text-white text-xs font-bold uppercase px-3 py-2 rounded inline-flex items-center gap-2">
                                            <FileText className="w-3 h-3" /> Wiring Diagram
                                        </a>
                                    )}
                                    
                                    {conn.file_pinning_list && (
                                        <a href={conn.file_pinning_list} target="_blank" rel="noopener noreferrer" className="bg-[#00C600] hover:bg-[#00b300] text-white text-xs font-bold uppercase px-3 py-2 rounded inline-flex items-center gap-2">
                                            <FileText className="w-3 h-3" /> Pinning List
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 font-medium">No connectors added yet.</p>
                    </div>
                )}
                
                <Button 
                    onClick={onAddConnector}
                    className="bg-[#00C600] hover:bg-[#00b300] text-white font-bold uppercase"
                >
                    + Connector
                </Button>
            </div>
        </div>
    );
}