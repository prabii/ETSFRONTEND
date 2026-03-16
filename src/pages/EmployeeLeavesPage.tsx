import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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

export default function EmployeeLeavesPage() {
  const queryClient = useQueryClient();
  const [leaveType, setLeaveType] = useState<string>("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-leaves"],
    queryFn: leavesApi.getMyLeaves,
  });

  const applyMutation = useMutation({
    mutationFn: leavesApi.applyLeave,
    onSuccess: () => {
      toast.success("Leave application submitted");
      setStartDate("");
      setEndDate("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit leave application");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error("Please fill all required fields");
      return;
    }
    applyMutation.mutate({ leaveType, startDate, endDate, reason });
  };

  const leaves = data?.data || [];
  const balance = data?.balance || { paid: 0, sick: 0 };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaves</h1>
          <p className="text-muted-foreground">Manage your leave applications and view your balance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-2">Paid Leaves Balance</h3>
            <p className="text-3xl font-bold">{balance.paid}</p>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-2">Sick Leaves Balance</h3>
            <p className="text-3xl font-bold">{balance.sick}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Application Form */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold text-lg mb-4">Apply for Leave</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger id="leaveType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Reason for your leave..."
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </div>

          {/* Leave History */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 overflow-x-auto">
            <h3 className="font-semibold text-lg mb-4">Leave History</h3>
            {isLoading ? (
              <p>Loading history...</p>
            ) : leaves.length === 0 ? (
               <p className="text-muted-foreground text-sm">No leave history found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave: any) => (
                    <TableRow key={leave._id}>
                      <TableCell className="capitalize">{leave.leaveType}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d")}
                        </div>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
