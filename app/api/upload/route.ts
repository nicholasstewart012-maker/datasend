import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = []

    for (const file of files) {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `uploads/${timestamp}_${safeName}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { data, error } = await supabase.storage
        .from('data-bridge')
        .upload(path, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        results.push({ name: file.name, success: false, error: error.message })
        continue
      }

      const { data: urlData } = supabase.storage
        .from('data-bridge')
        .getPublicUrl(path)

      results.push({
        name: file.name,
        success: true,
        path: data.path,
        url: urlData.publicUrl,
        size: file.size,
      })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
