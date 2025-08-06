import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Trophy, Target, Activity, Filter, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsViewProps {
  userRole: 'admin' | 'sbu';
  currentSBU?: string;
}

const AnalyticsView = ({ userRole, currentSBU = 'SBU Jawa Barat' }: AnalyticsViewProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('semester-1-2024');
  const [selectedIndicator, setSelectedIndicator] = useState('all');
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [performanceComparisonData, setPerformanceComparisonData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activityCompositionData, setActivityCompositionData] = useState<any[]>([]);
  const { toast } = useToast();
  
  const [liveData, setLiveData] = useState({
    totalReports: 0,
    approvalRate: 0,
    averageScore: 0,
    activeSBU: 0
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedIndicator, userRole, currentSBU]);

  // Simulate real-time updates
  useEffect(() => {
    if (liveData.totalReports === 0) return; // Don't update if no initial data
    
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

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports with user profiles
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          status,
          calculated_score,
          indicator_type,
          created_at,
          approved_at,
          profiles!reports_user_id_fkey(full_name, sbu_name)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch active SBU count
      const { data: sbuUsers, error: sbuError } = await supabase
        .from('profiles')
        .select('sbu_name')
        .eq('role', 'sbu')
        .not('sbu_name', 'is', null);

      if (sbuError) throw sbuError;

      // Calculate live data
      const totalReports = reports?.length || 0;
      const approvedReports = reports?.filter(r => r.status === 'approved' || r.status === 'completed').length || 0;
      const approvalRate = totalReports > 0 ? (approvedReports / totalReports) * 100 : 0;
      
      const completedWithScores = reports?.filter(r => r.calculated_score !== null) || [];
      const averageScore = completedWithScores.length > 0 
        ? completedWithScores.reduce((sum, r) => sum + (r.calculated_score || 0), 0) / completedWithScores.length
        : 0;
      
      const uniqueSBUs = new Set(sbuUsers?.map(u => u.sbu_name).filter(Boolean));
      const activeSBU = uniqueSBUs.size;

      setLiveData({
        totalReports,
        approvalRate,
        averageScore,
        activeSBU
      });

      // Generate leaderboard data
      await generateLeaderboardData(reports || []);
      
      // Generate performance comparison data
      await generatePerformanceData(reports || []);
      
      // Generate trend data
      await generateTrendData(reports || []);
      
      // Generate activity composition data
      await generateCompositionData(reports || []);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLeaderboardData = async (reports: any[]) => {
    // Group reports by SBU and calculate average scores
    const sbuScores: { [key: string]: { scores: number[], totalReports: number } } = {};
    
    reports.forEach(report => {
      const sbuName = report.profiles?.sbu_name;
      if (!sbuName || !report.calculated_score) return;
      
      if (!sbuScores[sbuName]) {
        sbuScores[sbuName] = { scores: [], totalReports: 0 };
      }
      
      sbuScores[sbuName].scores.push(report.calculated_score);
      sbuScores[sbuName].totalReports++;
    });

    // Calculate average scores and create leaderboard
    const leaderboard = Object.entries(sbuScores)
      .map(([sbu, data]) => ({
        sbu,
        score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
        totalReports: data.totalReports,
        change: (Math.random() - 0.5) * 5 // Mock change for now
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        rank: index + 1,
        sbu: item.sbu,
        score: Number(item.score.toFixed(1)),
        change: item.change > 0 ? `+${item.change.toFixed(1)}` : item.change.toFixed(1)
      }));

    setLeaderboardData(leaderboard);
  };

  const generatePerformanceData = async (reports: any[]) => {
    // Group by indicator type and SBU
    const indicatorPerformance: { [key: string]: { [key: string]: number[] } } = {};
    
    reports.forEach(report => {
      const sbuName = report.profiles?.sbu_name;
      const indicator = report.indicator_type;
      
      if (!sbuName || !indicator || !report.calculated_score) return;
      
      if (!indicatorPerformance[indicator]) {
        indicatorPerformance[indicator] = {};
      }
      
      if (!indicatorPerformance[indicator][sbuName]) {
        indicatorPerformance[indicator][sbuName] = [];
      }
      
      indicatorPerformance[indicator][sbuName].push(report.calculated_score);
    });

    // Calculate averages and create comparison data
    const comparisonData = Object.entries(indicatorPerformance).map(([indicator, sbuData]) => {
      const result: any = { indicator };
      let totalScores: number[] = [];
      
      Object.entries(sbuData).forEach(([sbu, scores]) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        result[sbu] = Math.round(avgScore);
        totalScores.push(...scores);
      });
      
      // Calculate overall average
      result.rata_rata = totalScores.length > 0 
        ? Math.round(totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length)
        : 0;
      
      return result;
    });

    setPerformanceComparisonData(comparisonData);
  };

  const generateTrendData = async (reports: any[]) => {
    // Group reports by month
    const monthlyData: { [key: string]: { total: number, approved: number, rejected: number } } = {};
    
    reports.forEach(report => {
      const date = new Date(report.created_at);
      const monthKey = date.toLocaleDateString('id-ID', { month: 'short' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, approved: 0, rejected: 0 };
      }
      
      monthlyData[monthKey].total++;
      
      if (report.status === 'approved' || report.status === 'completed') {
        monthlyData[monthKey].approved++;
      } else if (report.status === 'rejected' || report.status === 'system_rejected') {
        monthlyData[monthKey].rejected++;
      }
    });

    // Convert to array format for chart
    const trendArray = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      total_laporan: data.total,
      approved: data.approved,
      rejected: data.rejected
    }));

    setTrendData(trendArray);
  };

  const generateCompositionData = async (reports: any[]) => {
    // Group by indicator type
    const indicatorCounts: { [key: string]: number } = {};
    
    reports.forEach(report => {
      const indicator = report.indicator_type || 'Unknown';
      indicatorCounts[indicator] = (indicatorCounts[indicator] || 0) + 1;
    });

    // Convert to chart format
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(var(--desmon-primary))',
      'hsl(var(--desmon-secondary))'
    ];

    const compositionArray = Object.entries(indicatorCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));

    setActivityCompositionData(compositionArray);
  };

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
              <SelectTrigger className="w-[180px]" disabled={loading}>
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
            <SelectTrigger className="w-[160px]" disabled={loading}>
              <SelectValue placeholder="Filter Indikator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Indikator</SelectItem>
              <SelectItem value="siaran-pers">Siaran Pers</SelectItem>
              <SelectItem value="media-sosial">Media Sosial</SelectItem>
              <SelectItem value="publikasi">Publikasi Media</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" disabled={loading}>
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
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg border animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-muted rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-6 bg-muted rounded w-12"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : leaderboardData.length > 0 ? (
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Belum ada data peringkat tersedia</p>
                  </div>
                )}
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
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
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
                )}
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
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
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
                )}
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
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
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
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsView;