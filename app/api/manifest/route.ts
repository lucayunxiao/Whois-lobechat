import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Read the manifest from the public directory
    const filePath = path.join(process.cwd(), "public", "manifest.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const manifest = JSON.parse(fileContents)

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error serving manifest:", error)
    return NextResponse.json({ error: "Failed to load manifest" }, { status: 500 })
  }
}
