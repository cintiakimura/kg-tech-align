const FEDEX_API_KEY = process.env.FEDEX_API_KEY;
const FEDEX_SECRET_KEY = process.env.FEDEX_SECRET_KEY;
const FEDEX_ACCOUNT_NUMBER = process.env.FEDEX_ACCOUNT_NUMBER;
const API_BASE_URL = "https://apis.fedex.com";

async function getAccessToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', FEDEX_API_KEY);
    params.append('client_secret', FEDEX_SECRET_KEY);

    const response = await fetch(`${API_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`FedEx Auth Failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return data.access_token;
}

export default async function fedex(context) {
    const { action, ...payload } = context;
    
    if (!FEDEX_API_KEY || !FEDEX_SECRET_KEY || !FEDEX_ACCOUNT_NUMBER) {
        throw new Error("Missing FedEx credentials in environment variables");
    }

    try {
        const token = await getAccessToken();
        
        if (action === 'getRates') {
            return await getRates(token, payload);
        } else if (action === 'createShipment') {
            return await createShipment(token, payload);
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        console.error("FedEx Function Error:", error);
        throw new Error(error.message || "Internal FedEx Error");
    }
}

async function getRates(token, { weight, width, height, depth, originPostcode, destPostcode }) {
    // Defaulting to GB for this specific app context (GBP currency used in app)
    // In a full app, country codes should be passed in.
    const shipperAddress = { postalCode: originPostcode, countryCode: 'GB' };
    const recipientAddress = { postalCode: destPostcode, countryCode: 'GB' };

    const body = {
        accountNumber: { value: FEDEX_ACCOUNT_NUMBER },
        requestedShipment: {
            shipper: { address: shipperAddress },
            recipient: { address: recipientAddress },
            pickupType: "DROPOFF_AT_FEDEX_LOCATION",
            rateRequestType: ["ACCOUNT"],
            requestedPackageLineItems: [{
                weight: { units: "KG", value: weight },
                dimensions: { length: depth, width: width, height: height, units: "CM" }
            }]
        }
    };

    const response = await fetch(`${API_BASE_URL}/rate/v1/rates/quotes`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Rate Quote Failed: ${errText}`);
    }

    const data = await response.json();
    const rateReplyDetails = data.output?.rateReplyDetails || [];

    // Map to App format
    return rateReplyDetails.map(rate => {
        const serviceName = rate.serviceType; // e.g. FEDEX_INTERNATIONAL_PRIORITY
        const shipmentDetails = rate.ratedShipmentDetails?.[0];
        const totalNetCharge = shipmentDetails?.totalNetCharge;
        
        return {
            id: serviceName,
            carrier: 'FedEx',
            service: formatServiceName(serviceName),
            price: totalNetCharge || 0,
            currency: shipmentDetails?.currency || 'GBP',
            eta: 'Calculated at checkout' // FedEx API returns commit dates in separate fields if needed
        };
    }).sort((a, b) => a.price - b.price);
}

async function createShipment(token, { serviceType, shipmentDetails }) {
    // Construct the shipment payload
    // Note: This is a simplified payload. Real labels require full addresses.
    // We assume shipmentDetails contains: { shipper: {...}, recipient: {...} }
    
    const body = {
        labelResponseOptions: "URL_ONLY",
        requestedShipment: {
            shipper: shipmentDetails.shipper,
            recipient: shipmentDetails.recipient,
            serviceType: serviceType,
            pickupType: "DROPOFF_AT_FEDEX_LOCATION",
            shippingChargesPayment: {
                paymentType: "SENDER",
                payor: {
                    responsibleParty: {
                        accountNumber: { value: FEDEX_ACCOUNT_NUMBER }
                    }
                }
            },
            labelSpecification: {
                imageType: "PDF",
                labelStockType: "PAPER_4X6"
            },
            requestedPackageLineItems: [{
                weight: { units: "KG", value: shipmentDetails.weight || 1 },
                dimensions: {
                    length: shipmentDetails.depth || 10,
                    width: shipmentDetails.width || 10,
                    height: shipmentDetails.height || 10,
                    units: "CM"
                }
            }]
        },
        accountNumber: { value: FEDEX_ACCOUNT_NUMBER }
    };

    const response = await fetch(`${API_BASE_URL}/ship/v1/shipments`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Shipment Failed: ${errText}`);
    }

    const data = await response.json();
    const transactionId = data.transactionId;
    const completedShipment = data.output?.transactionShipments?.[0];
    
    if (!completedShipment) {
         throw new Error("No shipment output returned");
    }

    const pieceResponse = completedShipment.pieceResponses?.[0];
    const trackingNumber = pieceResponse?.trackingNumber;
    const labelUrl = pieceResponse?.packageDocuments?.[0]?.url;

    return {
        trackingNumber,
        labelUrl,
        carrier: 'FedEx',
        service: serviceType,
        format: 'PDF'
    };
}

function formatServiceName(name) {
    return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}