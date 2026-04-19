const APPLICATION_STATUSES = ["Nouvelle", "En revue", "Short-list", "Retenue", "Rejetée"];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || "Une erreur est survenue.");
  }

  return payload;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Ouverte";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateValue));
}

function renderTags(job) {
  return `
    <span class="tag tag--accent">${escapeHtml(job.contract)}</span>
    <span class="tag">${escapeHtml(job.location)}</span>
    <span class="tag">${escapeHtml(job.department)}</span>
    <span class="tag">${escapeHtml(job.mode)}</span>
  `;
}

function buildPublicApplyLink(job) {
  if (job.applyUrl) {
    return job.applyUrl;
  }

  const subject = encodeURIComponent(`Candidature - ${job.title}`);
  return `mailto:${encodeURIComponent(job.applyEmail)}?subject=${subject}`;
}

function populateSelect(node, values, defaultLabel) {
  if (!node) {
    return;
  }

  node.innerHTML = "";
  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = defaultLabel;
  node.append(firstOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    node.append(option);
  });
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
    jobs: [],
    selectedId: "",
    filters: {
      search: "",
      location: "",
      contract: "",
      sector: ""
    }
  };

  function filteredJobs() {
    const query = state.filters.search.toLowerCase();
    return state.jobs.filter((job) => {
      const haystack = [job.title, job.summary, job.department, job.sector, job.location].join(" ").toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (!state.filters.location || job.location === state.filters.location) &&
        (!state.filters.contract || job.contract === state.filters.contract) &&
        (!state.filters.sector || job.sector === state.filters.sector)
      );
    });
  }

  function syncSelected(jobs) {
    if (!jobs.length) {
      state.selectedId = "";
      return;
    }

    if (!jobs.some((job) => job.id === state.selectedId)) {
      state.selectedId = jobs[0].id;
    }
  }

  function renderJobsList(jobs) {
    if (!jobs.length) {
      jobsListNode.innerHTML = `
        <div class="empty-state">
          <h3>Aucune offre trouvée</h3>
          <p>Essayez un autre mot-clé ou envoyez une candidature spontanée à recrutement@madajob.mg.</p>
        </div>
      `;
      return;
    }

    jobsListNode.innerHTML = jobs
      .map(
        (job) => `
          <article class="job-card ${job.id === state.selectedId ? "is-active" : ""}" data-job-id="${escapeHtml(job.id)}">
            <div class="job-meta">${renderTags(job)}</div>
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
      detailNode.innerHTML = `
        <div class="empty-state">
          <h3>Aucune offre sélectionnée</h3>
          <p>Sélectionnez une offre dans la liste pour voir le détail du poste et postuler.</p>
        </div>
      `;
      return;
    }

    detailNode.innerHTML = `
      <div class="detail-tags">${renderTags(job)}</div>
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
        <ul class="detail-list">${job.missions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="detail-section">
        <h3>Profil recherché</h3>
        <ul class="detail-list">${job.profile.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="detail-section">
        <h3>Ce que nous proposons</h3>
        <ul class="detail-list">${job.benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div class="hero-actions">
        <a class="btn btn-secondary" href="${escapeHtml(buildPublicApplyLink(job))}" ${
          job.applyUrl ? 'target="_blank" rel="noreferrer"' : ""
        }>Candidater par lien direct</a>
      </div>
      <div class="detail-section">
        <h3>Postuler depuis le site carrière</h3>
        <form class="career-application-form" id="career-application-form" enctype="multipart/form-data">
          <input type="hidden" name="jobId" value="${escapeHtml(job.id)}" />
          <div class="admin-form-grid">
            <div class="field">
              <label for="apply-full-name">Nom complet</label>
              <input id="apply-full-name" name="fullName" type="text" placeholder="Votre nom et prénom" required />
            </div>
            <div class="field">
              <label for="apply-email">Email</label>
              <input id="apply-email" name="email" type="email" placeholder="vous@email.com" required />
            </div>
            <div class="field">
              <label for="apply-phone">Téléphone</label>
              <input id="apply-phone" name="phone" type="text" placeholder="+261..." />
            </div>
            <div class="field">
              <label for="apply-city">Ville</label>
              <input id="apply-city" name="city" type="text" placeholder="Antananarivo" />
            </div>
            <div class="field field--full">
              <label for="apply-cover-letter">Message / motivation</label>
              <textarea id="apply-cover-letter" name="coverLetter" placeholder="Présentez brièvement votre intérêt pour ce poste."></textarea>
            </div>
            <div class="field field--full">
              <label for="apply-cv">CV (PDF, Word, image)</label>
              <input id="apply-cv" name="cv" type="file" />
            </div>
          </div>
          <div class="status-row">
            <p class="status-message" id="career-application-status"></p>
            <div class="hero-actions admin-actions">
              <button class="btn btn-primary" type="submit">Envoyer ma candidature</button>
            </div>
          </div>
        </form>
      </div>
    `;

    const form = detailNode.querySelector("#career-application-form");
    const status = detailNode.querySelector("#career-application-status");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Envoi en cours...";
      try {
        const formData = new FormData(form);
        const response = await fetch("/api/public/applications", {
          method: "POST",
          body: formData
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Impossible d'envoyer la candidature.");
        }
        status.textContent = payload.message;
        form.reset();
      } catch (error) {
        status.textContent = error.message;
      }
    });
  }

  function render() {
    const jobs = filteredJobs();
    syncSelected(jobs);
    renderJobsList(jobs);
    const selected = jobs.find((job) => job.id === state.selectedId) || null;
    renderDetail(selected);
    if (resultsNode) {
      resultsNode.textContent = `${jobs.length} offre${jobs.length > 1 ? "s" : ""} disponible${jobs.length > 1 ? "s" : ""}`;
    }
  }

  jobsListNode.addEventListener("click", (event) => {
    const target = event.target.closest("[data-job-id]");
    if (!target) {
      return;
    }
    state.selectedId = target.dataset.jobId || "";
    render();
  });

  searchNode?.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim();
    render();
  });
  locationNode?.addEventListener("change", (event) => {
    state.filters.location = event.target.value;
    render();
  });
  contractNode?.addEventListener("change", (event) => {
    state.filters.contract = event.target.value;
    render();
  });
  sectorNode?.addEventListener("change", (event) => {
    state.filters.sector = event.target.value;
    render();
  });

  clearNode?.addEventListener("click", () => {
    state.filters = { search: "", location: "", contract: "", sector: "" };
    if (searchNode) searchNode.value = "";
    if (locationNode) locationNode.value = "";
    if (contractNode) contractNode.value = "";
    if (sectorNode) sectorNode.value = "";
    render();
  });

  request("/api/public/jobs")
    .then((payload) => {
      state.jobs = payload.jobs || [];
      populateSelect(locationNode, payload.filters?.locations || [], "Toutes les villes");
      populateSelect(contractNode, payload.filters?.contracts || [], "Tous les contrats");
      populateSelect(sectorNode, payload.filters?.sectors || [], "Tous les secteurs");

      if (totalJobsNode) totalJobsNode.textContent = String(payload.stats?.total || state.jobs.length);
      if (citiesNode) citiesNode.textContent = String(payload.stats?.locations || 0);
      if (featuredNode) featuredNode.textContent = String(payload.stats?.featured || 0);
      if (topCountNode) topCountNode.textContent = String(payload.stats?.total || state.jobs.length);
      render();
    })
    .catch((error) => {
      jobsListNode.innerHTML = `
        <div class="empty-state">
          <h3>Impossible de charger les annonces</h3>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
      detailNode.innerHTML = `
        <div class="empty-state">
          <h3>Erreur de chargement</h3>
          <p>Le portail carrière n'a pas pu récupérer les annonces pour le moment.</p>
        </div>
      `;
    });
}

function initAdminPage() {
  const loginPanel = document.querySelector("#admin-login-panel");
  const dashboard = document.querySelector("#admin-dashboard");
  const loginForm = document.querySelector("#admin-login-form");
  const loginStatus = document.querySelector("#admin-login-status");
  const logoutButton = document.querySelector("#admin-logout");
  const greetingNode = document.querySelector("#admin-greeting");
  const jobsListNode = document.querySelector("#admin-jobs-list");
  const applicationsListNode = document.querySelector("#admin-applications-list");
  const statusNode = document.querySelector("#admin-status");
  const totalNode = document.querySelector("#admin-total");
  const publishedNode = document.querySelector("#admin-published");
  const featuredNode = document.querySelector("#admin-featured");
  const applicationTotalNode = document.querySelector("#admin-applications-total");
  const form = document.querySelector("#job-form");
  const resetButton = document.querySelector("#job-form-reset");
  const exportButton = document.querySelector("#admin-export");
  const importInput = document.querySelector("#admin-import");
  const restoreButton = document.querySelector("#admin-restore");

  if (!loginPanel || !dashboard || !loginForm || !form || !jobsListNode || !applicationsListNode) {
    return;
  }

  const state = {
    admin: null,
    jobs: [],
    applications: []
  };

  function setMessage(node, message) {
    if (node) {
      node.textContent = message;
    }
  }

  function showLogin() {
    loginPanel.classList.remove("is-hidden");
    dashboard.classList.add("is-hidden");
  }

  function showDashboard() {
    loginPanel.classList.add("is-hidden");
    dashboard.classList.remove("is-hidden");
  }

  function resetForm() {
    form.reset();
    form.elements.jobId.value = "";
    form.elements.contract.value = "CDI";
    form.elements.mode.value = "Présentiel";
    form.elements.applyEmail.value = "recrutement@madajob.mg";
    form.elements.published.checked = true;
    form.elements.featured.checked = false;
  }

  function fillForm(job) {
    form.elements.jobId.value = job.id;
    form.elements.title.value = job.title;
    form.elements.contract.value = job.contract;
    form.elements.location.value = job.location;
    form.elements.department.value = job.department;
    form.elements.sector.value = job.sector;
    form.elements.mode.value = job.mode;
    form.elements.closingDate.value = job.closingDate || "";
    form.elements.applyEmail.value = job.applyEmail;
    form.elements.applyUrl.value = job.applyUrl || "";
    form.elements.summary.value = job.summary;
    form.elements.missions.value = job.missions.join("\n");
    form.elements.profile.value = job.profile.join("\n");
    form.elements.benefits.value = job.benefits.join("\n");
    form.elements.featured.checked = Boolean(job.featured);
    form.elements.published.checked = Boolean(job.published);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderStats() {
    if (greetingNode && state.admin) {
      greetingNode.textContent = `${state.admin.name} · ${state.admin.email}`;
    }
    if (totalNode) totalNode.textContent = String(state.jobs.length);
    if (publishedNode) publishedNode.textContent = String(state.jobs.filter((job) => job.published).length);
    if (featuredNode) featuredNode.textContent = String(state.jobs.filter((job) => job.featured).length);
    if (applicationTotalNode) applicationTotalNode.textContent = String(state.applications.length);
  }

  function renderJobs() {
    if (!state.jobs.length) {
      jobsListNode.innerHTML = `
        <div class="empty-state">
          <h3>Aucune annonce</h3>
          <p>Créez votre première annonce puis publiez-la sur le site carrière.</p>
        </div>
      `;
      return;
    }

    jobsListNode.innerHTML = state.jobs
      .map(
        (job) => `
          <article class="admin-job-card">
            <div class="admin-tags">
              <span class="status-pill ${job.published ? "status-pill--published" : "status-pill--draft"}">${job.published ? "Publiée" : "Brouillon"}</span>
              ${job.featured ? '<span class="status-pill status-pill--published">Mise en avant</span>' : ""}
            </div>
            <h3>${escapeHtml(job.title)}</h3>
            <p>${escapeHtml(job.summary)}</p>
            <div class="admin-job-footer">
              <p class="admin-helper">${escapeHtml(job.contract)} · ${escapeHtml(job.location)} · ${escapeHtml(job.department)}</p>
              <div class="admin-job-actions">
                <button class="btn btn-secondary" type="button" data-action="edit" data-job-id="${escapeHtml(job.id)}">Modifier</button>
                <button class="btn btn-secondary" type="button" data-action="duplicate" data-job-id="${escapeHtml(job.id)}">Dupliquer</button>
                <button class="btn btn-secondary" type="button" data-action="toggle" data-job-id="${escapeHtml(job.id)}">${job.published ? "Passer en brouillon" : "Publier"}</button>
                <button class="btn btn-ghost" type="button" data-action="delete" data-job-id="${escapeHtml(job.id)}">Supprimer</button>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderApplications() {
    if (!state.applications.length) {
      applicationsListNode.innerHTML = `
        <div class="empty-state">
          <h3>Aucune candidature pour le moment</h3>
          <p>Les candidatures envoyées depuis le site carrière apparaîtront ici automatiquement.</p>
        </div>
      `;
      return;
    }

    applicationsListNode.innerHTML = state.applications
      .map(
        (application) => `
          <article class="admin-job-card">
            <div class="admin-tags">
              <span class="status-pill status-pill--published">${escapeHtml(application.jobTitle)}</span>
              <span class="status-pill">${escapeHtml(application.status)}</span>
            </div>
            <h3>${escapeHtml(application.fullName)}</h3>
            <p>${escapeHtml(application.email)}${application.phone ? ` · ${escapeHtml(application.phone)}` : ""}${application.city ? ` · ${escapeHtml(application.city)}` : ""}</p>
            <p>${escapeHtml(application.coverLetter || "Aucun message renseigné.")}</p>
            <div class="admin-job-footer">
              <p class="admin-helper">Reçue le ${escapeHtml(formatDate(application.createdAt))}</p>
              <div class="admin-job-actions">
                <select class="field admin-inline-select" data-application-status="${escapeHtml(application.id)}">
                  ${APPLICATION_STATUSES.map(
                    (status) =>
                      `<option value="${escapeHtml(status)}" ${status === application.status ? "selected" : ""}>${escapeHtml(status)}</option>`
                  ).join("")}
                </select>
                <button class="btn btn-secondary" type="button" data-action="save-application" data-application-id="${escapeHtml(application.id)}">Mettre à jour</button>
                ${
                  application.cvDownloadUrl
                    ? `<a class="btn btn-secondary" href="${escapeHtml(application.cvDownloadUrl)}">Télécharger le CV</a>`
                    : ""
                }
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  async function loadDashboard() {
    const [jobsPayload, applicationsPayload] = await Promise.all([
      request("/api/admin/jobs"),
      request("/api/admin/applications")
    ]);

    state.jobs = jobsPayload.jobs || [];
    state.applications = applicationsPayload.applications || [];
    renderStats();
    renderJobs();
    renderApplications();
  }

  async function syncAuth() {
    try {
      const payload = await request("/api/admin/auth/me");
      state.admin = payload.admin;
      showDashboard();
      await loadDashboard();
    } catch {
      state.admin = null;
      showLogin();
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(loginStatus, "Connexion en cours...");
    try {
      const payload = await request("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.elements.email.value,
          password: loginForm.elements.password.value
        })
      });
      state.admin = payload.admin;
      setMessage(loginStatus, "");
      loginForm.reset();
      showDashboard();
      await loadDashboard();
    } catch (error) {
      setMessage(loginStatus, error.message);
    }
  });

  logoutButton?.addEventListener("click", async () => {
    await request("/api/admin/auth/logout", { method: "POST" });
    state.admin = null;
    showLogin();
    setMessage(statusNode, "");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(statusNode, "Enregistrement en cours...");
    const payload = {
      title: form.elements.title.value,
      contract: form.elements.contract.value,
      location: form.elements.location.value,
      department: form.elements.department.value,
      sector: form.elements.sector.value,
      mode: form.elements.mode.value,
      closingDate: form.elements.closingDate.value,
      applyEmail: form.elements.applyEmail.value,
      applyUrl: form.elements.applyUrl.value,
      summary: form.elements.summary.value,
      missions: form.elements.missions.value,
      profile: form.elements.profile.value,
      benefits: form.elements.benefits.value,
      featured: form.elements.featured.checked,
      published: form.elements.published.checked
    };

    try {
      const jobId = form.elements.jobId.value.trim();
      if (jobId) {
        await request(`/api/admin/jobs/${encodeURIComponent(jobId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: jobId })
        });
        setMessage(statusNode, "Annonce mise à jour.");
      } else {
        await request("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setMessage(statusNode, "Annonce créée.");
      }

      resetForm();
      await loadDashboard();
    } catch (error) {
      setMessage(statusNode, error.message);
    }
  });

  resetButton?.addEventListener("click", () => {
    resetForm();
    setMessage(statusNode, "Formulaire réinitialisé.");
  });

  exportButton?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.jobs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "madajob-annonces.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(statusNode, "Export JSON généré.");
  });

  importInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const jobs = JSON.parse(text);
      if (!Array.isArray(jobs)) {
        throw new Error("Le fichier importé doit contenir un tableau JSON d'annonces.");
      }

      for (const job of jobs) {
        const existing = state.jobs.find((item) => item.id === job.id);
        await request(existing ? `/api/admin/jobs/${encodeURIComponent(job.id)}` : "/api/admin/jobs", {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(job)
        });
      }

      await loadDashboard();
      setMessage(statusNode, "Import terminé.");
    } catch (error) {
      setMessage(statusNode, error.message || "Impossible d'importer ce fichier.");
    } finally {
      event.target.value = "";
    }
  });

  restoreButton?.addEventListener("click", async () => {
    try {
      await request("/api/admin/jobs/restore-seed", { method: "POST" });
      await loadDashboard();
      resetForm();
      setMessage(statusNode, "Les annonces de démonstration ont été restaurées.");
    } catch (error) {
      setMessage(statusNode, error.message);
    }
  });

  jobsListNode.addEventListener("click", async (event) => {
    const actionNode = event.target.closest("[data-action]");
    if (!actionNode) {
      return;
    }

    const action = actionNode.dataset.action;
    const jobId = actionNode.dataset.jobId;
    const job = state.jobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }

    try {
      if (action === "edit") {
        fillForm(job);
        setMessage(statusNode, `Modification de ${job.title}.`);
        return;
      }

      if (action === "duplicate") {
        const copy = { ...job, id: undefined, title: `${job.title} (copie)` };
        await request("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(copy)
        });
        await loadDashboard();
        setMessage(statusNode, "Annonce dupliquée.");
        return;
      }

      if (action === "toggle") {
        await request(`/api/admin/jobs/${encodeURIComponent(job.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...job, published: !job.published })
        });
        await loadDashboard();
        setMessage(statusNode, job.published ? "Annonce passée en brouillon." : "Annonce publiée.");
        return;
      }

      if (action === "delete") {
        await request(`/api/admin/jobs/${encodeURIComponent(job.id)}`, { method: "DELETE" });
        await loadDashboard();
        setMessage(statusNode, "Annonce supprimée.");
      }
    } catch (error) {
      setMessage(statusNode, error.message);
    }
  });

  applicationsListNode.addEventListener("click", async (event) => {
    const actionNode = event.target.closest("[data-action='save-application']");
    if (!actionNode) {
      return;
    }

    const applicationId = actionNode.dataset.applicationId;
    const select = [...applicationsListNode.querySelectorAll("[data-application-status]")].find(
      (node) => node.dataset.applicationStatus === applicationId
    );
    if (!select) {
      return;
    }

    try {
      await request(`/api/admin/applications/${encodeURIComponent(applicationId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: select.value })
      });
      await loadDashboard();
      setMessage(statusNode, "Statut de candidature mis à jour.");
    } catch (error) {
      setMessage(statusNode, error.message);
    }
  });

  resetForm();
  syncAuth();
}

if (document.body.dataset.careersPage === "list") {
  initCareersListPage();
}

if (document.body.dataset.careersPage === "admin") {
  initAdminPage();
}
