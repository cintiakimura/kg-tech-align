import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I can help you navigate the app. What are you looking for?' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue;
        setInputValue("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `
                    You are a helpful navigation assistant for the KG Solutions app.
                    The app has these pages:
                    - /ManagerDashboard (Dashboard, Overview)
                    - /ProductionControl (Production, Orders, Vehicles, Logistics)
                    - /Clients (Client list, Companies)
                    - /Quotations (Client Quotes list, Sales)
                    - /CreateClientQuote (Create new quote)
                    - /StockControl (Inventory, Parts, Catalogue, Stock)
                    - /Purchases (Supplier orders, Procurement)
                    - /Logistics (Deliveries, Tracking)
                    - /FinancialAnalysis (Finance, Revenue, Costs, Profit)
                    - /DocumentVault (Documents, Files, Legal, Contracts)
                    - /SupplierDashboard (For suppliers)
                    - /Onboarding (Client Dashboard)
                    - /Catalogue (Product Catalogue)

                    The user is asking: "${userMessage}"

                    Determine the best page to navigate to based on the user's request.
                    If the user asks to find something or go somewhere, return a JSON object with a navigation path.
                    If they just want to chat or ask a general question, return null for navigate_to.

                    Return ONLY a JSON object in this format:
                    {
                        "response": "A short, friendly text response to show the user.",
                        "navigate_to": "/Path" or null
                    }
                `,
                response_json_schema: {
                    type: "object",
                    properties: {
                        response: { type: "string" },
                        navigate_to: { type: ["string", "null"] }
                    },
                    required: ["response"]
                }
            });

            // Parse response if it comes back as string, though SDK usually handles dict return if schema provided
            const data = typeof response === 'string' ? JSON.parse(response) : response;

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

            if (data.navigate_to) {
                // Add a small delay for the user to read the message
                setTimeout(() => {
                    window.location.href = data.navigate_to;
                }, 1000);
            }

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I couldn't process that request. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="w-80 h-96 shadow-2xl border-2 border-[#00C600]/20 flex flex-col bg-white dark:bg-[#1e1e1e]">
                            <CardHeader className="p-4 border-b bg-[#00C600]/5 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-[#00C600]" />
                                    AI Assistant
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                                msg.role === 'user'
                                                    ? 'bg-[#00C600] text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-[#00C600]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>
                            <CardFooter className="p-3 border-t bg-gray-50 dark:bg-[#252525]">
                                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                                    <Input
                                        placeholder="Find something..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="h-9 text-sm focus-visible:ring-[#00C600]"
                                    />
                                    <Button type="submit" size="icon" className="h-9 w-9 bg-[#00C600] hover:bg-[#00b300]" disabled={isLoading}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 w-12 rounded-full bg-[#00C600] text-white shadow-lg flex items-center justify-center hover:bg-[#00b300] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00C600] focus:ring-offset-2"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}