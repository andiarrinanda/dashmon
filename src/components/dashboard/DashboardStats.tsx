import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, XCircle, TrendingUp, Users } from "lucide-react";

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
}

const DashboardStats = ({ userRole }: DashboardStatsProps) => {
  // Mock data - in real app, this would come from API
  const adminStats = [
    {
      title: "Total Laporan",
      value: "1,247",
      description: "Laporan bulan ini",
      icon: <FileText className="h-4 w-4" />,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Menunggu Approval",
      value: "23",
      description: "Menunggu persetujuan admin",
      icon: <Clock className="h-4 w-4" />,
      trend: { value: 8, isPositive: false }
    },
    {
      title: "Selesai Diproses",
      value: "1,156",
      description: "Laporan dengan skor final",
      icon: <CheckCircle className="h-4 w-4" />,
      trend: { value: 15, isPositive: true }
    },
    {
      title: "Ditolak",
      value: "68",
      description: "Ditolak admin/sistem",
      icon: <XCircle className="h-4 w-4" />,
      trend: { value: 5, isPositive: false }
    },
    {
      title: "SBU Aktif",
      value: "34",
      description: "Unit bisnis terdaftar",
      icon: <Users className="h-4 w-4" />
    },
    {
      title: "Skor Rata-rata",
      value: "87.5",
      description: "Performa nasional",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: { value: 3, isPositive: true }
    }
  ];

  const sbuStats = [
    {
      title: "Laporan Saya",
      value: "45",
      description: "Total laporan yang dikirim",
      icon: <FileText className="h-4 w-4" />,
      trend: { value: 20, isPositive: true }
    },
    {
      title: "Disetujui",
      value: "38",
      description: "Laporan valid",
      icon: <CheckCircle className="h-4 w-4" />,
      trend: { value: 18, isPositive: true }
    },
    {
      title: "Dalam Proses",
      value: "4",
      description: "Sedang divalidasi",
      icon: <Clock className="h-4 w-4" />
    },
    {
      title: "Skor KPI",
      value: "92.3",
      description: "Peringkat #3 nasional",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: { value: 5, isPositive: true }
    }
  ];

  const stats = userRole === 'admin' ? adminStats : sbuStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;