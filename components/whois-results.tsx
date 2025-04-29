"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

// Add this helper function at the top of the file, before the WhoisResultsProps interface
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString()
  } catch (e) {
    return "Invalid Date"
  }
}

interface WhoisResultsProps {
  data: any
  type: "ip" | "domain"
}

export function WhoisResults({ data, type }: WhoisResultsProps) {
  if (!data) return null

  return (
    <div className="mt-6 space-y-4">
      {data._note && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Limited Information</AlertTitle>
          <AlertDescription>{data._note}</AlertDescription>
        </Alert>
      )}

      {data._source && <div className="text-xs text-right text-slate-500">Data source: {data._source}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-500">{type === "ip" ? "IP Address" : "Domain"}</h3>
          <p className="text-lg font-semibold">{type === "ip" ? data.ip : data.domain || "N/A"}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-500">Location</h3>
          <p className="text-lg font-semibold">
            {data.country_name ? `${data.country_name} (${data.country_code})` : "Unknown"}
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {type === "domain" && (
          <AccordionItem value="domain-info">
            <AccordionTrigger>Domain Information</AccordionTrigger>
            <AccordionContent>
              <dl className="grid grid-cols-1 gap-2">
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Top-Level Domain (TLD)</dt>
                  <dd>{data.tld || "N/A"}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Second-Level Domain (SLD)</dt>
                  <dd>{data.sld || "N/A"}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Registrar</dt>
                  <dd>{data.registrar || "N/A"}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Creation Date</dt>
                  <dd>{formatDate(data.creation_date)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Expiration Date</dt>
                  <dd>{formatDate(data.expiration_date)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Updated Date</dt>
                  <dd>{formatDate(data.updated_date)}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Status</dt>
                  <dd>{Array.isArray(data.status) ? data.status.join(", ") : data.status || "N/A"}</dd>
                </div>
              </dl>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="network">
          <AccordionTrigger>Network Information</AccordionTrigger>
          <AccordionContent>
            <dl className="grid grid-cols-1 gap-2">
              {type === "ip" && (
                <>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">ASN</dt>
                    <dd>{data.asn || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">Network</dt>
                    <dd>{data.network || "N/A"}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between py-1 border-b">
                <dt className="font-medium text-slate-600">ISP/Organization</dt>
                <dd>{data.isp || data.org || "N/A"}</dd>
              </div>
              {type === "domain" && (
                <>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">Name Servers</dt>
                    <dd>{Array.isArray(data.nameservers) ? data.nameservers.join(", ") : data.nameservers || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">DNSSEC</dt>
                    <dd>{data.dnssec || "N/A"}</dd>
                  </div>
                </>
              )}
            </dl>
          </AccordionContent>
        </AccordionItem>

        {type === "ip" && (
          <>
            <AccordionItem value="location">
              <AccordionTrigger>Location Details</AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">Region</dt>
                    <dd>{data.region || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">City</dt>
                    <dd>{data.city || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">Postal Code</dt>
                    <dd>{data.postal_code || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <dt className="font-medium text-slate-600">Timezone</dt>
                    <dd>{data.timezone || "N/A"}</dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger>Security Information</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {data.is_proxy && (
                    <Badge variant="destructive" className="mr-2">
                      Proxy Detected
                    </Badge>
                  )}
                  {data.is_tor && (
                    <Badge variant="destructive" className="mr-2">
                      TOR Exit Node
                    </Badge>
                  )}
                  {data.is_vpn && (
                    <Badge variant="destructive" className="mr-2">
                      VPN
                    </Badge>
                  )}
                  {!data.is_proxy && !data.is_tor && !data.is_vpn && (
                    <Badge variant="outline" className="bg-green-50">
                      No Known Threats
                    </Badge>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {type === "domain" && (
          <AccordionItem value="registrant">
            <AccordionTrigger>Registrant Information</AccordionTrigger>
            <AccordionContent>
              <dl className="grid grid-cols-1 gap-2">
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Registrant Name</dt>
                  <dd>{data.registrant?.name || "N/A"}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Registrant Organization</dt>
                  <dd>{data.registrant?.organization || "N/A"}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Registrant Country</dt>
                  <dd>{data.registrant?.country || "N/A"}</dd>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <dt className="font-medium text-slate-600">Registrant Email</dt>
                  <dd>{data.registrant?.email || "N/A"}</dd>
                </div>
              </dl>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}
