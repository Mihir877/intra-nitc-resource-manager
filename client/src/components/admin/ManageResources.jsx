"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search } from "lucide-react";

const ResourceManager = () => {
  const [resources, setResources] = useState([
    {
      id: 1,
      name: "Electron Microscope SEM-500",
      type: "Lab Instrument",
      description:
        "Scanning Electron Microscope, 10nm resolution, 30kV accelerating voltage",
      location: "Advanced Materials Lab - Building B",
      status: "Available",
    },
    {
      id: 2,
      name: "FTIR Spectrometer",
      type: "Lab Instrument",
      description:
        "Fourier Transform Infrared, 4000-400 cm⁻¹ range, ATR module included",
      location: "Chemistry Research Lab - Block A",
      status: "In-Use",
    },
    {
      id: 3,
      name: "NMR Spectrometer 400MHz",
      type: "Lab Instrument",
      description:
        "Nuclear Magnetic Resonance, 400MHz, Liquid/Solid sample capability",
      location: "Central Instrumentation Facility",
      status: "Available",
    },
  ]);

  const [search, setSearch] = useState("");

  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Resources</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit, and manage all system resources
          </p>
        </div>
        <Button className="flex gap-2 bg-orange-500 hover:bg-orange-600">
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
            All Resources ({filteredResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {filteredResources.map((res) => (
              <ResourceItem key={res.id} resource={res} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ResourceItem = ({ resource }) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-3 rounded-lg">
          <span className="text-blue-600 text-lg">📘</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">{resource.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{resource.type}</Badge>
            <Badge
              className={
                resource.status === "Available"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"
              }
            >
              {resource.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
          <p className="text-xs text-gray-500 mt-1">{resource.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline">
          <Edit2 className="w-4 h-4 text-gray-600" />
        </Button>
        <Button size="icon" variant="outline">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export default ResourceManager;
