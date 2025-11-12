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

        const normalizedAvailability = defaultAvailability.map((dayObj) => {
          const existing = resource.availability?.find(
            (a) => a.day === dayObj.day
          );
          return existing
            ? {
                day: existing.day,
                startTime: existing.startTime || "09:00",
                endTime: existing.endTime || "17:00",
                enabled: true,
              }
            : { ...dayObj, enabled: false };
        });

        reset({
          ...resource,
          usageRules: resource.usageRules || [],
          availability: normalizedAvailability,
        });

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
      const result = await toast.promise(
        (async () => {
          const uploadedUrls = await uploadImagesToCloudinary();

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

      if (result) navigate("/admin/resources");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = (rule) => {
    if (rule.trim()) {
      setValue("usageRules", [...(usageRules || []), rule.trim()]);
    }
  };

  const handleRemoveRule = (index) => {
    setValue(
      "usageRules",
      (usageRules || []).filter((_, i) => i !== index)
    );
  };

  return (
    <div className="mx-auto bg-background text-foreground ">
      <header className="flex justify-between items-center px-3 sm:px-4 py-3 bg-muted rounded-md mb-4 -mx-3">
        <h1 className="text-3xl font-bold">
          {id ? "Edit Resource" : "Add New Resource"}
        </h1>
      </header>

      <div
        className="lg:grid lg:grid-cols-5 lg:gap-8 space-y-6 lg:space-y-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSubmit(onSubmit)();
          }
        }}
      >
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  {...register("name")}
                  placeholder="E.g., GPU Server - A"
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">
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

          {/* Availability */}
          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="text-xl font-semibold">Availability</h2>
            <Controller
              name="availability"
              control={control}
              render={() => (
                <AvailabilityEditor control={control} name="availability" />
              )}
            />
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4 border-t border-border pt-6 lg:border-none lg:pt-0">
            <h2 className="text-xl font-semibold">Configuration</h2>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
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

            <div className="flex items-center justify-between border border-border rounded-md p-3 mt-6 bg-muted/50">
              <Label className="text-sm">Requires Admin Approval</Label>
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

          {/* Images */}
          <section className="border-t border-border pt-6 lg:border-none lg:pt-0 space-y-4">
            <h2 className="text-xl font-semibold">Images</h2>
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

          {/* Usage Rules */}
          <section className="border-t border-border pt-6 lg:border-none lg:pt-0 space-y-3">
            <h2 className="text-xl font-semibold">Usage Rules</h2>
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {(usageRules || []).length > 0 && (
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-foreground">
                {usageRules.map((rule, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span>{rule}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive h-6 px-2"
                      onClick={() => handleRemoveRule(i)}
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-border lg:border-t">
            <Button
              type="submit"
              disabled={saving}
              onClick={handleSubmit(onSubmit)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
