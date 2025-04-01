"use client";

import { format } from "date-fns";
import { Trash } from "lucide-react";
import { type Item, type Price } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ItemCardProps {
    item: Item & {
        latestPrice?: Price;
    };
    onDelete: () => void;
    onAddPrice: () => void;
    onView: () => void;
}

export function ItemCard({ item, onDelete, onAddPrice, onView }: ItemCardProps) {
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "PPP");
        } catch (error) {
            return "Unknown date";
        }
    };

    const formatPrice = (price?: number) => {
        if (price === undefined) return "No price";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(price);
    };

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
                <CardTitle>{item.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                    Created: {formatDate(item.created_at)}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-2">
                    <div className="font-medium">Latest Price</div>
                    <div className="text-2xl font-bold">
                        {item.latestPrice
                            ? formatPrice(item.latestPrice.price)
                            : "No price yet"}
                    </div>
                    <div className="text-xs text-muted-foreground min-h-5">
                        {item.latestPrice ? formatDate(item.latestPrice.created_at) : "\u00A0"}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 mt-auto">
                <Button variant="outline" onClick={onView}>
                    View
                </Button>
                <Button onClick={onAddPrice}>Add Price</Button>
            </CardFooter>
        </Card>
    );
} 