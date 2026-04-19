const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const express = require("express");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const multer = require("multer");

const app = express();

const PORT = Number(process.env.PORT || 4173);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const CV_UPLOADS_DIR = path.join(UPLOADS_DIR, "cv");
const DB_PATH = path.join(DATA_DIR, "madajob-careers.db");
const SESSION_SECRET = process.env.SESSION_SECRET || "madajob-careers-local-secret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@madajob.mg";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "MadajobAdmin2026!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrateur Madajob";

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(CV_UPLOADS_DIR, { recursive: true });

const SQLiteStore = SQLiteStoreFactory(session);
const db = new Database(DB_PATH);

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
      "Assurer le suivi du pipe commercial et la négociation jusqu'à la signature."
    ],
    profile: [
      "Expérience confirmée en développement commercial B2B.",
      "Bonne capacité de négociation et sens du résultat.",
      "Excellente communication en français, aisance relationnelle."
    ],
    benefits: [
      "Package motivant selon profil.",
      "Environnement dynamique et orienté performance.",
      "Possibilités d'évolution au sein de projets à fort impact."
    ],
    closingDate: "2026-05-20",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: true,
    published: true,
    createdAt: "2026-04-19T08:00:00.000Z"
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
      "Rédiger les rapports d'incident et alerter en cas d'anomalie."
    ],
    profile: [
      "Première expérience en sécurité ou gardiennage souhaitée.",
      "Rigueur, vigilance et ponctualité.",
      "Bonne présentation et sens des responsabilités."
    ],
    benefits: ["Mission stable en environnement structuré.", "Encadrement opérationnel de proximité."],
    closingDate: "2026-05-05",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: false,
    published: true,
    createdAt: "2026-04-18T10:15:00.000Z"
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
      "Sécuriser les relations avec les partenaires financiers et fournisseurs."
    ],
    profile: [
      "Expérience confirmée en RAF ou poste similaire.",
      "Très bonne maîtrise des états financiers et de la gestion budgétaire.",
      "Leadership, rigueur et sens de l'organisation."
    ],
    benefits: ["Poste clé avec forte autonomie.", "Responsabilités transverses et impact direct sur la performance."],
    closingDate: "2026-05-12",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: true,
    published: true,
    createdAt: "2026-04-17T09:40:00.000Z"
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
      "Appuyer les équipes RH et finance dans les tâches de coordination."
    ],
    profile: [
      "Bonne maîtrise des outils bureautiques.",
      "Sens du détail, discrétion et fiabilité.",
      "Capacité à suivre plusieurs dossiers en parallèle."
    ],
    benefits: ["Poste polyvalent dans une structure organisée.", "Accompagnement à la prise de poste."],
    closingDate: "2026-05-08",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: false,
    published: true,
    createdAt: "2026-04-16T11:25:00.000Z"
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
      "Accompagner les départements sur les sujets réglementaires."
    ],
    profile: [
      "Formation en droit avec première expérience significative.",
      "Capacité d'analyse et qualité rédactionnelle.",
      "Aisance dans le travail transverse avec plusieurs départements."
    ],
    benefits: ["Missions variées à forte valeur ajoutée.", "Exposition à des dossiers stratégiques."],
    closingDate: "2026-05-18",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: false,
    published: true,
    createdAt: "2026-04-15T07:55:00.000Z"
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
      "Coordonner avec les équipes internes pour garantir la satisfaction client."
    ],
    profile: [
      "Expérience réussie en vente indirecte ou gestion de portefeuille.",
      "Très bonne capacité de négociation.",
      "Orientation résultats et sens du service client."
    ],
    benefits: ["Objectifs stimulants et environnement commercial ambitieux.", "Déplacements terrain et forte autonomie."],
    closingDate: "2026-05-25",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: true,
    published: true,
    createdAt: "2026-04-14T14:10:00.000Z"
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
      "Suivre la satisfaction et contribuer à l'amélioration du service."
    ],
    profile: [
      "Excellent relationnel et écoute active.",
      "Expression orale et écrite soignée.",
      "Capacité à gérer plusieurs demandes simultanément."
    ],
    benefits: ["Parcours encadré et montée en compétence rapide.", "Equipe dynamique orientée qualité de service."],
    closingDate: "2026-05-14",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: false,
    published: true,
    createdAt: "2026-04-13T09:05:00.000Z"
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
      "Structurer les outils RH et les pratiques de développement des talents."
    ],
    profile: [
      "Expérience solide en management RH.",
      "Bonne maîtrise du droit social et des pratiques RH.",
      "Leadership, diplomatie et sens de la confidentialité."
    ],
    benefits: ["Poste stratégique avec forte visibilité.", "Collaboration directe avec les directions opérationnelles."],
    closingDate: "2026-05-30",
    applyEmail: "recrutement@madajob.mg",
    applyUrl: "",
    featured: true,
    published: true,
    createdAt: "2026-04-12T08:45:00.000Z"
  }
];

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
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

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1 || value === "on";
}

