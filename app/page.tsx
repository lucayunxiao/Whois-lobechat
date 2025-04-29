"use client"

import { useState } from "react"
import { LookupForm } from "@/components/ip-lookup-form"
import { WhoisResults } from "@/components/whois-results"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function Home() {
  const [whoisData, setWhoisData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lookupType, setLookupType] = useState<"ip" | "domain">("ip")

  const handleLookup = async (query: string, type: "ip" | "domain") => {
    setLoading(true)
    setError("")
    setLookupType(type)
    setWhoisData(null)

    try {
      console.log(`Looking up ${type}: ${query}`)

      const response = await fetch(`/api/whois?query=${encodeURIComponent(query)}&type=${type}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || `Failed to fetch ${type} data (Status: ${response.status})`)
      }

      console.log(`Lookup successful:`, data)
      setWhoisData(data)
    } catch (err) {
      console.error("Lookup error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>LobeChat WHOIS Plugin</CardTitle>
          <CardDescription>Enter an IP address or domain name to retrieve WHOIS information</CardDescription>
        </CardHeader>
        <CardContent>
          <LookupForm onSubmit={handleLookup} isLoading={loading} />

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {whoisData && <WhoisResults data={whoisData} type={lookupType} />}
        </CardContent>
      </Card>
    </main>
  )
}
