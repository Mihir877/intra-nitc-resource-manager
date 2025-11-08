import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Loader2,
  Edit3,
  Save,
  UserCircle,
  Mail,
  Calendar,
  Shield,
  Lock,
  LogOut,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";

import api from "@/api/axios";
import PageTitle from "./PageTitle";

const Profile = () => {
  const { id } = useParams(); // Capture :id if exists
  const [user, setUser] = useState(null);
  const [editable, setEditable] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ✅ Fetch user profile
  const fetchUser = async () => {
    try {
      setLoading(true);
      const endpoint = `/users/profile/${id || "me"}`;
      const res = await api.get(endpoint);

      if (res.data.success) {
        setUser(res.data.user);
        setFormData(res.data.user);
        setCanEdit(res.data.isSelf); // backend tells if self
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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

  const handleVerifyEmail = async () => {
    try {
      setVerifying(true);
      const res = await api.post("/users/send-verification-email");
      if (res.data.success) alert("Verification email sent!");
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleChangePassword = () => {
    console.log("Change Password clicked");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-500">
        No user data found
      </div>
    );

  return (
    <div>
      <PageTitle title="Profile" subtitle="Manage your profile information" />

      <Card className="mx-auto border border-gray-200 shadow-sm relative">
        {/* Header */}
        <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 text-center sm:text-left relative">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mx-auto sm:mx-0">
            <UserCircle className="w-12 h-12 text-gray-500" />
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
              {user.username}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {user.role === "admin" ? "Administrator" : "Student"} Account
            </CardDescription>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {user.email}
              {user.isEmailVerified ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
              ) : (
                <span className="ml-1 text-yellow-600">(Unverified)</span>
              )}
            </div>
          </div>

          {/* Dots menu (only if self) */}
          {canEdit && (
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!editable && (
                          <DropdownMenuItem onClick={() => setEditable(true)}>
                            <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleChangePassword}>
                          <Lock className="w-4 h-4 mr-2" /> Change Password
                        </DropdownMenuItem>
                        {!user.isEmailVerified && (
                          <DropdownMenuItem onClick={handleVerifyEmail}>
                            {verifying ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4 mr-2" />
                            )}
                            {verifying ? "Sending..." : "Verify Email"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-red-600 focus:text-red-700"
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent align="end">
                    <p className="text-sm">More actions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardHeader>

        <Separator />

        {/* Info */}
        <CardContent className="px-4 sm:px-6 pb-8 pt-4">
          <div className="space-y-6">
            <Section title="Personal Information">
              <InfoField
                label="Full Name"
                name="username"
                value={formData.username}
                editable={editable}
                onChange={handleChange}
              />

              {/* Gender dropdown */}
              <div className="flex flex-col sm:text-left">
                <Label className="text-gray-600 text-sm">Gender</Label>
                {editable ? (
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, gender: val }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.gender || ""}
                    disabled
                    className="mt-1 bg-white text-gray-700"
                  />
                )}
              </div>

              <InfoField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={
                  formData.dateOfBirth ? formData.dateOfBirth.split("T")[0] : ""
                }
                editable={editable}
                onChange={handleChange}
              />
              <InfoField label="Role" value={user.role} disabled />
            </Section>

            <Section title="Contact Information">
              <InfoField label="Email" value={formData.email} disabled />
              <InfoField
                label="Phone"
                name="phoneNumber"
                value={formData.phoneNumber}
                editable={editable}
                onChange={handleChange}
              />
              <InfoField
                label="Address"
                name="address"
                value={formData.address}
                editable={editable}
                onChange={handleChange}
                fullWidth
              />
            </Section>

            <div className="bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 text-center sm:text-left">
                Account Details
              </h3>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 text-gray-600 text-sm text-center sm:text-left">
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  Login Type: {user.loginType}
                </div>
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* ✅ Bottom Save Bar (only for self and in edit mode) */}
        {canEdit && editable && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end rounded-b-md">
            <Button
              variant="outline"
              onClick={() => {
                setEditable(false);
                setFormData(user);
              }}
              className="mr-3 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-lg">
    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 text-center sm:text-left">
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const InfoField = ({
  label,
  name,
  value,
  editable,
  onChange,
  disabled,
  type,
}) => (
  <div className="flex flex-col sm:text-left">
    <Label className="text-gray-600 text-sm">{label}</Label>
    <Input
      type={type || "text"}
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled || !editable}
      className="mt-1"
    />
  </div>
);

export default Profile;
