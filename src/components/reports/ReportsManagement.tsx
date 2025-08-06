import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit,
  Trash2,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  RefreshCw
} from "lucide-react";
import ReportDetailModal from "./ReportDetailModal";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ReportsManagementProps {
  userRole: 'admin' | 'sbu';
  currentSBU?: string;
}

// Mock data untuk demo
const mockReports = [
  {
    id: "RPT-001",
    fileName: "Laporan Media Sosial Q4 2024.xlsx",
    submittedBy: "Ahmad Sutanto",
    sbu: "SBU Jawa Barat",
    submittedAt: "2024-01-15 14:30",
    status: "approved",
    indicatorType: "Media Sosial",
    calculatedScore: 85.5,
    approvedBy: "Admin Central",
    approvedAt: "2024-01-16 09:15"
  },
  {
    id: "RPT-002", 
    fileName: "Digital Marketing Report Jan 2024.xlsx",
    submittedBy: "Siti Rahayu",
    sbu: "SBU Jawa Tengah",
    submittedAt: "2024-01-14 16:45",
    status: "pending",
    indicatorType: "Digital Marketing",
    calculatedScore: null,
    approvedBy: null,
    approvedAt: null
  },
  {
    id: "RPT-003",
    fileName: "Website Analytics Dec 2023.xlsx", 
    submittedBy: "Budi Prasetyo",
    sbu: "SBU Jawa Barat",
    submittedAt: "2024-01-13 11:20",
    status: "rejected",
    indicatorType: "Website",
    calculatedScore: null,
    approvedBy: "Admin Central",
    approvedAt: "2024-01-14 08:30",
    rejectionReason: "Data tidak lengkap, mohon upload ulang dengan data yang complete"
  },
  {
    id: "RPT-004",
    fileName: "Social Media Engagement Report.xlsx",
    submittedBy: "Lisa Andriani", 
    sbu: "SBU DKI Jakarta",
    submittedAt: "2024-01-12 13:15",
    status: "processing",
    indicatorType: "Media Sosial",
    calculatedScore: null,
    approvedBy: null,
    approvedAt: null
  }
];

const ReportsManagement = ({ userRole, currentSBU = "SBU Jawa Barat" }: ReportsManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [indicatorFilter, setIndicatorFilter] = useState("all");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filter reports based on user role
  const filteredReports = mockReports.filter(report => {
    // For SBU users, only show their own reports
    if (userRole === 'sbu' && report.sbu !== currentSBU) return false;
    
    // Apply search filter
    if (searchTerm && !report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !report.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Apply status filter
    if (statusFilter !== "all" && report.status !== statusFilter) return false;
    
    // Apply indicator type filter
    if (indicatorFilter !== "all" && report.indicatorType !== indicatorFilter) return false;
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3" />Selesai</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Disetujui Admin</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />Ditolak Admin</Badge>;
      case 'system_rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Ditolak Sistem</Badge>;
      case 'pending':
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><TrendingUp className="mr-1 h-3 w-3" />Diproses</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Gagal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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

  const handleViewDetail = (report: any) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  const handleGenerateReport = () => {
    toast({
      title: "Generate Report",
      description: "Laporan sedang dibuat. Anda akan menerima notifikasi setelah selesai.",
    });
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedReport(null);
  };

  const handleApproveReport = (reportId: string, notes?: string) => {
    toast({
      title: "Laporan Disetujui",
      description: `Laporan telah disetujui${notes ? ' dengan catatan' : ''}.`,
    });
  };

  const handleRejectReport = (reportId: string, reason: string) => {
    toast({
      title: "Laporan Ditolak",
      description: "Laporan telah ditolak dengan alasan yang diberikan.",
    });
  };

  const handleDownloadReport = (report: any) => {
    toast({
      title: "Mengunduh File",
      description: `File ${report.fileName} sedang diunduh.`,
    });
  };

  const handleUploadNew = () => {
    const basePath = userRole === 'admin' ? '/admin' : '/sbu';
    navigate(`${basePath}/upload`);
  };

  const handleExportReports = () => {
    toast({
      title: "Export Data",
      description: "Data laporan sedang diekspor ke Excel.",
    });
  };

  const handleRefreshData = () => {
    toast({
      title: "Data Diperbarui",
      description: "Data laporan telah diperbarui dari database.",
    });
  };

  const indicatorTypes = ["Media Sosial", "Digital Marketing", "Website"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {userRole === 'admin' ? 'Manajemen Laporan' : 'Laporan Saya'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? 'Kelola dan review semua laporan yang masuk' 
              : `Laporan yang telah disubmit oleh ${currentSBU}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {userRole === 'sbu' && (
            <Button variant="hero" onClick={handleUploadNew}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Laporan Baru
            </Button>
          )}
          <Button variant="outline" onClick={handleExportReports}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {userRole === 'admin' && selectedReports.length > 0 && (
            <Button variant="hero">
              Bulk Action ({selectedReports.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="pending_approval">Menunggu Approval</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="system_rejected">Ditolak Sistem</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
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
                title: "Filter Diterapkan",
                description: "Filter laporan berhasil diterapkan.",
              });
            }}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button onClick={() => {
              toast({
                title: "Export Data",
                description: "Data laporan sedang diekspor ke Excel.",
              });
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Laporan</CardTitle>
              <CardDescription>
                Menampilkan {filteredReports.length} laporan
              </CardDescription>
            </div>
            {userRole === 'admin' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">Pilih Semua</label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  {userRole === 'admin' && (
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={(checked) => handleSelectReport(report.id, checked as boolean)}
                    />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{report.fileName}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {report.submittedBy}
                      </div>
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>{report.sbu}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.submittedAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span>{report.indicatorType}</span>
                      </div>
                      {report.calculatedScore && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Score: {report.calculatedScore}
                        </div>
                      )}
                    </div>

                    {report.rejectionReason && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <strong>Alasan Penolakan:</strong> {report.rejectionReason}
                      </div>
                    )}

                    {report.approvedBy && (
                      <div className="text-sm text-green-600">
                        Disetujui oleh {report.approvedBy} pada {report.approvedAt}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetail(report)}>
                    <Eye className="mr-1 h-3 w-3" />
                    Detail
                  </Button>
                  {userRole === 'admin' && report.status === 'pending' && (
                    <>
                      <Button variant="success" size="sm" onClick={() => handleApproveReport(report.id)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Setujui
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRejectReport(report.id, "")}>
                        <XCircle className="mr-1 h-3 w-3" />
                        Tolak
                      </Button>
                    </>
                  )}
                  {(userRole === 'sbu' && report.status === 'rejected') && (
                    <Button variant="outline" size="sm" onClick={() => {
                      toast({
                        title: "Redirect ke Upload",
                        description: "Mengarahkan ke halaman upload untuk mengunggah ulang laporan.",
                      });
                      handleUploadNew();
                    }}>
                      <Edit className="mr-1 h-3 w-3" />
                      Upload Ulang
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)}>
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Tidak ada laporan yang ditemukan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          isOpen={detailModalOpen}
          onClose={handleCloseDetailModal}
          report={selectedReport}
          userRole={userRole}
          onApprove={handleApproveReport}
          onReject={handleRejectReport}
        />
      )}
    </div>
  );
};

export default ReportsManagement;