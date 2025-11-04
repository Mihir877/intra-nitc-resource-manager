import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/api/axios";

export default function AddRequestModal({
  open,
  onClose,
  resources = [],
  onRequestCreated,
}) {
  const toISOStringUTC = (date) => date.toISOString();
  const [formData, setFormData] = useState({
    resourceId: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });
  const [loading, setLoading] = useState(false);

  const alignToHourUTC = (dateString) => {
    const date = new Date(dateString);
    date.setUTCMinutes(0, 0, 0);
    return date;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resourceId || !formData.startTime || !formData.endTime)
      return;

    setLoading(true);
    try {
      const payload = {
        resourceId: formData.resourceId,
        startTime: toISOStringUTC(alignToHourUTC(formData.startTime)),
        endTime: toISOStringUTC(alignToHourUTC(formData.endTime)),
        purpose: formData.purpose,
      };

      const res = await api.post("/requests", payload);
      if (res.data.success) {
        onRequestCreated?.(res.data.request);
        onClose(); // close modal
        setFormData({
          resourceId: "",
          startTime: "",
          endTime: "",
          purpose: "",
        });
      }
    } catch (error) {
      console.error("Create request error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Resource Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resource */}
          <div>
            <Label htmlFor="resourceId">Resource</Label>
            <select
              id="resourceId"
              name="resourceId"
              value={formData.resourceId}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select a resource</option>
              {resources.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* End Time */}
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* Purpose */}
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Briefly describe the reason for booking"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
