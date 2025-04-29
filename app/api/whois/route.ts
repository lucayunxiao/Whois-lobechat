import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")
  const type = searchParams.get("type") as "ip" | "domain"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  if (!type || (type !== "ip" && type !== "domain")) {
    return NextResponse.json({ error: "Valid type parameter (ip or domain) is required" }, { status: 400 })
  }

  try {
    if (type === "ip") {
      return await handleIpLookup(query)
    } else {
      return await handleDomainLookup(query)
    }
  } catch (error) {
    console.error(`Error in API route:`, error)
    return NextResponse.json({ error: `Failed to process ${type} lookup` }, { status: 500 })
  }
}

async function handleIpLookup(ip: string) {
  try {
    // Using a free IP lookup API for demonstration
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "IP2WHOIS-Plugin/1.0" },
    })

    if (!response.ok) {
      throw new Error(`IP API returned status ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.reason || "Invalid IP address" }, { status: 400 })
    }

    // Transform the data to match our expected format
    const result = {
      ip: data.ip,
      country_code: data.country_code,
      country_name: data.country_name,
      region: data.region,
      city: data.city,
      postal_code: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      asn: data.asn,
      org: data.org,
      isp: data.org, // Using org as ISP since ipapi doesn't provide ISP directly
      network: `${data.network || ""}`,
      is_proxy: false, // ipapi.co doesn't provide this info in the free tier
      is_tor: false, // ipapi.co doesn't provide this info in the free tier
      is_vpn: false, // ipapi.co doesn't provide this info in the free tier
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("IP lookup error:", error)

    // Fallback to a basic response
    return NextResponse.json({
      ip: ip,
      country_code: null,
      country_name: null,
      region: null,
      city: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      timezone: null,
      asn: null,
      org: null,
      isp: null,
      network: null,
      is_proxy: null,
      is_tor: null,
      is_vpn: null,
      _note: "Limited information available. External API lookup failed.",
    })
  }
}

async function handleDomainLookup(domain: string) {
  try {
    // Basic domain validation
    if (!isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    // Extract domain parts for fallback
    const domainParts = extractDomainParts(domain)

    // Try multiple WHOIS services in sequence until one works
    const whoisData = await tryMultipleWhoisServices(domain, domainParts)

    return NextResponse.json(whoisData)
  } catch (error) {
    console.error("Domain lookup error:", error)

    // If all else fails, return our local analysis as a fallback
    const domainParts = extractDomainParts(domain)
    return NextResponse.json(createLocalDomainResponse(domain, domainParts))
  }
}

async function tryMultipleWhoisServices(domain: string, domainParts: { tld: string; sld: string }) {
  // Try RDAP first (Registration Data Access Protocol)
  try {
    const rdapData = await fetchRDAPData(domain)
    if (rdapData) {
      return rdapData
    }
  } catch (error) {
    console.log("RDAP lookup failed:", error)
  }

  // Try whoisjsonapi as a second option
  try {
    const whoisJsonData = await fetchWhoisJsonData(domain)
    if (whoisJsonData) {
      return whoisJsonData
    }
  } catch (error) {
    console.log("WhoisJSON API lookup failed:", error)
  }

  // Try ipwhois.io as a third option
  try {
    const ipWhoisData = await fetchIpWhoisDomainData(domain)
    if (ipWhoisData) {
      return ipWhoisData
    }
  } catch (error) {
    console.log("ipwhois.io lookup failed:", error)
  }

  // If all services fail, return our local analysis
  return createLocalDomainResponse(domain, domainParts)
}

async function fetchRDAPData(domain: string) {
  // RDAP bootstrap service will redirect to the appropriate RDAP server
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/rdap+json",
        "User-Agent": "IP2WHOIS-Plugin/1.0",
      },
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      throw new Error(`RDAP API returned status ${response.status}`)
    }

    const data = await response.json()

    // Extract relevant information from RDAP response
    const nameservers = data.nameservers?.map((ns: any) => ns.ldhName) || []
    const events = data.events || []
    const entities = data.entities || []

    // Find registration, expiration and last updated dates
    const creationDate = events.find((e: any) => e.eventAction === "registration")?.eventDate
    const expirationDate = events.find((e: any) => e.eventAction === "expiration")?.eventDate
    const lastUpdatedDate = events.find((e: any) => e.eventAction === "last update")?.eventDate

    // Find registrar information
    const registrar = entities.find((e: any) => e.roles?.includes("registrar"))
    const registrarName = registrar?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3] || registrar?.handle

    // Find registrant information
    const registrant = entities.find((e: any) => e.roles?.includes("registrant"))
    const registrantInfo = {
      name: registrant?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3] || "Privacy Protected",
      organization: registrant?.vcardArray?.[1]?.find((v: any) => v[0] === "org")?.[3] || "Unknown",
      country: registrant?.vcardArray?.[1]?.find((v: any) => v[0] === "adr")?.[3]?.[6] || "Unknown",
      email: registrant?.vcardArray?.[1]?.find((v: any) => v[0] === "email")?.[3] || "Unknown",
    }

    // Extract status
    const status = data.status || []

    return {
      domain: domain,
      tld: extractDomainParts(domain).tld,
      sld: extractDomainParts(domain).sld,
      registrar: registrarName || "Unknown",
      creation_date: creationDate,
      expiration_date: expirationDate,
      updated_date: lastUpdatedDate,
      nameservers: nameservers,
      status: status,
      dnssec: data.secureDNS?.delegationSigned ? "Signed" : "Unsigned",
      country_code: registrantInfo.country,
      country_name: getCountryName(registrantInfo.country),
      registrant: registrantInfo,
      _source: "RDAP",
    }
  } catch (error) {
    console.log("RDAP fetch error:", error)
    throw error
  }
}

async function fetchWhoisJsonData(domain: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    // Using a free WHOIS API
    const response = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_demo&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "IP2WHOIS-Plugin/1.0",
        },
      },
    ).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      throw new Error(`WhoisXML API returned status ${response.status}`)
    }

    const data = await response.json()

    if (!data.WhoisRecord) {
      throw new Error("Invalid response from WhoisXML API")
    }

    const whoisRecord = data.WhoisRecord

    return {
      domain: whoisRecord.domainName,
      tld: extractDomainParts(whoisRecord.domainName).tld,
      sld: extractDomainParts(whoisRecord.domainName).sld,
      registrar: whoisRecord.registrarName || "Unknown",
      creation_date: whoisRecord.createdDate,
      expiration_date: whoisRecord.expiresDate,
      updated_date: whoisRecord.updatedDate,
      nameservers: whoisRecord.nameServers?.hostNames || [],
      status: whoisRecord.status || "Unknown",
      dnssec: whoisRecord.dnssec || "Unknown",
      country_code: whoisRecord.registrant?.countryCode,
      country_name: getCountryName(whoisRecord.registrant?.countryCode),
      registrant: {
        name: whoisRecord.registrant?.name || "Privacy Protected",
        organization: whoisRecord.registrant?.organization || "Unknown",
        country: whoisRecord.registrant?.countryCode || "Unknown",
        email: whoisRecord.registrant?.email || "Unknown",
      },
      _source: "WhoisXML API (Demo)",
    }
  } catch (error) {
    console.log("WhoisXML API fetch error:", error)
    throw error
  }
}

async function fetchIpWhoisDomainData(domain: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    // Using ipwhois.io API for domain lookup
    const response = await fetch(`https://ipwhois.io/json/${encodeURIComponent(domain)}?lang=en`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "IP2WHOIS-Plugin/1.0",
      },
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      throw new Error(`ipwhois.io API returned status ${response.status}`)
    }

    const data = await response.json()

    if (data.success === false) {
      throw new Error(data.message || "Domain lookup failed")
    }

    return {
      domain: domain,
      tld: extractDomainParts(domain).tld,
      sld: extractDomainParts(domain).sld,
      registrar: "Unknown", // Not provided by this API
      creation_date: null, // Not provided by this API
      expiration_date: null, // Not provided by this API
      updated_date: null, // Not provided by this API
      nameservers: [], // Not provided by this API
      status: "Unknown", // Not provided by this API
      dnssec: "Unknown", // Not provided by this API
      country_code: data.country_code,
      country_name: data.country,
      registrant: {
        name: "Unknown", // Not provided by this API
        organization: data.org || "Unknown",
        country: data.country || "Unknown",
        email: "Unknown", // Not provided by this API
      },
      _source: "ipwhois.io",
    }
  } catch (error) {
    console.log("ipwhois.io fetch error:", error)
    throw error
  }
}

