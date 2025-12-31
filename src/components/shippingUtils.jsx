import { base44 } from "@/api/base44Client";

// Helper to simulate shipping API calls
export const getShippingRates = async (weight, width, height, depth, destination) => {
    // In a real app, this would call a backend function which uses secrets to call DHL/FedEx
    // const response = await base44.functions.call('shipping', 'getRates', { ... });
    
    // Simulating API latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response
    return [
        { id: 'dhl_express', carrier: 'DHL', service: 'Express Worldwide', price: 45.50, currency: 'GBP', eta: '2 Days' },
        { id: 'fedex_priority', carrier: 'FedEx', service: 'International Priority', price: 42.10, currency: 'GBP', eta: '3 Days' },
        { id: 'dhl_standard', carrier: 'DHL', service: 'Economy Select', price: 28.90, currency: 'GBP', eta: '5-7 Days' }
    ];
};

export const createShipmentLabel = async (rateId, shipmentDetails) => {
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const trackingNumber = `${rateId.split('_')[0].toUpperCase()}${Math.floor(Math.random() * 1000000000)}`;
    
    // Return a dummy PDF URL (using a placeholder image service for demo purposes or just a string)
    // In real life this would be a URL to a PDF stored in S3/Base44 Storage
    const labelUrl = "https://via.placeholder.com/600x800.png?text=SHIPPING+LABEL+" + trackingNumber;
    
    return {
        trackingNumber,
        labelUrl,
        carrier: rateId.includes('dhl') ? 'DHL' : 'FedEx'
    };
};

export const appendAuditLog = (currentLog, action, userEmail) => {
    const log = currentLog || [];
    const entry = {
        action,
        by: userEmail,
        date: new Date().toISOString()
    };
    return [...log, entry];
};