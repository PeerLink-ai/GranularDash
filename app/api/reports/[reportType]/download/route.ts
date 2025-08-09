import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/sign"
import { sql } from "@/lib/db"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

async function tableExists(name: string) {
  try {
    const rows: any[] = await sql`SELECT to_regclass(${"public." + name}) AS exists`
    return rows?.[0]?.exists !== null
  } catch {
    return false
  }
}

export async function GET(req: Request, { params }: { params: { reportType: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || ""
    const token = searchParams.get("token") || ""
    const { valid, payload } = verifyToken(token)
    if (!valid || !payload || payload.id !== id || payload.type !== params.reportType) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 })
    }

    // Try to load from DB if reports table exists; otherwise fallback content
    let title = `${params.reportType.toUpperCase()} Report`
    let createdAt = new Date()
    let content = `This is a ${params.reportType.toUpperCase()} compliance report.\n\nReport ID: ${id}`

    if (await tableExists("reports")) {
      const rows: any[] = await sql`SELECT id, title, content, created_at FROM reports WHERE id = ${id}`
      if (rows.length) {
        title = rows[0].title || title
        content = rows[0].content || content
        createdAt = rows[0].created_at ? new Date(rows[0].created_at) : createdAt
      }
    }

    // Build real PDF
    const pdfDoc = await PDFDocument.create()
    pdfDoc.setTitle(title)
    pdfDoc.setCreationDate(createdAt)
    const page = pdfDoc.addPage([612, 792]) // Letter
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Header
    page.drawText(title, { x: 48, y: height - 64, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
    page.drawText(`Generated: ${createdAt.toLocaleString()}`, {
      x: 48,
      y: height - 84,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    })
    page.drawLine({
      start: { x: 48, y: height - 92 },
      end: { x: width - 48, y: height - 92 },
      color: rgb(0.8, 0.8, 0.8),
    })

    // Body content (simple wrap)
    const lines = content.split("\n")
    let cursorY = height - 120
    const lineHeight = 14
    for (const line of lines) {
      const words = line.split(" ")
      let current = ""
      for (const w of words) {
        const trial = current ? current + " " + w : w
        const tw = font.widthOfTextAtSize(trial, 11)
        if (tw > width - 96) {
          page.drawText(current, { x: 48, y: cursorY, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
          cursorY -= lineHeight
          current = w
        } else {
          current = trial
        }
      }
      page.drawText(current, { x: 48, y: cursorY, size: 11, font, color: rgb(0.1, 0.1, 0.1) })
      cursorY -= lineHeight
    }

    const bytes = await pdfDoc.save()
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${params.reportType}-report-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Download report error:", error)
    return NextResponse.json({ error: "Failed to download report" }, { status: 500 })
  }
}
