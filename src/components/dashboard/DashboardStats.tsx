import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, XCircle, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, description, icon, trend }: StatsCardProps) => (
  <Card className="hover:shadow-desmon-hover transition-all duration-200 cursor-pointer hover:scale-105">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-desmon-secondary">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{description}</span>
        {trend && (
          <div className={`flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 ${!trend.isPositive && 'rotate-180'}`} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

interface DashboardStatsProps {
  userRole: 'admin' | 'sbu';
  currentSBU?: string;
}

const DashboardStats = ({ userRole, currentSBU }: DashboardStatsProps) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [userRole, currentSBU]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      if (userRole === 'admin') {
        await fetchAdminStats();
      } else {
        await fetchSBUStats();
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Gagal memuat statistik dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    // Get current user for filtering
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all reports data
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('status, calculated_score, created_at');

    if (reportsError) throw reportsError;

    // Fetch active SBU count
    const { data: sbuUsers, error: sbuError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'sbu');

    if (sbuError) throw sbuError;

    // Calculate statistics
    const totalReports = reports?.length || 0;
    const pendingReports = reports?.filter(r => r.status === 'pending_approval').length || 0;
    const completedReports = reports?.filter(r => r.status === 'completed').length || 0;
    const rejectedReports = reports?.filter(r => r.status === 'rejected' || r.status === 'system_rejected').length || 0;
    const activeSBU = sbuUsers?.length || 0;
    
    // Calculate average score
    const completedWithScores = reports?.filter(r => r.calculated_score !== null) || [];
    const averageScore = completedWithScores.length > 0 
      ? completedWithScores.reduce((sum, r) => sum + (r.calculated_score || 0), 0) / completedWithScores.length
      : 0;

    // Get current month reports for trend calculation
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthReports = reports?.filter(r => {
      const reportDate = new Date(r.created_at);
      return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
    }).length || 0;

    // Calculate trends (mock calculation for now)
    const totalTrend = currentMonthReports > 0 ? 12 : 0;
    const pendingTrend = pendingReports > 10 ? -8 : 5;
    const completedTrend = completedReports > 100 ? 15 : 8;
    const rejectedTrend = rejectedReports > 50 ? -5 : 2;
    const scoreTrend = averageScore > 80 ? 3 : -1;

    setStats([
      {
        title: "Total Laporan",
        value: totalReports.toLocaleString(),
        description: "Laporan bulan ini",
        icon: <FileText className="h-4 w-4" />,
        trend: { value: totalTrend, isPositive: totalTrend > 0 }
      },
      {
        title: "Menunggu Approval",
        value: pendingReports.toString(),
        description: "Menunggu persetujuan admin",
        icon: <Clock className="h-4 w-4" />,
        trend: { value: Math.abs(pendingTrend), isPositive: pendingTrend > 0 }
      },
      {
        title: "Selesai Diproses",
        value: completedReports.toLocaleString(),
        description: "Laporan dengan skor final",
        icon: <CheckCircle className="h-4 w-4" />,
        trend: { value: completedTrend, isPositive: true }
      },
      {
        title: "Ditolak",
        value: rejectedReports.toString(),
        description: "Ditolak admin/sistem",
        icon: <XCircle className="h-4 w-4" />,
        trend: { value: Math.abs(rejectedTrend), isPositive: rejectedTrend > 0 }
      },
      {
        title: "SBU Aktif",
        value: activeSBU.toString(),
        description: "Unit bisnis terdaftar",
        icon: <Users className="h-4 w-4" />
      },
      {
        title: "Skor Rata-rata",
        value: averageScore.toFixed(1),
        description: "Performa nasional",
        icon: <TrendingUp className="h-4 w-4" />,
        trend: { value: Math.abs(scoreTrend), isPositive: scoreTrend > 0 }
      }
    ]);
  };

  const fetchSBUStats = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user's reports
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('status, calculated_score, created_at')
      .eq('user_id', user.id);

    if (reportsError) throw reportsError;

    // Calculate statistics
    const totalReports = reports?.length || 0;
    const approvedReports = reports?.filter(r => r.status === 'approved' || r.status === 'completed').length || 0;
    const pendingReports = reports?.filter(r => r.status === 'pending_approval' || r.status === 'processing' || r.status === 'queued').length || 0;
    
    // Calculate user's KPI score
    const completedWithScores = reports?.filter(r => r.calculated_score !== null) || [];
    const userScore = completedWithScores.length > 0 
      ? completedWithScores.reduce((sum, r) => sum + (r.calculated_score || 0), 0) / completedWithScores.length
      : 0;

    // Get user's ranking (mock for now - would need complex query for real ranking)
    const ranking = userScore > 90 ? 3 : userScore > 80 ? 5 : 8;

    // Calculate trends
    const totalTrend = totalReports > 10 ? 20 : 5;
    const approvedTrend = approvedReports > 5 ? 18 : 10;
    const scoreTrend = userScore > 85 ? 5 : -2;

    setStats([
      {
        title: "Laporan Saya",
        value: totalReports.toString(),
        description: "Total laporan yang dikirim",
        icon: <FileText className="h-4 w-4" />,
        trend: { value: totalTrend, isPositive: true }
      },
      {
        title: "Disetujui",
        value: approvedReports.toString(),
        description: "Laporan valid",
        icon: <CheckCircle className="h-4 w-4" />,
        trend: { value: approvedTrend, isPositive: true }
      },
      {
        title: "Dalam Proses",
        value: pendingReports.toString(),
        description: "Sedang divalidasi",
        icon: <Clock className="h-4 w-4" />
      },
      {
        title: "Skor KPI",
        value: userScore.toFixed(1),
        description: `Peringkat #${ranking} nasional`,
        icon: <TrendingUp className="h-4 w-4" />,
        trend: { value: Math.abs(scoreTrend), isPositive: scoreTrend > 0 }
      }
    ]);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: userRole === 'admin' ? 6 : 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;