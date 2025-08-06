import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = "https://vzpyamvunnhlzypzdbpf.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration for "Skoring Publikasi Media Massa" indicator
const MEDIA_SCORING_CONFIG = {
  requiredColumns: [
    { name: 'Link Media Sosial', aliases: ['Link Media Sosial', 'Media Sosial', 'Social Media Link', 'Link Medsos'] },
    { name: 'Link Media Online', aliases: ['Link Media Online', 'Media Online', 'Online Media Link'] },
    { name: 'Monitoring Radio', aliases: ['Monitoring Radio', 'Radio', 'Radio Monitoring'] },
    { name: 'Monitoring Media cetak', aliases: ['Monitoring Media cetak', 'Media Cetak', 'Print Media', 'Monitoring Media Cetak'] },
    { name: 'Monitoring Running Text', aliases: ['Monitoring Running Text', 'Running Text', 'Text Running'] },
    { name: 'Monitoring Siaran TV', aliases: ['Monitoring Siaran TV', 'Siaran TV', 'TV Broadcasting', 'TV Monitoring'] }
  ],
  minRequiredColumns: 1 // At least one media link column must be present
};

// Helper function to find column mapping with aliases
function findColumnMapping(headers: string[], columnConfig: any) {
  const mapping: { [key: string]: string } = {};
  const normalizedHeaders = headers.map(h => h.trim());
  
  for (const config of columnConfig.requiredColumns) {
    let found = false;
    for (const alias of config.aliases) {
      const foundHeader = normalizedHeaders.find(h => 
        h.toLowerCase() === alias.toLowerCase()
      );
      if (foundHeader) {
        mapping[config.name] = foundHeader;
        found = true;
        break;
      }
    }
    if (!found) {
      // Try partial match
      for (const alias of config.aliases) {
        const foundHeader = normalizedHeaders.find(h => 
          h.toLowerCase().includes(alias.toLowerCase()) || 
          alias.toLowerCase().includes(h.toLowerCase())
        );
        if (foundHeader) {
          mapping[config.name] = foundHeader;
          found = true;
          break;
        }
      }
    }
  }
  
  return mapping;
}

// ETL Stage 1: Extract and Transform (System Validation)
function extractExcelData(rawData: any) {
  console.log('📊 ETL Stage 1: Extracting Excel data...');
  
  if (!rawData || !Array.isArray(rawData) || rawData.length < 2) {
    throw new Error('Invalid or empty raw data format. File must contain a header and at least one row of data.');
  }

  const headers = rawData[0];
  if (!Array.isArray(headers) || headers.length === 0) {
    throw new Error('Invalid headers format or empty headers row');
  }
  
  const dataRows = rawData.slice(1);
  
  // Find column mapping for media scoring
  const columnMapping = findColumnMapping(headers, MEDIA_SCORING_CONFIG);
  const foundColumns = Object.keys(columnMapping);
  
  console.log('📋 ETL Stage 1: Column mapping found:', columnMapping);
  console.log('📋 ETL Stage 1: Available headers:', headers.map(h => h.trim()));
  
  // Check if minimum required columns are met
  if (foundColumns.length < MEDIA_SCORING_CONFIG.minRequiredColumns) {
    const expectedColumns = MEDIA_SCORING_CONFIG.requiredColumns.map(col => col.name).join(', ');
    const availableHeaders = headers.map(h => h.trim()).join(', ');
    throw new Error(`Insufficient columns for "Skoring Publikasi Media Massa". Expected at least ${MEDIA_SCORING_CONFIG.minRequiredColumns} from: ${expectedColumns}. Available headers: ${availableHeaders}`);
  }
  
  return dataRows.map((row: any[], index: number) => {
    const rowData: any = {};
    
    // Use mapping to fill data
    Object.entries(columnMapping).forEach(([standardName, actualHeader]) => {
      const colIndex = headers.findIndex((h: string) => h.trim() === actualHeader);
      if (colIndex !== -1) {
        rowData[standardName] = row[colIndex];
      }
    });
    
    // Add other unmapped columns
    headers.forEach((header: string, colIndex: number) => {
      const trimmedHeader = header.trim();
      if (!Object.values(columnMapping).includes(trimmedHeader)) {
        rowData[trimmedHeader] = row[colIndex];
      }
    });
    
    rowData._rowIndex = index + 2;
    return rowData;
  });
}

