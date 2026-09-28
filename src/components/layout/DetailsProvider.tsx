"use client";

import { createContext, useContext } from "react";

import { DEFAULT_DETAILS, type BusinessDetails } from "@/lib/contact";

/**
 * The client's contact details for the parts of the page that run in the
 * browser - the header, the sticky enquiry bar. The site layout reads them
 * once on the server and hands them down here.
 */
const DetailsContext = createContext<BusinessDetails>(DEFAULT_DETAILS);

export function DetailsProvider({ value, children }: { value: BusinessDetails; children: React.ReactNode }) {
  return <DetailsContext.Provider value={value}>{children}</DetailsContext.Provider>;
}

export function useDetails(): BusinessDetails {
  return useContext(DetailsContext);
}
