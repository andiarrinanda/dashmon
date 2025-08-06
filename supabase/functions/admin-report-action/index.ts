import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = "https://vzpyamvunnhlzypzdbpf.supabase.co";
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('🔐 Admin Action: Processing admin report action...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reportId, action, reason, notes } = await req.json();

    if (!reportId || !action) {
      return new Response(
        JSON.stringify({ error: 'Report ID and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔐 Admin Action: ${action} for report ${reportId}`);

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (report.status !== 'pending_approval') {
      return new Response(
        JSON.stringify({ error: 'Report is not in pending approval status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      // Update report status to approved
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) {
        throw new Error(`Failed to approve report: ${updateError.message}`);
      }

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: report.user_id,
          type: 'report_approved',
          title: 'Laporan Disetujui Admin',
          message: `Laporan "${report.file_name}" telah disetujui admin dan akan dilanjutkan ke proses kalkulasi skor.${notes ? ` Catatan: ${notes}` : ''}`,
          related_report_id: reportId
        });

      // Trigger ETL Stage 2 (Score Calculation)
      console.log('🚀 Admin Action: Triggering ETL Stage 2 for score calculation...');
      
      const { error: workerError } = await supabase.functions.invoke('process-report-worker', {
        body: JSON.stringify({ 
          action: 'process_approved_report', 
          reportId: reportId 
        })
      });

      if (workerError) {
        console.error('⚠️ Admin Action: Error triggering ETL Stage 2:', workerError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Report approved and score calculation initiated',
          reportId: reportId
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'reject') {
      if (!reason || reason.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Rejection reason is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update report status to rejected
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', reportId);

      if (updateError) {
        throw new Error(`Failed to reject report: ${updateError.message}`);
      }

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: report.user_id,
          type: 'report_rejected',
          title: 'Laporan Ditolak Admin',
          message: `Laporan "${report.file_name}" ditolak oleh admin. Alasan: ${reason}`,
          related_report_id: reportId
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Report rejected',
          reportId: reportId
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "approve" or "reject"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('💥 Admin Action: Processing error:', error);
    return new Response(
      JSON.stringify({ error: `Processing failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});