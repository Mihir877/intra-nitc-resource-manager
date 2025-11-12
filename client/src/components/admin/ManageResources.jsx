import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import api from "@/api/axios";
import PageTitle from "../common/PageTitle";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MapPin,
  Box,
  CircleDot,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Lock,
  X,
  Filter,
} from "lucide-react";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import ConfirmDialog from "../common/ConfirmDialog";
import useAuth from "@/hooks/useAuth";
import StatusBadge from "../common/StatusBadge";

function ResourceActions({ id, name, type, department, location }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const canEdit = user.role === "superadmin" || user.department === department;

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await api.delete(`/resources/${id}`);
      if (res.data?.success) {
        toast.success("Resource deleted successfully");
        setConfirmDelete(false);
      } else {
        throw new Error(res.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        {/* 👁️ View Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/admin/resources/${id}`)}
              >
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Resource Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* ✏️ Edit/Delete */}
        {canEdit ? (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/resources/${id}/edit`)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Resource</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Resource</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" disabled>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View only — cannot edit resources from other departments</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Resource"
        onConfirm={handleDelete}
        loading={loading}
        confirmText="Delete Resource"
      >
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Are you sure you want to delete:
          </p>
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium">{name}</h4>
            <p className="text-sm text-muted-foreground">
              {`${type || "Resource"} • ${department || "Department"} • ${
                location || "Location"
              }`}
            </p>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}

export default function ResourceManager() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await api.get("/resources/");
        const data = res.data?.resources ?? res.data?.data ?? res.data ?? [];
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch resources", err);
        toast.error("Failed to load resources");
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const columns = [
    {
      accessorKey: "images",
      header: "Image",
      enableSorting: false,
      cell: ({ row }) => {
        const img = row.original.images?.[0];
        return img ? (
          <img
            src={img}
            alt={row.original.name}
            className="w-12 h-12 object-cover rounded-md border border-border"
          />
        ) : (
          <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-md border border-border">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-40" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <TooltipProvider>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <div className="font-medium min-w-[180px] max-w-[240px] truncate cursor-help text-foreground">
                  {r.name || "Untitled Resource"}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-xs p-3 space-y-3 text-xs leading-relaxed bg-popover text-popover-foreground border border-border rounded-md"
              >
                <div className="font-semibold border-b border-border pb-2">
                  {r.name || "Unnamed Resource"}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{r.location || "No location specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Box className="h-3 w-3" />
                    <span className="capitalize">{r.type || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="h-3 w-3" />
                    <span className="capitalize">{r.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Max Duration:{" "}
                      {r.maxBookingDuration ? `${r.maxBookingDuration}h` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" />
                    <span>
                      Requires Approval: {r.requiresApproval ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          Type
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-40" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="capitalize text-foreground">
          {row.original.type || "—"}
        </span>
      ),
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          Department
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-40" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="capitalize text-foreground">
          {row.original.department || "—"}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          Location
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-40" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="truncate min-w-[140px] max-w-[200px] text-muted-foreground">
          {row.original.location || "—"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: (
        <div className="flex items-center gap-2 font-semibold text-foreground">
          Status
        </div>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "maxBookingDuration",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Clock className="w-4 h-4" />
          Duration (h)
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="w-4 h-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4 opacity-40" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center text-muted-foreground">
          {row.original.maxBookingDuration
            ? `${row.original.maxBookingDuration}h`
            : "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <ResourceActions
            id={r._id}
            name={r.name}
            type={r.type}
            department={r.department}
            location={r.location}
          />
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageTitle
        title="Resource Management"
        subtitle="Add, update, and monitor shared NITC assets in real time."
      >
        <Button
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => navigate("/admin/resources/add")}
        >
          <Plus className="w-4 h-4" /> Add Resource
        </Button>
      </PageTitle>

      <DataTable columns={columns} data={resources} searchColumn="name" />
    </div>
  );
}

/* -------------------- DataTable -------------------- */

function DataTable({ columns, data, searchColumn = "name" }) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [open, setOpen] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const typeOptions = Array.from(
    new Set(data.map((r) => r.type).filter(Boolean))
  );
  const deptOptions = Array.from(
    new Set(data.map((r) => r.department).filter(Boolean))
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div className="flex items-center gap-2 w-full relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={table.getColumn(searchColumn)?.getFilterValue() ?? ""}
            onChange={(e) =>
              table.getColumn(searchColumn)?.setFilterValue(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[320px] p-4 space-y-4 bg-popover text-popover-foreground border border-border rounded-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-semibold text-sm text-foreground">
                Filter Resources
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select
                value={table.getColumn("type")?.getFilterValue() ?? ""}
                onValueChange={(v) =>
                  table.getColumn("type")?.setFilterValue(v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="flex flex-col gap-2">
              <Label>Department</Label>
              <Select
                value={table.getColumn("department")?.getFilterValue() ?? ""}
                onValueChange={(v) =>
                  table
                    .getColumn("department")
                    ?.setFilterValue(v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {deptOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                table.resetColumnFilters();
                setSorting([]);
                toast.info("Filters reset");
              }}
            >
              Reset Filters
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-t mt-4">
        <div className="text-sm text-gray-600">
          {(() => {
            const pageSize = table.getState().pagination.pageSize;
            const pageIndex = table.getState().pagination.pageIndex;
            const totalRows = table.getFilteredRowModel().rows.length;
            const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
            const end = Math.min((pageIndex + 1) * pageSize, totalRows);
            const totalPages = table.getPageCount();

            return (
              <span>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {start}-{end}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">{totalRows}</span>{" "}
                resources • Page{" "}
                <span className="font-semibold text-gray-900">
                  {pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {totalPages}
                </span>
              </span>
            );
          })()}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Rows per page:</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[80px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Go to:</span>
            <Input
              type="number"
              min={1}
              max={table.getPageCount()}
              value={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="h-8 w-[70px] text-center"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
