import React from 'react';
import { CheckCircle2, Car, Building2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function PrintableReport({ companyProfile, carProfiles }) {
  const { t } = useLanguage();
  if (!companyProfile && (!carProfiles || carProfiles.length === 0)) return null;

  return (
    <div className="hidden print:block p-8 bg-white text-black">
      <div className="mb-8 border-b pb-4">
        <div className="flex justify-between items-center mb-4">
           <h1 className="text-3xl font-bold">{t('onboarding_title')} - {t('export_report')}</h1>
           <div className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Company Section */}
      {companyProfile && (
        <div className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold border-b-2 border-black mb-4 pb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> {t('company_info')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold block text-sm text-gray-600">{t('company_name')}</span>
              <span>{companyProfile.company_name}</span>
            </div>
            <div>
              <span className="font-semibold block text-sm text-gray-600">{t('tax_id')}</span>
              <span>{companyProfile.tax_id || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold block text-sm text-gray-600">{t('contact_email')}</span>
              <span>{companyProfile.contact_email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold block text-sm text-gray-600">{t('phone_number')}</span>
              <span>{companyProfile.phone || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold block text-sm text-gray-600">{t('billing_address')}</span>
              <span>{companyProfile.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Section */}
      {carProfiles && carProfiles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold border-b-2 border-black mb-6 pb-1 flex items-center gap-2">
            <Car className="w-5 h-5" /> {t('tab_fleet')} ({carProfiles.length})
          </h2>
          
          <div className="space-y-8">
            {carProfiles.map((car, index) => (
              <div key={car.id} className="break-inside-avoid border rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold mb-3 bg-gray-100 p-2 rounded">
                  #{index + 1} - {car.brand} {car.model}
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <span className="font-semibold block text-xs text-gray-500">{t('engine_model')}</span>
                        <span className="text-sm">{car.engine_model || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs text-gray-500">{t('transmission')}</span>
                        <span className="text-sm">{car.transmission_type || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs text-gray-500">{t('brakes_type')}</span>
                        <span className="text-sm">{car.brakes_type || '-'}</span>
                    </div>
                </div>

                {/* Embedded Photos */}
                <div className="mb-4">
                    <span className="font-semibold block text-sm text-gray-700 mb-2">{t('required_photos')}</span>
                    <div className="grid grid-cols-4 gap-2">
                        {car.image_connector_front && (
                            <div>
                                <img src={car.image_connector_front} alt={t('conn_front')} className="w-full h-24 object-cover border rounded" />
                                <p className="text-xs text-center mt-1">{t('conn_front')}</p>
                            </div>
                        )}
                        {car.image_lever_side && (
                            <div>
                                <img src={car.image_lever_side} alt={t('lever_side')} className="w-full h-24 object-cover border rounded" />
                                <p className="text-xs text-center mt-1">{t('lever_side')}</p>
                            </div>
                        )}
                        {car.image_ecu_part_number && (
                            <div>
                                <img src={car.image_ecu_part_number} alt={t('ecu_part')} className="w-full h-24 object-cover border rounded" />
                                <p className="text-xs text-center mt-1">{t('ecu_part')}</p>
                            </div>
                        )}
                        {car.image_ecu_front && (
                            <div>
                                <img src={car.image_ecu_front} alt={t('ecu_front')} className="w-full h-24 object-cover border rounded" />
                                <p className="text-xs text-center mt-1">{t('ecu_front')}</p>
                            </div>
                        )}
                    </div>
                    {car.image_extra_1 || car.image_extra_2 ? (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {car.image_extra_1 && (
                                <div>
                                    <img src={car.image_extra_1} alt={`${t('extra_photo')} 1`} className="w-full h-24 object-cover border rounded" />
                                    <p className="text-xs text-center mt-1">{t('extra_photo')} 1</p>
                                </div>
                            )}
                            {car.image_extra_2 && (
                                <div>
                                    <img src={car.image_extra_2} alt={`${t('extra_photo')} 2`} className="w-full h-24 object-cover border rounded" />
                                    <p className="text-xs text-center mt-1">{t('extra_photo')} 2</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Technical Documents with Links */}
                <div>
                    <span className="font-semibold block text-sm text-gray-700 mb-2">{t('tech_docs')}</span>
                    <div className="space-y-1">
                        {car.file_electrical_scheme && (
                            <div className="text-xs">
                                <span className="font-medium">{t('elec_scheme')}: </span>
                                <a href={car.file_electrical_scheme} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">
                                    {car.file_electrical_scheme}
                                </a>
                            </div>
                        )}
                        {car.file_sensors_actuators && (
                            <div className="text-xs">
                                <span className="font-medium">{t('sensors_list')}: </span>
                                <a href={car.file_sensors_actuators} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">
                                    {car.file_sensors_actuators}
                                </a>
                            </div>
                        )}
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