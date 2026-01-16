export interface Policy {
  number: string;
  description: string;
  enabled?: boolean;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  policies: Policy[];
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "saas-standard",
    name: "SaaS Standard",
    description: "Standard compliance for software-as-a-service agreements",
    policies: [
      { number: "POL-001", description: "Termination notice must be at least 90 days (90+ days required)", enabled: true },
      { number: "POL-005", description: "All payments must be in USD", enabled: true },
      { number: "POL-010", description: "Liability cap cannot exceed contract value", enabled: true },
      { number: "POL-015", description: "Data processing only in approved US regions", enabled: true },
      { number: "POL-020", description: "Contract must explicitly guarantee annual audit rights (not just 'upon request')", enabled: true },
    ]
  },
  {
    id: "financial",
    name: "Financial Services",
    description: "Enhanced compliance for financial institutions",
    policies: [
      { number: "FIN-001", description: "Minimum 180 days termination notice required", enabled: true },
      { number: "FIN-002", description: "All transactions must be in USD", enabled: true },
      { number: "FIN-003", description: "Maximum liability limited to 1x annual fees", enabled: true },
      { number: "FIN-004", description: "SOC 2 Type II certification required", enabled: true },
      { number: "FIN-005", description: "Data must remain in US jurisdiction", enabled: true },
      { number: "FIN-006", description: "Quarterly audit rights required", enabled: true },
      { number: "FIN-007", description: "Encryption at rest and in transit mandatory", enabled: true },
      { number: "FIN-008", description: "24/7 incident response required", enabled: true },
      { number: "FIN-009", description: "Business continuity plan documentation required", enabled: true },
      { number: "FIN-010", description: "Insurance coverage minimum $5M required", enabled: true },
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare (HIPAA)",
    description: "HIPAA-compliant healthcare data processing",
    policies: [
      { number: "HIP-001", description: "HIPAA Business Associate Agreement required", enabled: true },
      { number: "HIP-002", description: "PHI encryption required (AES-256)", enabled: true },
      { number: "HIP-003", description: "Minimum 120 days termination notice", enabled: true },
      { number: "HIP-004", description: "Data processing restricted to HIPAA-compliant US facilities", enabled: true },
      { number: "HIP-005", description: "Breach notification within 24 hours", enabled: true },
      { number: "HIP-006", description: "Annual HIPAA compliance audit required", enabled: true },
      { number: "HIP-007", description: "Access logs must be maintained for 7 years", enabled: true },
      { number: "HIP-008", description: "Role-based access control (RBAC) required", enabled: true },
      { number: "HIP-009", description: "Data backup and disaster recovery plan required", enabled: true },
      { number: "HIP-010", description: "Staff HIPAA training documentation required", enabled: true },
      { number: "HIP-011", description: "Subcontractor agreements must include HIPAA terms", enabled: true },
      { number: "HIP-012", description: "Right to data deletion upon termination", enabled: true },
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Comprehensive enterprise-grade requirements",
    policies: [
      { number: "ENT-001", description: "Minimum 90 days termination notice", enabled: true },
      { number: "ENT-002", description: "Currency must be USD or specified alternative", enabled: true },
      { number: "ENT-003", description: "Liability cap aligned with contract value", enabled: true },
      { number: "ENT-004", description: "Service Level Agreement (SLA) 99.9% uptime", enabled: true },
      { number: "ENT-005", description: "Data residency compliance required", enabled: true },
      { number: "ENT-006", description: "Security audit rights (annual minimum)", enabled: true },
      { number: "ENT-007", description: "Indemnification for IP infringement", enabled: true },
      { number: "ENT-008", description: "Dedicated support channel required", enabled: true },
    ]
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Basic compliance for simple agreements",
    policies: [
      { number: "MIN-001", description: "Termination notice required (30+ days)", enabled: true },
      { number: "MIN-002", description: "Payment currency specified", enabled: true },
      { number: "MIN-003", description: "Liability terms clearly defined", enabled: true },
    ]
  }
];

export const DEFAULT_TEMPLATE = "saas-standard";
