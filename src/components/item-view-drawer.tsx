"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, ChevronRight, ChevronDown } from "lucide-react";
import { getClientPocketBase } from "@/lib/pocketbase-client";
import { type Item, type Price } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    LabelList,
} from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface ItemViewDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Item;
}

export function ItemViewDrawer({
    open,
    onOpenChange,
    item,
}: ItemViewDrawerProps) {
    const [prices, setPrices] = useState<Price[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: undefined,
        to: undefined,
    });
    const [stats, setStats] = useState({
        min: 0,
        max: 0,
        average: 0,
        count: 0,
    });

    // State to track expanded/collapsed groups
    const [expandedYears, setExpandedYears] = useState<number[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [expandedDates, setExpandedDates] = useState<string[]>([]);

    // Toggle functions for each level
    const toggleYear = (year: number) => {
        setExpandedYears(prev => 
            prev.includes(year) 
                ? prev.filter(y => y !== year) 
                : [...prev, year]
        );
    };

    const toggleMonth = (yearMonth: string) => {
        setExpandedMonths(prev => 
            prev.includes(yearMonth) 
                ? prev.filter(m => m !== yearMonth) 
                : [...prev, yearMonth]
        );
    };

    const toggleDate = (yearMonthDate: string) => {
        setExpandedDates(prev => 
            prev.includes(yearMonthDate) 
                ? prev.filter(d => d !== yearMonthDate) 
                : [...prev, yearMonthDate]
        );
    };

    useEffect(() => {
        if (open) {
            fetchPrices();
        }
    }, [open, dateRange]);

    useEffect(() => {
        if (prices.length > 0) {
            const currentYear = new Date().getFullYear();
            setExpandedYears([currentYear]);
            
            // Expand current month
            const currentMonth = new Date().toLocaleString("default", { month: "long" });
            setExpandedMonths([`${currentYear}-${currentMonth}`]);
        }
    }, [prices]);

    async function fetchPrices() {
        setIsLoading(true);
        try {
            const pb = getClientPocketBase();

            let filter = `item = "${item.id}"`;

            if (dateRange.from) {
                filter += ` && created_at >= "${dateRange.from.toISOString()}"`;
            }

            if (dateRange.to) {
                // Add one day to include the end date
                const endDate = new Date(dateRange.to);
                endDate.setDate(endDate.getDate() + 1);
                filter += ` && created_at <= "${endDate.toISOString()}"`;
            }

            const result = await pb.collection("prices").getList(1, 100, {
                filter,
                sort: "created_at",
            });

            const pricesData = result.items.map(item => ({
                id: item.id,
                item: item.item,
                price: item.price,
                created_at: item.created_at,
                updated_at: item.updated_at
            })) as Price[];
            setPrices(pricesData);

            // Calculate stats
            if (pricesData.length > 0) {
                const priceValues = pricesData.map((p) => p.price);
                setStats({
                    min: Math.min(...priceValues),
                    max: Math.max(...priceValues),
                    average: priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
                    count: priceValues.length,
                });
            } else {
                setStats({ min: 0, max: 0, average: 0, count: 0 });
            }

        } catch (error) {
            console.error("Error fetching prices:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "PPP");
        } catch (error) {
            return "Unknown date";
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "PPPPp");
        } catch (error) {
            return "Unknown date";
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return format(new Date(dateString), "h:mm a");
        } catch (error) {
            return "Unknown time";
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(price);
    };

    // Group and average prices by date
    const chartData = useMemo(() => {
        // Group prices by date
        const groupedByDate = prices.reduce((acc, price) => {
            const dateStr = format(new Date(price.created_at), "MM/dd/yyyy");
            if (!acc[dateStr]) {
                acc[dateStr] = { sum: 0, count: 0 };
            }
            acc[dateStr].sum += price.price;
            acc[dateStr].count += 1;
            return acc;
        }, {} as Record<string, { sum: number; count: number }>);

        // Convert to array with averaged prices
        return Object.entries(groupedByDate)
            .map(([date, { sum, count }]) => ({
                date,
                price: sum / count,
            }))
            .sort((a, b) => {
                // Sort by date
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA.getTime() - dateB.getTime();
            });
    }, [prices]);

    const chartConfig = {
        price: {
            label: "Price",
            color: "var(--color-primary)",
        },
    } satisfies ChartConfig;

    const groupPricesByDate = (prices: Price[]) => {
        // First sort prices by date (newest first)
        const sortedPrices = [...prices].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const groupedPrices: {
            year: number;
            yearPrices: {
                month: string;
                monthPrices: {
                    date: string;
                    datePrices: Price[];
                }[];
            }[];
        }[] = [];
        
        sortedPrices.forEach(price => {
            const date = new Date(price.created_at);
            const year = date.getFullYear();
            const month = date.toLocaleString("default", { month: "long" });
            const dayStr = format(date, "EEEE, MMMM do, yyyy");
            
            // Find or create year group
            let yearGroup = groupedPrices.find(g => g.year === year);
            if (!yearGroup) {
                yearGroup = { year, yearPrices: [] };
                groupedPrices.push(yearGroup);
            }
            
            // Find or create month group
            let monthGroup = yearGroup.yearPrices.find(g => g.month === month);
            if (!monthGroup) {
                monthGroup = { month, monthPrices: [] };
                yearGroup.yearPrices.push(monthGroup);
            }
            
            // Find or create date group
            let dateGroup = monthGroup.monthPrices.find(g => g.date === dayStr);
            if (!dateGroup) {
                dateGroup = { date: dayStr, datePrices: [] };
                monthGroup.monthPrices.push(dateGroup);
            }
            
            // Add price to date group
            dateGroup.datePrices.push(price);
        });
        
        return groupedPrices;
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[90vh]">
                <div className="mx-auto w-full max-w-7xl">
                    <div className="overflow-y-auto max-h-[80vh] pb-20">
                        <DrawerHeader>
                            <DrawerTitle className="text-2xl">{item.name}</DrawerTitle>
                            <DrawerDescription>
                                View price history and statistics
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left side - Info and stats */}
                            <div className="space-y-6">
                                {/* Date range picker */}
                                <div className="flex flex-col space-y-2">
                                    <h3 className="text-sm font-medium">Date Range</h3>
                                    <div className="flex items-center space-x-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-[240px] justify-start text-left font-normal",
                                                        !dateRange.from && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateRange.from ? (
                                                        dateRange.to ? (
                                                            <>
                                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                                {format(dateRange.to, "LLL dd, y")}
                                                            </>
                                                        ) : (
                                                            format(dateRange.from, "LLL dd, y")
                                                        )
                                                    ) : (
                                                        <span>Pick a date range</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="range"
                                                    selected={{
                                                        from: dateRange.from,
                                                        to: dateRange.to,
                                                    }}
                                                    onSelect={(range) => {
                                                        setDateRange({
                                                            from: range?.from,
                                                            to: range?.to,
                                                        });
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setDateRange({ from: undefined, to: undefined });
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats */}
                                {isLoading ? (
                                    <div className="space-y-2 animate-pulse">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="h-8 bg-muted rounded w-3/4"></div>
                                        ))}
                                    </div>
                                ) : prices.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No price data for the selected date range
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="border rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Lowest Price
                                                </h3>
                                                <p className="text-2xl font-bold">{formatPrice(stats.min)}</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Highest Price
                                                </h3>
                                                <p className="text-2xl font-bold">{formatPrice(stats.max)}</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Average Price
                                                </h3>
                                                <p className="text-2xl font-bold">{formatPrice(stats.average)}</p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-muted-foreground">
                                                    Number of Entries
                                                </h3>
                                                <p className="text-2xl font-bold">{stats.count}</p>
                                            </div>
                                        </div>

                                        {/* Price Table */}
                                        <div>
                                            <h3 className="text-lg font-medium mb-2">Price History</h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50">
                                                            <th className="text-left p-2">Date & Time</th>
                                                            <th className="text-left p-2">Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {prices.length === 0 ? (
                                                            <tr>
                                                                <td
                                                                    colSpan={2}
                                                                    className="text-center h-24 text-muted-foreground p-2"
                                                                >
                                                                    No price data available
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            groupPricesByDate(prices).map((yearGroup) => (
                                                                <Fragment key={yearGroup.year}>
                                                                    <tr 
                                                                        className="bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
                                                                        onClick={() => toggleYear(yearGroup.year)}
                                                                    >
                                                                        <td colSpan={2} className="p-2 font-semibold flex items-center">
                                                                            {expandedYears.includes(yearGroup.year) 
                                                                                ? <ChevronDown className="h-4 w-4 mr-1" /> 
                                                                                : <ChevronRight className="h-4 w-4 mr-1" />
                                                                            }
                                                                            {yearGroup.year}
                                                                        </td>
                                                                    </tr>
                                                                    {expandedYears.includes(yearGroup.year) && yearGroup.yearPrices.map((monthGroup) => {
                                                                        const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                                                                        return (
                                                                            <Fragment key={monthGroup.month}>
                                                                                <tr 
                                                                                    className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                                                                                    onClick={() => toggleMonth(monthKey)}
                                                                                >
                                                                                    <td colSpan={2} className="p-2 font-medium pl-4 flex items-center">
                                                                                        {expandedMonths.includes(monthKey) 
                                                                                            ? <ChevronDown className="h-4 w-4 mr-1" /> 
                                                                                            : <ChevronRight className="h-4 w-4 mr-1" />
                                                                                        }
                                                                                        {monthGroup.month}
                                                                                    </td>
                                                                                </tr>
                                                                                {expandedMonths.includes(monthKey) && monthGroup.monthPrices.map((dateGroup) => {
                                                                                    const dateKey = `${monthKey}-${dateGroup.date}`;
                                                                                    return (
                                                                                        <Fragment key={dateGroup.date}>
                                                                                            <tr 
                                                                                                className="bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                                                                                                onClick={() => toggleDate(dateKey)}
                                                                                            >
                                                                                                <td colSpan={2} className="p-2 pl-6 text-sm flex items-center">
                                                                                                    {expandedDates.includes(dateKey) 
                                                                                                        ? <ChevronDown className="h-3 w-3 mr-1" /> 
                                                                                                        : <ChevronRight className="h-3 w-3 mr-1" />
                                                                                                    }
                                                                                                    {dateGroup.date}
                                                                                                </td>
                                                                                            </tr>
                                                                                            {expandedDates.includes(dateKey) && dateGroup.datePrices.map((price) => (
                                                                                                <tr key={price.id} className="border-b">
                                                                                                    <td className="p-2 pl-10">
                                                                                                        {formatTime(price.created_at)}
                                                                                                    </td>
                                                                                                    <td className="p-2">
                                                                                                        {formatPrice(price.price)}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </Fragment>
                                                                                    );
                                                                                })}
                                                                            </Fragment>
                                                                        );
                                                                    })}
                                                                </Fragment>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Right side - Chart */}
                            <div className="space-y-6">
                                {/* Chart */}
                                <div className="min-h-[250px] h-auto md:h-[300px]">
                                    <h3 className="text-lg font-medium mb-2">Price Trend</h3>
                                    {isLoading ? (
                                        <div className="h-full w-full animate-pulse bg-muted rounded" />
                                    ) : prices.length < 2 ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            Need at least two price points to display a chart
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle>Price Trend</CardTitle>
                                                <CardDescription>
                                                    {dateRange.from && dateRange.to 
                                                        ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                                                        : "All time"}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ChartContainer config={chartConfig} className="min-h-[220px]">
                                                    <LineChart
                                                        accessibilityLayer
                                                        data={chartData}
                                                        margin={{
                                                            top: 20,
                                                            right: 30,
                                                            left: 20,
                                                            bottom: 50,
                                                        }}
                                                    >
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            angle={-45}
                                                            textAnchor="end"
                                                            height={70}
                                                            tickMargin={8}
                                                            tick={{ fill: 'var(--color-muted-foreground)' }}
                                                        />
                                                        <YAxis
                                                            tickFormatter={(value) =>
                                                                new Intl.NumberFormat("en-IN", {
                                                                    notation: "compact",
                                                                    currency: "INR",
                                                                }).format(value)
                                                            }
                                                            tick={{ fill: 'var(--color-muted-foreground)' }}
                                                        />
                                                        <ChartTooltip
                                                            cursor={false}
                                                            content={
                                                                <ChartTooltipContent 
                                                                    formatter={(value) => [
                                                                        formatPrice(value as number),
                                                                        "Price",
                                                                    ]}
                                                                />
                                                            }
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="price"
                                                            stroke="var(--color-primary)"
                                                            strokeWidth={3}
                                                            dot={{
                                                                fill: "var(--color-primary)",
                                                                r: 5,
                                                            }}
                                                            activeDot={{
                                                                r: 7,
                                                                stroke: "var(--color-background)",
                                                                strokeWidth: 2,
                                                            }}
                                                            connectNulls
                                                        />
                                                        {/* Reference lines for min and max */}
                                                        <ReferenceLine
                                                            y={stats.min}
                                                            stroke="var(--color-chart-2)"
                                                            strokeDasharray="3 3"
                                                            label={{
                                                                value: "Min",
                                                                position: "insideBottomRight",
                                                                fill: "var(--color-chart-2)",
                                                            }}
                                                        />
                                                        <ReferenceLine
                                                            y={stats.max}
                                                            stroke="var(--color-chart-1)"
                                                            strokeDasharray="3 3"
                                                            label={{
                                                                value: "Max",
                                                                position: "insideTopRight",
                                                                fill: "var(--color-chart-1)",
                                                            }}
                                                        />
                                                    </LineChart>
                                                </ChartContainer>
                                            </CardContent>
                                            <CardFooter className="flex-col items-start gap-2 text-sm">
                                                <div className="flex gap-2 font-medium leading-none">
                                                    {prices.length > 1 && prices[0].price < prices[prices.length - 1].price ? (
                                                        <>
                                                            Trending up <TrendingUp className="h-4 w-4 text-green-500" />
                                                        </>
                                                    ) : prices.length > 1 ? (
                                                        <>
                                                            Trending down <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                                                        </>
                                                    ) : null}
                                                </div>
                                                <div className="leading-none text-muted-foreground">
                                                    {stats.count} price entries
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DrawerFooter>
                            <DrawerClose asChild>
                                <Button variant="outline">Close</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}