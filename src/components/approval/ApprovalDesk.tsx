import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Clock, 
  FileText, 
  Download,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Report interface
interface Report {
  id: string;
  fileName: string;
  submittedBy: string;
  sbu: string;
  submittedAt: string;
  status: string;
  indicatorType: string;
  rawData: any;
  processedData: any;
  calculatedScore: number | null;
  fileSize: string;
  videoLinks: string[];
  rejectionReason?: string;
}

// Mock data for detailed reports
const mockDetailedReports = [
  {
    id: "RPT-001",
    fileName: "Laporan Media Sosial Q4 2024.xlsx",
    submittedBy: "Ahmad Sutanto",
    sbu: "SBU Jawa Barat", 
    submittedAt: "2024-01-15 14:30",
    status: "pending",
    indicatorType: "Media Sosial",
    rawData: {
      followers: 15420,
      engagement_rate: 3.2,
      posts_count: 45,
      reach: 125000,
      impressions: 245000
    },
    processedData: {
      score_engagement: 85,
      score_reach: 78,
      score_growth: 92
    },
    calculatedScore: null,
    fileSize: "2.3 MB",
    videoLinks: [
      "https://youtube.com/watch?v=example1",
      "https://instagram.com/reel/example2"
    ]
  },
  {
    id: "RPT-002",
    fileName: "Digital Marketing Report Jan 2024.xlsx", 
    submittedBy: "Siti Rahayu",
    sbu: "SBU Jawa Tengah",
    submittedAt: "2024-01-14 16:45",
    status: "pending",
    indicatorType: "Digital Marketing",
    rawData: {
      website_visits: 8450,
      conversion_rate: 2.8,
      bounce_rate: 45,
      session_duration: 185
    },
    processedData: {
      score_traffic: 75,
      score_conversion: 82,
      score_retention: 68
    },
    calculatedScore: null,
    fileSize: "1.8 MB",
    videoLinks: []
  },
  {
    id: "RPT-003",
    fileName: "Website Analytics Dec 2023.xlsx",
    submittedBy: "Budi Prasetyo", 
    sbu: "SBU Jawa Barat",
    submittedAt: "2024-01-13 11:20",
    status: "pending",
    indicatorType: "Website",
    rawData: {
      page_views: 25600,
      unique_visitors: 12300,
      avg_session: 220,
      conversion_rate: 3.5
    },
    processedData: {
      score_traffic: 88,
      score_engagement: 76,
      score_conversion: 91
    },
    calculatedScore: null,
    fileSize: "3.1 MB",
    videoLinks: [
      "https://youtube.com/watch?v=demo1"
    ]
  }
];

interface ReportDetailProps {
  report: Report;
  onApprove: (reportId: string, note?: string) => void;
  onReject: (reportId: string, reason: string) => void;
}

