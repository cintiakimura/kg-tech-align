import React, { useState } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Collapsible, 
    CollapsibleContent, 
    CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Car, FileText, ExternalLink, Mail, Phone, MapPin, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '../utils/exportUtils';
import { useNavigate } from 'react-router-dom';

function ClientRow({ clientEmail, company, cars }) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const hasCompany = !!company;
    const carCount = cars.length;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
            <>
                <TableRow className="cursor-pointer bg-white dark:bg-[#2a2a2a] hover:bg-transparent hover:shadow-[inset_4px_0_0_0_#6366f1] transition-all border-b">
                    <TableCell className="w-[50px]">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">
                        <div className="flex flex-col group cursor-pointer" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ClientDetails?email=${encodeURIComponent(clientEmail)}`);
                        }}>
                            <span className="text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                {company?.company_name || clientEmail} 
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {hasCompany ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Registered
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                Pending
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span>{carCount}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                        {company?.updated_date ? format(new Date(company.updated_date), 'PPP') : '-'}
                    </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                    <TableRow className="bg-muted/30">
                        <TableCell colSpan={5} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Company Details */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <BuildingIcon className="w-4 h-4" /> Company Details
                                    </h4>
                                    {company ? (
                                        <div className="text-sm space-y-1 pl-6 border-l-2 border-gray-200">
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span className="text-muted-foreground">Tax ID:</span>
                                                <span>{company.tax_id || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span className="text-muted-foreground">Address:</span>
                                                <span className="flex items-start gap-1">
                                                     {company.address || '-'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span className="text-muted-foreground">Contact:</span>
                                                <span>{company.contact_email || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                                <span className="text-muted-foreground">Phone:</span>
                                                <span>{company.phone || '-'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground pl-6">No company profile created yet.</p>
                                    )}
                                </div>

                                {/* Fleet Details */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Car className="w-4 h-4" /> Fleet & Documents
                                    </h4>
                                    {cars.length > 0 ? (
                                        <div className="space-y-3">
                                            {cars.map((car) => (
                                                <div key={car.id} className="bg-white dark:bg-black border rounded p-3 text-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium">{car.brand} {car.model}</span>
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{car.transmission_type}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mb-2">
                                                        {car.engine_model} • {car.brakes_type}
                                                    </div>
                                                    
                                                    {/* Docs Links */}
                                                    <div className="flex gap-3 mt-2 pt-2 border-t border-dashed">
                                                        {car.file_electrical_scheme ? (
                                                            <a href={car.file_electrical_scheme} target="_blank" rel="noopener noreferrer" 
                                                               className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                                <FileText className="w-3 h-3" /> Scheme
                                                            </a>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                <FileText className="w-3 h-3" /> No Scheme
                                                            </span>
                                                        )}
                                                        {car.file_sensors_actuators ? (
                                                            <a href={car.file_sensors_actuators} target="_blank" rel="noopener noreferrer" 
                                                               className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                                                <FileText className="w-3 h-3" /> Sensors
                                                            </a>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                <FileText className="w-3 h-3" /> No Sensors
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                                                            <ExternalLink className="w-3 h-3" /> 
                                                            {[(car.image_connector_front, car.image_lever_side, car.image_ecu_part_number, car.image_ecu_front, car.image_extra_1, car.image_extra_2)].filter(Boolean).length} Photos
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground pl-6">No fleet items added yet.</p>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleContent>
            </>
        </Collapsible>
    );
}

// Icon helper
function BuildingIcon({ className }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
        </svg>
    )
}

export default function ClientsTable({ companies, cars: vehicles }) {
    // Alias cars prop to vehicles for internal use, though logic remains same
    const cars = vehicles; // Keep variable name 'cars' to avoid massive refactor of internal logic
    // Group data by created_by (email)
    const groupedData = React.useMemo(() => {
        const groups = {};
        
        // Process companies
        companies.forEach(company => {
            if (!groups[company.created_by]) {
                groups[company.created_by] = { company: null, cars: [] };
            }
            groups[company.created_by].company = company;
        });

        // Process cars
        cars.forEach(car => {
            if (!groups[car.created_by]) {
                groups[car.created_by] = { company: null, cars: [] };
            }
            groups[car.created_by].cars.push(car);
        });

        return Object.entries(groups).map(([email, data]) => ({
            email,
            ...data
        }));
    }, [companies, cars]);

    const handleExport = () => {
        const exportData = groupedData.map(g => ({
            ClientEmail: g.email,
            CompanyName: g.company?.company_name || 'N/A',
            TaxID: g.company?.tax_id || '',
            ContactPerson: g.company?.contact_person_name || '',
            FleetSize: g.cars.length,
            Status: g.company ? 'Registered' : 'Pending',
            LastUpdate: g.company?.updated_date || ''
        }));
        exportToCSV(exportData, `clients_export_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
            </div>
            <div className="rounded-md border bg-white dark:bg-[#2a2a2a] overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fleet Size</TableHead>
                            <TableHead className="text-right">Last Update</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {groupedData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No clients found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        groupedData.map((client) => (
                            <ClientRow 
                                key={client.email}
                                clientEmail={client.email}
                                company={client.company}
                                cars={client.cars}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
            </div>
        </div>
    );
}