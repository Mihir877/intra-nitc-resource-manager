import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Info,
  CheckCircle,
  XCircle,
  Mail,
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
import StatusBadge from "@/components/common/StatusBadge"; // Reuse shared component

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");

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
      <div className="flex justify-center items-center h-[60vh] text-muted-foreground">
        Loading request details...
      </div>
    );

  if (!request)
    return (
      <div className="flex justify-center items-center h-[60vh] text-muted-foreground">
        Request not found
      </div>
    );

  const requester = request.userId;

  return (
    <div className="flex justify-center">
      <Card className="w-full border border-border bg-card text-card-foreground shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl font-bold">
              Request Details
            </CardTitle>
            <StatusBadge status={request?.status} className="text-sm" />
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-4">
          {/* Admin Actions */}
          {isAdmin && request.status === "pending" && (
            <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-muted/30 dark:from-card dark:to-muted/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2 text-foreground text-lg">
                  <ClipboardCheck /> Admin Actions
                </h4>
                <StatusBadge status="pending" />
              </div>

              <div className="space-y-2 mb-4">
                <label
                  htmlFor="remarks"
                  className="text-sm font-medium text-muted-foreground flex items-center gap-1"
                >
                  Remarks
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="remarks"
                  placeholder="Write your remarks here"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="resize-none border-border bg-background text-foreground focus:border-orange-400 focus:ring-1 focus:ring-orange-400 min-h-[90px] dark:placeholder:text-muted-foreground/60"
                />
                <p className="text-xs text-muted-foreground">
                  Remarks are required only when rejecting a request.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleDecision("reject")}
                  disabled={submitting}
                  className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <XCircle className="w-4 h-4 mr-1" />
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
            <div className="sm:col-span-2 rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Info className="w-4 h-4" /> Request Information
                </h3>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{humanDate(request.createdAt)}</div>
                  <div>Submitted {dayjs(request.createdAt).fromNow()}</div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Request Details */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm border-b border-border pb-4">
                <div>
                  <Label>Purpose</Label>
                  <p className="mt-1 text-foreground">{request.purpose}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="mt-1 text-foreground">
                    {request.durationHours} hour(s)
                  </p>
                </div>
                <div>
                  <Label>Start</Label>
                  <p className="mt-1 flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{humanDate(request.startTime)}</span>
                  </p>
                </div>
                <div>
                  <Label>End</Label>
                  <p className="mt-1 flex items-center gap-2 text-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{humanDate(request.endTime)}</span>
                  </p>
                </div>
              </div>

              {/* Requested By */}
              <div className="mb-3 pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Requested By
                </h4>

                <div className="flex items-center gap-3 p-4 mt-3 rounded-xl bg-muted/30 border border-border">
                  <div className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800">
                    <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>

                  <div className="flex flex-col text-sm">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      {requester?.username}
                      {requester?.role === "admin" && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {requester?.role
                        ? requester.role.charAt(0).toUpperCase() +
                          requester.role.slice(1)
                        : ""}
                    </p>

                    <p className="text-muted-foreground flex items-center gap-1">
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
          <div className="relative bg-card text-card-foreground border border-border rounded-lg shadow-lg max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold">
              Confirm {decisionPending === "approve" ? "approval" : "rejection"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
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