function createLocalDomainResponse(domain: string, domainParts: { tld: string; sld: string }) {
  return {
    domain: domain,
    tld: domainParts.tld,
    sld: domainParts.sld,
    creation_date: null,
    updated_date: null,
    country_code: getTldCountry(domainParts.tld),
    country_name: getCountryName(getTldCountry(domainParts.tld)),
    registrar: "Information not available",
    nameservers: [],
    status: "Unknown",
    dnssec: "Unknown",
    expiration_date: null,
    registrant: {
      name: "Information not available",
      organization: "Information not available",
      country: null,
      email: null,
    },
    _note: "Limited information available. Using local domain analysis only.",
    _source: "Local Analysis",
  }
}

// Helper function to validate domain format
function isValidDomain(domain: string): boolean {
  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
  return domainRegex.test(domain)
}

// Helper function to extract domain parts
function extractDomainParts(domain: string) {
  const parts = domain.toLowerCase().split(".")
  const tld = parts.length > 1 ? parts[parts.length - 1] : ""
  const sld = parts.length > 1 ? parts[parts.length - 2] : parts[0]

  return { tld, sld }
}

// Helper function to get country from TLD
function getTldCountry(tld: string): string | null {
  const countryTlds: Record<string, string> = {
    us: "US",
    uk: "GB",
    ca: "CA",
    au: "AU",
    de: "DE",
    fr: "FR",
    jp: "JP",
    cn: "CN",
    in: "IN",
    br: "BR",
    ru: "RU",
    it: "IT",
    es: "ES",
    nl: "NL",
    se: "SE",
    // Add more as needed
  }

  return countryTlds[tld] || null
}

// Helper function to get country name from country code
function getCountryName(countryCode: string | null): string | null {
  if (!countryCode) return null

  const countries: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    JP: "Japan",
    CN: "China",
    IN: "India",
    BR: "Brazil",
    RU: "Russia",
    IT: "Italy",
    ES: "Spain",
    NL: "Netherlands",
    SE: "Sweden",
    // Add more as needed
  }

  return countries[countryCode] || countryCode
}
