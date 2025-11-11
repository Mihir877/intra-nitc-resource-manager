import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/api/axios";
import ImageUploader from "@/components/common/ImageUploader";
import AvailabilityEditor from "@/components/common/AvailabilityEditor";
import { isAxiosError } from "axios";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const resourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.string(),
  department: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  capacity: z.coerce.number().min(1, "Must be at least 1"),
  maxBookingDuration: z.coerce.number().min(1),
  requiresApproval: z.boolean(),
  usageRules: z.array(z.string()).optional(),
  availability: z.array(
    z.object({
      day: z.string(),
      enabled: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
    })
  ),
});

export default function ResourceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [removedExistingImages, setRemovedExistingImages] = useState([]);

  const defaultAvailability = [
    { day: "Monday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Thursday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
    { day: "Saturday", startTime: "", endTime: "", enabled: false },
    { day: "Sunday", startTime: "", endTime: "", enabled: false },
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "instrument",
      department: "",
      location: "",
      capacity: 1,
      maxBookingDuration: 2,
      requiresApproval: true,
      usageRules: [],
      availability: defaultAvailability,
    },
  });

  const usageRules = watch("usageRules");

  useEffect(() => {
    const fetchResource = async () => {
      if (!id) return;

      try {
        const { data } = await api.get(`/resources/${id}`);
        const resource = data.resource;

        // Normalize availability data
        const normalizedAvailability = defaultAvailability.map((dayObj) => {
          const existing = resource.availability?.find(
            (a) => a.day === dayObj.day
          );

          if (!existing) {
            return { ...dayObj, enabled: false };
          }

          return {
            day: existing.day,
            startTime: existing.startTime || "09:00",
            endTime: existing.endTime || "17:00",
            enabled: true,
          };
        });

        // Reset form with normalized data
        reset({
          ...resource,
          usageRules: resource.usageRules || [],
          availability: normalizedAvailability,
        });

        // Set image previews
        setPreviewUrls(resource.images || []);
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.message || "Failed to load resource"
          : "An unexpected error occurred";

        toast.error(message);
        navigate("/admin/resources");
      }
    };

    fetchResource();
  }, [id, reset, navigate]);

  const uploadImagesToCloudinary = async () => {
    if (imageFiles.length === 0) return [];
    const uploadedUrls = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) uploadedUrls.push(data.secure_url);
    }
    return uploadedUrls;
  };

  const onSubmit = async (data) => {
    setSaving(true);

    try {
      // Wrap the *entire async process* inside toast.promise and await it
      const result = await toast.promise(
        (async () => {
          // 1️⃣ Upload images first
          const uploadedUrls = await uploadImagesToCloudinary();

          // 2️⃣ Prepare payload
          const payload = {
            ...data,
            images: [
              ...(uploadedUrls.length ? uploadedUrls : []),
              ...previewUrls.filter((url) => !url.startsWith("blob:")),
            ],
            removedImages: removedExistingImages,
            availability: data.availability
              ?.filter((a) => a.enabled)
              .map(({ day, startTime, endTime }) => ({
                day,
                startTime,
                endTime,
              })),
          };

          // 3️⃣ Call API
          if (id) {
            await api.patch(`/resources/${id}`, payload);
            return "Resource updated successfully";
          } else {
            await api.post(`/resources`, payload);
            return "Resource created successfully";
          }
        })(),
        {
          loading: "Saving resource...",
          success: (msg) => msg,
          error: "Failed to save resource. Please try again.",
        }
      );

      // ✅ Navigate only after success toast
      if (result) navigate("/admin/resources");
    } catch (error) {
      // optional: fallback toast if something unexpected happens
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = (rule) => {
    if (rule.trim()) {
      const updated = [...(usageRules || []), rule.trim()];
      setValue("usageRules", updated);
    }
  };

  const handleRemoveRule = (index) => {
    const updated = (usageRules || []).filter((_, i) => i !== index);
    setValue("usageRules", updated);
  };

  return (
    <div className="mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 bg-gray-100 p-4 rounded-md -mx-3">
        {id ? "Edit Resource" : "Add New Resource"}
      </h1>

      <div
        className="lg:grid lg:grid-cols-5 lg:gap-8 space-y-6 lg:space-y-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            // Optional: allow Ctrl+Enter to submit
            handleSubmit(onSubmit)();
          }
        }}
      >
        {/* LEFT COLUMN — Basic Info & Availability */}
        <div className="lg:col-span-3 space-y-6">
          {/* --- Basic Info --- */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  {...register("name")}
                  placeholder="E.g., GPU Server - A"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instrument">Instrument</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="workstation">Workstation</SelectItem>
                        <SelectItem value="kit">Kit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Department</Label>
                <Input
                  {...register("department")}
                  placeholder="E.g., CSE, EEE"
                />
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  {...register("location")}
                  placeholder="Lab / Building / Floor"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea rows={3} {...register("description")} />
            </div>
          </section>

          {/* --- Availability --- */}
          <section className="space-y-4 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Availability
            </h2>
            <Controller
              name="availability"
              control={control}
              render={() => (
                <AvailabilityEditor control={control} name="availability" />
              )}
            />
          </section>
        </div>

        {/* RIGHT COLUMN — Configuration, Images, Usage Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* --- Configuration --- */}
          <section className="space-y-4 border-t pt-6 lg:border-none lg:pt-0">
            <h2 className="text-xl font-semibold text-gray-800">
              Configuration
            </h2>

            <div className="flex flex-col sm:flex-row  lg:flex-col gap-4">
              <div className="flex-1">
                <Label>Capacity</Label>
                <Input type="number" min={1} {...register("capacity")} />
              </div>
              <div className="flex-1">
                <Label>Max Booking Duration (hrs)</Label>
                <Input
                  type="number"
                  min={1}
                  {...register("maxBookingDuration")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-md p-3 mt-6">
              <Label className="text-sm text-gray-700">
                Requires Admin Approval
              </Label>
              <Controller
                name="requiresApproval"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </section>

          {/* --- Images --- */}
          <section className="border-t pt-6 lg:border-none lg:pt-0 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Images</h2>
            <ImageUploader
              title="Resource Images"
              onChange={(files, urls, removedUrls) => {
                setImageFiles(files);
                setPreviewUrls(urls);
                if (removedUrls?.length > 0) {
                  setRemovedExistingImages((prev) => [...prev, ...removedUrls]);
                }
              }}
              existingImages={previewUrls}
            />
          </section>

          {/* --- Usage Rules --- */}
          <section className="border-t pt-6 lg:border-none lg:pt-0 space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">Usage Rules</h2>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Enter a rule and press Add"
                id="newRuleInput"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRule(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => {
                  const input = document.getElementById("newRuleInput");
                  if (input?.value) {
                    handleAddRule(input.value);
                    input.value = "";
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {(usageRules || []).length > 0 && (
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-700">
                {usageRules.map((rule, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span>{rule}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-500 h-6 px-2"
                      onClick={() => handleRemoveRule(i)}
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* --- Save Button --- */}
          <div className="flex justify-end pt-6 border-t lg:border-t">
            <Button
              type="submit"
              disabled={saving}
              onClick={handleSubmit(onSubmit)}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              {saving
                ? id
                  ? "Saving..."
                  : "Creating..."
                : id
                ? "Save Changes"
                : "Create Resource"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
