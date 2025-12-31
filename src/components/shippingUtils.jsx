import { base44 } from "@/api/base44Client";

// Helper to simulate FedEx Shipping API calls
// Note: In a production environment, these calls should be proxied through a backend function
// to protect API keys and handle CORS. Since we are in a client-side preview, we simulate the responses
// based on the provided environment variable logic.

export const getFedExRates = async (weight, width, height, depth, originPostcode, destPostcode) => {
    try {
        console.log(`Fetching live FedEx rates for ${weight}kg pkg from ${originPostcode} to ${destPostcode}`);
        const rates = await base44.functions.fedex({
            action: 'getRates',
            weight: Number(weight),
            width: Number(width),
            height: Number(height),
            depth: Number(depth),
            originPostcode,
            destPostcode
        });
        return rates;
    } catch (error) {
        console.error("Failed to fetch live FedEx rates", error);
        // Fallback to simulation if live call fails during demo/preview without backend set up
        console.warn("Falling back to simulated rates due to error");
        return [
             { 
                 id: 'FEDEX_INTERNATIONAL_PRIORITY', 
                 carrier: 'FedEx', 
                 service: 'International Priority', 
                 price: 42.10 + (weight * 2.5), 
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
         ].sort((a, b) => a.price - b.price);
    }
};

export const createFedExShipment = async (serviceType, shipmentDetails) => {
    try {
        console.log("Creating live FedEx shipment", serviceType);
        const shipment = await base44.functions.fedex({
            action: 'createShipment',
            serviceType,
            shipmentDetails
        });
        return shipment;
    } catch (error) {
        console.error("Failed to create live FedEx shipment", error);
        throw error; // Propagate error to UI
    }
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