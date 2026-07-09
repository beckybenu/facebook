// Le cerveau NeuralStarK : routage vers l'agent compétent + boucle agentique (tool use) via l'API Claude.
import Anthropic from "@anthropic-ai/sdk";
import { AGENTS, ROUTER_GUIDE } from "./agents.js";
import { TOOL_DEFINITIONS, executeTool } from "./tools.js";

const MODEL = process.env.NEURALSTARK_MODEL || "claude-opus-4-8";
const MAX_ITERATIONS = 12;

let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function toolsForAgent(agent) {
  if (agent.tools === "*") return TOOL_DEFINITIONS;
  return TOOL_DEFINITIONS.filter((t) => agent.tools.includes(t.name));
}

// Étape 1 — router la demande vers le bon agent (appel léger, effort bas).
export async function routeToAgent(message) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            agent: { type: "string", enum: Object.keys(AGENTS) },
          },
          required: ["agent"],
          additionalProperties: false,
        },
      },
    },
    system: `Tu es le routeur de NeuralStarK, le cerveau d'entreprise. Choisis l'agent le plus compétent pour traiter la demande.
Agents disponibles :
${ROUTER_GUIDE}
Choisis "direction" si la demande couvre plusieurs domaines à la fois ou demande une vue d'ensemble.`,
    messages: [{ role: "user", content: message }],
  });
  const text = response.content.find((b) => b.type === "text")?.text || "{}";
  try {
    const { agent } = JSON.parse(text);
    return AGENTS[agent] || AGENTS.direction;
  } catch {
    return AGENTS.direction;
  }
}

// Étape 2 — boucle agentique : l'agent raisonne et agit avec ses outils jusqu'à terminer la mission.
export async function runAgent(agent, message, history = [], onStep = () => {}) {
  const tools = toolsForAgent(agent);
  const messages = [...history, { role: "user", content: message }];
  const steps = [];
  const anthropic = getClient();

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: agent.system,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    // La boucle de tours serveur peut se mettre en pause : on relance simplement.
    if (response.stop_reason === "pause_turn") continue;

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { text, steps, messages };
    }

    const toolResults = [];
    for (const call of toolUses) {
      const result = executeTool(agent.name, call.name, call.input);
      const step = { tool: call.name, input: call.input, ok: !(result && result.error) };
      steps.push(step);
      onStep(step);
      toolResults.push({
        type: "tool_result",
        tool_use_id: call.id,
        content: JSON.stringify(result),
        ...(result && result.error ? { is_error: true } : {}),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    text: "J'ai atteint la limite d'itérations pour cette mission. Voici où j'en suis — demandez-moi de continuer si besoin.",
    steps,
    messages,
  };
}

// Point d'entrée : route puis exécute.
export async function ask(message, { agentName = "auto", history = [], onStep } = {}) {
  const agent = agentName !== "auto" && AGENTS[agentName] ? AGENTS[agentName] : await routeToAgent(message);
  const result = await runAgent(agent, message, history, onStep);
  return { agent: { name: agent.name, label: agent.label, emoji: agent.emoji }, ...result };
}
