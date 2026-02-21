import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkEnvVars } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const envError = checkEnvVars()
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 500 })
  }

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
        // Provide a helpful message for the 405 bucket policy issue
        const msg = error.message?.includes('405') || (error as any).status === 405
          ? 'Bucket upload blocked (405). Check that your "data-bridge" bucket exists in Supabase Storage and has the correct RLS policy (see README).'
          : error.message
        results.push({ name: file.name, success: false, error: msg })
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
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
