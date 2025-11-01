"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import api from "@/api/axios";
import AddResourceModal from "./AddResourceModal";

const ResourceManager = () => {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // for "add" modal
  const [edit, setEdit] = useState(false); // for "edit" modal
  const [selectedResource, setSelectedResource] = useState(null); // ✅ fix

  // ✅ handle resource add
  const handleResourceAdded = (newResource) => {
    setResources((prev) => [...prev, newResource]);
  };

  // ✅ handle resource edit
  const handleResourceEdited = (updatedResource) => {
    setResources((prev) =>
      prev.map((r) => (r._id === updatedResource._id ? updatedResource : r))
    );
  };

  // ✅ handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;
    try {
      const res = await api.delete(`/resources/${id}`);
      if (res.data.success) {
        setResources((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  // ✅ fetch all resources
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await api.get("/resources/");
        setResources(res.data.data || res.data.resources || []);
      } catch (err) {
        console.error("Error fetching resources:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const filteredResources = resources.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Resources</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit, and manage all resources
          </p>
        </div>
        <Button
          className="flex gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Resource
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search resources..."
          className="pl-10 border-gray-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Resource List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {loading
              ? "Loading..."
              : `All Resources (${filteredResources.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && filteredResources.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((res) => (
                <ResourceItem
                  key={res._id}
                  resource={res}
                  onEdit={() => {
                    setSelectedResource(res);
                    setEdit(true);
                  }}
                  onDelete={() => handleDelete(res._id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No resources found.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <AddResourceModal
        open={open || edit}
        onClose={() => {
          setOpen(false);
          setEdit(false);
          setSelectedResource(null);
        }}
        onResourceAdded={
          selectedResource ? handleResourceEdited : handleResourceAdded
        }
        resourceData={selectedResource} // Pass resource if editing, null if adding
      />
    </div>
  );
};

const ResourceItem = ({ resource, onEdit, onDelete }) => {
  return (
    <div className="relative group bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-blue-600 text-xl">📘</span>
        <h2 className="font-semibold text-gray-800 truncate">
          {resource.name}
        </h2>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary">{resource.type}</Badge>
        <Badge
          variant="secondary"
          className={
            resource.status?.toLowerCase() === "available"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }
        >
          {resource.status}
        </Badge>
      </div>

      <p className="text-sm text-gray-600">{resource.description}</p>
      <p className="text-xs text-gray-500 mt-1">{resource.location}</p>

      {/* Hover Buttons */}
      <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button
          onClick={onEdit}
          variant="outline"
          className="p-1 h-7 w-7 rounded-md bg-white/90 hover:bg-gray-100"
        >
          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
        </Button>
        <Button
          onClick={onDelete}
          variant="outline"
          className="p-1 h-7 w-7 rounded-md bg-white/90 hover:bg-gray-100"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export default ResourceManager;
