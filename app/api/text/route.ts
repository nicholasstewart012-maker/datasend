import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TABLE = 'text_clips'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clips: data || [] })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, label } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ content, label: label || null }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clip: data })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const { error } = await supabase.from(TABLE).delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
