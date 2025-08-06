
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const UploadInterface = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState<string>("");
  const { toast } = useToast();

  const indicators = [
    {
      id: 'skoring-publikasi-media',
      name: 'Skoring Publikasi Media Massa',
      description: 'Laporan dan skor publikasi di berbagai platform media massa (media sosial, online, radio, cetak, running text, TV)'
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Format File Tidak Valid",
          description: "Silakan pilih file Excel (.xlsx atau .xls)",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Terlalu Besar",
          description: "Ukuran file maksimal 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDownloadTemplate = (indicatorId: string) => {
    // In real app, this would download the actual template
    toast({
      title: "Template Diunduh",
      description: `Template untuk ${indicators.find(i => i.id === indicatorId)?.name} berhasil diunduh`,
    });
  };

  const handleUpload = async () => {
    if (!selectedIndicator || !selectedFile) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Silakan pilih indikator dan file Excel",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setProcessStatus("Menyiapkan upload...");

    try {
      // Get current user
      console.log('🔐 Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User tidak terautentikasi");
      }
      console.log('✅ User authenticated:', user.id);

      // Get session for authorization
      console.log('🔐 Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Session tidak valid");
      }
      console.log('✅ Session obtained');

      // Create FormData
      console.log('📝 Creating form data...');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('indicator_type', selectedIndicator);
      formData.append('user_id', user.id);

      setProcessStatus("Mengunggah file...");
      setUploadProgress(25);

      // Call edge function
      console.log('🚀 Calling edge function...');
      console.log('📋 Upload details:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        indicator: selectedIndicator,
        userId: user.id
      });
      
      const { data, error } = await supabase.functions.invoke('process-report-upload', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      
      console.log('📨 Edge function response received:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Terjadi kesalahan saat memproses file');
      }

      setProcessStatus("Memvalidasi file...");
      setUploadProgress(50);

      // Check response
      if (!data) {
        throw new Error('Tidak ada response dari server');
      }

      if (!data.success) {
        console.error('❌ Upload failed:', data.error);
        throw new Error(data.error || 'Upload gagal');
      }

      setProcessStatus("File diterima sistem...");
      setUploadProgress(75);

      // Short delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessStatus("Laporan sedang diproses...");
      setUploadProgress(100);

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🎉 Upload queued successfully!', {
        reportId: data.report_id,
        status: data.status
      });

      toast({
        title: "Laporan Berhasil Diunggah!",
        description: "Laporan Anda telah masuk ke antrian untuk validasi sistem. Setelah validasi, laporan akan menunggu persetujuan admin sebelum dihitung skornya.",
      });

      // Reset form
      setSelectedFile(null);
      setSelectedIndicator("");
      setUploadProgress(0);
      setProcessStatus("");
      
    } catch (error: any) {
      console.error('💥 Upload error:', error);
      
      let errorMessage = "Terjadi kesalahan saat mengunggah file.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload Gagal",
        description: errorMessage,
        variant: "destructive"
      });
      
      setUploadProgress(0);
      setProcessStatus("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card className="border-desmon-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-desmon-secondary/10 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-desmon-secondary" />
            </div>
            Panduan Upload Laporan
          </CardTitle>
          <CardDescription>
            Ikuti langkah-langkah berikut untuk mengunggah laporan Excel Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-desmon-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
            <div>
              <p className="font-medium">Pilih Jenis Indikator</p>
              <p className="text-sm text-muted-foreground">Tentukan kategori laporan yang akan Anda unggah</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-desmon-primary rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
            <div>
              <p className="font-medium">Unduh Template Excel</p>
              <p className="text-sm text-muted-foreground">Gunakan template yang sesuai dengan indikator yang dipilih</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-desmon-primary rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
            <div>
              <p className="font-medium">Isi Data & Upload</p>
              <p className="text-sm text-muted-foreground">Lengkapi template dengan data Anda dan unggah ke sistem</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Laporan Excel</CardTitle>
          <CardDescription>
            Unggah file laporan Excel sesuai dengan indikator yang dipilih
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Indicator Selection */}
          <div className="space-y-2">
            <Label htmlFor="indicator">Jenis Indikator Laporan</Label>
            <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis indikator..." />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((indicator) => (
                  <SelectItem key={indicator.id} value={indicator.id}>
                    <div>
                      <div className="font-medium">{indicator.name}</div>
                      <div className="text-sm text-muted-foreground">{indicator.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          {selectedIndicator && (
            <div className="p-4 bg-desmon-background/30 rounded-lg border border-desmon-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Template Excel Tersedia</p>
                  <p className="text-sm text-muted-foreground">
                    Unduh template untuk {indicators.find(i => i.id === selectedIndicator)?.name}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadTemplate(selectedIndicator)}
                  className="border-desmon-secondary text-desmon-primary hover:bg-desmon-secondary/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Unduh Template
                </Button>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File Excel</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{selectedFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Format yang didukung: .xlsx, .xls (Maksimal 10MB)
            </p>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-3 p-4 bg-desmon-background/30 rounded-lg border border-desmon-secondary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress Upload</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              {processStatus && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-desmon-primary" />
                  <span className="text-sm text-muted-foreground">{processStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={!selectedIndicator || !selectedFile || isUploading}
              className="min-w-32"
              variant="hero"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim ke Antrian...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Unggah Laporan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadInterface;