function transformData(extractedData: any[]) {
  console.log('🔄 ETL Stage 1: Transforming data...');
  
  return extractedData.map((row: any) => {
    // Extract all links from relevant columns
    const mediaLinks = [
      row['Link Media Sosial'],
      row['Link Media Online'],
      row['Monitoring Radio'],
      row['Monitoring Media cetak'],
      row['Monitoring Running Text'],
      row['Monitoring Siaran TV'],
    ].filter(link => link && link.toString().trim() !== '');
    
    // Validate link formats
    const validLinks = mediaLinks.filter(link => {
      const linkStr = link.toString().toLowerCase();
      return linkStr.includes('sharepoint.com') || 
             linkStr.includes('drive.google.com') ||
             linkStr.includes('dropbox.com') ||
             linkStr.includes('onedrive.live.com') ||
             linkStr.startsWith('http') ||
             linkStr.startsWith('https');
    });
    
    const isValid = validLinks.length > 0;
    
    return {
      linkMediaSosial: row['Link Media Sosial'] || '',
      linkMediaOnline: row['Link Media Online'] || '',
      monitoringRadio: row['Monitoring Radio'] || '',
      monitoringMediaCetak: row['Monitoring Media cetak'] || '',
      monitoringRunningText: row['Monitoring Running Text'] || '',
      monitoringSiaranTV: row['Monitoring Siaran TV'] || '',
      allMediaLinks: mediaLinks,
      validLinks: validLinks,
      rowIndex: row._rowIndex,
      isValid: isValid,
      validationErrors: isValid ? [] : ['No valid media links found'],
      // Additional data from other columns
      additionalData: Object.keys(row)
        .filter(key => !['Link Media Sosial', 'Link Media Online', 'Monitoring Radio', 'Monitoring Media cetak', 'Monitoring Running Text', 'Monitoring Siaran TV', '_rowIndex'].includes(key))
        .reduce((acc, key) => {
          acc[key] = row[key];
          return acc;
        }, {} as any)
    };
  });
}

async function generateVideoHashes(transformedData: any[]) {
  console.log('🔐 ETL Stage 1: Generating video hashes...');
  
  return transformedData.map((item: any) => {
    const allLinks = item.allMediaLinks || [];
    
    if (allLinks.length > 0) {
      // Generate hash for each link
      const hashes = allLinks
        .filter((link: any) => link && link.toString().trim() !== '')
        .map((link: any) => {
          const linkStr = link.toString();
          // Generate hash based on URL (mock implementation)
          const encoder = new TextEncoder();
          const data = encoder.encode(linkStr);
          return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          });
        });
      
      return Promise.all(hashes).then(resolvedHashes => ({
        ...item,
        videoHashes: resolvedHashes
      }));
    }
    
    return Promise.resolve({
      ...item,
      videoHashes: []
    });
  });
}

async function checkDuplicates(processedData: any[], currentReportId: string) {
  console.log('🔍 ETL Stage 1: Checking for duplicates...');
  
  // Collect all hashes from processed data
  const allHashes: string[] = [];
  processedData.forEach(item => {
    if (item.videoHashes && Array.isArray(item.videoHashes)) {
      allHashes.push(...item.videoHashes);
    }
  });
  
  if (allHashes.length === 0) {
    return { hasDuplicates: false, duplicates: [] };
  }
  
  const { data: existingReports, error } = await supabase
    .from('reports')
    .select('id, file_name, video_hashes')
    .neq('id', currentReportId)
    .not('video_hashes', 'is', null);
  
  if (error) {
    console.error('❌ ETL Stage 1: Error checking duplicates:', error);
    throw new Error('Failed to check duplicates');
  }
  
  const duplicates: any[] = [];
  
  for (const report of existingReports || []) {
    const existingHashes = report.video_hashes || [];
    const commonHashes = allHashes.filter(hash => 
      existingHashes.includes(hash)
    );
    
    if (commonHashes.length > 0) {
      duplicates.push({
        reportId: report.id,
        fileName: report.file_name,
        duplicateHashes: commonHashes
      });
    }
  }
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
}

