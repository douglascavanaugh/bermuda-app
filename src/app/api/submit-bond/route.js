import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
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
    if (!data.clientFullName || !data.courtCaseNumber) {
      return NextResponse.json(
        { error: 'Client name and court case number are required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabase();
    
    // Map camelCase form data to snake_case database columns
    const submission = {
      client_full_name: data.clientFullName,
      date_bond_executed: data.dateBondExecuted || null,
      court_case_number: data.courtCaseNumber,
      past_convictions_case_numbers: data.pastConvictionsCaseNumbers || null,
      birth_certificate_number: data.birthCertificateNumber || null,
      state_of_birth: data.stateOfBirth || null,
      date_of_birth: data.dateOfBirth || null,
      ucc_trust_number: data.uccTrustNumber || null,
      social_security_number: data.socialSecurityNumber || null,
      ssn_back_number: data.ssnBackNumber || null,
      third_party_name: data.thirdPartyName || null,
      third_party_address: data.thirdPartyAddress || null,
      third_party_city: data.thirdPartyCity || null,
      third_party_state: data.thirdPartyState || null,
      third_party_zip: data.thirdPartyZip || null,
      third_party_county: data.thirdPartyCounty || null,
      prison_number: data.prisonNumber || null,
      prison_name: data.prisonName || null,
      prison_address: data.prisonAddress || null,
      trial_court_name: data.trialCourtName || null,
      trial_court_type: data.trialCourtType || null,
      court_address: data.courtAddress || null,
      court_city: data.courtCity || null,
      court_state: data.courtState || null,
      court_zip: data.courtZip || null,
      amount_owed: data.amountOwed || null,
      status: 'pending'
    };
    
    const { data: result, error } = await supabase
      .from('bond_submissions')
      .insert(submission)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save submission', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Bond submission saved:', result.id);
    
    return NextResponse.json({
      success: true,
      message: 'Submission received successfully',
      id: result.id,
      clientName: data.clientFullName
    });
    
  } catch (error) {
    console.error('❌ Submit bond error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending submissions (for local processor)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('bond_submissions')
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
    console.error('❌ Fetch submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
