import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, Building2, MapPin, Phone, Mail, Box, ShieldCheck, AlertTriangle, Calendar, Edit2, LayoutDashboard } from 'lucide-react';
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
        <div className="space-y-8 animate-in fade-in duration-500 p-6">
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <LayoutDashboard className="w-8 h-8 text-[#00C600]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.full_name || user?.email}
                    </p>
                </div>
            </div>

            {/* Company Profile Card */}
            <Card className="bg-white dark:bg-[#2a2a2a] shadow-sm border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold uppercase flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#00C600]" />
                        Company Profile
                    </CardTitle>
                    <Button onClick={() => window.location.href = createPageUrl('Onboarding') + '?edit=true'} variant="ghost" size="sm" className="h-8 gap-2">
                        <Edit2 className="w-4 h-4" /> Edit
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border">
                            {company?.logo_url ? (
                                <ImageWithFallback src={company.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building2 className="w-10 h-10 text-gray-300" />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4 flex-grow">
                            <div>
                                <h3 className="text-xl font-bold uppercase mb-1">{company?.company_name || 'My Company'}</h3>
                                {company?.client_number && (
                                    <Badge variant="outline" className="font-mono mb-2">{company.client_number}</Badge>
                                )}
                                {company?.address && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" /> {company.address}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#00C600]" />
                                    <span>{company?.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#00C600]" />
                                    <span className="truncate">{company?.contact_email || user?.email}</span>
                                </div>
                                {company?.tax_id && (
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-[#00C600]" />
                                        <span>TAX: {company.tax_id}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#00C600]" />
                                    <span>Member since {moment(user?.created_date).format('MMM YYYY')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fleet Manager */}
            <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border">
                <FleetManager clientEmail={user?.email} />
            </div>

            {/* Products & Licenses */}
            <Card className="bg-white dark:bg-[#2a2a2a] border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold uppercase flex items-center gap-2">
                        <Box className="w-5 h-5 text-[#00C600]" />
                        Products & Licenses
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-t">
                            <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-xs font-bold text-muted-foreground">
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
    );
}