// ETL Stage 2: Score Calculation (After Admin Approval)
async function calculateScore(processedData: any[]) {
  console.log('🧮 ETL Stage 2: Calculating score...');
  
  // Get KPI definition for media scoring
  const { data: kpiDef, error: kpiError } = await supabase
    .from('kpi_definitions')
    .select('*')
    .eq('code', 'SKORING_PUBLIKASI_MEDIA')
    .single();

  if (kpiError || !kpiDef) {
    throw new Error('KPI definition for "Skoring Publikasi Media Massa" not found');
  }

  // Get scoring ranges
  const { data: scoringRanges, error: rangesError } = await supabase
    .from('kpi_scoring_ranges')
    .select('*')
    .eq('kpi_id', kpiDef.id)
    .order('min_percentage');

  if (rangesError) {
    throw new Error('Failed to get scoring ranges');
  }

  // Calculate total valid links
  let totalValidLinks = 0;
  let totalRows = processedData.length;
  let validRows = 0;

  processedData.forEach(item => {
    if (item.isValid && item.validLinks && item.validLinks.length > 0) {
      totalValidLinks += item.validLinks.length;
      validRows++;
    }
  });

  // Calculate achievement percentage
  // Based on brainstorm.xlsx: target is to have valid links in all rows
  const achievementPercentage = totalRows > 0 ? (validRows / totalRows) * 100 : 0;
  
  console.log(`🧮 ETL Stage 2: Achievement - ${validRows}/${totalRows} rows (${achievementPercentage.toFixed(1)}%), ${totalValidLinks} total valid links`);

  // Find appropriate score based on achievement percentage
  let finalScore = 0;
  for (const range of scoringRanges || []) {
    if (achievementPercentage >= range.min_percentage && achievementPercentage <= range.max_percentage) {
      finalScore = range.score_value;
      break;
    }
  }

  // If no range matches, use default scoring
  if (finalScore === 0 && achievementPercentage > 0) {
    finalScore = Math.min(5, Math.max(1, Math.ceil(achievementPercentage / 20)));
  }

  return {
    finalScore,
    achievementPercentage,
    totalValidLinks,
    validRows,
    totalRows,
    scoringDetails: {
      kpiTarget: kpiDef.target_value,
      kpiWeight: kpiDef.weight_percentage,
      appliedRange: scoringRanges?.find(r => 
        achievementPercentage >= r.min_percentage && achievementPercentage <= r.max_percentage
      )
    }
  };
}

async function createNotification(userId: string, type: string, title: string, message: string, reportId?: string) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      related_report_id: reportId
    });
  
  if (error) {
    console.error('⚠️ Worker: Error creating notification:', error);
  }
}

async function processQueuedReports() {
  console.log('🔄 Worker: Processing queued reports...');
  
  const { data: queuedReports, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(5);
  
  if (fetchError) {
    console.error('❌ Worker: Error fetching queued reports:', fetchError);
    return;
  }
  
  if (!queuedReports || queuedReports.length === 0) {
    console.log('ℹ️ Worker: No queued reports found');
    return;
  }
  
  console.log(`📋 Worker: Found ${queuedReports.length} reports to process`);
  
  for (const report of queuedReports) {
    await processReportStage1(report.id);
  }
}

async function processReportStage1(reportId: string) {
  console.log(`🚀 ETL Stage 1: Processing report ${reportId}`);
  
  try {
    // Update status to processing
    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'processing' })
      .eq('id', reportId);
    
    if (updateError) {
      console.error('❌ ETL Stage 1: Error updating report status:', updateError);
      return;
    }
    
    // Get report data
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    
    if (fetchError || !report) {
      console.error('❌ ETL Stage 1: Error fetching report:', fetchError);
      return;
    }
    
    // Send processing notification to user
    await createNotification(
      report.user_id,
      'report_processing',
      'Laporan Sedang Diproses',
      `Laporan "${report.file_name}" sedang divalidasi oleh sistem.`,
      reportId
    );
    
    // Extract and transform data
    const extractedData = extractExcelData(report.raw_data);
    const transformedData = transformData(extractedData);
    const processedDataWithHashes = await Promise.all(await generateVideoHashes(transformedData));
    
    // Check for duplicates
    const duplicateCheck = await checkDuplicates(processedDataWithHashes, reportId);
    
    if (duplicateCheck.hasDuplicates) {
      const duplicateInfo = duplicateCheck.duplicates.map(d => `${d.fileName} (${d.reportId})`).join(', ');
      
      await supabase
        .from('reports')
        .update({
          status: 'system_rejected',
          rejection_reason: `Duplicate videos found in existing reports: ${duplicateInfo}`
        })
        .eq('id', reportId);
      
      await createNotification(
        report.user_id,
        'report_error',
        'Laporan Ditolak - Video Duplikat',
        `Laporan "${report.file_name}" ditolak karena mengandung video yang sudah pernah digunakan dalam laporan: ${duplicateInfo}`,
        reportId
      );
      
      return;
    }
    
    // Calculate validation statistics
    const validRows = processedDataWithHashes.filter(item => item.isValid).length;
    const totalRows = processedDataWithHashes.length;
    
    // Collect all video hashes for storage
    const allVideoHashes: string[] = [];
    processedDataWithHashes.forEach(item => {
      if (item.videoHashes && Array.isArray(item.videoHashes)) {
        allVideoHashes.push(...item.videoHashes);
      }
    });
    
    // Update report with processed data - READY FOR ADMIN REVIEW
    const { error: finalUpdateError } = await supabase
      .from('reports')
      .update({
        status: 'pending_approval', // Wait for admin approval before score calculation
        processed_data: processedDataWithHashes,
        video_hashes: allVideoHashes,
        video_links: processedDataWithHashes.flatMap(item => item.allMediaLinks || [])
      })
      .eq('id', reportId);
    
    if (finalUpdateError) {
      throw new Error(`Failed to update report: ${finalUpdateError.message}`);
    }
    
    // Send notifications
    await createNotification(
      report.user_id,
      'report_completed',
      'Laporan Berhasil Divalidasi',
      `Laporan "${report.file_name}" telah berhasil divalidasi sistem (${validRows}/${totalRows} baris valid) dan menunggu persetujuan admin.`,
      reportId
    );
    
    // Notify admin about new report pending approval
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    
    if (!adminError && adminUsers) {
      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          'report_submitted',
          'Laporan Baru Menunggu Approval',
          `Laporan "${report.file_name}" dari ${report.user_id} telah divalidasi sistem dan menunggu persetujuan Anda.`,
          reportId
        );
      }
    }
    
    console.log(`✅ ETL Stage 1: Successfully processed report ${reportId} - awaiting admin approval`);
    
  } catch (error: any) {
    console.error(`💥 ETL Stage 1: Error processing report ${reportId}:`, error);
    
    await supabase
      .from('reports')
      .update({
        status: 'failed',
        rejection_reason: `ETL Stage 1 error: ${error.message}`
      })
      .eq('id', reportId);
    
    const { data: report } = await supabase
      .from('reports')
      .select('user_id, file_name')
      .eq('id', reportId)
      .single();
    
    if (report) {
      await createNotification(
        report.user_id,
        'report_error',
        'Gagal Memproses Laporan',
        `Terjadi kesalahan saat memvalidasi laporan "${report.file_name}": ${error.message}`,
        reportId
      );
    }
  }
}

