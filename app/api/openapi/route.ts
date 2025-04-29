import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Read the OpenAPI specification from the public directory
    const filePath = path.join(process.cwd(), "public", "openapi.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const openApiSpec = JSON.parse(fileContents)

    return NextResponse.json(openApiSpec, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error serving OpenAPI spec:", error)
    return NextResponse.json({ error: "Failed to load OpenAPI specification" }, { status: 500 })
  }
}
