import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Plus, Edit, Trash2, Target, Calculator, Percent, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KPIDefinition {
  id: string;
  name: string;
  code: string;
  description?: string;
  target_value: number;
  weight_percentage: number;
  unit?: string;
  calculation_type: 'count' | 'sum' | 'percentage';
  is_active: boolean;
}

interface ScoringRange {
  id: string;
  kpi_id: string;
  min_percentage: number;
  max_percentage: number;
  score_value: number;
}

const KPIManagement = () => {
  const [kpis, setKpis] = useState<KPIDefinition[]>([]);
  const [scoringRanges, setScoringRanges] = useState<ScoringRange[]>([]);
  const [selectedKPI, setSelectedKPI] = useState<KPIDefinition | null>(null);
  const [isAddKPIOpen, setIsAddKPIOpen] = useState(false);
  const [isEditKPIOpen, setIsEditKPIOpen] = useState(false);
  const [isEditRangesOpen, setIsEditRangesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newKPI, setNewKPI] = useState({
    name: '',
    code: '',
    description: '',
    target_value: 0,
    weight_percentage: 0,
    unit: '',
    calculation_type: 'count' as 'count' | 'sum' | 'percentage'
  });

  useEffect(() => {
    fetchKPIs();
    fetchScoringRanges();
  }, []);

  const fetchKPIs = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_definitions')
        .select('*')
        .order('name');

      if (error) throw error;
      setKpis((data || []) as KPIDefinition[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data KPI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScoringRanges = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_scoring_ranges')
        .select('*')
        .order('kpi_id, min_percentage');

      if (error) throw error;
      setScoringRanges(data || []);
    } catch (error) {
      console.error('Error fetching scoring ranges:', error);
    }
  };

  const handleAddKPI = async () => {
    try {
      const { error } = await supabase
        .from('kpi_definitions')
        .insert([newKPI]);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "KPI baru berhasil ditambahkan",
      });

      setIsAddKPIOpen(false);
      setNewKPI({
        name: '',
        code: '',
        description: '',
        target_value: 0,
        weight_percentage: 0,
        unit: '',
        calculation_type: 'count'
      });
      fetchKPIs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan KPI baru",
        variant: "destructive",
      });
    }
  };

  const handleUpdateKPI = async () => {
    if (!selectedKPI) return;

    try {
      const { error } = await supabase
        .from('kpi_definitions')
        .update({
          name: selectedKPI.name,
          description: selectedKPI.description,
          target_value: selectedKPI.target_value,
          weight_percentage: selectedKPI.weight_percentage,
          unit: selectedKPI.unit,
          calculation_type: selectedKPI.calculation_type,
          is_active: selectedKPI.is_active
        })
        .eq('id', selectedKPI.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "KPI berhasil diperbarui",
      });

      setIsEditKPIOpen(false);
      fetchKPIs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui KPI",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKPI = async (id: string) => {
    try {
      const { error } = await supabase
        .from('kpi_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "KPI berhasil dihapus",
      });

      fetchKPIs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus KPI",
        variant: "destructive",
      });
    }
  };

  const getKPIScoringRanges = (kpiId: string) => {
    return scoringRanges.filter(range => range.kpi_id === kpiId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data KPI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manajemen KPI</h1>
          <p className="text-muted-foreground">
            Atur target, bobot, dan aturan scoring untuk setiap indikator kinerja
          </p>
        </div>
        
        <Dialog open={isAddKPIOpen} onOpenChange={setIsAddKPIOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah KPI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah KPI Baru</DialogTitle>
              <DialogDescription>
                Buat definisi KPI baru dengan target dan bobot yang sesuai
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama KPI</Label>
                <Input
                  id="name"
                  value={newKPI.name}
                  onChange={(e) => setNewKPI({...newKPI, name: e.target.value})}
                  placeholder="Contoh: Produksi Siaran Pers"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Kode KPI</Label>
                <Input
                  id="code"
                  value={newKPI.code}
                  onChange={(e) => setNewKPI({...newKPI, code: e.target.value.toUpperCase()})}
                  placeholder="Contoh: SIARAN_PERS"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={newKPI.description}
                  onChange={(e) => setNewKPI({...newKPI, description: e.target.value})}
                  placeholder="Deskripsi detail tentang KPI ini"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    value={newKPI.target_value}
                    onChange={(e) => setNewKPI({...newKPI, target_value: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Bobot (%)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="100"
                    value={newKPI.weight_percentage}
                    onChange={(e) => setNewKPI({...newKPI, weight_percentage: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    id="unit"
                    value={newKPI.unit}
                    onChange={(e) => setNewKPI({...newKPI, unit: e.target.value})}
                    placeholder="dokumen, konten, poin"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="calculation">Tipe Kalkulasi</Label>
                  <Select value={newKPI.calculation_type} onValueChange={(value: any) => setNewKPI({...newKPI, calculation_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Hitung (Count)</SelectItem>
                      <SelectItem value="sum">Jumlah (Sum)</SelectItem>
                      <SelectItem value="percentage">Persentase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddKPIOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddKPI}>
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview KPI</TabsTrigger>
          <TabsTrigger value="scoring">Aturan Scoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total KPI</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.length}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.filter(kpi => kpi.is_active).length} aktif
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bobot</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.reduce((sum, kpi) => sum + kpi.weight_percentage, 0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 100%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aturan Scoring</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scoringRanges.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total rentang nilai
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar KPI</CardTitle>
              <CardDescription>
                Kelola definisi dan konfigurasi KPI yang digunakan dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama KPI</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Bobot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((kpi) => (
                    <TableRow key={kpi.id}>
                      <TableCell className="font-medium">{kpi.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{kpi.code}</Badge>
                      </TableCell>
                      <TableCell>{kpi.target_value.toLocaleString()} {kpi.unit}</TableCell>
                      <TableCell>{kpi.weight_percentage}%</TableCell>
                      <TableCell>
                        <Badge variant={kpi.is_active ? "default" : "secondary"}>
                          {kpi.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKPI(kpi);
                              setIsEditKPIOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus KPI</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Yakin ingin menghapus KPI "{kpi.name}"? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteKPI(kpi.id)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Rules Tab */}
        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aturan Scoring KPI</CardTitle>
              <CardDescription>
                Tabel konversi persentase pencapaian menjadi nilai skor untuk setiap KPI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kpis.map((kpi) => {
                const ranges = getKPIScoringRanges(kpi.id);
                return (
                  <div key={kpi.id} className="mb-6 p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-medium">{kpi.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Target: {kpi.target_value.toLocaleString()} {kpi.unit} | Bobot: {kpi.weight_percentage}%
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-3 w-3" />
                        Edit Rentang
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rentang Pencapaian</TableHead>
                          <TableHead>Nilai Skor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ranges.map((range) => (
                          <TableRow key={range.id}>
                            <TableCell>
                              {range.min_percentage}% - {range.max_percentage > 100 ? '≥100%' : `${range.max_percentage}%`}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{range.score_value}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {ranges.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              Belum ada aturan scoring
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit KPI Dialog */}
      <Dialog open={isEditKPIOpen} onOpenChange={setIsEditKPIOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit KPI</DialogTitle>
            <DialogDescription>
              Perbarui konfigurasi KPI yang dipilih
            </DialogDescription>
          </DialogHeader>
          
          {selectedKPI && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama KPI</Label>
                <Input
                  id="edit-name"
                  value={selectedKPI.name}
                  onChange={(e) => setSelectedKPI({...selectedKPI, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  value={selectedKPI.description || ''}
                  onChange={(e) => setSelectedKPI({...selectedKPI, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-target">Target</Label>
                  <Input
                    id="edit-target"
                    type="number"
                    value={selectedKPI.target_value}
                    onChange={(e) => setSelectedKPI({...selectedKPI, target_value: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Bobot (%)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedKPI.weight_percentage}
                    onChange={(e) => setSelectedKPI({...selectedKPI, weight_percentage: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Satuan</Label>
                  <Input
                    id="edit-unit"
                    value={selectedKPI.unit || ''}
                    onChange={(e) => setSelectedKPI({...selectedKPI, unit: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-calculation">Tipe Kalkulasi</Label>
                  <Select 
                    value={selectedKPI.calculation_type} 
                    onValueChange={(value: any) => setSelectedKPI({...selectedKPI, calculation_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Hitung (Count)</SelectItem>
                      <SelectItem value="sum">Jumlah (Sum)</SelectItem>
                      <SelectItem value="percentage">Persentase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditKPIOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateKPI}>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KPIManagement;