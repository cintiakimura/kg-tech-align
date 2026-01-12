import React from 'react';
import { useLanguage } from '@/components/LanguageContext';

export default function PrintableOrder({ order }) {
    if (!order) return null;

    return (
        <div className="p-8 border-2 border-black m-4">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">KG PROTECH SAS</h1>
                    <p>123 Industrial Ave, Paris, France</p>
                    <p>VAT: FR123456789</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">PRODUCTION ORDER</h2>
                    <p className="font-mono text-lg">{order.serial_number}</p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Cost Split (Internal Use Only - usually, but requested on order page) */}
            <div className="mb-8 p-4 bg-gray-100 border border-gray-300">
                <h3 className="font-bold border-b border-gray-400 mb-2">Cost Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-sm text-gray-600">Production Cost</span>
                        <span className="font-bold">€{order.supplierQuote?.price || 0}</span>
                    </div>
                    <div>
                        <span className="block text-sm text-gray-600">Shipping Cost</span>
                        <span className="font-bold">€{order.supplierQuote?.shipping_cost || 0}</span>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold border-b border-black mb-2">Client Details</h3>
                    <p className="font-semibold">{order.client?.company_name || 'N/A'}</p>
                    <p>{order.client?.address}</p>
                    <p>{order.client_email}</p>
                    <p>Client #: {order.client?.client_number}</p>
                </div>
                <div>
                    <h3 className="font-bold border-b border-black mb-2">Supplier Details</h3>
                    <p className="font-semibold">{order.supplierQuote?.supplier_email || 'N/A'}</p>
                    <p>Status: {order.status}</p>
                </div>
            </div>

            {/* Produced Items */}
            <div className="mb-8">
                <h3 className="font-bold border-b border-black mb-4">Produced Items</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2">Item / Serial</th>
                            <th className="text-left py-2">System</th>
                            <th className="text-left py-2">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-2 font-mono">{order.serial_number}</td>
                            <td className="py-2">{order.calculator_system}</td>
                            <td className="py-2">{order.brand} {order.model} {order.version}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Shipping Details */}
            <div className="mb-8">
                <h3 className="font-bold border-b border-black mb-2">Shipping Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-600">Carrier</span>
                        <span>{order.carrier || 'TBD'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-600">Tracking Number</span>
                        <span className="font-mono">{order.tracking_number || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="block text-gray-600">Delivery Address</span>
                        <span>{order.client?.delivery_address || order.client?.address || 'Same as billing'}</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 pt-4 border-t border-black flex justify-between text-sm">
                <div>Authorized Signature</div>
                <div>Date</div>
            </div>
        </div>
    );
}