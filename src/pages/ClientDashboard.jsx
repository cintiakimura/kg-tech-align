import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Building2, MapPin, Phone, Mail, Box, ShieldCheck, AlertTriangle, Calendar, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FleetManager from '../components/onboarding/fleet/FleetManager';
import { getProxiedImageUrl } from "@/components/utils/imageUtils";
import { createPageUrl } from '@/utils';
import moment from 'moment';

export default function ClientDashboard() {
    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ['me'],
        queryFn: () => base44.auth.me(),
    });

    // Fetch Company Profile
    const { data: companyProfileList, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['companyProfile', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // Try fetch by company_id if set, else by owner
            if (user.company_id) {
                return base44.entities.CompanyProfile.list({ id: user.company_id });
            }
            // Fallback for just-created users without company_id set yet
            return base44.entities.CompanyProfile.list({ contact_email: user.email });
        },
        enabled: !!user
    });

    const company = companyProfileList?.[0];

    // Fetch Purchases (Products/Licenses)
    const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
        queryKey: ['purchases', user?.email],
        queryFn: () => base44.entities.Purchase.list({ user_email: user?.email }),
        enabled: !!user?.email
    });

    if (isLoadingUser || isLoadingCompany) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#00C600]" />
            </div>
        );
    }

    const ImageWithFallback = ({ src, alt, className }) => {
        const [error, setError] = useState(false);
        if (!src || error) return <div className={`bg-gray-100 flex items-center justify-center ${className}`}><Building2 className="text-gray-400" /></div>;
        return <img src={getProxiedImageUrl(src)} alt={alt} className={className} onError={() => setError(true)} />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            
            {/* Top Section: Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-3 bg-white dark:bg-[#2a2a2a] border-none shadow-md overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-[#00C600]/10 to-[#00C600]/5 border-b"></div>
                    <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-start md:items-end gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-xl border-4 border-white dark:border-[#2a2a2a] bg-white dark:bg-[#333] shadow-lg overflow-hidden flex items-center justify-center">
                                {company?.logo_url ? (
                                    <ImageWithFallback src={company.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Building2 className="w-12 h-12 text-gray-300" />
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-grow space-y-2 pt-2 md:pt-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold uppercase">{company?.company_name || user?.full_name || 'My Company'}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                                        {company?.client_number && (
                                            <Badge variant="outline" className="font-mono">{company.client_number}</Badge>
                                        )}
                                        {company?.tax_id && (
                                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> TAX ID: {company.tax_id}</span>
                                        )}
                                        {company?.address && (
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {company.address}</span>
                                        )}
                                    </div>
                                </div>
                                <Button onClick={() => window.location.href = createPageUrl('Onboarding') + '?edit=true'} variant="outline" className="gap-2">
                                    <Edit2 className="w-4 h-4" /> Edit Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-8 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm"><Phone className="w-4 h-4 text-[#00C600]" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Phone</p>
                                <p className="font-medium">{company?.phone || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm"><Mail className="w-4 h-4 text-[#00C600]" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Contact Email</p>
                                <p className="font-medium truncate">{company?.contact_email || user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                             <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm"><Calendar className="w-4 h-4 text-[#00C600]" /></div>
                             <div>
                                <p className="text-xs text-muted-foreground uppercase">Member Since</p>
                                <p className="font-medium">{moment(user?.created_date).format('MMM YYYY')}</p>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Middle Section: Fleet / Cars */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold uppercase flex items-center gap-2">
                        <span className="w-1 h-8 bg-[#00C600] rounded-full inline-block"></span>
                        My Fleet
                    </h2>
                </div>
                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-md border-none">
                    <FleetManager clientEmail={user?.email} />
                </div>
            </div>

            {/* Bottom Section: Purchased Products */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold uppercase flex items-center gap-2">
                        <span className="w-1 h-8 bg-[#00C600] rounded-full inline-block"></span>
                        Products & Licenses
                    </h2>
                </div>
                
                <Card className="bg-white dark:bg-[#2a2a2a] border-none shadow-md overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs font-bold text-muted-foreground border-b">
                                    <tr>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Delivery / Active Date</th>
                                        <th className="px-6 py-4">Expiration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {isLoadingPurchases ? (
                                        <tr><td colSpan="5" className="p-6 text-center text-muted-foreground">Loading products...</td></tr>
                                    ) : purchases && purchases.length > 0 ? (
                                        purchases.map((item) => {
                                            const isExpired = item.expiration_date && moment().isAfter(item.expiration_date);
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold flex items-center gap-3">
                                                        <Box className="w-4 h-4 text-[#00C600]" />
                                                        {item.product}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{item.description || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        {isExpired ? (
                                                            <Badge variant="destructive">Expired</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className={
                                                                item.status === 'active' || item.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''
                                                            }>
                                                                {item.status}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono">
                                                        {item.delivery_date ? moment(item.delivery_date).format('DD MMM YYYY') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono">
                                                        {item.expiration_date ? (
                                                            <span className={isExpired ? 'text-red-500 font-bold flex items-center gap-1' : ''}>
                                                                {isExpired && <AlertTriangle className="w-3 h-3" />}
                                                                {moment(item.expiration_date).format('DD MMM YYYY')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">Lifetime / N/A</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center">
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                    <Box className="w-10 h-10 opacity-20" />
                                                    <p>No products or licenses found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}