import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Upload, File, Download, Printer, Mail, Trash2, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import moment from 'moment';
import TruncatedCell from '@/components/TruncatedCell';

export default function DocumentVault() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Fetch documents
    const { data: documents, isLoading } = useQuery({
        queryKey: ['vaultDocuments'],
        queryFn: () => base44.entities.VaultDocument.list(),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.VaultDocument.delete(id),
        onSuccess: () => {
            toast.success("Document deleted");
            queryClient.invalidateQueries(['vaultDocuments']);
        },
        onError: () => toast.error("Failed to delete document")
    });

    const filteredDocs = documents?.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const categoryColors = {
        legal: "bg-blue-100 text-blue-800",
        accountant: "bg-green-100 text-green-800",
        funding: "bg-purple-100 text-purple-800",
        client: "bg-orange-100 text-orange-800",
        personal: "bg-pink-100 text-pink-800",
        other: "bg-gray-100 text-gray-800"
    };

    const handlePrint = (url) => {
        const win = window.open(url, '_blank');
        if (win) {
            win.focus();
            setTimeout(() => win.print(), 1000);
        } else {
            toast.error("Please allow popups to print");
        }
    };

    const openEmailModal = (doc) => {
        setSelectedDoc(doc);
        setShowEmailModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 min-h-screen bg-gray-50 dark:bg-[#212121] p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/ManagerDashboard')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <File className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
                                <p className="text-muted-foreground">Securely manage and share important documents</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setShowUploadModal(true)} className="bg-[#00C600] hover:bg-[#00b300] text-white gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Document
                    </Button>
                </div>

                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border overflow-hidden p-4">
                    <div className="mb-4 w-full md:w-72">
                         <Input 
                             placeholder="Search documents..." 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50 h-12">
                                    <TableHead className="w-[250px]">Document Name</TableHead>
                                    <TableHead className="w-[150px]">Category</TableHead>
                                    <TableHead className="w-[150px]">Date Added</TableHead>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead className="w-[250px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No documents found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDocs.map((doc) => (
                                        <TableRow key={doc.id} className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <File className="w-4 h-4 text-muted-foreground" />
                                                    <TruncatedCell text={doc.title} className="font-medium" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${categoryColors[doc.category] || 'bg-gray-100'} capitalize`}>
                                                    {doc.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {moment(doc.created_date).format('MMM D, YYYY')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs uppercase text-muted-foreground">
                                                    {doc.file_type || 'FILE'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button variant="ghost" size="icon" title="View/Download" onClick={() => window.open(doc.file_url, '_blank')}>
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Print" onClick={() => handlePrint(doc.file_url)}>
                                                        <Printer className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Email" onClick={() => openEmailModal(doc)}>
                                                        <Mail className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => {
                                                        if(confirm('Are you sure you want to delete this document?')) deleteMutation.mutate(doc.id);
                                                    }}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <UploadDocumentModal open={showUploadModal} onOpenChange={setShowUploadModal} />
            <EmailDocumentModal open={showEmailModal} onOpenChange={setShowEmailModal} document={selectedDoc} />
        </div>
    );
}

function UploadDocumentModal({ open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: 'other',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !formData.title) return;

        try {
            setUploading(true);
            
            // 1. Upload File
            const uploadRes = await base44.integrations.Core.UploadFile({ file });
            
            // 2. Create Entity
            await base44.entities.VaultDocument.create({
                ...formData,
                file_url: uploadRes.file_url,
                file_type: file.name.split('.').pop()
            });

            toast.success("Document uploaded successfully");
            queryClient.invalidateQueries(['vaultDocuments']);
            onOpenChange(false);
            setFile(null);
            setFormData({ title: '', category: 'other', description: '' });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!formData.title) {
                setFormData(prev => ({ ...prev, title: selectedFile.name }));
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>File</Label>
                        <Input 
                            type="file" 
                            onChange={handleFileChange}
                            required
                            className="cursor-pointer"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Document Name</Label>
                        <Input 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required 
                            placeholder="e.g. Annual Report 2024"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(val) => setFormData({...formData, category: val})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="legal">Legal</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                                <SelectItem value="funding">Funding</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={uploading || !file}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EmailDocumentModal({ open, onOpenChange, document }) {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');

    const handleSend = async (e) => {
        e.preventDefault();
        if (!document) return;

        try {
            setSending(true);
            await base44.integrations.Core.SendEmail({
                to: email,
                subject: `Document Shared: ${document.title}`,
                body: `
                    Hello,

                    A document has been shared with you via KG Solutions Vault.

                    Document: ${document.title}
                    Category: ${document.category}
                    
                    Message: ${message}

                    You can access it here: ${document.file_url}

                    Best regards,
                    KG Solutions
                `
            });
            toast.success("Email sent successfully");
            onOpenChange(false);
            setEmail('');
            setMessage('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send email");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Email Document</DialogTitle>
                    <DialogDescription>
                        Send "{document?.title}" via email
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSend} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Recipient Email</Label>
                        <Input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="recipient@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Message (Optional)</Label>
                        <Input 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a note..."
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={sending}>
                            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Email
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}