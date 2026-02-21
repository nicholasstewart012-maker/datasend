import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkEnvVars } from '@/lib/supabase'

const TABLE = 'text_clips'

export async function GET() {
  const envError = checkEnvVars()
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clips: data || [] })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const envError = checkEnvVars()
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 500 })
  }

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
      console.error('DB insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clip: data })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const envError = checkEnvVars()
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 500 })
  }

  try {
    const { id } = await request.json()
    const { error } = await supabase.from(TABLE).delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