function normalizeJobInput(input) {
  return {
    id: String(input.id || createId("MJ")).trim(),
    title: String(input.title || "").trim(),
    contract: String(input.contract || "CDI").trim(),
    location: String(input.location || "Antananarivo").trim(),
    department: String(input.department || "Recrutement").trim(),
    sector: String(input.sector || "Général").trim(),
    mode: String(input.mode || "Présentiel").trim(),
    summary: String(input.summary || "").trim(),
    missions: normalizeList(input.missions),
    profile: normalizeList(input.profile),
    benefits: normalizeList(input.benefits),
    closingDate: String(input.closingDate || "").trim(),
    applyEmail: String(input.applyEmail || "recrutement@madajob.mg").trim(),
    applyUrl: String(input.applyUrl || "").trim(),
    featured: normalizeBoolean(input.featured),
    published: input.published === undefined ? true : normalizeBoolean(input.published),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function toJobResponse(row) {
  return {
    id: row.id,
    title: row.title,
    contract: row.contract,
    location: row.location,
    department: row.department,
    sector: row.sector,
    mode: row.mode,
    summary: row.summary,
    missions: parseJsonArray(row.missions_json),
    profile: parseJsonArray(row.profile_json),
    benefits: parseJsonArray(row.benefits_json),
    closingDate: row.closing_date,
    applyEmail: row.apply_email,
    applyUrl: row.apply_url || "",
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function initDatabase() {
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      contract TEXT NOT NULL,
      location TEXT NOT NULL,
      department TEXT NOT NULL,
      sector TEXT NOT NULL,
      mode TEXT NOT NULL,
      summary TEXT NOT NULL,
      missions_json TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      benefits_json TEXT NOT NULL,
      closing_date TEXT,
      apply_email TEXT NOT NULL,
      apply_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      cover_letter TEXT,
      cv_original_name TEXT,
      cv_stored_name TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );
  `);

  const adminCount = db.prepare("SELECT COUNT(*) AS count FROM admins").get().count;
  if (!adminCount) {
    const hashed = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    db.prepare(
      `INSERT INTO admins (id, email, password_hash, name, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(createId("admin"), ADMIN_EMAIL, hashed, ADMIN_NAME, new Date().toISOString());
    console.log(`Admin Madajob créé : ${ADMIN_EMAIL}`);
  }

  const jobCount = db.prepare("SELECT COUNT(*) AS count FROM jobs").get().count;
  if (!jobCount) {
    seedJobsIntoDatabase(seedJobs);
    console.log("Annonces de démonstration créées.");
  }
}

function seedJobsIntoDatabase(jobs) {
  const insertJob = db.prepare(`
    INSERT INTO jobs (
      id, title, contract, location, department, sector, mode, summary,
      missions_json, profile_json, benefits_json, closing_date, apply_email, apply_url,
      featured, published, created_at, updated_at
    ) VALUES (
      @id, @title, @contract, @location, @department, @sector, @mode, @summary,
      @missions_json, @profile_json, @benefits_json, @closing_date, @apply_email, @apply_url,
      @featured, @published, @created_at, @updated_at
    )
  `);

  const transaction = db.transaction((items) => {
    items.forEach((job) => {
      const normalized = normalizeJobInput(job);
      insertJob.run({
        id: normalized.id,
        title: normalized.title,
        contract: normalized.contract,
        location: normalized.location,
        department: normalized.department,
        sector: normalized.sector,
        mode: normalized.mode,
        summary: normalized.summary,
        missions_json: JSON.stringify(normalized.missions),
        profile_json: JSON.stringify(normalized.profile),
        benefits_json: JSON.stringify(normalized.benefits),
        closing_date: normalized.closingDate,
        apply_email: normalized.applyEmail,
        apply_url: normalized.applyUrl,
        featured: normalized.featured ? 1 : 0,
        published: normalized.published ? 1 : 0,
        created_at: normalized.createdAt,
        updated_at: normalized.updatedAt
      });
    });
  });

  transaction(jobs);
}

initDatabase();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, CV_UPLOADS_DIR),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname || "") || ".pdf";
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
  }),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new SQLiteStore({
      dir: DATA_DIR,
      db: "madajob-sessions.db"
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  next();
}

function sanitizeApplicationRow(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title || "Annonce supprimée",
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || "",
    city: row.city || "",
    coverLetter: row.cover_letter || "",
    status: row.status,
    createdAt: row.created_at,
    hasCv: Boolean(row.cv_stored_name),
    cvOriginalName: row.cv_original_name || "",
    cvDownloadUrl: row.cv_stored_name ? `/api/admin/applications/${row.id}/cv` : ""
  };
}

