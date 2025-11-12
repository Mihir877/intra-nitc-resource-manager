import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import PasswordField from "@/components/auth/PasswordField";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/utils/constants";

const Profile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [editable, setEditable] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const endpoint = `/users/profile/${id || "me"}`;
      const res = await api.get(endpoint);
      if (res.data.success) {
        setUser(res.data.user);
        setFormData(res.data.user);
        setCanEdit(res.data.isSelf);
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
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setVerifying(true);
      const res = await api.post("/auth/resend-email-verification");
      if (res.data.success) toast.success("Verification email sent!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send verification email");
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
    setShowPasswordModal(true);
  };

  // Change password API call
  const handleSubmitPasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setChanging(true);
      const res = await api.post(
        "/users/change-password",
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("Password changed successfully!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChanging(false);
    }
  };
  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        No user data found
      </div>
    );

  return (
    <div className="text-foreground">
      <PageTitle title="Profile" subtitle="Manage your profile information" />

      <Card className="mx-auto border border-border bg-card text-card-foreground relative">
        <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 text-center sm:text-left relative">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mx-auto sm:mx-0">
            <UserCircle className="w-12 h-12 text-muted-foreground" />
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
              {user.username}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {user.role === "admin" ? "Administrator" : "Student"} Account
            </CardDescription>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {user.email}
              {user.isEmailVerified ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
              ) : (
                <span className="ml-1 text-yellow-600">(Unverified)</span>
              )}
            </div>
          </div>

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
                      <DropdownMenuContent
                        align="end"
                        className="bg-popover text-popover-foreground border-border"
                      >
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
                          className="text-destructive focus:text-destructive"
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
              <InfoField
                label="Gender"
                name="gender"
                value={formData.gender}
                editable={editable}
                onChange={handleChange}
              />
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

              <div>
                <Label className="mb-1 block text-sm text-muted-foreground">
                  Department
                </Label>
                {editable ? (
                  <Select
                    value={formData.department || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, department: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d.code} value={d.code}>
                          <div className="flex gap-2 items-center">
                            {d.code}
                            <Separator
                              orientation="vertical"
                              className="h-4 bg-border"
                            />
                            {d.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={
                      DEPARTMENTS.find((d) => d.code === formData.department)
                        ?.name || "Not specified"
                    }
                    disabled
                    className="mt-1"
                  />
                )}
              </div>

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

            <div className="bg-muted/50 sm:bg-transparent p-4 sm:p-0 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 text-center sm:text-left">
                Account Details
              </h3>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground text-center sm:text-left">
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Login Type: {user.loginType}
                </div>
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {canEdit && editable && (
          <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-end rounded-b-md">
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
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

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md bg-popover text-popover-foreground border-border">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and new password below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <PasswordField
              id="oldPassword"
              label="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              showChecklist={false}
              showStrength={false}
            />

            <PasswordField
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              confirmValue={confirmPassword}
              onConfirmChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPasswordChange} disabled={changing}>
              {changing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 🧩 Section Component
const Section = ({ title, children }) => (
  <div className="bg-muted/50 sm:bg-transparent p-4 sm:p-0 rounded-lg">
    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 text-center sm:text-left">
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

// 🧩 InfoField Component
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
    <Label className="text-sm text-muted-foreground">{label}</Label>
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
