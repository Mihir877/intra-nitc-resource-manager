"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Cpu, ChevronRight } from "lucide-react";

const resourcesData = [
  {
    name: "Electron Microscope SEM-500",
    type: "Lab Instrument",
    specs:
      "Scanning Electron Microscope, 10nm resolution, 30kV accelerating voltage",
    location: "Advanced Materials Lab - Building B",
    status: "Available",
    slug: "electron-microscope-sem-500",
  },
  {
    name: "FTIR Spectrometer",
    type: "Lab Instrument",
    specs:
      "Fourier Transform Infrared, 4000–400 cm⁻¹ range, ATR module included",
    location: "Chemistry Research Lab - Block A",
    status: "In-Use",
    availableDate: "2025-10-05 10:00",
    slug: "ftir-spectrometer",
  },
  {
    name: "NMR Spectrometer 400MHz",
    type: "Lab Instrument",
    specs: "Nuclear Magnetic Resonance, 400MHz, Liquid/Solid sample capability",
    location: "Central Instrumentation Facility",
    status: "Available",
    slug: "nmr-spectrometer-400mhz",
  },
  {
    name: "Digital Oscilloscope DSO-X",
    type: "Lab Instrument",
    specs: "500MHz bandwidth, 4 analog channels, high sampling rate",
    location: "Electronics Lab - Room 204",
    status: "Available",
    slug: "digital-oscilloscope-dso-x",
  },
  {
    name: "HPLC System",
    type: "Lab Instrument",
    specs: "High Performance Liquid Chromatography, UV/Vis detector included",
    location: "Analytical Chemistry Lab - Block C",
    status: "In-Use",
    slug: "hplc-system",
  },
  {
    name: "CNC Milling Machine",
    type: "Workshop Equipment",
    specs: "3-axis, precision up to 0.01mm, suitable for prototyping",
    location: "Mechanical Workshop - Bay 2",
    status: "Available",
    slug: "cnc-milling-machine",
  },
];

export default function BrowseResources() {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredResources = resourcesData.filter((item) => {
    const matchesFilter =
      filter === "All" || item.status.toLowerCase() === filter.toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.specs.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Resources</h1>
        <p className="text-gray-500 mt-1">
          Explore available GPU servers, lab equipment, and institutional
          resources
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
            <button
              key={f}
              onClick={() => setFilter(f)}
              type="button"
              className={[
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50 h-9 px-4",
                f === filter
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-gray-600",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:1fr]">
        {filteredResources.map((res, i) => {
          const isAvailable = res.status === "Available";
          const to = `/resources/${
            res.slug ?? res.name.toLowerCase().replace(/\s+/g, "-")
          }`;

          return (
            <Link
              key={i}
              to={to}
              aria-label={`View resource ${res.name}`}
              className="group block h-full"
            >
              <Card
                className={[
                  "relative h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm",
                  "transition-all duration-200 ease-out",
                  "hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300",
                  "hover:scale-[1.01] active:scale-[0.995]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "will-change-transform",
                  "flex flex-col", 
                ].join(" ")}
              >
                <CardHeader className="pb-2 flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {res.name}
                    </CardTitle>
                  </div>
                  <Badge
                    className={[
                      "transition-colors",
                      isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {res.status}
                  </Badge>
                </CardHeader>

                {/* Growable content area */}
                <CardContent className="text-sm space-y-3 flex-1">
                  <div>
                    <p className="font-medium text-gray-800">{res.type}</p>
                  </div>
                  {res.specs && (
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Specifications:</span>{" "}
                        {res.specs}
                      </p>
                    </div>
                  )}
                  {res.location && (
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {res.location}
                      </p>
                    </div>
                  )}
                  {res.status === "In-Use" && res.availableDate && (
                    <p className="text-sm text-gray-500">
                      Available: {res.availableDate}
                    </p>
                  )}
                </CardContent>

                {/* Sticky bottom row */}
                <div className="px-6 pb-5 pt-2 mt-auto flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1 text-blue-700">
                    View resource
                    <ChevronRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span
                    className={[
                      "text-xs px-2 py-1 rounded-md",
                      isAvailable
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-600",
                    ].join(" ")}
                  >
                    {isAvailable ? "Open to request" : "Check availability"}
                  </span>
                </div>

                {/* Soft ring pulse on hover */}
                <span
                  className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-blue-200/0 group-hover:ring-8 transition-[box-shadow,transform,border-color,ring] duration-200"
                  aria-hidden="true"
                />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
