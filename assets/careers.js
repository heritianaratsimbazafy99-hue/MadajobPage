const CAREERS_STORAGE_KEY = "madajob-native-careers-v1";
const DEFAULT_APPLY_EMAIL = "recrutement@madajob.mg";

const seedJobs = [
  {
    id: "MJ-2995",
    title: "BUSINESS DEVELOPER",
    contract: "CDI",
    location: "Antananarivo",
    department: "Commercial",
    sector: "Commerce et services",
    mode: "Présentiel",
    summary:
      "Développer un portefeuille B2B, identifier de nouveaux relais de croissance et piloter la relation commerciale avec les comptes clés.",
    missions: [
      "Prospecter et qualifier de nouveaux clients B2B basés à Madagascar.",
      "Construire des propositions commerciales adaptées au besoin du client.",
      "Assurer le suivi du pipe commercial et la négociation jusqu'à la signature.",
    ],
    profile: [
      "Expérience confirmée en développement commercial B2B.",
      "Bonne capacité de négociation et sens du résultat.",
      "Excellente communication en français, aisance relationnelle.",
    ],
    benefits: [
      "Package motivant selon profil.",
      "Environnement dynamique et orienté performance.",
      "Possibilités d'évolution au sein de projets à fort impact.",
    ],
    closingDate: "2026-05-20",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: true,
    createdAt: "2026-04-19T08:00:00.000Z",
  },
  {
    id: "MJ-2994",
    title: "AGENT DE SECURITE",
    contract: "CDI",
    location: "Antananarivo",
    department: "Opérations",
    sector: "Textiles / Vêtements / Accessoires",
    mode: "Présentiel",
    summary:
      "Assurer la surveillance des sites, contrôler les accès et veiller au respect des consignes de sécurité.",
    missions: [
      "Sécuriser l'enceinte de l'entreprise et effectuer les rondes.",
      "Contrôler les entrées et sorties des personnes et des véhicules.",
      "Rédiger les rapports d'incident et alerter en cas d'anomalie.",
    ],
    profile: [
      "Première expérience en sécurité ou gardiennage souhaitée.",
      "Rigueur, vigilance et ponctualité.",
      "Bonne présentation et sens des responsabilités.",
    ],
    benefits: [
      "Mission stable en environnement structuré.",
      "Encadrement opérationnel de proximité.",
    ],
    closingDate: "2026-05-05",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: false,
    createdAt: "2026-04-18T10:15:00.000Z",
  },
  {
    id: "MJ-2993",
    title: "RESPONSABLE ADMINISTRATIF & FINANCIER",
    contract: "CDI",
    location: "Toamasina",
    department: "Finance & Administration",
    sector: "Finance & Administration",
    mode: "Présentiel",
    summary:
      "Piloter les volets administratifs, comptables et financiers de l'entreprise avec un rôle central dans la structuration des opérations.",
    missions: [
      "Superviser la gestion administrative, la paie et le suivi social.",
      "Assurer le pilotage budgétaire et le contrôle des dépenses.",
      "Sécuriser les relations avec les partenaires financiers et fournisseurs.",
    ],
    profile: [
      "Expérience confirmée en RAF ou poste similaire.",
      "Très bonne maîtrise des états financiers et de la gestion budgétaire.",
      "Leadership, rigueur et sens de l'organisation.",
    ],
    benefits: [
      "Poste clé avec forte autonomie.",
      "Responsabilités transverses et impact direct sur la performance.",
    ],
    closingDate: "2026-05-12",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: true,
    createdAt: "2026-04-17T09:40:00.000Z",
  },
  {
    id: "MJ-2984",
    title: "ASSISTANT(E) ADMINISTRATIF(VE)",
    contract: "CDI",
    location: "Antananarivo",
    department: "Support",
    sector: "Finance & Administration",
    mode: "Présentiel",
    summary:
      "Assurer la gestion documentaire, le suivi administratif et le support aux équipes dans un environnement exigeant.",
    missions: [
      "Collecter, vérifier et classer les documents administratifs.",
      "Préparer les courriers, tableaux de suivi et synthèses utiles.",
      "Appuyer les équipes RH et finance dans les tâches de coordination.",
    ],
    profile: [
      "Bonne maîtrise des outils bureautiques.",
      "Sens du détail, discrétion et fiabilité.",
      "Capacité à suivre plusieurs dossiers en parallèle.",
    ],
    benefits: [
      "Poste polyvalent dans une structure organisée.",
      "Accompagnement à la prise de poste.",
    ],
    closingDate: "2026-05-08",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: false,
    createdAt: "2026-04-16T11:25:00.000Z",
  },
  {
    id: "MJ-2982",
    title: "LEGAL OFFICER",
    contract: "CDD",
    location: "Antananarivo",
    department: "Juridique",
    sector: "Produits chimiques",
    mode: "Présentiel",
    summary:
      "Veiller à la conformité juridique des opérations, identifier les écarts et proposer les actions correctives adaptées.",
    missions: [
      "Analyser la conformité légale des procédures internes.",
      "Rédiger ou relire les contrats, notes et documents juridiques.",
      "Accompagner les départements sur les sujets réglementaires.",
    ],
    profile: [
      "Formation en droit avec première expérience significative.",
      "Capacité d'analyse et qualité rédactionnelle.",
      "Aisance dans le travail transverse avec plusieurs départements.",
    ],
    benefits: [
      "Missions variées à forte valeur ajoutée.",
      "Exposition à des dossiers stratégiques.",
    ],
    closingDate: "2026-05-18",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: false,
    createdAt: "2026-04-15T07:55:00.000Z",
  },
  {
    id: "MJ-2981",
    title: "COMMERCIAL VENTE INDIRECT B to B",
    contract: "CDI",
    location: "Antananarivo",
    department: "Commercial",
    sector: "Commerce de détail et de gros",
    mode: "Présentiel",
    summary:
      "Développer un portefeuille de clients professionnels et renforcer la présence commerciale auprès des grands comptes.",
    missions: [
      "Prospecter, négocier et fidéliser les clients B2B.",
      "Suivre les indicateurs de vente et sécuriser les objectifs fixés.",
      "Coordonner avec les équipes internes pour garantir la satisfaction client.",
    ],
    profile: [
      "Expérience réussie en vente indirecte ou gestion de portefeuille.",
      "Très bonne capacité de négociation.",
      "Orientation résultats et sens du service client.",
    ],
    benefits: [
      "Objectifs stimulants et environnement commercial ambitieux.",
      "Déplacements terrain et forte autonomie.",
    ],
    closingDate: "2026-05-25",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: true,
    createdAt: "2026-04-14T14:10:00.000Z",
  },
  {
    id: "MJ-2944",
    title: "CONSEILLER CLIENT",
    contract: "CDI",
    location: "Antananarivo",
    department: "Relation client",
    sector: "Services",
    mode: "Présentiel",
    summary:
      "Prendre en charge les demandes clients, assurer un suivi de qualité et contribuer à l'amélioration continue de l'expérience client.",
    missions: [
      "Répondre aux sollicitations des clients et traiter les demandes.",
      "Orienter les dossiers vers les bons interlocuteurs internes.",
      "Suivre la satisfaction et contribuer à l'amélioration du service.",
    ],
    profile: [
      "Excellent relationnel et écoute active.",
      "Expression orale et écrite soignée.",
      "Capacité à gérer plusieurs demandes simultanément.",
    ],
    benefits: [
      "Parcours encadré et montée en compétence rapide.",
      "Equipe dynamique orientée qualité de service.",
    ],
    closingDate: "2026-05-14",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: false,
    createdAt: "2026-04-13T09:05:00.000Z",
  },
  {
    id: "MJ-2931",
    title: "RESPONSABLE RH",
    contract: "CDI",
    location: "Antananarivo",
    department: "Ressources humaines",
    sector: "RH",
    mode: "Présentiel",
    summary:
      "Piloter la stratégie RH, accompagner les managers et superviser les processus liés au développement des équipes.",
    missions: [
      "Coordonner le recrutement, l'onboarding et la gestion administrative RH.",
      "Accompagner les managers sur les sujets organisationnels et humains.",
      "Structurer les outils RH et les pratiques de développement des talents.",
    ],
    profile: [
      "Expérience solide en management RH.",
      "Bonne maîtrise du droit social et des pratiques RH.",
      "Leadership, diplomatie et sens de la confidentialité.",
    ],
    benefits: [
      "Poste stratégique avec forte visibilité.",
      "Collaboration directe avec les directions opérationnelles.",
    ],
    closingDate: "2026-05-30",
    applyEmail: DEFAULT_APPLY_EMAIL,
    published: true,
    featured: true,
    createdAt: "2026-04-12T08:45:00.000Z",
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeJob(job, index = 0) {
  return {
    id: job.id || `MJ-${Date.now()}-${index}`,
    title: String(job.title || "").trim(),
    contract: String(job.contract || "CDI").trim(),
    location: String(job.location || "Antananarivo").trim(),
    department: String(job.department || "Recrutement").trim(),
    sector: String(job.sector || "Général").trim(),
    mode: String(job.mode || "Présentiel").trim(),
    summary: String(job.summary || "").trim(),
    missions: normalizeList(job.missions),
    profile: normalizeList(job.profile),
    benefits: normalizeList(job.benefits),
    closingDate: String(job.closingDate || "").trim(),
    applyEmail: String(job.applyEmail || DEFAULT_APPLY_EMAIL).trim(),
    applyUrl: String(job.applyUrl || "").trim(),
    featured: Boolean(job.featured),
    published: job.published !== false,
    createdAt: job.createdAt || new Date().toISOString(),
  };
}

function readJobs() {
  try {
    const raw = window.localStorage.getItem(CAREERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeJob) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs) {
  const normalized = jobs.map(normalizeJob);
  window.localStorage.setItem(CAREERS_STORAGE_KEY, JSON.stringify(normalized));
}

function ensureJobs() {
  let jobs = readJobs();
  if (!jobs.length) {
    jobs = seedJobs.map(normalizeJob);
    saveJobs(jobs);
  }
  return jobs;
}

function sortJobs(jobs) {
  return [...jobs].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }

    if (left.published !== right.published) {
      return Number(right.published) - Number(left.published);
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Ouverte";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function buildApplyHref(job) {
  if (job.applyUrl) {
    return job.applyUrl;
  }

  const subject = encodeURIComponent(`Candidature - ${job.title}`);
  return `mailto:${encodeURIComponent(job.applyEmail || DEFAULT_APPLY_EMAIL)}?subject=${subject}`;
}

function uniqueValues(jobs, key) {
  return [...new Set(jobs.map((job) => job[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function renderJobTags(job) {
  return `
    <span class="tag tag--accent">${escapeHtml(job.contract)}</span>
    <span class="tag">${escapeHtml(job.location)}</span>
    <span class="tag">${escapeHtml(job.department)}</span>
    <span class="tag">${escapeHtml(job.mode)}</span>
  `;
}

function renderList(items) {
  return items
    .map(
      (job) => `
        <article class="job-card" data-job-id="${escapeHtml(job.id)}">
          <div class="job-meta">${renderJobTags(job)}</div>
          <h3>${escapeHtml(job.title)}</h3>
          <p>${escapeHtml(job.summary)}</p>
          <div class="job-card-footer">
            <p>${escapeHtml(job.sector)} · Clôture ${escapeHtml(formatDate(job.closingDate))}</p>
            <button class="btn btn-secondary" type="button" data-job-id="${escapeHtml(job.id)}">Voir le détail</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDetail(job) {
  if (!job) {
    return `
      <div class="empty-state">
        <h3>Aucune annonce sélectionnée</h3>
        <p>Choisissez une offre pour voir le détail complet et postuler.</p>
      </div>
    `;
  }

  return `
    <div class="detail-tags">${renderJobTags(job)}</div>
    <h2>${escapeHtml(job.title)}</h2>
    <p>${escapeHtml(job.summary)}</p>
    <div class="detail-section">
      <h3>Informations clés</h3>
      <div class="detail-tags">
        <span class="tag">Secteur : ${escapeHtml(job.sector)}</span>
        <span class="tag">Clôture : ${escapeHtml(formatDate(job.closingDate))}</span>
      </div>
    </div>
    <div class="detail-section">
      <h3>Missions</h3>
      <ul class="detail-list">${job.missions
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>
    </div>
    <div class="detail-section">
      <h3>Profil recherché</h3>
      <ul class="detail-list">${job.profile
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>
    </div>
    <div class="detail-section">
      <h3>Ce que nous proposons</h3>
      <ul class="detail-list">${job.benefits
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>
    </div>
    <div class="hero-actions">
      <a class="btn btn-primary" href="${escapeHtml(buildApplyHref(job))}" ${
        job.applyUrl ? 'target="_blank" rel="noreferrer"' : ""
      }>Postuler</a>
      <a class="btn btn-ghost" href="mailto:${escapeHtml(job.applyEmail || DEFAULT_APPLY_EMAIL)}">Contacter Madajob</a>
    </div>
  `;
}

function initCareersListPage() {
  const jobsListNode = document.querySelector("#jobs-list");
  const detailNode = document.querySelector("#job-detail");
  if (!jobsListNode || !detailNode) {
    return;
  }

  const searchNode = document.querySelector("#career-search");
  const locationNode = document.querySelector("#career-location");
  const contractNode = document.querySelector("#career-contract");
  const sectorNode = document.querySelector("#career-sector");
  const resultsNode = document.querySelector("#career-results-label");
  const clearNode = document.querySelector("#career-clear-filters");
  const totalJobsNode = document.querySelector("#career-stat-total");
  const citiesNode = document.querySelector("#career-stat-cities");
  const featuredNode = document.querySelector("#career-stat-featured");
  const topCountNode = document.querySelector("#career-top-count");

  const state = {
    jobs: ensureJobs(),
    selectedId: "",
  };

  function getPublishedJobs() {
    return sortJobs(state.jobs).filter((job) => job.published);
  }

  function populateSelect(node, values) {
    if (!node) {
      return;
    }

    const firstOption = node.querySelector("option");
    node.innerHTML = "";
    if (firstOption) {
      node.append(firstOption);
    } else {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Tous";
      node.append(option);
    }

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      node.append(option);
    });
  }

  function getFilteredJobs() {
    const query = (searchNode?.value || "").trim().toLowerCase();
    const location = locationNode?.value || "";
    const contract = contractNode?.value || "";
    const sector = sectorNode?.value || "";

    return getPublishedJobs().filter((job) => {
      const haystack = [job.title, job.summary, job.department, job.sector, job.location]
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (!location || job.location === location) &&
        (!contract || job.contract === contract) &&
        (!sector || job.sector === sector)
      );
    });
  }

  function syncStats() {
    const publishedJobs = getPublishedJobs();
    if (totalJobsNode) {
      totalJobsNode.textContent = String(publishedJobs.length);
    }
    if (citiesNode) {
      citiesNode.textContent = String(uniqueValues(publishedJobs, "location").length);
    }
    if (featuredNode) {
      featuredNode.textContent = String(publishedJobs.filter((job) => job.featured).length);
    }
    if (topCountNode) {
      topCountNode.textContent = String(publishedJobs.length);
    }

    populateSelect(locationNode, uniqueValues(publishedJobs, "location"));
    populateSelect(contractNode, uniqueValues(publishedJobs, "contract"));
    populateSelect(sectorNode, uniqueValues(publishedJobs, "sector"));
  }

  function syncSelectedJob(items) {
    if (!items.length) {
      state.selectedId = "";
      return;
    }

    const selectedStillExists = items.some((job) => job.id === state.selectedId);
    if (!selectedStillExists) {
      state.selectedId = items[0].id;
    }
  }

  function render() {
    const filteredJobs = getFilteredJobs();
    syncSelectedJob(filteredJobs);

    if (resultsNode) {
      resultsNode.textContent = `${filteredJobs.length} offre${filteredJobs.length > 1 ? "s" : ""} disponible${filteredJobs.length > 1 ? "s" : ""}`;
    }

    if (!filteredJobs.length) {
      jobsListNode.innerHTML = `
        <div class="empty-state">
          <h3>Aucune offre ne correspond à votre recherche</h3>
          <p>Modifiez vos filtres ou envoyez une candidature spontanée à ${DEFAULT_APPLY_EMAIL}.</p>
        </div>
      `;
      detailNode.innerHTML = renderDetail(null);
      return;
    }

    jobsListNode.innerHTML = renderList(filteredJobs);
    jobsListNode.querySelectorAll(".job-card").forEach((card) => {
      if (card.dataset.jobId === state.selectedId) {
        card.classList.add("is-active");
      }
    });

    const selectedJob = filteredJobs.find((job) => job.id === state.selectedId);
    detailNode.innerHTML = renderDetail(selectedJob);
  }

  jobsListNode.addEventListener("click", (event) => {
    const target = event.target.closest("[data-job-id]");
    if (!target) {
      return;
    }

    state.selectedId = target.dataset.jobId || "";
    render();
  });

  [searchNode, locationNode, contractNode, sectorNode].forEach((node) => {
    if (!node) {
      return;
    }

    const eventName = node.tagName === "INPUT" ? "input" : "change";
    node.addEventListener(eventName, render);
  });

  clearNode?.addEventListener("click", () => {
    if (searchNode) searchNode.value = "";
    if (locationNode) locationNode.value = "";
    if (contractNode) contractNode.value = "";
    if (sectorNode) sectorNode.value = "";
    render();
  });

  window.addEventListener("storage", () => {
    state.jobs = ensureJobs();
    syncStats();
    render();
  });

  syncStats();
  render();
}

function initAdminPage() {
  const form = document.querySelector("#job-form");
  const jobsListNode = document.querySelector("#admin-jobs-list");
  if (!form || !jobsListNode) {
    return;
  }

  const statusNode = document.querySelector("#admin-status");
  const totalNode = document.querySelector("#admin-total");
  const publishedNode = document.querySelector("#admin-published");
  const featuredNode = document.querySelector("#admin-featured");
  const resetButton = document.querySelector("#job-form-reset");
  const exportButton = document.querySelector("#admin-export");
  const importInput = document.querySelector("#admin-import");
  const restoreButton = document.querySelector("#admin-restore");

  let jobs = ensureJobs();

  function setStatus(message) {
    if (statusNode) {
      statusNode.textContent = message;
    }
  }

  function updateStats() {
    if (totalNode) totalNode.textContent = String(jobs.length);
    if (publishedNode) publishedNode.textContent = String(jobs.filter((job) => job.published).length);
    if (featuredNode) featuredNode.textContent = String(jobs.filter((job) => job.featured).length);
  }

  function fillForm(job) {
    form.elements.jobId.value = job.id;
    form.elements.title.value = job.title;
    form.elements.contract.value = job.contract;
    form.elements.location.value = job.location;
    form.elements.department.value = job.department;
    form.elements.sector.value = job.sector;
    form.elements.mode.value = job.mode;
    form.elements.closingDate.value = job.closingDate;
    form.elements.applyEmail.value = job.applyEmail;
    form.elements.applyUrl.value = job.applyUrl;
    form.elements.summary.value = job.summary;
    form.elements.missions.value = job.missions.join("\n");
    form.elements.profile.value = job.profile.join("\n");
    form.elements.benefits.value = job.benefits.join("\n");
    form.elements.featured.checked = job.featured;
    form.elements.published.checked = job.published;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    form.reset();
    form.elements.jobId.value = "";
    form.elements.contract.value = "CDI";
    form.elements.mode.value = "Présentiel";
    form.elements.applyEmail.value = DEFAULT_APPLY_EMAIL;
    form.elements.published.checked = true;
    form.elements.featured.checked = false;
  }

  function saveAndRender(message) {
    jobs = sortJobs(jobs);
    saveJobs(jobs);
    updateStats();
    renderAdminJobs();
    setStatus(message);
  }

  function renderAdminJobs() {
    if (!jobs.length) {
      jobsListNode.innerHTML = `
        <div class="empty-state">
          <h3>Aucune annonce</h3>
          <p>Créez votre première annonce pour l'afficher immédiatement sur le site carrière.</p>
        </div>
      `;
      return;
    }

    jobsListNode.innerHTML = sortJobs(jobs)
      .map(
        (job) => `
          <article class="admin-job-card">
            <div class="admin-tags">
              <span class="status-pill ${job.published ? "status-pill--published" : "status-pill--draft"}">
                ${job.published ? "Publiée" : "Brouillon"}
              </span>
              ${job.featured ? '<span class="status-pill status-pill--published">Mise en avant</span>' : ""}
            </div>
            <h3>${escapeHtml(job.title)}</h3>
            <p>${escapeHtml(job.summary)}</p>
            <div class="admin-job-footer">
              <p class="admin-helper">${escapeHtml(job.contract)} · ${escapeHtml(job.location)} · ${escapeHtml(job.department)}</p>
              <div class="admin-job-actions">
                <button class="btn btn-secondary" type="button" data-action="edit" data-job-id="${escapeHtml(job.id)}">Modifier</button>
                <button class="btn btn-secondary" type="button" data-action="duplicate" data-job-id="${escapeHtml(job.id)}">Dupliquer</button>
                <button class="btn btn-secondary" type="button" data-action="toggle" data-job-id="${escapeHtml(job.id)}">
                  ${job.published ? "Passer en brouillon" : "Publier"}
                </button>
                <button class="btn btn-ghost" type="button" data-action="delete" data-job-id="${escapeHtml(job.id)}">Supprimer</button>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const rawId = String(data.get("jobId") || "").trim();
    const job = normalizeJob({
      id: rawId || `MJ-${Date.now()}`,
      title: data.get("title"),
      contract: data.get("contract"),
      location: data.get("location"),
      department: data.get("department"),
      sector: data.get("sector"),
      mode: data.get("mode"),
      closingDate: data.get("closingDate"),
      applyEmail: data.get("applyEmail"),
      applyUrl: data.get("applyUrl"),
      summary: data.get("summary"),
      missions: data.get("missions"),
      profile: data.get("profile"),
      benefits: data.get("benefits"),
      featured: data.get("featured") === "on",
      published: data.get("published") === "on",
      createdAt: new Date().toISOString(),
    });

    if (!job.title || !job.summary) {
      setStatus("Le titre et le résumé sont obligatoires.");
      return;
    }

    const existingIndex = jobs.findIndex((item) => item.id === rawId);
    if (existingIndex >= 0) {
      job.createdAt = jobs[existingIndex].createdAt;
      jobs[existingIndex] = job;
      saveAndRender("Annonce mise à jour.");
    } else {
      jobs.unshift(job);
      saveAndRender("Annonce créée et enregistrée.");
    }

    resetForm();
  });

  resetButton?.addEventListener("click", () => {
    resetForm();
    setStatus("Formulaire réinitialisé.");
  });

  exportButton?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(sortJobs(jobs), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "madajob-annonces.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Export JSON généré.");
  });

  importInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error("Format invalide");
      }
      jobs = parsed.map(normalizeJob);
      saveAndRender("Annonces importées avec succès.");
      resetForm();
    } catch {
      setStatus("Impossible d'importer ce fichier JSON.");
    } finally {
      event.target.value = "";
    }
  });

  restoreButton?.addEventListener("click", () => {
    jobs = seedJobs.map(normalizeJob);
    saveAndRender("Les annonces de démonstration ont été restaurées.");
    resetForm();
  });

  jobsListNode.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const jobId = button.dataset.jobId;
    const action = button.dataset.action;
    const index = jobs.findIndex((job) => job.id === jobId);
    if (index < 0) {
      return;
    }

    if (action === "edit") {
      fillForm(jobs[index]);
      setStatus(`Modification de ${jobs[index].title}.`);
      return;
    }

    if (action === "duplicate") {
      const source = jobs[index];
      jobs.unshift(
        normalizeJob({
          ...source,
          id: `MJ-${Date.now()}`,
          title: `${source.title} (copie)`,
          createdAt: new Date().toISOString(),
        })
      );
      saveAndRender("Annonce dupliquée.");
      return;
    }

    if (action === "toggle") {
      jobs[index].published = !jobs[index].published;
      saveAndRender(jobs[index].published ? "Annonce publiée." : "Annonce passée en brouillon.");
      return;
    }

    if (action === "delete") {
      jobs.splice(index, 1);
      saveAndRender("Annonce supprimée.");
      resetForm();
    }
  });

  resetForm();
  updateStats();
  renderAdminJobs();
}

if (document.body.dataset.careersPage === "list") {
  initCareersListPage();
}

if (document.body.dataset.careersPage === "admin") {
  initAdminPage();
}
