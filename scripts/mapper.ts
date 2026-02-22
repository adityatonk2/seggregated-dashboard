export function mapCompany(raw: any) {
  return {
    company: raw.company?.trim(),
    sector: raw.sector?.toLowerCase(),
    cioName: raw.cioName || null,
    cioLinkedin: raw.cioLinkedin || null,
    cfoName: raw.cfoName || null,
    cfoLinkedin: raw.cfoLinkedin || null,
    ctoCdoName: raw.ctoCdoName || null,
    ctoCdoLinkedin: raw.ctoCdoLinkedin || null,
    ceoName: raw.ceoName || null,
    ceoLinkedin: raw.ceoLinkedin || null,
    updatedAt: new Date(),
  };
}

export function mapProspect(raw: any) {
  return {
    name: raw.Name?.trim(),
    linkedinUrl: raw.LinkedIn || null,
    email: raw.email || null,
    organization: raw.Organization?.trim(),
    designation: raw.Designation || null,
    connectedOn: raw["Connected On"] ? new Date(raw["Connected On"]) : null,
    updatedAt: new Date(),
  };
}