function buildJobFilters(rows) {
  const unique = (key) => [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  return {
    locations: unique("location"),
    contracts: unique("contract"),
    sectors: unique("sector")
  };
}

app.post("/api/admin/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: "Email ou mot de passe invalide." });
  }

  req.session.adminId = admin.id;
  req.session.adminEmail = admin.email;
  req.session.adminName = admin.name;

  return res.json({
    ok: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }
  });
});

app.post("/api/admin/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/admin/auth/me", (req, res) => {
  if (!req.session?.adminId) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    admin: {
      id: req.session.adminId,
      email: req.session.adminEmail,
      name: req.session.adminName
    }
  });
});

app.get("/api/public/jobs", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM jobs
       WHERE published = 1
       ORDER BY featured DESC, datetime(created_at) DESC`
    )
    .all();

  const jobs = rows.map(toJobResponse);

  return res.json({
    jobs,
    filters: buildJobFilters(jobs),
    stats: {
      total: jobs.length,
      locations: new Set(jobs.map((job) => job.location)).size,
      featured: jobs.filter((job) => job.featured).length
    }
  });
});

app.get("/api/public/jobs/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM jobs WHERE id = ? AND published = 1")
    .get(req.params.id);

  if (!row) {
    return res.status(404).json({ error: "Annonce introuvable." });
  }

  return res.json({ job: toJobResponse(row) });
});

app.post("/api/public/applications", upload.single("cv"), (req, res) => {
  const jobId = String(req.body.jobId || "").trim();
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim();
  const phone = String(req.body.phone || "").trim();
  const city = String(req.body.city || "").trim();
  const coverLetter = String(req.body.coverLetter || "").trim();

  if (!jobId || !fullName || !email) {
    return res.status(400).json({ error: "Le poste, le nom complet et l'email sont obligatoires." });
  }

  const job = db.prepare("SELECT id, title, published FROM jobs WHERE id = ?").get(jobId);
  if (!job || !job.published) {
    return res.status(404).json({ error: "Cette annonce n'est plus disponible." });
  }

  const application = {
    id: createId("APP"),
    jobId,
    fullName,
    email,
    phone,
    city,
    coverLetter,
    cvOriginalName: req.file?.originalname || "",
    cvStoredName: req.file?.filename || "",
    status: "Nouvelle",
    createdAt: new Date().toISOString()
  };

  db.prepare(
    `INSERT INTO applications (
      id, job_id, full_name, email, phone, city, cover_letter, cv_original_name, cv_stored_name, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    application.id,
    application.jobId,
    application.fullName,
    application.email,
    application.phone,
    application.city,
    application.coverLetter,
    application.cvOriginalName,
    application.cvStoredName,
    application.status,
    application.createdAt
  );

  return res.status(201).json({
    ok: true,
    message: `Votre candidature pour ${job.title} a bien été enregistrée.`
  });
});

