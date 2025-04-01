"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getClientPocketBase } from "@/lib/pocketbase-client";
import { type Item } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schema for adding a new price
const priceSchema = z.object({
    price: z.coerce
        .number({ invalid_type_error: "Price must be a number" })
        .positive({ message: "Price must be a positive number" }),
});

type PriceFormValues = z.infer<typeof priceSchema>;

interface ItemPriceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Item;
    onPriceAdded: () => void;
}

export function ItemPriceDialog({
    open,
    onOpenChange,
    item,
    onPriceAdded,
}: ItemPriceDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PriceFormValues>({
        resolver: zodResolver(priceSchema),
        defaultValues: {
            price: 0,
        },
    });

    async function onSubmit(data: PriceFormValues) {
        setIsLoading(true);
        try {
            const pb = getClientPocketBase();
            await pb.collection("prices").create({
                item: item.id,
                price: data.price,
            });
            form.reset();
            onOpenChange(false);
            onPriceAdded();
        } catch (error) {
            console.error("Error adding price:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Price for {item.name}</DialogTitle>
                    <DialogDescription>
                        Enter the new price for your item
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            disabled={isLoading}
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Adding..." : "Add Price"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 