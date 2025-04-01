"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Price } from "@/lib/types"

// Enhanced price data with additional date information
export type EnhancedPriceData = {
  id: string
  price: number
  created_at: string
  formattedDate: string
  formattedTime: string
  month: string
  year: number
}

// Function to enhance price data with additional date information
export function enhancePriceData(prices: Price[]): EnhancedPriceData[] {
  return prices.map(price => {
    const date = new Date(price.created_at)
    return {
      ...price,
      formattedDate: format(date, "MMM dd, yyyy"),
      formattedTime: format(date, "h:mm a"),
      month: format(date, "MMMM"),
      year: date.getFullYear()
    }
  })
}

export const columns: ColumnDef<EnhancedPriceData>[] = [
  {
    accessorKey: "formattedDate",
    header: "Date",
    cell: ({ row }) => <div>{row.getValue("formattedDate")}</div>,
  },
  {
    accessorKey: "formattedTime",
    header: "Time",
    cell: ({ row }) => <div>{row.getValue("formattedTime")}</div>,
  },
  {
    accessorKey: "month",
    header: "Month",
    cell: ({ row }) => <div>{row.getValue("month")}</div>,
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => <div>{row.getValue("year")}</div>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(price)
      return <div className="font-medium">{formatted}</div>
    },
  },
]

interface PriceHistoryTableProps {
  prices: Price[]
}

export function PriceHistoryTable({ prices }: PriceHistoryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    month: false,
    year: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Enhance price data with additional date information
  const data = enhancePriceData(prices)

  // Determine if we should show month and year columns
  const shouldShowMonthColumn = React.useMemo(() => 
    data.some((item, index, array) => 
      index > 0 && item.month !== array[0].month
    ), [data]
  )
  
  const shouldShowYearColumn = React.useMemo(() => 
    data.some((item, index, array) => 
      index > 0 && item.year !== array[0].year
    ), [data]
  )

  // Update column visibility based on data
  React.useEffect(() => {
    setColumnVisibility(prev => ({
      ...prev,
      month: shouldShowMonthColumn,
      year: shouldShowYearColumn,
    }))
  }, [shouldShowMonthColumn, shouldShowYearColumn])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter dates..."
          value={(table.getColumn("formattedDate")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("formattedDate")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No price data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} price entries
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
