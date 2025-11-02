"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { Loader2, Edit3, Save } from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editable, setEditable] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current user details
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/me"); // Adjust endpoint if needed
      if (res.data.success) {
        setUser(res.data.user);
        setFormData(res.data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Save updated details
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch("/users/update-profile", formData);
      if (res.data.success) {
        setUser(res.data.user);
        setFormData(res.data.user);
        setEditable(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label className="text-gray-600">Name</Label>
                <Input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  disabled={!editable}
                />
              </div>

              {/* Email (non-editable) */}
              <div>
                <Label className="text-gray-600">Email</Label>
                <Input value={formData.email || ""} disabled />
              </div>

              {/* Phone */}
              <div>
                <Label className="text-gray-600">Phone</Label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={handleChange}
                  disabled={!editable}
                />
              </div>

              {/* Gender */}
              <div>
                <Label className="text-gray-600">Gender</Label>
                <Input
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  disabled={!editable}
                />
              </div>

              {/* Address */}
              <div>
                <Label className="text-gray-600">Address</Label>
                <Input
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  disabled={!editable}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <Label className="text-gray-600">Date of Birth</Label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={
                    formData.dateOfBirth
                      ? formData.dateOfBirth.split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  disabled={!editable}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4">
                {!editable ? (
                  <Button
                    onClick={() => setEditable(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No user data found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
