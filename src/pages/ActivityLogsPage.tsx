import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  User as UserIcon,
  Clock,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { activityLogsApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface Log {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetType: string;
  details: any;
  ipAddress: string;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await activityLogsApi.getAll();
      setLogs(data.logs || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-green-500 bg-green-500/10";
    if (action.includes("DELETE")) return "text-destructive bg-destructive/10";
    if (action.includes("UPDATE") || action.includes("TOGGLE")) return "text-blue-500 bg-blue-500/10";
    if (action.includes("LOGIN")) return "text-purple-500 bg-purple-500/10";
    return "text-muted-foreground bg-muted";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-muted-foreground">Monitor system updates and user activities</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by user, action or target..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4 h-16 bg-muted/20" />
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(new Date(log.createdAt), "MMM dd, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "HH:mm:ss")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {log.user?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{log.user?.name}</p>
                            <p className="text-xs text-muted-foreground lowercase">{log.user?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {log.targetType}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate text-muted-foreground">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-foreground">
                        {log.ipAddress || "Internal"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No activity logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
