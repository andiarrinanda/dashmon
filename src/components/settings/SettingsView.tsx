import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Database, FileText, Mail, Shield, Save, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsView = () => {
  const { toast } = useToast();
  
  const [systemSettings, setSystemSettings] = useState({
    enableNotifications: true,
    autoApproval: false,
    maxFileSize: '50',
    allowedFileTypes: ['xlsx', 'xls'],
    backupFrequency: 'daily',
    retentionPeriod: '365'
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    enableEmailNotifications: true,
    emailTemplate: 'default'
  });

  const [reportSettings, setReportSettings] = useState({
    defaultExportFormat: 'xlsx',
    includeCharts: true,
    autoGenerateReports: false,
    reportSchedule: 'weekly'
  });

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Berhasil",
      description: `Pengaturan ${section} berhasil disimpan`,
    });
  };

  const handleBackupNow = () => {
    toast({
      title: "Backup Dimulai",
      description: "Proses backup database sedang berjalan...",
    });
  };

  const handleImportConfig = () => {
    toast({
      title: "Import Berhasil",
      description: "Konfigurasi berhasil diimport",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">
          Konfigurasi dan preferensi sistem DASHMON+
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">Sistem</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pengaturan Sistem Umum
              </CardTitle>
              <CardDescription>
                Konfigurasi dasar sistem dan batasan file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Ukuran File Maksimal (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: e.target.value})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Batas ukuran file yang dapat diunggah
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionPeriod">Periode Retensi Data (hari)</Label>
                  <Input
                    id="retentionPeriod"
                    type="number"
                    value={systemSettings.retentionPeriod}
                    onChange={(e) => setSystemSettings({...systemSettings, retentionPeriod: e.target.value})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Berapa lama data disimpan dalam sistem
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Setujui laporan secara otomatis jika lolos validasi sistem
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.autoApproval}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoApproval: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifikasi Real-time</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktifkan notifikasi push untuk update real-time
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableNotifications}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, enableNotifications: checked})}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tipe File yang Diizinkan</Label>
                <div className="flex flex-wrap gap-2">
                  {['xlsx', 'xls', 'csv'].map((type) => (
                    <Badge 
                      key={type} 
                      variant={systemSettings.allowedFileTypes.includes(type) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => {
                        const updatedTypes = systemSettings.allowedFileTypes.includes(type)
                          ? systemSettings.allowedFileTypes.filter(t => t !== type)
                          : [...systemSettings.allowedFileTypes, type];
                        setSystemSettings({...systemSettings, allowedFileTypes: updatedTypes});
                      }}
                    >
                      .{type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('sistem')}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>
                Konfigurasi notifikasi untuk berbagai event sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'upload', label: 'Upload Laporan Baru', description: 'Notifikasi saat ada laporan baru diunggah' },
                  { key: 'approval', label: 'Status Approval', description: 'Notifikasi perubahan status persetujuan' },
                  { key: 'rejection', label: 'Laporan Ditolak', description: 'Notifikasi saat laporan ditolak sistem' },
                  { key: 'deadline', label: 'Pengingat Deadline', description: 'Pengingat deadline pelaporan' },
                  { key: 'system', label: 'Notifikasi Sistem', description: 'Update sistem dan maintenance' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('notifikasi')}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Konfigurasi Email
              </CardTitle>
              <CardDescription>
                Pengaturan SMTP dan template email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    placeholder="587"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    placeholder="your-email@example.com"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="emailTemplate">Template Email</Label>
                <Select value={emailSettings.emailTemplate} onValueChange={(value) => setEmailSettings({...emailSettings, emailTemplate: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Template Default</SelectItem>
                    <SelectItem value="corporate">Template Corporate</SelectItem>
                    <SelectItem value="minimal">Template Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktifkan Email Notifikasi</Label>
                  <p className="text-sm text-muted-foreground">
                    Kirim notifikasi via email untuk event penting
                  </p>
                </div>
                <Switch
                  checked={emailSettings.enableEmailNotifications}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableEmailNotifications: checked})}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('email')}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Settings */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pengaturan Laporan
              </CardTitle>
              <CardDescription>
                Konfigurasi format dan jadwal laporan otomatis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultExportFormat">Format Export Default</Label>
                  <Select value={reportSettings.defaultExportFormat} onValueChange={(value) => setReportSettings({...reportSettings, defaultExportFormat: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportSchedule">Jadwal Laporan Otomatis</Label>
                  <Select value={reportSettings.reportSchedule} onValueChange={(value) => setReportSettings({...reportSettings, reportSchedule: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="quarterly">Triwulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sertakan Grafik</Label>
                    <p className="text-sm text-muted-foreground">
                      Tambahkan visualisasi data dalam export laporan
                    </p>
                  </div>
                  <Switch
                    checked={reportSettings.includeCharts}
                    onCheckedChange={(checked) => setReportSettings({...reportSettings, includeCharts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Generate Laporan Otomatis</Label>
                    <p className="text-sm text-muted-foreground">
                      Buat laporan secara otomatis sesuai jadwal
                    </p>
                  </div>
                  <Switch
                    checked={reportSettings.autoGenerateReports}
                    onCheckedChange={(checked) => setReportSettings({...reportSettings, autoGenerateReports: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('laporan')}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Pengaturan backup database dan restore sistem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Frekuensi Backup</Label>
                <Select value={systemSettings.backupFrequency} onValueChange={(value) => setSystemSettings({...systemSettings, backupFrequency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Backup Manual</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Buat backup database secara manual kapan saja dibutuhkan
                  </p>
                  <Button onClick={handleBackupNow}>
                    <Download className="mr-2 h-4 w-4" />
                    Backup Sekarang
                  </Button>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Import Konfigurasi</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restore pengaturan dari file backup sebelumnya
                  </p>
                  <div className="flex gap-2">
                    <Input type="file" accept=".json" className="flex-1" />
                    <Button onClick={handleImportConfig}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Informasi Backup Terakhir</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Tanggal: 29 Juli 2024, 14:30 WIB</p>
                  <p>Ukuran: 156 MB</p>
                  <p>Status: Berhasil</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('backup')}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsView;