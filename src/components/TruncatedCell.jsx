import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function TruncatedCell({ text, children, className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // If no text provided, just render children directly (e.g. for inputs/selects)
    if (!text && !children) return <span className="text-muted-foreground">-</span>;
    if (!text && children) return children;

    // For simple text that we want to truncate and expand on click
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div 
                    className={`truncate cursor-pointer hover:bg-black/5 rounded px-1 -mx-1 transition-colors ${className}`} 
                    title="Click to view full text"
                >
                    {text}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[300px] p-2 text-sm break-words bg-white dark:bg-[#333]">
                {text}
            </PopoverContent>
        </Popover>
    );
}