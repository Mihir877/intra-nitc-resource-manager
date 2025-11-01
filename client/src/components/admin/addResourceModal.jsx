"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
//import { toast } from "@/components/ui/use-toast";

export default function AddResourceModal({
  open,
  onClose,
  onResourceAdded,
  resourceData = null,
}) {
  const isEdit = !!resourceData;

  // ---------------- State ----------------
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    category: "",
    description: "",
    location: "",
    maxBookingDuration: "",
    requiresApproval: false,
    usageRules: "",
    images: "",
    capacity: "",
  });

  // ---------------- Pre-fill data if editing ----------------
  useEffect(() => {
    if (resourceData) {
      setFormData({
        name: resourceData.name || "",
        type: resourceData.type || "",
        category: resourceData.category || "",
        description: resourceData.description || "",
        location: resourceData.location || "",
        maxBookingDuration: resourceData.maxBookingDuration || "",
        requiresApproval: resourceData.requiresApproval || false,
        usageRules: resourceData.usageRules || "",
        images:
          resourceData.images && resourceData.images.length
            ? resourceData.images.join(", ")
            : "",
        capacity: resourceData.capacity || "",
      });
    } else {
      // Reset when switching to add mode
      setFormData({
        name: "",
        type: "",
        category: "",
        description: "",
        location: "",
        maxBookingDuration: "",
        requiresApproval: false,
        usageRules: "",
        images: "",
        capacity: "",
      });
    }
  }, [resourceData]);

  // ---------------- Handle change ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  // ---------------- Submit / Update ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      maxBookingDuration: Number(formData.maxBookingDuration),
      requiresApproval: formData.requiresApproval,
      usageRules: formData.usageRules,
      images: formData.images
        ? formData.images.split(",").map((url) => url.trim())
        : [],
      capacity: Number(formData.capacity),
    };

    try {
      if (isEdit) {
        // 🔥 PATCH request to update
        const res = await api.patch(`/resources/${resourceData._id}`, payload);

        if (res.data.success) {
          if (onResourceAdded) onResourceAdded(res.data.resource);
        } else {
        }
      } else {
        // 🔥 POST request to create
        const res = await api.post("/resources", payload);

        if (res.data.success) {
          if (onResourceAdded) onResourceAdded(res.data.resource);
        } else {
        }
      }

      onClose(); // Close modal after success
    } catch (err) {
      console.error("Error submitting resource:", err);
      // toast({
      //   title: "❌ Server Error",
      //   description:
      //     err.response?.data?.message || "Something went wrong on server",
      //   variant: "destructive",
      // });
    }
  };

  // ---------------- Render ----------------
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800">
            {resourceData ? "Edit Resource" : "Add New Resource"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={!!resourceData} // name usually unique, lock on edit
              />
            </div>

            <div>
              <Label>Type</Label>
              <Input
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Category</Label>
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Max Booking Duration (hrs)</Label>
              <Input
                name="maxBookingDuration"
                type="number"
                value={formData.maxBookingDuration}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Capacity</Label>
              <Input
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Switch
                id="requiresApproval"
                checked={formData.requiresApproval}
                onCheckedChange={(val) =>
                  setFormData({ ...formData, requiresApproval: val })
                }
              />
              <Label htmlFor="requiresApproval">Requires Approval</Label>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Usage Rules</Label>
            <Textarea
              name="usageRules"
              value={formData.usageRules}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Images (comma separated URLs)</Label>
            <Input
              name="images"
              value={formData.images}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {resourceData ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
