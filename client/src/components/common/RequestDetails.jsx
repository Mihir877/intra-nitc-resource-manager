import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Info,
  CheckCircle,
  XCircle,
  MessageCircle,
  Mail,
  ToolCase,
  Settings,
  ClipboardCheck,
  BadgeCheck,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import useAuth from "@/hooks/useAuth";
import { humanDate } from "@/utils/dateUtils";
import ResourceCard from "@/components/common/resource/ResourceCard";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");

const statusStyles = {
  approved: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [decisionPending, setDecisionPending] = useState(null);

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/requests/${id}`);
      if (res.data?.success && res.data.request) {
        setRequest(res.data.request);
      } else {
        toast.error("Failed to fetch request details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching request details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleDecision = async (decision) => {
    if (decision === "reject" && !remarks.trim()) {
      toast.error("Remarks are required for rejection");
      return;
    }
    setDecisionPending(decision);
    setShowConfirm(true);
  };

  const performDecision = async () => {
    const decision = decisionPending;
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const body =
        decision === "approve"
          ? { remarks: `Approved by admin on ${dayjs().format("lll")}` }
          : { remarks: remarks.trim() };

      const res = await api.patch(`/requests/${id}/${decision}`, body);
      if (res.data?.success) {
        toast.success(`Request ${decision}ed successfully`);
        setRequest((prev) => ({
          ...prev,
          status: decision === "approve" ? "approved" : "rejected",
          remarks: body.remarks,
          approvedBy: res.data.approvedBy || prev?.approvedBy,
          approvedAt: res.data.approvedAt || prev?.approvedAt,
        }));
        setTimeout(() => navigate("/admin/requests"), 900);
      } else {
        toast.error(res.data?.message || `Failed to ${decision} request`);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || `Error performing ${decision}`
      );
    } finally {
      setSubmitting(false);
      setDecisionPending(null);
    }
  };

  const isAdmin = user?.role === "admin";

  if (authLoading || loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        Loading request details...
      </div>
    );

  if (!request)
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500">
        Request not found
      </div>
    );

  const requester = request.userId;

  return (
    <div className="flex justify-center">
      <Card className="w-full border border-gray-200 shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Request Details
            </CardTitle>
            <Badge
              className={`capitalize ${
                statusStyles[request?.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {request?.status}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-4">
          {/* Admin Actions */}
          {isAdmin && request.status === "pending" && (
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <ClipboardCheck /> Admin Actions
                </h4>
                <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md border border-yellow-200">
                  Pending Review
                </span>
              </div>

              {/* Remarks */}
              <div className="space-y-2 mb-4">
                <label
                  htmlFor="remarks"
                  className="text-sm font-medium text-gray-700 flex items-center gap-1"
                >
                  Remarks
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="remarks"
                  placeholder="Write your remarks here"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="resize-none border-gray-300 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 min-h-[90px]"
                />
                <p className="text-xs text-gray-500">
                  Remarks are required only when rejecting a request.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDecision("reject")}
                  disabled={submitting}
                  className="border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {submitting ? "Rejecting..." : "Reject"}
                </Button>

                <Button
                  onClick={() => handleDecision("approve")}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? "Approving..." : "Approve"}
                </Button>
              </div>
            </div>
          )}

          {/* Resource Section */}
          <div className="grid sm:grid-cols-3 gap-4">
            <ResourceCard resource={request.resourceId} />

            {/* Request Info */}
            <div className="sm:col-span-2 rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Request Information
                </h3>
                <div className="text-right text-sm text-gray-500">
                  <div>{humanDate(request.createdAt)}</div>
                  <div>Submitted {dayjs(request.createdAt).fromNow()}</div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 🗓 Request Details */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <Label>Purpose</Label>
                  <p className="mt-1 text-gray-800">{request.purpose}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="mt-1 text-gray-800">
                    {request.durationHours} hour(s)
                  </p>
                </div>
                <div>
                  <Label>Start</Label>
                  <p className="mt-1 flex items-center gap-2 text-gray-800">
                    <Clock className="w-4 h-4" />
                    <span>{humanDate(request.startTime)}</span>
                  </p>
                </div>
                <div>
                  <Label>End</Label>
                  <p className="mt-1 flex items-center gap-2 text-gray-800">
                    <Calendar className="w-4 h-4" />
                    <span>{humanDate(request.endTime)}</span>
                  </p>
                </div>
              </div>

              {/* 🧑 Requested By Section */}
              <div className="mb-3 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Requested By
                </h4>

                <div className="flex items-center gap-3 p-4 rounded-xl">
                  {/* Avatar or Icon */}
                  <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 border border-orange-200">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col text-sm">
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      {requester?.username}
                      {requester?.role === "admin" && (
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      {requester?.role
                        ? requester.role.charAt(0).toUpperCase() +
                          requester.role.slice(1)
                        : ""}
                    </p>

                     <p className="text-gray-600 flex items-center gap-1">
                      <Mail size={16} className="mt-0.5" />
                      <a
                        href={`mailto:${requester?.email}`}
                        className="hover:underline"
                      >
                        {requester?.email}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold">
              Confirm {decisionPending === "approve" ? "approval" : "rejection"}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to {decisionPending} this request?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={performDecision}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting
                  ? "Processing..."
                  : decisionPending === "approve"
                  ? "Confirm Approve"
                  : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;
