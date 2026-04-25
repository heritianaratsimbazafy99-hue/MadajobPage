const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(projectRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      target: ts.ScriptTarget.ES2020
    },
    fileName: filename
  });

  module._compile(output.outputText, filename);
};

const {
  getCandidateJobMatch,
  rankJobsForCandidate
} = require("../lib/matching.ts");
const {
  getNumericRecordValue,
  getStringArrayRecordValue,
  mapJobRecord,
  mapManagedJobRecord
} = require("../lib/job-record-mappers.ts");
const {
  buildCandidateApplicationInterviewSignalMap,
  buildRecruiterApplicationInterviewSignalMap,
  mapApplicationInterviewRecord
} = require("../lib/interview-record-mappers.ts");
const {
  createSignedUrlForDocument,
  mapCandidateDocumentRecord
} = require("../lib/candidate-document-records.ts");
const {
  fallbackApplications,
  fallbackCandidateProfile,
  fallbackInterviews,
  fallbackJobs,
  fallbackRecruiterApplications
} = require("../lib/job-fallbacks.ts");
const {
  normalizeJobRelation,
  normalizeSupabaseRelation
} = require("../lib/supabase-relations.ts");
const {
  getCandidateJobAlertEligibility
} = require("../lib/candidate-job-alert-eligibility.ts");
const {
  getCandidateJobAlertPreferenceSignals,
  summarizeCandidateJobAlerts
} = require("../lib/candidate-job-alert-insights.ts");
const {
  buildCvLibraryMatchingProfile,
  getCvLibraryParsingStatus,
  inferCvLibraryCandidateName,
  summarizeCvLibraryDocuments
} = require("../lib/cv-library-insights.ts");
const {
  getCompatibleUncontactedCandidateLeads,
  summarizeCompatibleCandidateLeads
} = require("../lib/job-compatible-candidate-leads.ts");
const {
  getCandidateCvAnalysis
} = require("../lib/candidate-cv-analysis.ts");
const {
  buildCandidateJobOpportunities,
  summarizeCandidateJobsWorkspace
} = require("../lib/candidate-job-insights.ts");
const {
  getAdminPlatformRecommendations,
  getRecruiterPlatformRecommendations
} = require("../lib/platform-recommendations.ts");
const {
  getJobQualityReport
} = require("../lib/job-quality.ts");
const {
  getJobPublicationChecklist
} = require("../lib/job-publication-checklist.ts");
const {
  buildJobPostingJsonLd,
  getJobCanonicalUrl,
  getJobSeoDescription
} = require("../lib/job-posting-seo.ts");
const {
  EXPECTED_PRODUCTION_SITE_URL,
  getLaunchReadinessChecks
} = require("../lib/launch-readiness.ts");
const {
  getEmailProviderReadinessChecks
} = require("../lib/email-provider-readiness.ts");
const {
  validateCandidateUploadFile
} = require("../lib/candidate-document-validation.ts");
const {
  getDashboardNavigation,
  getDashboardPrimaryAction,
  getDashboardRoleLabel,
  getDashboardSupportMessages
} = require("../lib/dashboard-navigation.ts");

const fixedNow = new Date("2026-04-23T12:00:00.000Z").getTime();

function useFixedNow(t) {
  const originalNow = Date.now;
  Date.now = () => fixedNow;
  t.after(() => {
    Date.now = originalNow;
  });
}

function buildJob(overrides = {}) {
  return {
    id: "job-commercial",
    title: "Commercial B2B grands comptes",
    slug: "commercial-b2b-grands-comptes",
    organization_id: "org-1",
    department: "Commercial",
    location: "Antananarivo",
    contract_type: "CDI",
    work_mode: "Hybride",
    sector: "Commercial",
    summary: "Developper un portefeuille B2B, piloter la prospection et closer des comptes strategiques.",
    responsibilities: "Prospection, CRM, closing et suivi grands comptes.",
    requirements: "Experience B2B, negociation, CRM et gestion de pipeline.",
    benefits: "Package fixe et variable.",
    salary_min: null,
    salary_max: null,
    salary_currency: "MGA",
    salary_period: "month",
    salary_is_visible: false,
    status: "published",
    is_featured: false,
    published_at: "2026-04-10T08:00:00.000Z",
    closing_at: null,
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
    applications_count: 0,
    organization_name: "Madajob",
    ...overrides
  };
}

function buildApplication(overrides = {}) {
  return {
    id: "application-1",
    status: "screening",
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-10T08:00:00.000Z",
    candidate_id: "candidate-1",
    job_id: "job-1",
    cover_letter: null,
    has_cv: false,
    candidate_name: "Miora Randriam",
    candidate_email: "miora@example.com",
    job_title: "Commercial B2B grands comptes",
    job_location: "Antananarivo",
    interview_signal: {
      interviews_count: 0,
      feedback_count: 0,
      latest_interview_at: null,
      latest_interview_status: null,
      next_interview_at: null,
      pending_feedback: false,
      latest_feedback: null
    },
    ...overrides
  };
}

