import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AdminLeavesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["all-leaves"],
    queryFn: leavesApi.getAllLeaves,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      leavesApi.updateLeaveStatus(id, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Leave application ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["all-leaves"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update leave status");
    },
  });

  const handleUpdateStatus = (id: string, status: "approved" | "rejected") => {
    if (confirm(`Are you sure you want to ${status} this leave request?`)) {
      updateStatusMutation.mutate({ id, status });
    }
  };

  const leaves = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee leave applications.</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Loading leaves...
                    </TableCell>
                  </TableRow>
                ) : leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No leave applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave: any) => (
                    <TableRow key={leave._id}>
                      <TableCell>
                        <div className="font-medium">{leave.employeeId?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{leave.employeeId?.employeeId}</div>
                      </TableCell>
                      <TableCell className="capitalize">{leave.leaveType}</TableCell>
                      <TableCell>
                        <div className="text-sm whitespace-nowrap">
                          {format(new Date(leave.startDate), "MMM d, yyyy")}
                          <br />
                          to {format(new Date(leave.endDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(leave.appliedOn), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            leave.status === "rejected" ? "destructive" :
                            leave.status === "approved" ? "default" : "secondary"
                          }
                          className={`capitalize ${leave.status === "approved" ? "bg-green-500 hover:bg-green-600" : ""}`}
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {leave.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => handleUpdateStatus(leave._id, "approved")}
                              disabled={updateStatusMutation.isPending}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleUpdateStatus(leave._id, "rejected")}
                              disabled={updateStatusMutation.isPending}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {leave.status !== "pending" && (
                           <span className="text-sm text-muted-foreground italic">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
