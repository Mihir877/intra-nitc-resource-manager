// BrowseResources.jsx
"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Cpu } from "lucide-react";

const resourcesData = [
  {
    name: "Electron Microscope SEM-500",
    type: "Lab Instrument",
    specs: "Scanning Electron Microscope, 10nm resolution, 30kV accelerating voltage",
    location: "Advanced Materials Lab - Building B",
    status: "Available",
  },
  {
    name: "FTIR Spectrometer",
    type: "Lab Instrument",
    specs: "Fourier Transform Infrared, 4000–400 cm⁻¹ range, ATR module included",
    location: "Chemistry Research Lab - Block A",
    status: "In-Use",
    availableDate: "2025-10-05 10:00",
  },
  {
    name: "NMR Spectrometer 400MHz",
    type: "Lab Instrument",
    specs: "Nuclear Magnetic Resonance, 400MHz, Liquid/Solid sample capability",
    location: "Central Instrumentation Facility",
    status: "Available",
  },
  {
    name: "Digital Oscilloscope DSO-X",
    type: "Lab Instrument",
    specs: "500MHz bandwidth, 4 analog channels, high sampling rate",
    location: "Electronics Lab - Room 204",
    status: "Available",
  },
  {
    name: "HPLC System",
    type: "Lab Instrument",
    specs: "High Performance Liquid Chromatography, UV/Vis detector included",
    location: "Analytical Chemistry Lab - Block C",
    status: "In-Use",
  },
  {
    name: "CNC Milling Machine",
    type: "Workshop Equipment",
    specs: "3-axis, precision up to 0.01mm, suitable for prototyping",
    location: "Mechanical Workshop - Bay 2",
    status: "Available",
  },
];

export default function BrowseResources() {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResources = resourcesData.filter((item) => {
    const matchesFilter =
      filter === "All" || item.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Resources</h1>
        <p className="text-gray-500 mt-1">
          Explore available GPU servers, lab equipment, and institutional resources
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search resources by name, type, or specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Available", "In-Use"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              className={`${
                filter === f
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "text-gray-600"
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((res, i) => (
          <Card key={i} className="shadow-sm border border-gray-200">
            <CardHeader className="pb-2 flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {res.name}
                </CardTitle>
              </div>
              <Badge
                className={`${
                  res.status === "Available"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {res.status}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="font-medium text-gray-800">{res.type}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Specifications:</span>{" "}
                  {res.specs}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Location:</span> {res.location}
                </p>
              </div>
              {res.status === "In-Use" && res.availableDate && (
                <p className="text-sm text-gray-500">
                  Available: {res.availableDate}
                </p>
              )}
              <Button
                className={`w-full mt-2 ${
                  res.status === "Available"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={res.status !== "Available"}
              >
                {res.status === "Available"
                  ? "Request Resource"
                  : "Unavailable"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
