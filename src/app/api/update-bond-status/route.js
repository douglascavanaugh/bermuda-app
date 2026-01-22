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
    const { id, status, errorMessage } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabase();
    
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString();
      updateData.pdf_generated = true;
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    const { data, error } = await supabase
      .from('bond_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Update status error:', error);
      return NextResponse.json(
        { error: 'Failed to update status', details: error.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ Updated ${id} to ${status}`);
    
    return NextResponse.json({
      success: true,
      id: data.id,
      status: data.status
    });
    
  } catch (error) {
    console.error('❌ Update bond status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
