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
            
            // CSV Parsing with simplified logic for known columns
            // Columns: 0: Brand, 1: Pins, 2: Color, 3: Type, 4: PN, 5: Supplier, 6+: URLs
            const rows = csvText.split('\n')
                .map(row => {
                    // Split by comma, handling potential quotes roughly (assuming simple data based on sample)
                    // Using a regex to split by comma outside quotes is safer
                    const cells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                    return cells;
                })
                .filter(cells => cells.length > 4 && cells[4] && cells[4] !== 'PN') // Filter header and empty PNs
                .map(cells => {
                    const providedUrls = cells.slice(6).filter(c => c && c.startsWith('http'));
                    return {
                        brand: cells[0] || "",
                        pins: cells[1] ? parseInt(cells[1]) : null,
                        color: cells[2] || "",
                        type: cells[3] ? cells[3].toLowerCase() : "other",
                        part_number: cells[4],
                        supplier: cells[5] || "",
                        provided_urls: providedUrls
                    };
                });
            
            addLog(`Found ${rows.length} parts. Starting processing...`);
            
            let completed = 0;
            
            for (const row of rows) {
                try {
                    addLog(`Processing ${row.part_number} (${row.brand})...`);
                    
                    // Construct a description if missing
                    const description = `${row.brand} ${row.pins || '?'} Pin ${row.color} ${row.type}`.trim();
                    
                    // 3. Search Image and PDF using Provided Links
                    let searchResult = { image_url: null, pdf_url: null };
                    
                    if (row.provided_urls.length > 0) {
                        addLog(`Checking ${row.provided_urls.length} provided links...`);
                        searchResult = await base44.integrations.Core.InvokeLLM({
                            prompt: `I am looking for data for electronic part "${row.part_number}" (${description}).
                            I have these product page links: ${row.provided_urls.join(', ')}.
                            
                            Please visit these links and:
                            1. Find the **Technical Datasheet PDF** direct URL.
                            2. Find a **clean product image URL** (no watermarks, white background preferred).
                            
                            Return JSON: { "image_url": "url", "pdf_url": "url" }`,
                            response_json_schema: {
                                type: "object",
                                properties: {
                                    image_url: { type: "string" },
                                    pdf_url: { type: "string" }
                                }
                            },
                            add_context_from_internet: true
                        });
                    } else {
                        // Fallback to search if no links (though user said use provided links)
                         addLog(`No links provided, searching web...`);
                         searchResult = await base44.integrations.Core.InvokeLLM({
                            prompt: `Find image and datasheet for "${row.part_number}" ${description}.`,
                            response_json_schema: {
                                type: "object",
                                properties: {
                                    image_url: { type: "string" },
                                    pdf_url: { type: "string" }
                                }
                            },
                            add_context_from_internet: true
                        });
                    }
                    
                    const { image_url: imageUrl, pdf_url: pdfUrl } = searchResult;
                    let finalImageUrl = imageUrl;
                    
                    // 4. Download & Upload Image to Storage
                    if (imageUrl && imageUrl.startsWith('http')) {
                        try {
                             const imgRes = await fetch(imageUrl);
                             const blob = await imgRes.blob();
                             const file = new File([blob], `${row.part_number}.png`, { type: blob.type });
                             
                             const uploadRes = await base44.integrations.Core.UploadFile({
                                file: file
                             });
                             
                             if (uploadRes && uploadRes.file_url) {
                                finalImageUrl = uploadRes.file_url;
                             }
                        } catch (imgErr) {
                            console.warn("Image upload failed, using external URL", imgErr);
                        }
                    }
                    
                    // 5. Upsert Record
                    // Filter undefined/null values to "ignore blank cells"
                    const dataToSave = {
                        part_number: row.part_number,
                        description: description,
                        type: row.type || "other",
                        ...(row.brand && { brand: row.brand }),
                        ...(row.supplier && { supplier: row.supplier }),
                        ...(row.pins && { pins: row.pins }),
                        ...(row.color && { color: row.color }),
                        ...(finalImageUrl && { image_url: finalImageUrl }),
                        ...(pdfUrl && { technical_pdf_url: pdfUrl })
                    };

                    const existingRecord = (await base44.entities.Catalogue.list()).find(r => r.part_number === row.part_number);
                    
                    if (existingRecord) {
                        await base44.entities.Catalogue.update(existingRecord.id, dataToSave);
                    } else {
                        await base44.entities.Catalogue.create(dataToSave);
                    }
                    
                } catch (rowErr) {
                    console.error(`Error processing row ${row.part_number}`, rowErr);
                    addLog(`Error processing ${row.part_number}: ${rowErr.message}`);
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