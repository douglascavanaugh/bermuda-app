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

export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Get all submissions ordered by created_at descending
    // Then we'll dedupe by client name on the server side
    const { data, error } = await supabase
      .from('bond_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients', details: error.message },
        { status: 500 }
      );
    }
    
    // Dedupe: keep only the latest submission per client name
    const clientMap = new Map();
    for (const submission of data) {
      const name = submission.client_full_name;
      if (!clientMap.has(name)) {
        clientMap.set(name, submission);
      }
    }
    
    // Convert to array and sort alphabetically by name
    const uniqueClients = Array.from(clientMap.values())
      .sort((a, b) => a.client_full_name.localeCompare(b.client_full_name));
    
    return NextResponse.json({
      success: true,
      count: uniqueClients.length,
      clients: uniqueClients
    });
    
  } catch (error) {
    console.error('❌ Get clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
