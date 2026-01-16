export interface SampleContract {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: "compliant",
    name: "Compliant Contract",
    description: "Passes all compliance checks",
    content: `SOFTWARE LICENSE AGREEMENT

This Software License Agreement ("Agreement") is entered into as of January 1, 2025, between TechCorp Solutions Inc. ("Licensor") and Enterprise Client LLC ("Licensee").

TERMINATION NOTICE
Either party may terminate this Agreement with one hundred twenty (120) days written notice to the other party.

PAYMENT TERMS
All fees under this Agreement shall be paid in United States Dollars (USD). Payment is due within thirty (30) days of invoice date.

LIABILITY PROVISIONS
The total liability of Licensor under this Agreement shall not exceed the total amount paid by Licensee in the twelve (12) months preceding the claim, which represents the contract value.

DATA PROCESSING
All data processing activities shall be conducted exclusively within approved data centers located in the United States, specifically in Virginia and California regions.

AUDIT RIGHTS
Licensee shall have the right to conduct annual audits of Licensor's compliance with this Agreement, with reasonable advance notice.

GENERAL PROVISIONS
This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements.`
  },
  {
    id: "non-compliant",
    name: "Non-Compliant Contract",
    description: "Fails multiple policy checks",
    content: `SERVICE AGREEMENT

This Service Agreement is dated December 15, 2024, between GlobalTech Ltd. and Client Company Inc.

TERMINATION
Either party may terminate this agreement with thirty (30) days written notice.

PAYMENT
All payments shall be made in Euros (EUR). Invoices are due upon receipt.

LIABILITY
The maximum liability under this agreement is capped at €500,000, regardless of the actual contract value which may be less.

DATA HANDLING
Data may be processed in our global data centers located in Europe, Asia, and other international regions as needed for optimal performance.

AUDIT
The Client may request a review of services upon reasonable request, subject to availability.

CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.`
  },
  {
    id: "partial",
    name: "Partially Compliant Contract",
    description: "Passes some checks, fails others",
    content: `CONSULTING SERVICES AGREEMENT

Effective Date: January 15, 2025
Between: Consulting Group LLC ("Consultant") and Business Corp ("Client")

TERM AND TERMINATION
This Agreement may be terminated by either party with one hundred (100) days advance written notice.

COMPENSATION
All fees shall be invoiced and paid in United States Dollars (USD) on a monthly basis.

INDEMNIFICATION AND LIMITATION OF LIABILITY
Consultant's total liability shall be limited to twice the fees paid in the preceding year, which may exceed the actual contract value.

DATA SECURITY
Client data will be processed in approved US-based facilities in accordance with industry standards.

COMPLIANCE AND AUDITING
Consultant will maintain records and make them available for Client review during business hours with two weeks notice.

MISCELLANEOUS
This Agreement represents the complete understanding between the parties.`
  }
];
