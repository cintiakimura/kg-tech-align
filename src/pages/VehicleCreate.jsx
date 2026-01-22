import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { createPageUrl } from '@/utils';
import VehicleSpecsForm from '../components/onboarding/fleet/VehicleSpecsForm';

export default function VehicleCreate() {
    const [clientEmail, setClientEmail] = useState("");

    // We need the user's email if creating a new vehicle (to assign client_email)
    React.useEffect(() => {
        base44.auth.me().then(user => {
            if (user) setClientEmail(user.email);
        });
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            <h1 className="text-2xl font-bold mb-6">Create New Vehicle</h1>
            <VehicleSpecsForm 
                clientEmail={clientEmail}
                initialData={null}
                onCancel={() => window.history.back()} 
                onSuccess={(savedVehicle) => {
                    // Redirect to the Connectors page after saving
                    if (savedVehicle?.id) {
                        // Small delay to ensure DB propagation
                        setTimeout(() => {
                            window.location.href = createPageUrl('VehicleConnectors') + `?vehicleId=${savedVehicle.id}`;
                        }, 1000);
                    }
                }}
            />
        </div>
    );
}