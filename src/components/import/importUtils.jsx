import { base44 } from "@/api/base44Client";

export const watermarkImage = async (originalImageUrl, watermarkUrl) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Try to request CORS permission
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Draw watermark
            const watermark = new Image();
            watermark.crossOrigin = "Anonymous";
            watermark.onload = () => {
                // Scale watermark to 30% of image width
                const scale = (img.width * 0.3) / watermark.width;
                const wWidth = watermark.width * scale;
                const wHeight = watermark.height * scale;
                
                // Position bottom-right with 10px padding
                const x = img.width - wWidth - 10;
                const y = img.height - wHeight - 10;
                
                ctx.globalAlpha = 0.7; // Semi-transparent
                ctx.drawImage(watermark, x, y, wWidth, wHeight);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "watermarked_image.png", { type: "image/png" });
                        resolve(file);
                    } else {
                        reject(new Error("Canvas to Blob failed"));
                    }
                }, 'image/png');
            };
            watermark.onerror = () => {
                // If watermark fails, just return original
                console.warn("Watermark load failed, returning original");
                canvas.toBlob(b => resolve(new File([b], "image.png", { type: "image/png" })));
            };
            watermark.src = watermarkUrl;
        };
        
        img.onerror = (e) => {
            reject(new Error("Failed to load original image (CORS or network error)"));
        };
        
        // Use a CORS proxy if needed, but for now try direct
        img.src = originalImageUrl;
    });
};

export const parseDescription = (desc) => {
    const result = { pins: 0, color: 'Unknown', type: 'other' };
    if (!desc) return result;
    
    const lower = desc.toLowerCase();
    
    // Pins
    const pinMatch = lower.match(/(\d+)\s*pins?/);
    if (pinMatch) result.pins = parseInt(pinMatch[1]);
    
    // Type
    if (lower.includes('connector')) result.type = 'connector';
    else if (lower.includes('header')) result.type = 'header';
    
    // Color
    const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'grey', 'gray'];
    const foundColor = colors.find(c => lower.includes(c));
    if (foundColor) result.color = foundColor;
    
    return result;
};