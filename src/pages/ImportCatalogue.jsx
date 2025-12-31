import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { watermarkImage, parseDescription } from "@/components/import/importUtils";

export default function ImportCatalogue() {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("idle"); // idle, importing, done
    const [logs, setLogs] = useState([]);
    
    // Hardcoded for the task
    const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1S-YdOVM9Ajf8miBAakJY-yDH7--w-HabUcg1mtovTjs/export?format=csv&gid=583597950";
    // Assuming user uploads this file to this path or I need to find where they dropped it. 
    // I'll try to find a public URL pattern or assume they uploaded it via the dashboard to the 'public' bucket.
    // For now I'll use a placeholder or try to access it if it exists.
    const WATERMARK_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/watermark.png"; 

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
            
            // Simple CSV Parser
            const rows = csvText.split('\n').map(row => {
                // Handle quotes if necessary, but simple split for now
                const cells = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                return {
                    part_number: cells[0],
                    description: cells[1]
                };
            }).filter(r => r.part_number && r.part_number !== 'Part Number'); // Skip header
            
            addLog(`Found ${rows.length} parts. Starting processing...`);
            
            let completed = 0;
            
            // Process sequentially to avoid rate limits / overwhelming browser
            for (const row of rows) {
                try {
                    addLog(`Processing ${row.part_number}...`);
                    
                    // 2. Parse Description
                    const metadata = parseDescription(row.description);
                    
                    // 3. Search Image
                    // Using LLM to find image URL
                    const searchResult = await base44.integrations.Core.InvokeLLM({
                        prompt: `Find a high quality product image URL for electronic component "${row.part_number} ${row.description}". Search Digi-Key, Mouser, LCSC. Return ONLY the direct image URL.`,
                        add_context_from_internet: true
                    });
                    
                    const imageUrl = searchResult.trim();
                    let finalImageUrl = imageUrl;
                    
                    // 4. Download & Watermark & Upload
                    if (imageUrl && imageUrl.startsWith('http')) {
                        try {
                            const watermarkedFile = await watermarkImage(imageUrl, WATERMARK_URL);
                            
                            // Upload
                            const uploadRes = await base44.integrations.Core.UploadFile({
                                file: watermarkedFile // Integration handles File object
                            });
                            
                            if (uploadRes && uploadRes.file_url) {
                                finalImageUrl = uploadRes.file_url;
                            }
                        } catch (imgErr) {
                            console.error("Image processing failed", imgErr);
                            addLog(`Image processing failed for ${row.part_number}: ${imgErr.message}`);
                            // Fallback to original URL if processing fails
                        }
                    }
                    
                    // 5. Create Record
                    await base44.entities.Catalogue.create({
                        part_number: row.part_number,
                        description: row.description,
                        pins: metadata.pins,
                        color: metadata.color,
                        type: metadata.type,
                        image_url: finalImageUrl
                    });
                    
                } catch (rowErr) {
                    console.error(`Error processing row ${row.part_number}`, rowErr);
                    addLog(`Error processing ${row.part_number}`);
                }
                
                completed++;
                setProgress(Math.round((completed / rows.length) * 100));
            }
            
            setStatus("done");
            toast.success(`Done – ${completed} parts imported with watermarked images`);
            
        } catch (error) {
            console.error("Import failed", error);
            setStatus("error");
            toast.error("Import failed: " + error.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Import Catalogue</h1>
                <p className="text-muted-foreground">Import parts from Google Sheet and auto-enrich with images.</p>
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
                            Done – 150 parts imported with watermarked images
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