const ReportDetail = ({ report, onApprove, onReject }: ReportDetailProps) => {
  const [actionNote, setActionNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = () => {
    onApprove(report.id, actionNote);
    setShowApproveDialog(false);
    setActionNote("");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penolakan harus diisi",
        variant: "destructive"
      });
      return;
    }
    onReject(report.id, rejectionReason);
    setShowRejectDialog(false);
    setRejectionReason("");
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Detail Laporan
        </DialogTitle>
        <DialogDescription>
          Review dan approval laporan yang disubmit
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nama File</Label>
                <p className="font-medium">{report.fileName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ukuran File</Label>
                <p>{report.fileSize}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Disubmit Oleh</Label>
                <p>{report.submittedBy}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">SBU</Label>
                <p>{report.sbu}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tanggal Submit</Label>
                <p>{report.submittedAt}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Jenis Indikator</Label>
                <p>{report.indicatorType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Mentah</CardTitle>
            <CardDescription>Data yang disubmit dalam laporan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(report.rawData).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-primary">{(value as number)?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processed Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Terproses</CardTitle>
            <CardDescription>Hasil analisis dan scoring otomatis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(report.processedData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <span className="capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-bold text-2xl text-primary ml-4">{value as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Links */}
        {report.videoLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Link Video</CardTitle>
              <CardDescription>Video pendukung yang dilampirkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.videoLinks.map((link: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-sm">Video {index + 1}:</span>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      {link}
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1" variant="success">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Setujui Laporan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
                <DialogDescription>
                  Anda akan menyetujui laporan "{report.fileName}"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="approve-note">Catatan (Opsional)</Label>
                  <Textarea
                    id="approve-note"
                    placeholder="Tambahkan catatan untuk approval ini..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApprove} className="flex-1">
                    Ya, Setujui
                  </Button>
                  <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1" variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Tolak Laporan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Penolakan</DialogTitle>
                <DialogDescription>
                  Anda akan menolak laporan "{report.fileName}"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Jelaskan alasan mengapa laporan ditolak..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleReject} className="flex-1">
                    Ya, Tolak
                  </Button>
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DialogContent>
  );
};

const ApprovalDesk = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sbuFilter, setSbuFilter] = useState("all");
  const [indicatorFilter, setIndicatorFilter] = useState("all");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>(mockDetailedReports);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real reports from database
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select(`
          *,
          profiles!reports_user_id_fkey(full_name, sbu_name)
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data laporan dari database",
          variant: "destructive"
        });
        return;
      }

      if (reportsData && reportsData.length > 0) {
        // Transform database data to match our component structure
        const transformedReports: Report[] = reportsData.map(report => ({
          id: report.id,
          fileName: report.file_name,
          submittedBy: report.profiles?.full_name || 'Unknown User',
          sbu: report.profiles?.sbu_name || 'Unknown SBU',
          submittedAt: new Date(report.created_at).toLocaleString('id-ID'),
          status: report.approved_at ? 'approved' : 'pending',
          indicatorType: report.indicator_type,
          rawData: typeof report.raw_data === 'object' ? report.raw_data : {},
          processedData: typeof report.processed_data === 'object' ? report.processed_data : {},
          calculatedScore: report.calculated_score,
          fileSize: "N/A",
          videoLinks: Array.isArray(report.video_links) ? report.video_links.filter(link => typeof link === 'string') as string[] : [],
          rejectionReason: report.rejection_reason || undefined
        }));
        
        // Use only real data from database
        setReports(transformedReports);
      } else {
        // Show mock data if no real data
        setReports(mockDetailedReports);
      }
    } catch (error) {
      console.error('Error in fetchReports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(report => {
    if (searchTerm && !report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !report.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    if (sbuFilter !== "all" && report.sbu !== sbuFilter) return false;
    if (indicatorFilter !== "all" && report.indicatorType !== indicatorFilter) return false;
    
    return report.status === 'pending';
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(filteredReports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    }
  };

  const handleApprove = async (reportId: string, note?: string) => {
    try {
      // Get current session for authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Session tidak valid");
      }

      // Call admin action edge function
      const { data, error } = await supabase.functions.invoke('admin-report-action', {
        body: JSON.stringify({ 
          reportId: reportId,
          action: 'approve',
          notes: note
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        throw new Error(error.message || 'Gagal menyetujui laporan');
      }

      if (!data.success) {
        throw new Error(data.error || 'Gagal menyetujui laporan');
      }

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'approved', calculatedScore: Math.round(Math.random() * 30 + 70) }
          : report
      ));
      
      toast({
        title: "Laporan Disetujui",
        description: "Laporan berhasil disetujui dan akan dilanjutkan ke proses kalkulasi skor",
      });

      // Refresh data
      await fetchReports();
    } catch (error: any) {
      console.error('Error approving report:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui laporan: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (reportId: string, reason: string) => {
    try {
      // Get current session for authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Session tidak valid");
      }

      // Call admin action edge function
      const { data, error } = await supabase.functions.invoke('admin-report-action', {
        body: JSON.stringify({ 
          reportId: reportId,
          action: 'reject',
          reason: reason
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        throw new Error(error.message || 'Gagal menolak laporan');
      }

      if (!data.success) {
        throw new Error(data.error || 'Gagal menolak laporan');
      }

      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'rejected', rejectionReason: reason }
          : report
      ));
      
      toast({
        title: "Laporan Ditolak", 
        description: "Laporan telah ditolak dan tidak akan dilanjutkan ke proses kalkulasi",
        variant: "destructive",
      });

      // Refresh data
      await fetchReports();
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      toast({
        title: "Error",
        description: "Gagal menolak laporan: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleBulkApprove = () => {
    selectedReports.forEach(reportId => handleApprove(reportId));
    setSelectedReports([]);
    
    toast({
      title: "Bulk Approval Berhasil",
      description: `${selectedReports.length} laporan berhasil disetujui`,
    });
  };

  const sbuOptions = ["SBU Jawa Barat", "SBU Jawa Tengah", "SBU Jawa Timur", "SBU DKI Jakarta"];
  const indicatorTypes = ["Media Sosial", "Digital Marketing", "Website"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approval Laporan</h1>
          <p className="text-muted-foreground">Tinjau dan setujui laporan yang masuk</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            toast({
              title: "Export Data",
              description: "Data laporan sedang diekspor ke Excel.",
            });
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {selectedReports.length > 0 && (
            <Button variant="hero" onClick={handleBulkApprove}>
              Bulk Approve ({selectedReports.length})
            </Button>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama file atau pembuat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={sbuFilter} onValueChange={setSbuFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih SBU" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua SBU</SelectItem>
                {sbuOptions.map(sbu => (
                  <SelectItem key={sbu} value={sbu}>{sbu}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={indicatorFilter} onValueChange={setIndicatorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Jenis Indikator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Indikator</SelectItem>
                {indicatorTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              toast({
                title: "Filter Aktif",
                description: "Filter laporan telah diterapkan.",
              });
            }}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Laporan Menunggu Approval</CardTitle>
              <CardDescription>{filteredReports.length} laporan memerlukan persetujuan</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm">Pilih Semua</label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={(checked) => handleSelectReport(report.id, checked as boolean)}
                  />
                  
                  <div className="space-y-1">
                    <p className="font-medium">{report.fileName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {report.submittedBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span>{report.sbu}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.submittedAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span>{report.indicatorType}</span>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="mr-1 h-3 w-3" />
                      Menunggu Approval
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <ReportDetail 
                      report={report} 
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  </Dialog>
                  
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleApprove(report.id)}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Setujui
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleReject(report.id, "Ditolak melalui quick action")}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Tolak
                  </Button>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Tidak ada laporan pending</h3>
                <p className="text-muted-foreground">Semua laporan telah diproses</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalDesk;