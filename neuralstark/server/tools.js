// Outils métier exposés aux agents (définitions JSON Schema + implémentations).
import { getState, mutate, newId, logActivity } from "./store.js";
import { searchKnowledge } from "./rag.js";

export const TOOL_DEFINITIONS = [
  {
    name: "get_company_profile",
    description: "Récupère le profil de l'entreprise (nom, secteur, ton de communication, description). À consulter avant de rédiger du contenu au nom de l'entreprise.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "update_company_profile",
    description: "Met à jour le profil de l'entreprise. Ne fournir que les champs à modifier.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        sector: { type: "string" },
        tone: { type: "string", description: "Ton de communication, ex. 'professionnel et chaleureux'" },
        website: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_tasks",
    description: "Liste les tâches. Filtrable par statut.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["a_faire", "en_cours", "terminee"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "create_task",
    description: "Crée une tâche dans le gestionnaire de tâches de l'entreprise.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        notes: { type: "string" },
        priority: { type: "string", enum: ["basse", "normale", "haute"] },
        due: { type: "string", description: "Échéance au format AAAA-MM-JJ" },
        assignee: { type: "string" },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  {
    name: "update_task",
    description: "Met à jour une tâche existante (statut, titre, échéance…).",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        notes: { type: "string" },
        status: { type: "string", enum: ["a_faire", "en_cours", "terminee"] },
        priority: { type: "string", enum: ["basse", "normale", "haute"] },
        due: { type: "string" },
        assignee: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_events",
    description: "Liste les événements de l'agenda, triés par date.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "create_event",
    description: "Ajoute un rendez-vous ou une réunion à l'agenda.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        date: { type: "string", description: "AAAA-MM-JJ" },
        time: { type: "string", description: "HH:MM" },
        durationMin: { type: "integer" },
        attendees: { type: "array", items: { type: "string" } },
        location: { type: "string" },
        notes: { type: "string" },
      },
      required: ["title", "date"],
      additionalProperties: false,
    },
  },
  {
    name: "list_contacts",
    description: "Liste les contacts/clients du CRM. Filtrable par étape du pipeline.",
    input_schema: {
      type: "object",
      properties: {
        stage: { type: "string", enum: ["prospect", "qualifie", "negociation", "client", "perdu"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "upsert_contact",
    description: "Crée un contact CRM, ou le met à jour si un `id` est fourni.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Fournir uniquement pour une mise à jour" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        stage: { type: "string", enum: ["prospect", "qualifie", "negociation", "client", "perdu"] },
        tags: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "log_interaction",
    description: "Enregistre une interaction (appel, réunion, email…) dans l'historique d'un contact CRM.",
    input_schema: {
      type: "object",
      properties: {
        contactId: { type: "string" },
        summary: { type: "string" },
      },
      required: ["contactId", "summary"],
      additionalProperties: false,
    },
  },
  {
    name: "draft_email",
    description: "Rédige et enregistre un email dans la boîte d'envoi (statut brouillon). L'envoi réel est validé par un humain.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "list_emails",
    description: "Liste les emails en boîte d'envoi (brouillons et prêts).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "schedule_post",
    description: "Planifie une publication sur un réseau social (enregistrée pour validation humaine).",
    input_schema: {
      type: "object",
      properties: {
        network: { type: "string", enum: ["linkedin", "facebook", "instagram", "x", "tiktok"] },
        content: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
        scheduledFor: { type: "string", description: "AAAA-MM-JJ HH:MM" },
      },
      required: ["network", "content"],
      additionalProperties: false,
    },
  },
  {
    name: "list_posts",
    description: "Liste les publications planifiées sur les réseaux sociaux.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "kb_search",
    description: "Recherche dans la base de connaissances de l'entreprise (RAG). Retourne les passages les plus pertinents avec leur source. À utiliser dès qu'une question porte sur des informations internes de l'entreprise.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "kb_add_document",
    description: "Ajoute un document à la base de connaissances (RAG).",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "content"],
      additionalProperties: false,
    },
  },
  {
    name: "kb_list_documents",
    description: "Liste les documents de la base de connaissances (titres et tags, sans le contenu).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
];

const executors = {
  get_company_profile: () => getState().company,

  update_company_profile: (input) =>
    mutate((s) => {
      Object.assign(s.company, input);
      return s.company;
    }),

  list_tasks: ({ status } = {}) => {
    const tasks = getState().tasks;
    return status ? tasks.filter((t) => t.status === status) : tasks;
  },

  create_task: (input) =>
    mutate((s) => {
      const task = {
        id: newId("task"),
        title: input.title,
        notes: input.notes || "",
        status: "a_faire",
        priority: input.priority || "normale",
        due: input.due || null,
        assignee: input.assignee || null,
        createdAt: new Date().toISOString(),
      };
      s.tasks.push(task);
      return task;
    }),

  update_task: (input) =>
    mutate((s) => {
      const task = s.tasks.find((t) => t.id === input.id);
      if (!task) return { error: `Tâche introuvable : ${input.id}` };
      Object.assign(task, input);
      return task;
    }),

  list_events: () =>
    [...getState().events].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || ""))),

  create_event: (input) =>
    mutate((s) => {
      const event = { id: newId("evt"), durationMin: 60, ...input, createdAt: new Date().toISOString() };
      s.events.push(event);
      return event;
    }),

  list_contacts: ({ stage } = {}) => {
    const contacts = getState().contacts;
    return stage ? contacts.filter((c) => c.stage === stage) : contacts;
  },

  upsert_contact: (input) =>
    mutate((s) => {
      if (input.id) {
        const contact = s.contacts.find((c) => c.id === input.id);
        if (!contact) return { error: `Contact introuvable : ${input.id}` };
        Object.assign(contact, input);
        return contact;
      }
      const contact = {
        id: newId("ct"),
        stage: "prospect",
        tags: [],
        notes: "",
        interactions: [],
        ...input,
        createdAt: new Date().toISOString(),
      };
      s.contacts.push(contact);
      return contact;
    }),

  log_interaction: ({ contactId, summary }) =>
    mutate((s) => {
      const contact = s.contacts.find((c) => c.id === contactId);
      if (!contact) return { error: `Contact introuvable : ${contactId}` };
      contact.interactions.push({ date: new Date().toISOString(), summary });
      return contact;
    }),

  draft_email: (input) =>
    mutate((s) => {
      const email = { id: newId("em"), status: "brouillon", ...input, createdAt: new Date().toISOString() };
      s.emails.push(email);
      return email;
    }),

  list_emails: () => getState().emails,

  schedule_post: (input) =>
    mutate((s) => {
      const post = {
        id: newId("post"),
        hashtags: [],
        status: input.scheduledFor ? "planifie" : "brouillon",
        ...input,
        createdAt: new Date().toISOString(),
      };
      s.posts.push(post);
      return post;
    }),

  list_posts: () => getState().posts,

  kb_search: ({ query }) => {
    const results = searchKnowledge(query);
    if (results.length === 0) return { results: [], note: "Aucun passage pertinent trouvé dans la base de connaissances." };
    return {
      results: results.map((r) => ({ source: r.title, extrait: r.body, score: Number(r.score.toFixed(3)) })),
    };
  },

  kb_add_document: (input) =>
    mutate((s) => {
      const doc = { id: newId("doc"), tags: [], ...input, createdAt: new Date().toISOString() };
      s.documents.push(doc);
      return { id: doc.id, title: doc.title, length: doc.content.length };
    }),

  kb_list_documents: () =>
    getState().documents.map((d) => ({ id: d.id, title: d.title, tags: d.tags, createdAt: d.createdAt })),
};

