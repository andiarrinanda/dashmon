import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Clock, XCircle, Upload, FileText } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'upload' | 'approve' | 'reject' | 'process';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error' | 'processing';
}

const RecentActivity = () => {
  // Mock data - in real app, this would come from API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'upload',
      title: 'Laporan Skoring Media Massa',
      description: 'SBU Jawa Barat mengunggah laporan publikasi media',
      user: 'Jawa Barat',
      timestamp: '2 menit yang lalu',
      status: 'processing'
    },
    {
      id: '2',
      type: 'approve',
      title: 'Laporan Skoring Media Massa',
      description: 'Admin menyetujui laporan dan memicu kalkulasi skor',
      user: 'Admin Central',
      timestamp: '15 menit yang lalu',
      status: 'success'
    },
    {
      id: '3',
      type: 'reject',
      title: 'Laporan Skoring Media Massa',
      description: 'Ditolak: Link video duplikat terdeteksi',
      user: 'Sumatera Utara',
      timestamp: '1 jam yang lalu',
      status: 'error'
    },
    {
      id: '4',
      type: 'upload',
      title: 'Laporan Skoring Media Massa',
      description: 'SBU Kalimantan mengunggah laporan publikasi media',
      user: 'Kalimantan',
      timestamp: '2 jam yang lalu',
      status: 'success'
    },
    {
      id: '5',
      type: 'process',
      title: 'Kalkulasi Skor Selesai',
      description: 'ETL Stage 2 menghitung skor 8 laporan yang disetujui',
      user: 'System',
      timestamp: '3 jam yang lalu',
      status: 'success'
    }
  ];

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
        {activities.map((activity) => (
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
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;