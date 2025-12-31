import { base44 } from "@/api/base44Client";

// Helper to simulate FedEx Shipping API calls
// Note: In a production environment, these calls should be proxied through a backend function
// to protect API keys and handle CORS. Since we are in a client-side preview, we simulate the responses
// based on the provided environment variable logic.

export const getFedExRates = async (weight, width, height, depth, originPostcode, destPostcode) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real implementation:
    // const token = await getFedExToken();
    // const rates = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', ...);

    console.log(`Fetching FedEx rates for ${weight}kg pkg from ${originPostcode} to ${destPostcode}`);
    
    // Return realistic mock data
    return [
        { 
            id: 'FEDEX_INTERNATIONAL_PRIORITY', 
            carrier: 'FedEx', 
            service: 'International Priority', 
            price: 42.10 + (weight * 2.5), // dynamic price simulation
            currency: 'GBP', 
            eta: '1-3 Business Days' 
        },
        { 
            id: 'FEDEX_INTERNATIONAL_ECONOMY', 
            carrier: 'FedEx', 
            service: 'International Economy', 
            price: 28.90 + (weight * 1.5), 
            currency: 'GBP', 
            eta: '4-6 Business Days' 
        }
    ].sort((a, b) => a.price - b.price); // Cheapest first
};

export const createFedExShipment = async (serviceType, shipmentDetails) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const trackingNumber = `79${Math.floor(Math.random() * 10000000000)}`;
    
    // Simulate Label Generation
    const labelUrl = "https://via.placeholder.com/600x800.png?text=FEDEX+LABEL+" + trackingNumber;
    
    return {
        trackingNumber,
        labelUrl,
        carrier: 'FedEx',
        service: serviceType,
        format: 'PDF'
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