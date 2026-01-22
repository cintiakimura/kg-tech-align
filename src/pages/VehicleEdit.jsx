import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import VehicleSpecsForm from '../components/onboarding/fleet/VehicleSpecsForm';

export default function VehicleEdit() {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('vehicleId');
    const [clientEmail, setClientEmail] = useState("");

    // If we have an ID, fetch the vehicle data
    const { data: vehicle, isLoading } = useQuery({
        queryKey: ['vehicle', vehicleId],
        queryFn: () => base44.entities.Vehicle.filter({ id: vehicleId }).then(res => res[0]),
        enabled: !!vehicleId,
    });

    // We also need the user's email if creating a new vehicle (to assign client_email)
    React.useEffect(() => {
        base44.auth.me().then(user => {
            if (user) setClientEmail(user.email);
        });
    }, []);

    if (vehicleId && isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <VehicleSpecsForm 
                clientEmail={clientEmail}
                initialData={vehicle}
                onCancel={() => window.location.href = createPageUrl('Onboarding')} 
                onSuccess={(savedVehicle) => {
                    // Redirect to the Detail page after saving
                    if (savedVehicle?.id) {
                        window.location.href = createPageUrl('VehicleDetail') + `?vehicleId=${savedVehicle.id}`;
                    } else {
                        window.location.href = createPageUrl('Onboarding');
                    }
                }}
            />
        </div>
    );
}