app.get("/api/admin/jobs", requireAdmin, (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM jobs ORDER BY featured DESC, datetime(created_at) DESC")
    .all();
  res.json({ jobs: rows.map(toJobResponse) });
});

app.post("/api/admin/jobs", requireAdmin, (req, res) => {
  const job = normalizeJobInput(req.body);
  if (!job.title || !job.summary) {
    return res.status(400).json({ error: "Le titre et le résumé sont obligatoires." });
  }

  db.prepare(
    `INSERT INTO jobs (
      id, title, contract, location, department, sector, mode, summary,
      missions_json, profile_json, benefits_json, closing_date, apply_email, apply_url,
      featured, published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    job.id,
    job.title,
    job.contract,
    job.location,
    job.department,
    job.sector,
    job.mode,
    job.summary,
    JSON.stringify(job.missions),
    JSON.stringify(job.profile),
    JSON.stringify(job.benefits),
    job.closingDate,
    job.applyEmail,
    job.applyUrl,
    job.featured ? 1 : 0,
    job.published ? 1 : 0,
    job.createdAt,
    job.updatedAt
  );

  res.status(201).json({ job });
});

app.put("/api/admin/jobs/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT created_at FROM jobs WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Annonce introuvable." });
  }

  const job = normalizeJobInput({ ...req.body, id: req.params.id, createdAt: existing.created_at });

  db.prepare(
    `UPDATE jobs SET
      title = ?, contract = ?, location = ?, department = ?, sector = ?, mode = ?, summary = ?,
      missions_json = ?, profile_json = ?, benefits_json = ?, closing_date = ?, apply_email = ?, apply_url = ?,
      featured = ?, published = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    job.title,
    job.contract,
    job.location,
    job.department,
    job.sector,
    job.mode,
    job.summary,
    JSON.stringify(job.missions),
    JSON.stringify(job.profile),
    JSON.stringify(job.benefits),
    job.closingDate,
    job.applyEmail,
    job.applyUrl,
    job.featured ? 1 : 0,
    job.published ? 1 : 0,
    job.updatedAt,
    job.id
  );

  res.json({ job });
});

app.delete("/api/admin/jobs/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/jobs/restore-seed", requireAdmin, (_req, res) => {
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM jobs").run();
    seedJobsIntoDatabase(seedJobs);
  });

  transaction();
  res.json({ ok: true });
});

app.get("/api/admin/applications", requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT applications.*, jobs.title AS job_title
       FROM applications
       LEFT JOIN jobs ON jobs.id = applications.job_id
       ORDER BY datetime(applications.created_at) DESC`
    )
    .all();

  res.json({ applications: rows.map(sanitizeApplicationRow) });
});

app.patch("/api/admin/applications/:id", requireAdmin, (req, res) => {
  const status = String(req.body.status || "").trim();
  const allowedStatuses = ["Nouvelle", "En revue", "Short-list", "Retenue", "Rejetée"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Statut invalide." });
  }

  const result = db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
  if (!result.changes) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }

  res.json({ ok: true });
});

app.get("/api/admin/applications/:id/cv", requireAdmin, (req, res) => {
  const application = db
    .prepare("SELECT cv_stored_name, cv_original_name FROM applications WHERE id = ?")
    .get(req.params.id);

  if (!application?.cv_stored_name) {
    return res.status(404).json({ error: "CV introuvable." });
  }

  const filePath = path.join(CV_UPLOADS_DIR, application.cv_stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier introuvable." });
  }

  return res.download(filePath, application.cv_original_name || application.cv_stored_name);
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint introuvable." });
});

app.use(express.static(ROOT_DIR));

app.use((req, res) => {
  const requested = req.path === "/" ? "index.html" : req.path.slice(1);
  const filePath = path.join(ROOT_DIR, requested);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  return res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Madajob app running on http://localhost:${PORT}`);
  console.log(`Admin local: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});
