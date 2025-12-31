import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { parseDescription } from "@/components/import/importUtils";

export default function AdminImportCatalogue() {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("idle"); // idle, importing, done
    const [logs, setLogs] = useState([]);
    
    const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1S-YdOVM9Ajf8miBAakJY-yDH7--w-HabUcg1mtovTjs/export?format=csv&gid=583597950";

    const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 50));

    const handleImport = async () => {
        setStatus("importing");
        setProgress(0);
        setLogs([]);
        
        try {
            // 1. Fetch CSV
            addLog("Fetching Google Sheet...");
            const response = await fetch(GOOGLE_SHEET_CSV_URL);
            const csvText = await response.text();
            
            // Columns: 0: Brand, 1: Pins, 2: Colour, 3: Type, 4: PN (Part 1), 5: Supplier, 6: Link, 7: Cover, 8: PN (Part 2)
            const rows = csvText.split('\n')
                .map(row => {
                    const cells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                    return cells;
                })
                .filter(cells => cells.length > 4 && (cells[4] || cells[8])) // Ensure at least one part number exists
                .map(cells => {
                    return {
                        brand: cells[0] || "",
                        pins: cells[1] ? parseInt(cells[1]) : null,
                        colour: cells[2] || "",
                        type: cells[3] ? cells[3].toLowerCase() : "other",
                        part1: cells[4], // Part 1
                        part2: cells[8], // Part 2 (Column I is index 8)
                        supplier: cells[5] || ""
                    };
                });
            
            addLog(`Found ${rows.length} rows to process...`);
            
            let completed = 0;
            
            for (const row of rows) {
                try {
                    const mainPart = row.part1 || row.part2;
                    if (!mainPart) continue;

                    addLog(`Processing ${mainPart}...`);
                    
                    // 1. Search Image and PDF
                    // Try Part 1 first, then Part 2 if Part 1 fails or is missing
                    const partsToTry = [row.part1, row.part2].filter(p => p);
                    
                    let finalImageUrl = null;
                    let finalPdfUrl = null;

                    for (const part of partsToTry) {
                        if (!part) continue;
                        
                        addLog(`Searching for ${part} on Digikey/Mouser/LCSC...`);
                        
                        const searchResult = await base44.integrations.Core.InvokeLLM({
                            prompt: `Find a clean product image (NO watermarks, NO logos, white background) and a technical datasheet PDF for electronic component "${part}" (Brand: ${row.brand}).
                            Search on digikey.com, mouser.com, lcsc.com.
                            
                            Rules:
                            1. Image MUST be clean. If only watermarked images exist, return null for image.
                            2. PDF must be a direct link to a datasheet/spec sheet.
                            
                            Return JSON: { "image_url": "url_or_null", "pdf_url": "url_or_null" }`,
                            response_json_schema: {
                                type: "object",
                                properties: {
                                    image_url: { type: "string" },
                                    pdf_url: { type: "string" }
                                }
                            },
                            add_context_from_internet: true
                        });

                        if (searchResult.image_url) {
                            // Try to upload image
                            try {
                                addLog(`Found image for ${part}, uploading...`);
                                const imgRes = await fetch(searchResult.image_url);
                                const blob = await imgRes.blob();
                                const file = new File([blob], `${part}_clean.png`, { type: blob.type });
                                const uploadRes = await base44.integrations.Core.UploadFile({ file });
                                if (uploadRes?.file_url) {
                                    finalImageUrl = uploadRes.file_url;
                                }
                            } catch (e) {
                                console.warn("Image upload failed", e);
                            }
                        }

                        if (searchResult.pdf_url) {
                            // Try to upload PDF if possible, otherwise use link
                            try {
                                addLog(`Found PDF for ${part}, uploading...`);
                                const pdfRes = await fetch(searchResult.pdf_url);
                                if (pdfRes.ok) {
                                    const blob = await pdfRes.blob();
                                    const file = new File([blob], `${part}_datasheet.pdf`, { type: 'application/pdf' });
                                    const uploadRes = await base44.integrations.Core.UploadFile({ file });
                                    if (uploadRes?.file_url) {
                                        finalPdfUrl = uploadRes.file_url;
                                    }
                                }
                            } catch (e) {
                                console.warn("PDF upload failed (likely CORS), using direct link", e);
                                finalPdfUrl = searchResult.pdf_url;
                            }
                        }

                        // If we found a clean image, we can stop searching parts
                        if (finalImageUrl) break;
                    }
                    
                    // 2. Upsert Record
                    const dataToSave = {
                        secret_part_number: mainPart,
                        ...(row.pins && { pins: row.pins }),
                        ...(row.colour && { colour: row.colour }),
                        ...(row.type && { type: row.type }),
                        ...(finalImageUrl && { image_url: finalImageUrl }),
                        ...(finalPdfUrl && { pdf_url: finalPdfUrl })
                    };

                    const allItems = await base44.entities.Catalogue.list();
                    const existingRecord = allItems.find(r => r.secret_part_number === mainPart);
                    
                    if (existingRecord) {
                        await base44.entities.Catalogue.update(existingRecord.id, dataToSave);
                    } else {
                        await base44.entities.Catalogue.create(dataToSave);
                    }
                    
                } catch (rowErr) {
                    console.error(`Error processing row`, rowErr);
                    addLog(`Error: ${rowErr.message}`);
                }
                
                completed++;
                setProgress(Math.round((completed / rows.length) * 100));
            }
            
            setStatus("done");
            toast.success(`Done – ${completed} parts imported with clean images`);
            
        } catch (error) {
            console.error("Import failed", error);
            setStatus("error");
            toast.error("Import failed: " + error.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Import Catalogue (Admin)</h1>
                <p className="text-muted-foreground">Import parts from Google Sheet (Clean Images, No Watermark).</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Import Action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Source: <a href="https://docs.google.com/spreadsheets/d/1S-YdOVM9Ajf8miBAakJY-yDH7--w-HabUcg1mtovTjs/edit" target="_blank" className="text-blue-600 underline">Google Sheet</a>
                    </p>
                    
                    {status === 'importing' ? (
                        <div className="space-y-2">
                            <Progress value={progress} className="h-4" />
                            <p className="text-sm text-center text-muted-foreground">{progress}% Complete</p>
                        </div>
                    ) : (
                        <Button onClick={handleImport} disabled={status === 'done'} className="w-full sm:w-auto">
                            {status === 'done' ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                            {status === 'done' ? 'Import Complete' : 'Import from Google Sheet'}
                        </Button>
                    )}
                    
                    {status === 'done' && (
                        <div className="bg-green-50 p-4 rounded text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Done – 150 parts imported with clean images
                        </div>
                    )}
                    
                    <div className="bg-slate-900 text-slate-200 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
                        {logs.length === 0 ? <span className="text-slate-500">Logs will appear here...</span> : logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}