export function executeTool(agentName, toolName, input) {
  const fn = executors[toolName];
  if (!fn) return { error: `Outil inconnu : ${toolName}` };
  const result = fn(input || {});
  logActivity(agentName, toolName, summarizeAction(toolName, input, result));
  return result;
}

function summarizeAction(toolName, input, result) {
  if (result && result.error) return result.error;
  switch (toolName) {
    case "create_task": return `Tâche créée : ${input.title}`;
    case "update_task": return `Tâche mise à jour : ${input.id}`;
    case "create_event": return `Événement : ${input.title} le ${input.date}`;
    case "upsert_contact": return input.id ? `Contact mis à jour : ${input.name}` : `Contact créé : ${input.name}`;
    case "log_interaction": return `Interaction enregistrée (${input.contactId})`;
    case "draft_email": return `Email rédigé → ${input.to} : « ${input.subject} »`;
    case "schedule_post": return `Post ${input.network}${input.scheduledFor ? ` planifié pour ${input.scheduledFor}` : " en brouillon"}`;
    case "kb_add_document": return `Document ajouté au RAG : ${input.title}`;
    case "kb_search": return `Recherche RAG : « ${input.query} »`;
    case "update_company_profile": return "Profil entreprise mis à jour";
    default: return toolName;
  }
}
