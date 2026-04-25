export function getAuditEntityFallbackLabel(entityType: string, entityId: string) {
  if (entityType === "profile") {
    return "Utilisateur";
  }

  if (entityType === "job_post") {
    return "Offre";
  }

  if (entityType === "organization") {
    return "Organisation";
  }

  return entityId ? `${entityType}:${entityId.slice(0, 8)}` : entityType;
}

export function getAuditEntityHref(entityType: string, entityId: string) {
  if (!entityId) {
    return null;
  }

  if (entityType === "profile") {
    return `/app/admin/utilisateurs/${entityId}`;
  }

  if (entityType === "job_post") {
    return `/app/admin/offres/${entityId}`;
  }

  if (entityType === "organization") {
    return `/app/admin/organisations/${entityId}`;
  }

  return null;
}
