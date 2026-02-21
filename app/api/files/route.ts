import { NextResponse } from 'next/server'
import { supabase, checkEnvVars } from '@/lib/supabase'

export async function GET() {
  const envError = checkEnvVars()
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 500 })
  }

  try {
    const { data, error } = await supabase.storage
      .from('data-bridge')
      .list('uploads', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      console.error('Storage list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const filesWithUrls = (data || []).map((file) => {
      const { data: urlData } = supabase.storage
        .from('data-bridge')
        .getPublicUrl(`uploads/${file.name}`)

      const originalName = file.name.replace(/^\d+_/, '')

      return {
        id: file.id,
        name: originalName,
        storedName: file.name,
        size: file.metadata?.size || 0,
        createdAt: file.created_at,
        url: urlData.publicUrl,
      }
    })

    return NextResponse.json({ files: filesWithUrls })
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
    const { storedName } = await request.json()
    const { error } = await supabase.storage
      .from('data-bridge')
      .remove([`uploads/${storedName}`])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
