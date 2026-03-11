import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase not configured');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
      return NextResponse.json(
        { error: 'At least one entry is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabase();
    
    // Generate a batch ID for this submission group
    const batchId = crypto.randomUUID();
    
    // Map entries to database format
    const submissions = data.entries.map(entry => ({
      first_name: entry.firstName,
      middle_name: entry.middleName || null,
      last_name: entry.lastName,
      address: entry.address,
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
      ssn_last_four: entry.ssn,
      tda_no: entry.tdaNo,
      screenshot_form: entry.screenshotForm || null,
      screenshot_confirmation: entry.screenshotConfirmation || null,
      batch_id: batchId,
      status: 'pending'
    }));
    
    const { data: result, error } = await supabase
      .from('spc_submissions')
      .insert(submissions)
      .select();
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save submission', details: error.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ SPC batch saved: ${result.length} entries with batch ID ${batchId}`);
    
    return NextResponse.json({
      success: true,
      message: `${result.length} SPC form(s) submitted successfully`,
      batchId: batchId,
      count: result.length
    });
    
  } catch (error) {
    console.error('❌ Submit SPC error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('spc_submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('❌ Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      count: data.length,
      submissions: data
    });
    
  } catch (error) {
    console.error('❌ Fetch SPC submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
