import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, ShoppingCart, Plus, Minus, Info } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';

export default function Catalogue() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Parts
  const { data: parts = [] } = useQuery({
    queryKey: ['parts'],
    queryFn: () => base44.entities.Part.list(),
  });

  // Fetch User's Cars
  const { data: myCars = [] } = useQuery({
    queryKey: ['myCars'],
    queryFn: () => base44.entities.CarProfile.list(),
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.PartRequest.create(data);
    },
    onSuccess: () => {
      setCart([]);
      setIsCheckoutOpen(false);
      alert("Request sent successfully!");
    }
  });

  const filteredParts = parts.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    part.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (part) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === part.id);
      if (existing) {
        return prev.map(p => p.id === part.id ? {...p, quantity: p.quantity + 1} : p);
      }
      return [...prev, {...part, quantity: 1}];
    });
  };

  const removeFromCart = (partId) => {
    setCart(prev => prev.filter(p => p.id !== partId));
  };

  const updateQuantity = (partId, delta) => {
    setCart(prev => prev.map(p => {
      if (p.id === partId) {
        return {...p, quantity: Math.max(1, p.quantity + delta)};
      }
      return p;
    }));
  };

  const handleCheckout = () => {
    if (!selectedCar) return;
    
    createRequestMutation.mutate({
      car_profile_id: selectedCar,
      status: 'open',
      description: `Request for ${cart.length} items`,
      requested_parts: cart.map(item => ({
        part_id: item.id,
        quantity: item.quantity,
        notes: ""
      }))
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Parts Catalogue</h1>
          <p className="text-muted-foreground">Browse and request components for your vehicles.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search parts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00C600] text-white relative">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
                {cart.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Summary</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground">Your cart is empty.</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.id)}>
                              <Info className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <label className="text-sm font-medium mb-2 block">Select Vehicle</label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        onChange={(e) => setSelectedCar(e.target.value)}
                        value={selectedCar || ""}
                      >
                        <option value="" disabled>Choose a vehicle...</option>
                        {myCars.map(car => (
                          <option key={car.id} value={car.id}>{car.brand} {car.model} ({car.year})</option>
                        ))}
                      </select>
                      {myCars.length === 0 && (
                        <p className="text-xs text-amber-500 mt-1">Please add a vehicle in your Digital Garage first.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
              <CardFooter className="px-0 pt-2 justify-between">
                 <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Close</Button>
                 <Button 
                   className="bg-[#00C600] text-white" 
                   onClick={handleCheckout}
                   disabled={cart.length === 0 || !selectedCar || createRequestMutation.isPending}
                 >
                   {createRequestMutation.isPending ? 'Sending...' : 'Submit Request'}
                 </Button>
              </CardFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredParts.map(part => (
          <Card key={part.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-all">
            <div className="aspect-square bg-gray-100 dark:bg-[#1a1a1a] relative flex items-center justify-center p-4">
              {part.image_url ? (
                <img src={part.image_url} alt={part.name} className="object-contain h-full w-full mix-blend-multiply dark:mix-blend-normal" />
              ) : (
                <div className="text-4xl text-gray-300 font-bold">{part.sku?.substring(0,2)}</div>
              )}
              <Badge className="absolute top-2 right-2">{part.category}</Badge>
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">{part.name}</CardTitle>
              <CardDescription className="font-mono text-xs">{part.sku}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-sm text-muted-foreground line-clamp-2">{part.description}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button 
                variant="outline" 
                className="w-full hover:bg-[#00C600] hover:text-white transition-colors"
                onClick={() => addToCart(part)}
              >
                Add to Request
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}