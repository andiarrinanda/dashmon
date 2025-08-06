import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Clock, XCircle, Upload, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  id: string;
  type: 'upload' | 'approve' | 'reject' | 'process';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error' | 'processing';
}

interface RecentActivityProps {
  userRole: 'admin' | 'sbu';
  currentSBU?: string;
}

const RecentActivity = ({ userRole, currentSBU }: RecentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentActivity();
  }, [userRole, currentSBU]);

  const fetchRecentActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent reports with user profiles
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          file_name,
          status,
          created_at,
          updated_at,
          approved_at,
          profiles!reports_user_id_fkey(full_name, sbu_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (reportsError) throw reportsError;

      // Transform reports into activity items
      const reportActivities: ActivityItem[] = (reports || []).map(report => {
        const userProfile = report.profiles as any;
        const userName = userProfile?.full_name || 'Unknown User';
        const sbuName = userProfile?.sbu_name || 'Unknown SBU';
        
        let activityType: ActivityItem['type'] = 'upload';
        let title = report.file_name;
        let description = '';
        let status: ActivityItem['status'] = 'pending';
        let timestamp = report.created_at;

        switch (report.status) {
          case 'queued':
          case 'processing':
            activityType = 'upload';
            description = `${sbuName} mengunggah laporan`;
            status = 'processing';
            timestamp = report.created_at;
            break;
          case 'pending_approval':
            activityType = 'process';
            description = `Laporan dari ${sbuName} menunggu approval admin`;
            status = 'pending';
            timestamp = report.updated_at;
            break;
          case 'approved':
            activityType = 'approve';
            description = `Admin menyetujui laporan dari ${sbuName}`;
            status = 'success';
            timestamp = report.approved_at || report.updated_at;
            break;
          case 'completed':
            activityType = 'process';
            description = `Kalkulasi skor selesai untuk laporan ${sbuName}`;
            status = 'success';
            timestamp = report.updated_at;
            break;
          case 'rejected':
          case 'system_rejected':
            activityType = 'reject';
            description = `Laporan dari ${sbuName} ditolak`;
            status = 'error';
            timestamp = report.updated_at;
            break;
          case 'failed':
            activityType = 'process';
            description = `Gagal memproses laporan dari ${sbuName}`;
            status = 'error';
            timestamp = report.updated_at;
            break;
        }

        return {
          id: report.id,
          type: activityType,
          title: title,
          description: description,
          user: sbuName,
          timestamp: formatTimeAgo(timestamp),
          status: status
        };
      });

      setActivities(reportActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      toast({
        title: "Error",
        description: "Gagal memuat aktivitas terbaru",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`;
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} menit yang lalu`;
    } else {
      return "Baru saja";
    }
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4" />;
      case 'approve': return <CheckCircle className="h-4 w-4" />;
      case 'reject': return <XCircle className="h-4 w-4" />;
      case 'process': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">Proses</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
        <CardDescription>Update terkini dari sistem DASHMON+</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-lg animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer hover:shadow-sm">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-desmon-secondary/10 text-desmon-primary">
                {getUserInitials(activity.user)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-desmon-secondary">
                  {getIcon(activity.type)}
                </div>
                <p className="text-sm font-medium">{activity.title}</p>
                {getStatusBadge(activity.status)}
              </div>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>
          </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Belum ada aktivitas terbaru</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;