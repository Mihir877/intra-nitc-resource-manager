import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Filter,
  Search,
  Trash2,
  X,
  Mail,
  CheckCircle2,
  XCircle,
  BarChart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageTitle from "../common/PageTitle";
import ConfirmDialog from "../common/ConfirmDialog";
import api from "@/api/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/get-all-users");
      const data = res.data?.users || [];
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      accessorKey: "username",
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
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.username}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="w-3 h-3" /> {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          Role
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
        <Badge
          className={`capitalize ${
            row.original.role === "admin"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-300/20 dark:text-purple-300"
              : row.original.role === "faculty"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-300/20 dark:text-blue-300"
              : "bg-green-100 text-green-800 dark:bg-green-300/20 dark:text-green-300"
          }`}
        >
          {row.original.role}
        </Badge>
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
        <div className="flex items-center gap-1 text-foreground">
          {row.original.department ? (
            <span>{row.original.department}</span>
          ) : (
            <span className="text-center w-full text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "isEmailVerified",
      header: (
        <div className="flex items-center gap-2 font-semibold text-foreground">
          Verified
        </div>
      ),
      size: 40,
      cell: ({ row }) => (
        <div className="w-full h-full flex items-center justify-center">
          {row.original.isEmailVerified ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "loginType",
      header: (
        <div className="flex items-center gap-2 font-semibold text-foreground">
          Login
        </div>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-medium capitalize">
          {row.original.loginType?.replace("_", " ") || "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "totalBookings",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <BarChart className="w-4 h-4" />
          Bookings
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
        <div className="flex justify-center items-center gap-1 text-foreground">
          <span className="font-medium">{row.original.totalBookings}</span>
          <span className="text-xs text-muted-foreground mt-0.5">
            ({row.original.activeBookings} active)
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <UserActions user={row.original} onRefresh={fetchUsers} />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground ">
      <PageTitle
        title="User Management"
        subtitle="Monitor users, activity, and access levels"
      />
      <DataTable columns={columns} data={users} searchColumn="username" />
    </div>
  );
}

/* ---------------------- UserActions ---------------------- */

function UserActions({ user, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await api.delete(`/users/delete-account/${user._id}`);
      if (res.data?.success) {
        toast.success("User deleted");
        onRefresh();
      } else toast.error("Failed to delete user");
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 justify-end">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => navigate(`/admin/users/${user._id}`)}
        >
          <Eye className="w-4 h-4 text-primary" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete User"
        onConfirm={handleDelete}
        loading={loading}
        confirmText="Delete"
      >
        Are you sure you want to delete <b>{user.username}</b>?
      </ConfirmDialog>
    </>
  );
}

/* ---------------------- DataTable ---------------------- */

function DataTable({ columns, data, searchColumn = "username" }) {
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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: "username", desc: false }],
    },
  });

  const roleOptions = ["student", "faculty", "admin"];

  return (
    <div className="transition-colors">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div className="flex items-center gap-2 w-full relative">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={table.getColumn(searchColumn)?.getFilterValue() ?? ""}
            onChange={(e) =>
              table.getColumn(searchColumn)?.setFilterValue(e.target.value)
            }
            className="w-full pl-9"
          />
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[280px] p-4 space-y-4 border border-border rounded-xl bg-popover text-popover-foreground">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="text-sm font-semibold">Filter Users</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select
                value={table.getColumn("role")?.getFilterValue() ?? ""}
                onValueChange={(v) =>
                  table.getColumn("role")?.setFilterValue(v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
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
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-t border-border mt-4 text-sm text-muted-foreground">
        <div>
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
                <span className="font-semibold text-foreground">
                  {start}-{end}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalRows}
                </span>{" "}
                users • Page{" "}
                <span className="font-semibold text-foreground">
                  {pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalPages}
                </span>
              </span>
            );
          })()}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
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

          <div className="flex items-center gap-2">
            <span>Go to:</span>
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