async function processReportStage2(reportId: string) {
  console.log(`🧮 ETL Stage 2: Calculating score for report ${reportId}`);
  
  try {
    // Get approved report data
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('status', 'approved')
      .single();
    
    if (fetchError || !report) {
      console.error('❌ ETL Stage 2: Error fetching approved report:', fetchError);
      return;
    }
    
    // Send processing notification to user
    await createNotification(
      report.user_id,
      'report_processing',
      'Menghitung Skor Laporan',
      `Laporan "${report.file_name}" sedang dihitung skornya berdasarkan aturan KPI.`,
      reportId
    );
    
    // Calculate score using processed data
    const scoreResult = await calculateScore(report.processed_data || []);
    
    // Update report with final score
    const { error: scoreUpdateError } = await supabase
      .from('reports')
      .update({
        status: 'completed',
        calculated_score: scoreResult.finalScore
      })
      .eq('id', reportId);
    
    if (scoreUpdateError) {
      throw new Error(`Failed to update report score: ${scoreUpdateError.message}`);
    }
    
    // Send completion notification to user
    await createNotification(
      report.user_id,
      'report_completed',
      'Laporan Selesai Diproses',
      `Laporan "${report.file_name}" telah selesai diproses. Skor akhir: ${scoreResult.finalScore} poin (${scoreResult.achievementPercentage.toFixed(1)}% pencapaian).`,
      reportId
    );
    
    console.log(`✅ ETL Stage 2: Successfully calculated score for report ${reportId}: ${scoreResult.finalScore} points`);
    
  } catch (error: any) {
    console.error(`💥 ETL Stage 2: Error calculating score for report ${reportId}:`, error);
    
    await supabase
      .from('reports')
      .update({
        status: 'failed',
        rejection_reason: `ETL Stage 2 error: ${error.message}`
      })
      .eq('id', reportId);
    
    const { data: report } = await supabase
      .from('reports')
      .select('user_id, file_name')
      .eq('id', reportId)
      .single();
    
    if (report) {
      await createNotification(
        report.user_id,
        'report_error',
        'Gagal Menghitung Skor',
        `Terjadi kesalahan saat menghitung skor laporan "${report.file_name}": ${error.message}`,
        reportId
      );
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, reportId } = await req.json();
    
    console.log(`🔄 Worker: Called with action: ${action}, reportId: ${reportId}`);
    
    if (action === 'process_queued_reports') {
      await processQueuedReports();
      return new Response(
        JSON.stringify({ success: true, message: 'Queued reports processed (Stage 1)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'process_report' && reportId) {
      await processReportStage1(reportId);
      return new Response(
        JSON.stringify({ success: true, message: 'Report processed (Stage 1)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'process_approved_report' && reportId) {
      await processReportStage2(reportId);
      return new Response(
        JSON.stringify({ success: true, message: 'Report score calculated (Stage 2)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action or missing reportId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('💥 Worker: Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});