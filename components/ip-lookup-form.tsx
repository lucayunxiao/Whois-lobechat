"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

// Rename the component and update props
interface LookupFormProps {
  onSubmit: (query: string, type: "ip" | "domain") => void
  isLoading: boolean
}

export function LookupForm({ onSubmit, isLoading }: LookupFormProps) {
  const [query, setQuery] = useState("")
  const [lookupType, setLookupType] = useState<"ip" | "domain">("ip")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSubmit(query.trim(), lookupType)
    }
  }

  // Helper function to detect if input is likely an IP address
  const detectInputType = (input: string) => {
    // Simple IP regex pattern
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipPattern.test(input)) {
      setLookupType("ip")
    } else if (input.includes(".")) {
      setLookupType("domain")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="ip-lookup"
            name="lookup-type"
            checked={lookupType === "ip"}
            onChange={() => setLookupType("ip")}
            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
          />
          <label htmlFor="ip-lookup" className="text-sm font-medium">
            IP Address
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="domain-lookup"
            name="lookup-type"
            checked={lookupType === "domain"}
            onChange={() => setLookupType("domain")}
            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
          />
          <label htmlFor="domain-lookup" className="text-sm font-medium">
            Domain Name
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
        <Input
          type="text"
          placeholder={
            lookupType === "ip" ? "Enter IP address (e.g., 8.8.8.8)" : "Enter domain name (e.g., example.com)"
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            detectInputType(e.target.value)
          }}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading
            </span>
          ) : (
            <span className="flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Lookup
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}