function buildCandidate(overrides = {}) {
  return {
    id: "candidate-1",
    full_name: "Miora Randriam",
    email: "miora@example.com",
    phone: null,
    headline: "Commerciale B2B",
    skills_text: "prospection CRM closing",
    city: "Antananarivo",
    country: "Madagascar",
    current_position: "Commerciale",
    desired_position: "Commercial B2B grands comptes",
    desired_contract_type: "",
    desired_work_mode: "",
    desired_salary_min: null,
    desired_salary_currency: "MGA",
    desired_sectors: [],
    desired_locations: [],
    desired_experience_level: "",
    profile_completion: 88,
    applications_count: 0,
    latest_application_at: null,
    latest_status: null,
    latest_job_title: null,
    latest_job_location: null,
    has_primary_cv: true,
    primary_cv: null,
    ...overrides
  };
}

function buildNotification(overrides = {}) {
  return {
    id: "notification-1",
    user_id: "user-1",
    kind: "application",
    title: "Nouveau signal",
    body: "Action a traiter",
    link_href: "/app/recruteur/candidatures",
    is_read: false,
    read_at: null,
    created_at: "2026-04-22T08:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

function buildCandidateJobAlert(overrides = {}) {
  return {
    id: "candidate-alert-1",
    candidate_id: "candidate-1",
    job_post_id: "job-commercial",
    match_score: 84,
    match_level: "fort",
    match_reason: "Contrat, mode de travail et competences alignes.",
    metadata: {},
    created_at: "2026-04-22T08:00:00.000Z",
    updated_at: "2026-04-22T08:00:00.000Z",
    job: buildJob({
      salary_min: 1200000,
      salary_max: 1800000,
      salary_is_visible: true
    }),
    ...overrides
  };
}

function buildCvLibraryDocument(overrides = {}) {
  return {
    id: "cv-library-1",
    organization_id: "org-1",
    uploaded_by: "user-1",
    source_label: "Import test",
    candidate_name: "Miora Randriam",
    candidate_email: null,
    candidate_phone: null,
    bucket_id: "cv-library",
    storage_path: "org-1/cv.pdf",
    file_name: "CV_Miora_Randriam.pdf",
    mime_type: "application/pdf",
    file_size: 120000,
    parsing_status: "parsed",
    parsing_error: null,
    parsed_text:
      "Commercial B2B grands comptes Antananarivo CDI Hybride prospection CRM closing negociation portefeuille strategique",
    ai_summary: {},
    tags: ["test"],
    is_archived: false,
    created_at: "2026-04-22T08:00:00.000Z",
    updated_at: "2026-04-22T08:00:00.000Z",
    download_url: null,
    ...overrides
  };
}

function buildUser(overrides = {}) {
  return {
    id: "user-1",
    email: "recruteur@example.com",
    full_name: "Recruteur Test",
    role: "recruteur",
    organization_id: null,
    organization_name: null,
    phone: null,
    is_active: true,
    created_at: "2026-04-20T08:00:00.000Z",
    updated_at: "2026-04-20T08:00:00.000Z",
    invitation_sent_at: "2026-04-21T08:00:00.000Z",
    last_admin_action_at: null,
    headline: "",
    city: "",
    current_position: "",
    candidate_profile_completion: null,
    applications_count: 0,
    jobs_count: 0,
    ...overrides
  };
}

function buildOrganization(overrides = {}) {
  return {
    id: "org-1",
    name: "Client Test",
    slug: "client-test",
    kind: "client",
    is_active: true,
    members_count: 0,
    recruiters_count: 0,
    active_jobs_count: 0,
    applications_count: 0,
    shortlist_count: 0,
    latest_job_at: null,
    latest_application_at: null,
    ...overrides
  };
}

function buildEmail(overrides = {}) {
  return {
    id: "email-1",
    recipient_email: "candidat@example.com",
    recipient_name: null,
    recipient_user_id: null,
    template_key: "application_status_changed",
    subject: "Mise a jour",
    preview_text: "Votre dossier avance",
    link_href: "/app/candidat/candidatures",
    status: "failed",
    provider: null,
    provider_message_id: null,
    attempts_count: 1,
    last_attempt_at: "2026-04-22T08:00:00.000Z",
    sent_at: null,
    error_message: "Provider non configure",
    metadata: {},
    created_at: "2026-04-22T08:00:00.000Z",
    updated_at: "2026-04-22T09:00:00.000Z",
    ...overrides
  };
}

test("job fallbacks: conservent les jeux de secours hors Supabase", () => {
  assert.equal(fallbackJobs.length, 4);
  assert.equal(fallbackJobs[0].status, "published");
  assert.equal(fallbackApplications.length, 2);
  assert.equal(fallbackRecruiterApplications[0].interview_signal.feedback_count, 1);
  assert.equal(fallbackInterviews[0].application_id, "recruiter-app-1");
  assert.equal(fallbackCandidateProfile.country, "Madagascar");
  assert.equal(fallbackCandidateProfile.job_alerts_enabled, true);
});

test("candidate document records: normalisent les documents et liens signes", async () => {
  const document = mapCandidateDocumentRecord({
    id: "document-1",
    document_type: "cv",
    bucket_id: "candidate-cv",
    storage_path: "candidate-1/cv.pdf",
    file_name: "CV.pdf",
    mime_type: "application/pdf",
    file_size: 120000,
    is_primary: true,
    created_at: "2026-04-20T08:00:00.000Z"
  });
  const storageCalls = [];
  const signedUrl = await createSignedUrlForDocument(
    {
      storage: {
        from(bucketId) {
          return {
            async createSignedUrl(storagePath, expiresIn) {
              storageCalls.push({ bucketId, storagePath, expiresIn });
              return { data: { signedUrl: "https://signed.example/cv.pdf" } };
            }
          };
        }
      }
    },
    document
  );

  assert.equal(document.bucket_id, "candidate-cv");
  assert.equal(document.storage_path, "candidate-1/cv.pdf");
  assert.equal(document.is_primary, true);
  assert.equal(signedUrl, "https://signed.example/cv.pdf");
  assert.deepEqual(storageCalls, [
    {
      bucketId: "candidate-cv",
      storagePath: "candidate-1/cv.pdf",
      expiresIn: 1200
    }
  ]);
  assert.equal(await createSignedUrlForDocument(null, document), null);
  assert.equal(
    await createSignedUrlForDocument(
      { storage: { from: () => ({ createSignedUrl: async () => ({ data: null }) }) } },
      { ...document, storage_path: "" }
    ),
    null
  );
});

test("job record mappers: normalisent les valeurs Supabase des offres", () => {
  assert.equal(getNumericRecordValue({ salary_min: "1200000" }, "salary_min"), 1200000);
  assert.equal(getNumericRecordValue({ salary_min: "invalide" }, "salary_min"), null);
  assert.deepEqual(
    getStringArrayRecordValue({ desired_sectors: [" RH ", "", "Commercial"] }, "desired_sectors"),
    ["RH", "Commercial"]
  );

  const job = mapJobRecord({
    id: "job-record",
    title: "Responsable RH",
    slug: "responsable-rh",
    location: "Antananarivo",
    contract_type: "CDI",
    work_mode: "Hybride",
    sector: "RH",
    summary: "Piloter les recrutements.",
    salary_min: "1200000",
    salary_max: "invalide",
    salary_is_visible: true,
    status: "published",
    is_featured: true,
    published_at: "2026-04-20T08:00:00.000Z"
  });

  assert.equal(job.salary_min, 1200000);
  assert.equal(job.salary_max, null);
  assert.equal(job.salary_currency, "MGA");
  assert.equal(job.salary_period, "month");
  assert.equal(job.organization_name, "Madajob");
  assert.equal(job.status, "published");

  const managedJob = mapManagedJobRecord({
    ...job,
    organization_id: "org-1",
    created_at: "2026-04-19T08:00:00.000Z",
    updated_at: "2026-04-21T08:00:00.000Z",
    applications_count: 4
  });

  assert.equal(managedJob.organization_id, "org-1");
  assert.equal(managedJob.applications_count, 4);
  assert.equal(managedJob.updated_at, "2026-04-21T08:00:00.000Z");
});

test("interview record mappers: construisent les signaux candidat et recruteur", (t) => {
  useFixedNow(t);

  const interviewRows = [
    {
      id: "interview-latest",
      application_id: "application-interviews",
      status: "scheduled",
      format: "video",
      starts_at: "2026-04-25T09:00:00.000Z",
      timezone: "Indian/Antananarivo",
      meeting_url: "https://meet.example/latest",
      interviewer_name: "Equipe Madajob",
      created_at: "2026-04-20T08:00:00.000Z",
      updated_at: "2026-04-20T08:00:00.000Z"
    },
    {
      id: "interview-next",
      application_id: "application-interviews",
      status: "scheduled",
      format: "phone",
      starts_at: "2026-04-24T09:00:00.000Z",
      timezone: "Indian/Antananarivo",
      location: "Antananarivo",
      meeting_url: "https://meet.example/next",
      interviewer_name: "Equipe Madajob",
      created_at: "2026-04-20T08:00:00.000Z",
      updated_at: "2026-04-20T08:00:00.000Z"
    },
    {
      id: "interview-feedback",
      application_id: "application-interviews",
      status: "completed",
      format: "video",
      starts_at: "2026-04-21T09:00:00.000Z",
      interviewer_name: "Equipe Madajob",
      created_at: "2026-04-20T08:00:00.000Z",
      updated_at: "2026-04-21T10:00:00.000Z",
      feedback: {
        id: "feedback-1",
        interview_id: "interview-feedback",
        application_id: "application-interviews",
        summary: "Bon echange.",
        strengths: "Communication claire.",
        concerns: "",
        recommendation: "yes",
        proposed_decision: "advance",
        next_action: "schedule_next_interview",
        author: { full_name: "Admin Madajob", email: "admin@madajob.mg" },
        created_at: "2026-04-21T10:30:00.000Z",
        updated_at: "2026-04-21T10:30:00.000Z"
      }
    },
    {
      id: "interview-pending-feedback",
      application_id: "application-interviews",
      status: "completed",
      format: "onsite",
      starts_at: "2026-04-22T09:00:00.000Z",
      interviewer_name: "Equipe Madajob",
      created_at: "2026-04-20T08:00:00.000Z",
      updated_at: "2026-04-22T10:00:00.000Z"
    }
  ];

  const mappedInterview = mapApplicationInterviewRecord(interviewRows[0], {
    full_name: "Planificateur Madajob",
    email: "planning@madajob.mg"
  });

  assert.equal(mappedInterview.scheduled_by_name, "Planificateur Madajob");
  assert.equal(mappedInterview.scheduled_by_email, "planning@madajob.mg");

  const recruiterSignal = buildRecruiterApplicationInterviewSignalMap(interviewRows).get(
    "application-interviews"
  );
  const candidateSignal = buildCandidateApplicationInterviewSignalMap(interviewRows).get(
    "application-interviews"
  );

  assert.equal(recruiterSignal.interviews_count, 4);
  assert.equal(recruiterSignal.feedback_count, 1);
  assert.equal(recruiterSignal.pending_feedback, true);
  assert.equal(recruiterSignal.latest_interview_at, "2026-04-25T09:00:00.000Z");
  assert.equal(recruiterSignal.next_interview_at, "2026-04-24T09:00:00.000Z");
  assert.equal(recruiterSignal.latest_feedback.author_name, "Admin Madajob");
  assert.equal(candidateSignal.interviews_count, 4);
  assert.equal(candidateSignal.latest_interview_at, "2026-04-25T09:00:00.000Z");
  assert.equal(candidateSignal.next_interview_at, "2026-04-24T09:00:00.000Z");
  assert.equal(candidateSignal.next_interview_format, "phone");
  assert.equal(candidateSignal.next_interview_meeting_url, "https://meet.example/next");
});

test("supabase relations: normalise les relations objet ou tableau", () => {
  const jobRelation = { id: "job-1", title: "Commercial B2B", organization_id: "org-1" };

  assert.equal(normalizeSupabaseRelation(null), null);
  assert.deepEqual(normalizeSupabaseRelation([jobRelation]), jobRelation);
  assert.deepEqual(normalizeSupabaseRelation(jobRelation), jobRelation);
  assert.deepEqual(normalizeSupabaseRelation([]), null);
  assert.equal(normalizeJobRelation([jobRelation]).organization_id, "org-1");
});

test("matching: detecte un fort alignement candidat/offre", () => {
  const profile = {
    headline: "Commerciale B2B grands comptes",
    city: "Antananarivo",
    current_position: "Account executive B2B",
    desired_position: "Commercial B2B grands comptes",
    skills_text: "prospection CRM closing negociation comptes strategiques",
    cv_text: "developpement commercial B2B, gestion de pipeline et closing",
    profile_completion: 92
  };
  const match = getCandidateJobMatch(profile, buildJob());

  assert.equal(match.hasSignal, true);
  assert.ok(match.score >= 70);
  assert.match(match.reason, /poste|cible|competences/i);
  assert.ok(match.matchedKeywords.length > 0);
});

test("matching: retourne un signal faible quand le profil est vide", () => {
  const match = getCandidateJobMatch({ city: "Antananarivo" }, buildJob());

  assert.equal(match.score, 0);
  assert.equal(match.hasSignal, false);
  assert.equal(match.level, "faible");
  assert.equal(match.breakdown.length, 5);
});

test("matching: classe les offres par score decroissant", () => {
  const profile = {
    desired_position: "Commercial B2B grands comptes",
    skills_text: "prospection CRM closing B2B",
    city: "Antananarivo",
    profile_completion: 80
  };
  const ranked = rankJobsForCandidate(profile, [
    buildJob({
      id: "job-finance",
      title: "Responsable administratif et financier",
      slug: "responsable-administratif-financier",
      sector: "Finance",
      summary: "Piloter la comptabilite, le controle et les reportings financiers.",
      requirements: "Comptabilite, fiscalite et reporting.",
      responsibilities: "Clotures comptables et suivi budgetaire."
    }),
    buildJob()
  ]);

  assert.equal(ranked[0].job.id, "job-commercial");
  assert.ok(ranked[0].match.score > ranked[1].match.score);
});

test("matching: priorise les preferences candidat de contrat, mode et salaire", () => {
  const profile = {
    desired_position: "",
    skills_text: "",
    city: "Antananarivo",
    desired_contract_type: "CDI",
    desired_work_mode: "Hybride",
    desired_salary_min: 1500000,
    desired_salary_currency: "MGA",
    profile_completion: 82
  };
  const aligned = getCandidateJobMatch(
    profile,
    buildJob({
      salary_min: 1600000,
      salary_max: 2200000,
      salary_currency: "MGA",
      salary_period: "month",
      salary_is_visible: true
    })
  );
  const lessAligned = getCandidateJobMatch(
    profile,
    buildJob({
      contract_type: "CDD",
      work_mode: "Presentiel",
      salary_min: 1100000,
      salary_max: 1300000,
      salary_currency: "MGA",
      salary_period: "month",
      salary_is_visible: true
    })
  );

  assert.ok(aligned.score > lessAligned.score);
  assert.ok(aligned.breakdown.some((item) => item.key === "preferences"));
  assert.match(
    aligned.breakdown.find((item) => item.key === "preferences").value,
    /contrat CDI aligne|mode Hybride aligne|remuneration visible compatible/i
  );
});

test("matching: integre les preferences avancees de secteur, lieu et niveau", () => {
  const profile = {
    desired_position: "",
    skills_text: "",
    city: "",
    desired_sectors: ["Commercial"],
    desired_locations: ["Antananarivo"],
    desired_experience_level: "Senior",
    profile_completion: 82
  };
  const aligned = getCandidateJobMatch(
    profile,
    buildJob({
      title: "Senior commercial B2B",
      sector: "Commercial",
      location: "Antananarivo",
      requirements: "Experience senior en negociation B2B et CRM."
    })
  );
  const lessAligned = getCandidateJobMatch(
    profile,
    buildJob({
      title: "Comptable junior",
      sector: "Finance",
      location: "Toamasina",
      requirements: "Premiere experience en comptabilite."
    })
  );

  assert.ok(aligned.score > lessAligned.score);
  assert.match(
    aligned.breakdown.find((item) => item.key === "preferences").value,
    /secteur cible aligne|lieu souhaite aligne|niveau Senior visible/i
  );
});

test("candidate job alerts: valide une nouvelle offre compatible avec les preferences", () => {
  const profile = {
    headline: "Commerciale B2B",
    city: "Antananarivo",
    current_position: "Account executive B2B",
    desired_position: "Commercial B2B grands comptes",
    desired_contract_type: "CDI",
    desired_work_mode: "Hybride",
    desired_salary_min: 1500000,
    desired_salary_currency: "MGA",
    skills_text: "prospection CRM closing negociation comptes strategiques",
    cv_text: "developpement commercial B2B, gestion de pipeline et closing",
    profile_completion: 92
  };

  const eligibility = getCandidateJobAlertEligibility(
    profile,
    buildJob({
      salary_min: 1600000,
      salary_max: 2200000,
      salary_currency: "MGA",
      salary_period: "month",
      salary_is_visible: true
    })
  );

  assert.equal(eligibility.eligible, true);
  assert.ok(eligibility.match.score >= 60);
  assert.match(eligibility.reasons.join(" "), /contrat CDI aligne/i);
  assert.match(eligibility.reasons.join(" "), /mode Hybride aligne/i);
  assert.match(eligibility.reasons.join(" "), /remuneration compatible/i);
});

test("candidate job alerts: bloque une offre sous le salaire minimum visible", () => {
  const profile = {
    headline: "Commerciale B2B",
    city: "Antananarivo",
    current_position: "Account executive B2B",
    desired_position: "Commercial B2B grands comptes",
    desired_contract_type: "CDI",
    desired_work_mode: "Hybride",
    desired_salary_min: 2500000,
    desired_salary_currency: "MGA",
    skills_text: "prospection CRM closing negociation comptes strategiques",
    cv_text: "developpement commercial B2B, gestion de pipeline et closing",
    profile_completion: 92
  };

  const eligibility = getCandidateJobAlertEligibility(
    profile,
    buildJob({
      salary_min: 1600000,
      salary_max: 2200000,
      salary_currency: "MGA",
      salary_period: "month",
      salary_is_visible: true
    })
  );

  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.blockedReasons.join(" "), /sous le minimum souhaite/i);
});

test("candidate job alert insights: resume le centre candidat par preferences", () => {
  const profile = buildCandidate({
    desired_contract_type: "CDI",
    desired_work_mode: "Hybride",
    desired_salary_min: 1500000,
    desired_salary_currency: "MGA",
    desired_sectors: ["Commercial"],
    desired_locations: ["Antananarivo"],
    desired_experience_level: "Senior"
  });
  const alerts = [
    buildCandidateJobAlert(),
    buildCandidateJobAlert({
      id: "candidate-alert-2",
      match_score: 62,
      match_level: "bon",
      created_at: "2026-04-01T08:00:00.000Z",
      job: buildJob({
        id: "job-2",
        salary_is_visible: false
      })
    })
  ];
  const summary = summarizeCandidateJobAlerts(alerts, profile, fixedNow);
  const preferenceSignals = getCandidateJobAlertPreferenceSignals(profile);

  assert.equal(summary.totalCount, 2);
  assert.equal(summary.strongCount, 1);
  assert.equal(summary.recentCount, 1);
  assert.equal(summary.visibleSalaryCount, 1);
  assert.equal(summary.topAlert.id, "candidate-alert-1");
  assert.deepEqual(
    preferenceSignals.map((signal) => signal.label),
    ["Contrat", "Mode", "Salaire minimum", "Secteurs", "Lieux", "Niveau"]
  );
});

test("job compatible candidate leads: exclut les profils deja engages", () => {
  const job = buildJob();
  const candidates = [
    buildCandidate({
      id: "lead-ready",
      profile_completion: 92,
      has_primary_cv: true
    }),
    buildCandidate({
      id: "same-job",
      profile_completion: 92,
      has_primary_cv: true
    }),
    buildCandidate({
      id: "active-elsewhere",
      profile_completion: 92,
      has_primary_cv: true
    }),
    buildCandidate({
      id: "shortlist-elsewhere",
      profile_completion: 92,
      has_primary_cv: true
    }),
    buildCandidate({
      id: "weak-match",
      headline: "",
      city: "Mahajanga",
      current_position: "",
      desired_position: "",
      skills_text: "",
      cv_text: "",
      profile_completion: 10,
      has_primary_cv: false
    })
  ];
  const applications = [
    buildApplication({
      id: "same-job-app",
      candidate_id: "same-job",
      job_id: job.id,
      status: "rejected"
    }),
    buildApplication({
      id: "active-app",
      candidate_id: "active-elsewhere",
      job_id: "job-other",
      status: "screening"
    }),
    buildApplication({
      id: "shortlist-app",
      candidate_id: "shortlist-elsewhere",
      job_id: "job-other",
      status: "shortlist"
    })
  ];

  const leads = getCompatibleUncontactedCandidateLeads({
    job,
    candidates,
    applications,
    minScore: 60,
    limit: 10
  });
  const summary = summarizeCompatibleCandidateLeads(leads);

  assert.deepEqual(
    leads.map((lead) => lead.candidate.id),
    ["lead-ready"]
  );
  assert.equal(summary.totalCount, 1);
  assert.equal(summary.withCvCount, 1);
  assert.ok(leads[0].signals.includes("Non contacte"));
  assert.ok(leads[0].signals.includes("Sans candidature active"));
});

test("cv library: prepare un CV importe pour le matching sans candidat", () => {
  const document = buildCvLibraryDocument();
  const profile = buildCvLibraryMatchingProfile(document);
  const match = getCandidateJobMatch(profile, buildJob());
  const summary = summarizeCvLibraryDocuments([
    document,
    buildCvLibraryDocument({
      id: "cv-library-2",
      file_name: "archive.docx",
      parsing_status: "unsupported",
      parsed_text: "",
      created_at: "2026-03-20T08:00:00.000Z"
    }),
    buildCvLibraryDocument({
      id: "cv-library-3",
      file_name: "scan.pdf",
      parsing_status: "failed",
      parsed_text: "",
      created_at: "2026-03-18T08:00:00.000Z"
    })
  ], fixedNow);

  assert.equal(inferCvLibraryCandidateName("CV_Miora_Randriam.pdf"), "Miora Randriam");
  assert.equal(getCvLibraryParsingStatus("profil.pdf", "application/pdf", "texte"), "parsed");
  assert.equal(getCvLibraryParsingStatus("profil.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ""), "unsupported");
  assert.ok(match.score >= 60);
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.parsedCount, 1);
  assert.equal(summary.unsupportedCount, 1);
  assert.equal(summary.failedCount, 1);
  assert.equal(summary.recentCount, 1);
});

test("cv analysis: exploite le texte extrait du CV meme sans profil formulaire", () => {
  const analysis = getCandidateCvAnalysis({
    headline: "",
    bio: "",
    city: "Antananarivo",
    current_position: "",
    desired_position: "",
    skills_text: "",
    experience_years: null,
    primary_cv: { id: "primary-cv" },
    documentsCount: 1,
    cv_text:
      "Bachelor marketing and business. Grace a plus de 4 ans d'experience dans la vente B2B, " +
      "la prospection et le closing, le candidat a occupe des postes Account Executive SMB chez Revolut, " +
      "Business Development Representative chez Skello et Business Developer en alternance. " +
      "Experience concrete sur CRM, MEDDIC, prospection, pipeline commercial, objectifs de revenus, " +
      "qualification de leads, demonstrations produit, negociations et suivi grands comptes. " +
      "Langues: French, Anglais, Malgache. Maitrise des cycles de vente courts et longs, relation client, " +
      "collaboration avec les equipes marketing, reporting et developpement de portefeuille."
  });

  assert.ok(analysis.score >= 80);
  assert.equal(analysis.label, "Lecture CV exploitable");
  assert.match(
    analysis.signals.find((signal) => signal.label === "Cible").value,
    /business development|vente b2b/i
  );
  assert.ok(
    analysis.strengths.some((strength) => /detectee dans le CV/i.test(strength))
  );
});

test("candidate jobs: remonte les offres sauvegardees dans le cockpit candidat", () => {
  const profile = {
    desired_position: "Commercial B2B grands comptes",
    skills_text: "prospection CRM closing B2B",
    city: "Antananarivo",
    profile_completion: 80
  };
  const savedJob = buildJob({
    id: "job-saved",
    slug: "commercial-b2b-sauvegarde",
    published_at: "2026-04-09T08:00:00.000Z"
  });
  const opportunities = buildCandidateJobOpportunities(
    [buildJob(), savedJob],
    [],
    profile,
    new Map([
      [
        "job-saved",
        {
          job_post_id: "job-saved",
          note: "Verifier le package et la zone de prospection avant de postuler.",
          created_at: "2026-04-23T08:00:00.000Z"
        }
      ]
    ])
  );
  const summary = summarizeCandidateJobsWorkspace(opportunities);
  const savedOpportunity = opportunities.find((entry) => entry.job.id === "job-saved");

  assert.equal(summary.savedCount, 1);
  assert.ok(savedOpportunity);
  assert.equal(savedOpportunity.isSaved, true);
  assert.match(savedOpportunity.savedJob.note, /package/);
  assert.equal(opportunities[0].job.id, "job-saved");
});

test("recommendations: priorise les dossiers recruteur bloques", (t) => {
  useFixedNow(t);

  const recommendations = getRecruiterPlatformRecommendations({
    jobs: [
      buildJob(),
      buildJob({
        id: "job-draft",
        slug: "brouillon-ancien",
        status: "draft",
        published_at: null,
        created_at: "2026-04-18T08:00:00.000Z",
        updated_at: "2026-04-18T08:00:00.000Z"
      })
    ],
    applications: [buildApplication()],
    candidates: [buildCandidate()],
    notifications: [buildNotification()]
  });

  assert.equal(recommendations[0].id, "stalled-applications");
  assert.ok(recommendations.some((recommendation) => recommendation.id === "missing-cv-applications"));
  assert.ok(
    recommendations.some(
      (recommendation) => recommendation.id === "published-jobs-without-applications"
    )
  );
  assert.equal(
    recommendations.find((recommendation) => recommendation.id === "stalled-applications").href,
    "/app/recruteur/candidatures"
  );
});

test("recommendations: remonte les risques admin avant les signaux secondaires", (t) => {
  useFixedNow(t);

  const recommendations = getAdminPlatformRecommendations({
    jobs: [],
    applications: [],
    candidates: [],
    notifications: [],
    users: [buildUser()],
    organizations: [buildOrganization()],
    emails: [buildEmail(), buildEmail({ id: "email-2", status: "queued" })]
  });

  assert.equal(recommendations[0].id, "admin-users-without-access");
  assert.ok(recommendations.some((recommendation) => recommendation.id === "admin-email-failures"));
  assert.ok(
    recommendations.some(
      (recommendation) => recommendation.id === "admin-organizations-without-recruiter"
    )
  );
});

test("job quality: bloque une annonce trop vague avant publication", () => {
  const report = getJobQualityReport({
    title: "Manager",
    summary: "Poste a pourvoir rapidement.",
    responsibilities: "",
    requirements: "",
    benefits: "",
    closing_at: null
  });

  assert.equal(report.readyForPublication, false);
  assert.ok(report.score < 70);
  assert.deepEqual(
    report.alerts.map((alert) => alert.key),
    ["vague_title", "missing_skills", "missing_salary", "missing_closing_date"]
  );
});

test("job quality: valide une annonce exploitable avec salaire et cloture", () => {
  const report = getJobQualityReport({
    title: "Responsable commercial B2B grands comptes",
    summary: "Piloter la prospection, le pipeline et le developpement des comptes strategiques.",
    responsibilities: "Structurer les campagnes de prospection, qualifier les leads et suivre le CRM.",
    requirements: "Experience B2B, negociation, CRM et gestion de pipeline commercial.",
    benefits: "Primes de performance et accompagnement terrain.",
    salary_min: 1200000,
    salary_max: 1800000,
    salary_currency: "MGA",
    salary_period: "month",
    salary_is_visible: true,
    closing_at: "2026-05-30T23:59:59.000Z"
  });

  assert.equal(report.readyForPublication, true);
  assert.equal(report.alerts.length, 0);
  assert.ok(report.score >= 85);
});

test("job publication checklist: remonte les points avant diffusion", () => {
  const job = buildJob({
    status: "draft",
    salary_min: 1200000,
    salary_max: 1800000,
    salary_is_visible: true,
    closing_at: "2026-05-30T23:59:59.000Z"
  });
  const report = getJobQualityReport(job);
  const checklist = getJobPublicationChecklist(job, report, {
    previewHref: "/app/admin/offres/job-commercial/apercu"
  });

  assert.equal(checklist.totalCount, 5);
  assert.equal(checklist.readyCount, 4);
  assert.equal(checklist.tone, "info");
  assert.equal(checklist.items.find((item) => item.id === "quality").complete, true);
  assert.equal(checklist.items.find((item) => item.id === "salary").complete, true);
  assert.equal(checklist.items.find((item) => item.id === "closing").complete, true);
  assert.equal(checklist.items.find((item) => item.id === "preview").actionHref, "/app/admin/offres/job-commercial/apercu");
  assert.deepEqual(
    checklist.items
      .filter((item) => !item.complete)
      .map((item) => item.id),
    ["status"]
  );
});

test("job SEO: genere un JSON-LD JobPosting complet pour Google Jobs", () => {
  const job = buildJob({
    id: "job-seo-1",
    slug: "responsable-commercial-seo",
    title: "Responsable commercial",
    department: "Commercial",
    salary_min: 1200000,
    salary_max: 1800000,
    salary_currency: "MGA",
    salary_period: "month",
    salary_is_visible: true,
    closing_at: "2026-05-30T23:59:59.000Z"
  });
  const jsonLd = buildJobPostingJsonLd(job);

  assert.equal(jsonLd["@type"], "JobPosting");
  assert.equal(jsonLd.title, "Responsable commercial");
  assert.equal(jsonLd.datePosted, "2026-04-10T08:00:00.000Z");
  assert.equal(jsonLd.validThrough, "2026-05-30T23:59:59.000Z");
  assert.equal(jsonLd.employmentType, "FULL_TIME");
  assert.equal(jsonLd.hiringOrganization.name, "Madajob");
  assert.equal(jsonLd.jobLocation.address.addressCountry, "MG");
  assert.equal(jsonLd.baseSalary.currency, "MGA");
  assert.equal(jsonLd.baseSalary.value.minValue, 1200000);
  assert.equal(jsonLd.baseSalary.value.maxValue, 1800000);
  assert.equal(
    getJobCanonicalUrl(job),
    "https://madajob-page.vercel.app/carrieres/responsable-commercial-seo"
  );
  assert.match(getJobSeoDescription(job), /Developper un portefeuille B2B/i);
});

test("launch readiness: verifie les prerequis Vercel et Supabase prod", () => {
  const readyChecks = getLaunchReadinessChecks({
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    NEXT_PUBLIC_SITE_URL: EXPECTED_PRODUCTION_SITE_URL
  });

  assert.equal(readyChecks.find((check) => check.id === "launch-vercel-env-vars").status, "ok");
  assert.equal(readyChecks.find((check) => check.id === "launch-site-url").status, "ok");
  assert.equal(
    readyChecks.find((check) => check.id === "launch-supabase-auth-redirects").value,
    "A confirmer"
  );

  const missingChecks = getLaunchReadinessChecks({
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000"
  });

  assert.equal(
    missingChecks.find((check) => check.id === "launch-vercel-env-vars").status,
    "danger"
  );
  assert.equal(missingChecks.find((check) => check.id === "launch-site-url").status, "warning");
});

test("email provider readiness: prepare Resend ou Brevo sans activer l'envoi", () => {
  const checks = getEmailProviderReadinessChecks(
    [buildEmail({ status: "queued" })],
    {
      TRANSACTIONAL_EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_key",
      TRANSACTIONAL_EMAIL_FROM: "Madajob <no-reply@madajob.mg>",
      TRANSACTIONAL_EMAILS_ENABLED: "false"
    }
  );

  assert.equal(checks.find((check) => check.id === "email-provider-choice").status, "ok");
  assert.equal(checks.find((check) => check.id === "email-provider-api-key").status, "ok");
  assert.equal(checks.find((check) => check.id === "email-provider-from").status, "ok");
  assert.equal(checks.find((check) => check.id === "email-provider-send-lock").status, "ok");
  assert.equal(checks.find((check) => check.id === "email-provider-queue-health").status, "muted");

  const unsafeChecks = getEmailProviderReadinessChecks(
    [buildEmail({ status: "failed" })],
    {
      TRANSACTIONAL_EMAIL_PROVIDER: "smtp",
      TRANSACTIONAL_EMAILS_ENABLED: "true"
    }
  );

  assert.equal(unsafeChecks.find((check) => check.id === "email-provider-choice").status, "warning");
  assert.equal(unsafeChecks.find((check) => check.id === "email-provider-from").status, "warning");
  assert.equal(unsafeChecks.find((check) => check.id === "email-provider-send-lock").status, "warning");
  assert.equal(unsafeChecks.find((check) => check.id === "email-provider-queue-health").status, "danger");
});

test("candidate documents: valide les formats d'upload cote serveur", () => {
  assert.equal(
    validateCandidateUploadFile(
      { name: "cv-heritiana.pdf", type: "application/pdf", size: 200_000 },
      "cv"
    ),
    ""
  );
  assert.equal(
    validateCandidateUploadFile(
      { name: "scan-identite.jpg", type: "image/jpeg", size: 200_000 },
      "supplementary"
    ),
    ""
  );
  assert.match(
    validateCandidateUploadFile(
      { name: "archive.zip", type: "application/zip", size: 200_000 },
      "supplementary"
    ),
    /Format non accepte/
  );
  assert.match(
    validateCandidateUploadFile(
      { name: "cv.exe", type: "", size: 200_000 },
      "cv"
    ),
    /Format non accepte/
  );
  assert.match(
    validateCandidateUploadFile(
      { name: "cv.pdf", type: "application/pdf", size: 11 * 1024 * 1024 },
      "cv"
    ),
    /10 Mo/
  );
});

test("dashboard navigation: expose les menus et actions par role", () => {
  const candidateNav = getDashboardNavigation("candidat");
  const recruiterNav = getDashboardNavigation("recruteur");
  const adminNav = getDashboardNavigation("admin");

  assert.equal(getDashboardRoleLabel("candidat"), "Candidat");
  assert.equal(getDashboardRoleLabel("recruteur"), "Recruteur");
  assert.equal(getDashboardRoleLabel("admin"), "Admin");
  assert.equal(candidateNav[0].href, "/app/candidat");
  assert.equal(candidateNav.some((item) => item.href === "/app/candidat/notifications"), true);
  assert.equal(recruiterNav.some((item) => item.href === "/app/recruteur/cvtheque"), true);
  assert.equal(recruiterNav.some((item) => item.href === "/carrieres"), true);
  assert.equal(adminNav.some((item) => item.href === "/app/admin/sante"), true);
  assert.equal(adminNav.some((item) => item.href === "/app/admin/emails"), true);
  assert.deepEqual(getDashboardPrimaryAction("admin"), {
    href: "/app/admin/offres",
    label: "Piloter les offres"
  });
  assert.equal(getDashboardSupportMessages("recruteur").length, 3);
});

test("refactor hygiene: les anciennes pages statiques racine ne reviennent pas", () => {
  const obsoleteStaticFiles = [
    "index.html",
    "carrieres.html",
    "entreprise.html",
    "formation.html",
    "externalisation.html",
    "admin-annonces.html",
    "candidat.html",
    path.join("assets", "script.js"),
    path.join("assets", "careers.js"),
    path.join("assets", "styles.css"),
    path.join("assets", "careers.css")
  ];

  assert.deepEqual(
    obsoleteStaticFiles.filter((filePath) => fs.existsSync(path.join(projectRoot, filePath))),
    []
  );
});
