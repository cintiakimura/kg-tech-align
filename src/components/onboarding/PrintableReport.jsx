import React from 'react';
import { CheckCircle2, Car, Building2 } from 'lucide-react';

export default function PrintableReport({ companyProfile, carProfiles }) {
  if (!companyProfile && (!carProfiles || carProfiles.length === 0)) return null;

  return (
    <div className="hidden print:block p-8 bg-white text-black">
      <div className="mb-8 border-b pb-4">
        <div className="flex justify-between items-center mb-4">
           <h1 className="text-3xl font-bold">Client Onboarding Report</h1>
           <div className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Company Section */}
      {companyProfile && (
        <div className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold border-b-2 border-black mb-4 pb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Company Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold block text-sm text-gray-600">Company Name</span>
              <span>{companyProfile.company_name}</span>
            </div>
            <div>
              <span className="font-semibold block text-sm text-gray-600">Tax / VAT ID</span>
              <span>{companyProfile.tax_id || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold block text-sm text-gray-600">Contact Email</span>
              <span>{companyProfile.contact_email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold block text-sm text-gray-600">Phone</span>
              <span>{companyProfile.phone || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold block text-sm text-gray-600">Address</span>
              <span>{companyProfile.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Section */}
      {carProfiles && carProfiles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold border-b-2 border-black mb-6 pb-1 flex items-center gap-2">
            <Car className="w-5 h-5" /> Fleet Information ({carProfiles.length} Vehicles)
          </h2>
          
          <div className="space-y-8">
            {carProfiles.map((car, index) => (
              <div key={car.id} className="break-inside-avoid border rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 rounded">
                  #{index + 1} - {car.brand} {car.model}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <span className="font-semibold block text-xs text-gray-500">Engine</span>
                        <span className="text-sm">{car.engine_model || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs text-gray-500">Transmission</span>
                        <span className="text-sm">{car.transmission_type || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs text-gray-500">Brakes</span>
                        <span className="text-sm">{car.brakes_type || '-'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="font-semibold block text-xs text-gray-500 mb-1">Photos Provided</span>
                        <ul className="list-disc list-inside text-xs">
                            {car.image_connector_front && <li>Connector Front</li>}
                            {car.image_lever_side && <li>Lever Side</li>}
                            {car.image_ecu_part_number && <li>ECU Part #</li>}
                            {car.image_ecu_front && <li>ECU Front</li>}
                        </ul>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs text-gray-500 mb-1">Documents Provided</span>
                        <ul className="list-disc list-inside text-xs">
                            {car.file_electrical_scheme && <li>Electrical Scheme</li>}
                            {car.file_sensors_actuators && <li>Sensors List</li>}
                        </ul>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}