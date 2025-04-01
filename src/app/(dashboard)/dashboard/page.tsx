"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getClientPocketBase } from "@/lib/pocketbase-client";
import { itemSchema, type ItemFormValues } from "@/lib/auth-schema";
import { type Item, type Price } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ItemCard } from "@/components/item-card";
import { ItemPriceDialog } from "@/components/item-price-dialog";
import { ItemViewDrawer } from "@/components/item-view-drawer";

export default function DashboardPage() {
    const [items, setItems] = useState<(Item & { latestPrice?: Price })[]>([]);
    const [filteredItems, setFilteredItems] = useState<(Item & { latestPrice?: Price })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<"created" | "price">("created");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            name: "",
            price: 0,
        },
    });

    // Fetch items on initial load
    useEffect(() => {
        fetchItems();
    }, []);

    // Filter and sort items when search term or sort option changes
    useEffect(() => {
        let sorted = [...items];
        
        // Sort based on selected option
        if (sortOption === "created") {
            sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortOption === "price") {
            sorted.sort((a, b) => {
                // Items with no price go to the bottom
                if (!a.latestPrice && !b.latestPrice) return 0;
                if (!a.latestPrice) return 1;
                if (!b.latestPrice) return -1;
                
                // Sort by price update date (most recent first)
                return new Date(b.latestPrice.created_at).getTime() - new Date(a.latestPrice.created_at).getTime();
            });
        }
        
        // Then filter by search term
        if (searchTerm.trim() === "") {
            setFilteredItems(sorted);
        } else {
            const filtered = sorted.filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    }, [searchTerm, items, sortOption]);

    async function fetchItems() {
        setIsLoading(true);
        try {
            const pb = getClientPocketBase();
            const userId = pb.authStore.model?.id;
            if (!userId) return;

            // Fetch all items for current user
            const itemsData = await pb.collection("items").getList(1, 100, {
                filter: `User = "${userId}"`,
                sort: "-created_at",
            });

            // Fetch the latest price for each item
            const itemsWithPrices = await Promise.all(
                itemsData.items.map(async (item: any) => {
                    try {
                        const prices = await pb.collection("prices").getList(1, 1, {
                            filter: `item = "${item.id}"`,
                            sort: "-created_at",
                        });
                        return {
                            ...item,
                            latestPrice: prices.items.length > 0 ? prices.items[0] : undefined,
                        };
                    } catch (error) {
                        return { ...item };
                    }
                })
            );

            setItems(itemsWithPrices);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateItem(data: ItemFormValues) {
        try {
            const pb = getClientPocketBase();
            const userId = pb.authStore.model?.id;
            if (!userId) return;

            // Create the item
            const item = await pb.collection("items").create({
                name: data.name,
                User: userId,
            });

            // Create the initial price
            await pb.collection("prices").create({
                item: item.id,
                price: data.price,
            });

            // Refresh items
            await fetchItems();
            form.reset();
            setIsCreateDialogOpen(false);
        } catch (error) {
            console.error("Error creating item:", error);
        }
    }

    async function handleDeleteItem(itemId: string) {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const pb = getClientPocketBase();

            // Delete all prices associated with the item
            const prices = await pb.collection("prices").getList(1, 1000, {
                filter: `item = "${itemId}"`,
            });

            for (const price of prices.items) {
                await pb.collection("prices").delete(price.id);
            }

            // Delete the item
            await pb.collection("items").delete(itemId);

            // Refresh items
            await fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }

    function handleAddPrice(item: Item) {
        setSelectedItem(item);
        setIsPriceDialogOpen(true);
    }

    function handleViewItem(item: Item) {
        setSelectedItem(item);
        setIsViewDrawerOpen(true);
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Search and Create */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">Create Item</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Item</DialogTitle>
                            <DialogDescription>
                                Add a new item to track its price
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreateItem)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Item Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter item name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit">Create Item</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            
            {/* Sort Pills */}
            <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <div className="flex gap-2">
                    <Button 
                        variant={sortOption === "created" ? "default" : "outline"} 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => setSortOption("created")}
                    >
                        Date Created
                    </Button>
                    <Button 
                        variant={sortOption === "price" ? "default" : "outline"} 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => setSortOption("price")}
                    >
                        Latest Price
                    </Button>
                </div>
            </div>

            {/* Items Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="border rounded-xl p-6 space-y-4 animate-pulse"
                        >
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <div className="h-9 bg-muted rounded w-20"></div>
                                <div className="h-9 bg-muted rounded w-20"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4 border rounded-xl bg-background/50">
                    <p className="text-muted-foreground">No items found</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>Create your first item</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onDelete={() => handleDeleteItem(item.id)}
                            onAddPrice={() => handleAddPrice(item)}
                            onView={() => handleViewItem(item)}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            {selectedItem && (
                <>
                    <ItemPriceDialog
                        open={isPriceDialogOpen}
                        onOpenChange={setIsPriceDialogOpen}
                        item={selectedItem}
                        onPriceAdded={fetchItems}
                    />
                    <ItemViewDrawer
                        open={isViewDrawerOpen}
                        onOpenChange={setIsViewDrawerOpen}
                        item={selectedItem}
                    />
                </>
            )}
        </div>
    );
}