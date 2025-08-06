import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Trophy, Target, Activity, Filter, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface AnalyticsViewProps {
  userRole: 'admin' | 'sbu';
  currentSBU?: string;
}

const AnalyticsView = ({ userRole, currentSBU = 'SBU Jawa Barat' }: AnalyticsViewProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('semester-1-2024');
  const [selectedIndicator, setSelectedIndicator] = useState('all');
  const [liveData, setLiveData] = useState({
    totalReports: 1295,
    approvalRate: 94.2,
    averageScore: 85.7,
    activeSBU: 18
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        totalReports: prev.totalReports + Math.floor(Math.random() * 3),
        approvalRate: Math.min(100, prev.approvalRate + (Math.random() - 0.5) * 0.5),
        averageScore: Math.max(0, prev.averageScore + (Math.random() - 0.5) * 2),
        activeSBU: Math.min(20, prev.activeSBU + Math.floor(Math.random() * 2))
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Mock data - akan diganti dengan data real dari Supabase
  const leaderboardData = [
    { rank: 1, sbu: 'SBU Jawa Barat', score: 92.5, change: '+2.3' },
    { rank: 2, sbu: 'SBU Jawa Timur', score: 89.2, change: '+1.8' },
    { rank: 3, sbu: 'SBU DKI Jakarta', score: 87.1, change: '-0.5' },
    { rank: 4, sbu: 'SBU Sumatra Utara', score: 84.6, change: '+3.2' },
    { rank: 5, sbu: 'SBU Kalimantan Timur', score: 82.3, change: '+0.9' },
    { rank: 6, sbu: 'SBU Sulawesi Selatan', score: 79.8, change: '-1.2' },
  ];

  const performanceComparisonData = [
    { indicator: 'Siaran Pers', 'SBU Jawa Barat': 95, 'SBU Jawa Timur': 88, 'SBU DKI Jakarta': 92, rata_rata: 85 },
    { indicator: 'Media Sosial', 'SBU Jawa Barat': 87, 'SBU Jawa Timur': 91, 'SBU DKI Jakarta': 89, rata_rata: 82 },
    { indicator: 'Skoring Media', 'SBU Jawa Barat': 94, 'SBU Jawa Timur': 86, 'SBU DKI Jakarta': 83, rata_rata: 79 },
    { indicator: 'Kampanye Komun.', 'SBU Jawa Barat': 78, 'SBU Jawa Timur': 85, 'SBU DKI Jakarta': 87, rata_rata: 75 },
  ];

  const trendData = [
    { month: 'Jan', total_laporan: 145, approved: 132, rejected: 13 },
    { month: 'Feb', total_laporan: 168, approved: 155, rejected: 13 },
    { month: 'Mar', total_laporan: 192, approved: 178, rejected: 14 },
    { month: 'Apr', total_laporan: 234, approved: 218, rejected: 16 },
    { month: 'May', total_laporan: 267, approved: 245, rejected: 22 },
    { month: 'Jun', total_laporan: 289, approved: 271, rejected: 18 },
  ];

  const activityCompositionData = [
    { name: 'Siaran Pers', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Konten Media Sosial', value: 28, color: 'hsl(var(--secondary))' },
    { name: 'Publikasi Media Massa', value: 20, color: 'hsl(var(--accent))' },
    { name: 'Kampanye Komunikasi', value: 12, color: 'hsl(var(--desmon-primary))' },
    { name: 'Tindaklanjut OFI', value: 5, color: 'hsl(var(--desmon-secondary))' },
  ];

  const chartConfig = {
    total_laporan: {
      label: "Total Laporan",
      color: "hsl(var(--primary))",
    },
    approved: {
      label: "Disetujui",
      color: "hsl(var(--desmon-secondary))",
    },
    rejected: {
      label: "Ditolak",
      color: "hsl(var(--destructive))",
    },
  };

  const isCurrentUserSBU = (sbuName: string) => userRole === 'sbu' && sbuName === currentSBU;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Analytics Dashboard
            <div className="flex items-center gap-1 text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </h1>
          <p className="text-muted-foreground">
            Visualisasi kinerja dan insight data real-time DASHMON+
            {userRole === 'sbu' && (
              <span className="block text-sm text-primary font-medium">
                Data untuk {currentSBU}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semester-1-2024">Semester 1 2024</SelectItem>
              <SelectItem value="semester-2-2024">Semester 2 2024</SelectItem>
              <SelectItem value="tahun-2024">Tahun 2024</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter Indikator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Indikator</SelectItem>
              <SelectItem value="siaran-pers">Siaran Pers</SelectItem>
              <SelectItem value="media-sosial">Media Sosial</SelectItem>
              <SelectItem value="publikasi">Publikasi Media</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveData.totalReports.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-desmon-secondary">+12.5%</span> dari bulan lalu
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Approval</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveData.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-desmon-secondary">+2.1%</span> dari target
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Skor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveData.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-desmon-secondary">+4.8%</span> improvement
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SBU Aktif</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveData.activeSBU}/20</div>
            <p className="text-xs text-muted-foreground">
              {((liveData.activeSBU / 20) * 100).toFixed(0)}% partisipasi aktif
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard">Peringkat</TabsTrigger>
          <TabsTrigger value="comparison">Komparasi</TabsTrigger>
          <TabsTrigger value="trends">Tren</TabsTrigger>
          <TabsTrigger value="composition">Komposisi</TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-desmon-secondary" />
                Papan Peringkat Nasional
              </CardTitle>
              <CardDescription>
                Ranking kinerja SBU berdasarkan skor KPI terintegrasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardData.map((item) => (
                  <div
                    key={item.rank}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isCurrentUserSBU(item.sbu) 
                        ? 'bg-desmon-primary/5 border-desmon-primary/20 ring-1 ring-desmon-primary/10' 
                        : 'bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        item.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        item.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        item.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {item.rank}
                      </div>
                      <div>
                        <p className={`font-medium ${isCurrentUserSBU(item.sbu) ? 'text-desmon-primary font-semibold' : ''}`}>
                          {item.sbu}
                          {isCurrentUserSBU(item.sbu) && (
                            <Badge variant="secondary" className="ml-2 bg-desmon-primary/10 text-desmon-primary">
                              Anda
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Perubahan: <span className={item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                            {item.change}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{item.score}</p>
                      <p className="text-sm text-muted-foreground">Skor Total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Komparasi Kinerja per Indikator</CardTitle>
              <CardDescription>
                Perbandingan pencapaian target untuk setiap indikator KPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="indicator" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="SBU Jawa Barat" fill="hsl(var(--primary))" />
                    <Bar dataKey="SBU Jawa Timur" fill="hsl(var(--secondary))" />
                    <Bar dataKey="SBU DKI Jakarta" fill="hsl(var(--accent))" />
                    <Bar dataKey="rata_rata" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Aktivitas Bulanan</CardTitle>
              <CardDescription>
                Perkembangan jumlah laporan dan tingkat approval sepanjang waktu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="total_laporan" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" stroke="hsl(var(--desmon-secondary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="rejected" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Composition Tab */}
        <TabsContent value="composition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Komposisi Jenis Kegiatan</CardTitle>
              <CardDescription>
                Distribusi laporan berdasarkan kategori indikator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityCompositionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityCompositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsView;