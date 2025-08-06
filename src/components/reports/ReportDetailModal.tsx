import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Download, Eye, Clock, User, Calendar, FileText, Video, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: string;
    fileName: string;
    submitter: string;
    status: 'pending' | 'approved' | 'rejected' | 'processing';
    submittedAt: string;
    sbu?: string;
    indicatorType: string;
    score?: number;
    rawData?: any;
    processedData?: any;
    videoUrl?: string;
    rejectionReason?: string;
    approvalNotes?: string;
  };
  userRole: 'admin' | 'sbu';
  onApprove?: (reportId: string, notes?: string) => void;
  onReject?: (reportId: string, reason: string) => void;
}

const ReportDetailModal = ({ 
  isOpen, 
  onClose, 
  report, 
  userRole, 
  onApprove, 
  onReject 
}: ReportDetailModalProps) => {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Disetujui Admin</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3" />Selesai</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Ditolak Admin</Badge>;
      case 'system_rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Ditolak Sistem</Badge>;
      case 'pending':
      case 'pending_approval':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Menunggu Review</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><BarChart3 className="mr-1 h-3 w-3" />Sedang Diproses</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Gagal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(report.id, approvalNotes);
      toast({
        title: "Laporan Disetujui",
        description: `Laporan ${report.fileName} telah disetujui dan akan dilanjutkan ke proses kalkulasi skor.`,
      });
      onClose();
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Alasan Diperlukan",
        description: "Silakan berikan alasan penolakan laporan.",
        variant: "destructive"
      });
      return;
    }
    
    if (onReject) {
      onReject(report.id, rejectionReason);
      toast({
        title: "Laporan Ditolak",
        description: `Laporan ${report.fileName} telah ditolak.`,
      });
      onClose();
    }
  };

  const handleDownload = () => {
    toast({
      title: "Mengunduh File",
      description: `File ${report.fileName} sedang diunduh.`,
    });
  };

  const handleOpenVideo = () => {
    if (report.videoUrl) {
      window.open(report.videoUrl, '_blank');
    } else {
      toast({
        title: "Video Tidak Tersedia",
        description: "Link video tidak ditemukan untuk laporan ini.",
        variant: "destructive"
      });
    }
  };

  // Mock processed data
  const mockProcessedData = {
    totalEntries: 156,
    validEntries: 142,
    errorEntries: 14,
    score: report.score || 87.5,
    indicators: {
      'siaran-pers': { count: 45, score: 92 },
      'media-sosial': { count: 78, score: 85 },
      'publikasi-media': { count: 23, score: 91 }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{report.fileName}</DialogTitle>
              <DialogDescription className="mt-2">
                Detail lengkap laporan dan hasil analisis
              </DialogDescription>
            </div>
            {getStatusBadge(report.status)}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="analysis">Analisis</TabsTrigger>
            <TabsTrigger value="actions">Aksi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informasi Pelapor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Pelapor</p>
                    <p className="font-medium">{report.submitter}</p>
                  </div>
                  {report.sbu && (
                    <div>
                      <p className="text-sm text-muted-foreground">SBU</p>
                      <p className="font-medium">{report.sbu}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis Indikator</p>
                    <p className="font-medium">{report.indicatorType}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Informasi Waktu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Submit</p>
                    <p className="font-medium">{report.submittedAt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{report.status}</p>
                  </div>
                  {report.score && (
                    <div>
                      <p className="text-sm text-muted-foreground">Skor</p>
                      <p className="font-medium text-lg text-desmon-primary">{report.score}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {(report.rejectionReason || report.approvalNotes) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Catatan Review</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.rejectionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800">Alasan Penolakan:</p>
                      <p className="text-red-700 mt-1">{report.rejectionReason}</p>
                    </div>
                  )}
                  {report.approvalNotes && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-800">Catatan Persetujuan:</p>
                      <p className="text-green-700 mt-1">{report.approvalNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File Data
                </CardTitle>
                <CardDescription>Informasi file yang diunggah</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{report.fileName}</p>
                    <p className="text-sm text-muted-foreground">Excel Spreadsheet • {report.submittedAt}</p>
                  </div>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Unduh
                  </Button>
                </div>

                {report.videoUrl && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Video Pendukung</p>
                      <p className="text-sm text-muted-foreground">Link video dokumentasi</p>
                    </div>
                    <Button variant="outline" onClick={handleOpenVideo}>
                      <Video className="mr-2 h-4 w-4" />
                      Buka Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Hasil Analisis ETL
                </CardTitle>
                <CardDescription>Hasil pemrosesan dan validasi data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Entri</p>
                    <p className="text-2xl font-bold">{mockProcessedData.totalEntries}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Entri Valid</p>
                    <p className="text-2xl font-bold text-green-600">{mockProcessedData.validEntries}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Entri Error</p>
                    <p className="text-2xl font-bold text-red-600">{mockProcessedData.errorEntries}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Skor Akhir</p>
                    <p className="text-2xl font-bold text-desmon-primary">{mockProcessedData.score}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {userRole === 'admin' && report.status === 'pending' && (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Setujui Laporan</CardTitle>
                    <CardDescription>Berikan persetujuan dengan catatan opsional</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="approval-notes">Catatan Persetujuan (Opsional)</Label>
                      <Textarea
                        id="approval-notes"
                        placeholder="Tambahkan catatan untuk laporan yang disetujui..."
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleApprove} className="w-full" variant="success">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Setujui Laporan
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Tolak Laporan</CardTitle>
                    <CardDescription>Berikan alasan penolakan yang jelas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Jelaskan alasan penolakan laporan..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                      />
                    </div>
                    <Button onClick={handleReject} variant="destructive" className="w-full">
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak Laporan
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {userRole === 'sbu' && (
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Laporan</CardTitle>
                  <CardDescription>Aksi yang tersedia untuk laporan Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh File Laporan
                  </Button>
                  {report.videoUrl && (
                    <Button variant="outline" onClick={handleOpenVideo} className="w-full">
                      <Video className="mr-2 h-4 w-4" />
                      Lihat Video Pendukung
                    </Button>
                  )}
                  {report.status === 'rejected' && (
                    <Button variant="hero" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Upload Ulang Perbaikan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {(userRole === 'admin' && report.status !== 'pending') && (
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Admin</CardTitle>
                  <CardDescription>Aksi administratif untuk laporan ini</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh File Laporan
                  </Button>
                  {report.videoUrl && (
                    <Button variant="outline" onClick={handleOpenVideo} className="w-full">
                      <Video className="mr-2 h-4 w-4" />
                      Lihat Video Pendukung
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailModal;