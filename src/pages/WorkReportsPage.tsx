import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ScrollText, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  User as UserIcon,
  Calendar
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { workReportsApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface WorkReport {
  _id: string;
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
  };
  date: string;
  tasksCompleted: string;
  hoursWorked: number;
  status: "pending" | "reviewed" | "flagged";
  managerRemarks: string;
  reviewedBy?: {
    name: string;
  };
  createdAt: string;
}

export default function WorkReportsPage() {
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  
  // Form states
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [managerRemarks, setManagerRemarks] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"reviewed" | "flagged">("reviewed");

  const { user } = useAuth();
  const { toast } = useToast();
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr";

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await workReportsApi.getAll();
      setReports(data.reports || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await workReportsApi.submit({
        tasksCompleted,
        hoursWorked: parseFloat(hoursWorked),
      });
      
      toast({ title: "Success", description: "Work report submitted!" });
      setShowSubmitModal(false);
      setTasksCompleted("");
      setHoursWorked("");
      fetchReports();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReviewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    
    try {
      await workReportsApi.review(selectedReport._id, {
        status: reviewStatus,
        managerRemarks,
      });
      
      toast({ title: "Success", description: "Report reviewed!" });
      setShowReviewModal(false);
      setManagerRemarks("");
      fetchReports();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Reports</h1>
            <p className="text-muted-foreground">Manage and track daily work progress</p>
          </div>
          {user?.role === "employee" && (
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="zy-gradient text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Submit Report
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  {isAdminOrHR && <th className="px-6 py-4">Employee</th>}
                  <th className="px-6 py-4">Tasks Description</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdminOrHR && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4 h-16 bg-muted/20" />
                    </tr>
                  ))
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <tr key={report._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {format(new Date(report.date), "MMM dd, yyyy")}
                      </td>
                      {isAdminOrHR && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                              {report.employee?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{report.employee?.name}</p>
                              <p className="text-xs text-muted-foreground">{report.employee?.department}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-md">
                        <p className="line-clamp-2">{report.tasksCompleted}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {report.hoursWorked}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                          report.status === "reviewed" ? "bg-green-500/10 text-green-500" :
                          report.status === "flagged" ? "bg-destructive/10 text-destructive" :
                          "bg-amber-500/10 text-amber-500"
                        }`}>
                          {report.status === "reviewed" ? <CheckCircle2 className="h-3 w-3" /> :
                           report.status === "flagged" ? <AlertCircle className="h-3 w-3" /> :
                           <Clock className="h-3 w-3" />}
                          {report.status}
                        </span>
                      </td>
                      {isAdminOrHR && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => {
                              setSelectedReport(report);
                              setManagerRemarks(report.managerRemarks || "");
                              setReviewStatus(report.status === "pending" ? "reviewed" : report.status as any);
                              setShowReviewModal(true);
                            }}
                            className="text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1 rounded-md text-sm font-medium border border-primary/20 transition-all"
                          >
                            Review
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No work reports found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg border border-border rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold mb-4">Submit Daily Work Report</h2>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">What did you work on today?</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Describe your tasks, modules completed, or issues fixed..."
                  value={tasksCompleted}
                  onChange={(e) => setTasksCompleted(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Total Hours Worked</label>
                <input 
                  type="number" 
                  step="0.5"
                  required
                  className="w-full px-4 py-2 bg-muted/30 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 zy-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xl border border-border rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-2">Review Work Report</h2>
            <p className="text-sm text-muted-foreground mb-6">Submitted by {selectedReport.employee?.name} on {format(new Date(selectedReport.date), "PPP")}</p>
            
            <div className="bg-muted/30 p-4 rounded-lg mb-6 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-1 flex items-center gap-2"><ScrollText className="h-3 w-3" /> Report Content:</p>
              <p className="text-sm text-muted-foreground italic">"{selectedReport.tasksCompleted}"</p>
            </div>

            <form onSubmit={handleReviewReport} className="space-y-4">
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setReviewStatus("reviewed")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${reviewStatus === "reviewed" ? "border-green-500 bg-green-500/10 text-green-500" : "border-border hover:bg-muted"}`}
                >
                  <CheckCircle2 className="h-4 w-4" /> Reviewed
                </button>
                <button 
                  type="button"
                  onClick={() => setReviewStatus("flagged")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${reviewStatus === "flagged" ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:bg-muted"}`}
                >
                  <AlertCircle className="h-4 w-4" /> Flag for Review
                </button>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Manager Remarks (Optional)</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Add feedback or instructions..."
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  className="flex-1 zy-gradient text-primary-foreground px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
