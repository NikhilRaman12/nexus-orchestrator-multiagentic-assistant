import { GoogleGenAI } from "@google/genai";

// NEXUS Orchestrator Service - Pure Frontend Routing Engine

const model = "gemini-3-flash-preview";

// In AI Studio Build, the GEMINI_API_KEY is injected into the environment
// We access it via process.env.GEMINI_API_KEY which is handled by the platform
const apiKey = process.env.GEMINI_API_KEY || "";

// Nexus System Prompts

const NEXUS_ROUTER_PROMPT = `You are NEXUS, a blazing-fast AI orchestrator.
Your singular job is to route user intent and return a SINGLE structured JSON object in under one second.
You NEVER explain, narrate, or think out loud.
You NEVER call agents yourself — you only return a routing manifest.

═══ ROUTING RULES ═══
Read the user message. Output ONLY this JSON — nothing else:

{
  "intent": "<TASK_CREATE|TASK_LIST|TASK_UPDATE|EVENT_SCHEDULE|NOTE_LOG|NOTE_RETRIEVE|INFO_FETCH|SUMMARIZE|PUBLISH|MULTI>",
  "agents": ["TaskAgent"],   // ONLY agents actually needed
  "params": {
    "title": "",
    "deadline": "",
    "priority": "medium",
    "description": "",
    "event_date": "",
    "event_title": "",
    "note_content": "",
    "query": "",
    "publish_targets": ["dashboard"]
  },
  "parallel": true,
  "stream": true
}

═══ AGENT SELECTION ═══
- "create a task" → ["TaskAgent"]
- "schedule a meeting" → ["CalendarAgent"]
- "create task and add to calendar" → ["TaskAgent","CalendarAgent"], parallel: true
- "summarize notes" → ["NotesAgent","SummarizerAgent"], parallel: false
- "publish results" → ["PublisherAgent"]
- "find info about X" → ["InfoAgent","SummarizerAgent"], parallel: false

═══ PARAM EXTRACTION ═══
Extract ALL params from the user message in one pass.
Example:
"Finalize hackathon slides" → title: "Finalize hackathon slides"
"deadline Friday" → deadline: "Friday"
"high priority" → priority: "high"
If a param is not mentioned, leave it as "".

═══ SPEED CONTRACT ═══
Respond in <500ms:
- Zero chain-of-thought
- Zero explanations
- JSON output only
- No clarification requests
`;

function parseJson(text: string | undefined) {
  if (!text || text.trim() === "") throw new Error("Empty response from AI");
  const cleanText = text.trim();
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    const markdownMatch = cleanText.match(/```json\n([\s\S]*?)\n```/);
    if (markdownMatch) {
      try {
        return JSON.parse(markdownMatch[1].trim());
      } catch (e2) {}
    }

    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleanText.substring(firstBrace, lastBrace + 1).trim();
      try {
        return JSON.parse(extracted);
      } catch (e2) {
        try {
           const fixed = extracted.replace(/,\s*([\]}])/g, '$1');
           return JSON.parse(fixed);
        } catch (e3) {
           throw new Error(`Failed to parse extracted JSON`);
        }
      }
    }
    throw new Error(`Invalid JSON response`);
  }
}

/**
 * NexusOrchestrator: A high-performance AI routing engine.
 */
export class NexusOrchestrator {
  public async route(input: string): Promise<any> {
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please ensure it is configured in the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: "user", parts: [{ text: NEXUS_ROUTER_PROMPT + "\n\nUser Message: " + input + "\n\nCurrent Time: " + new Date().toISOString() }] }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      }
    });

    if (!response.text) {
      throw new Error("NEXUS Router returned an empty response.");
    }

    return parseJson(response.text);
  }
}

export async function route(input: string) {
  const orchestrator = new NexusOrchestrator();
  return await orchestrator.route(input);
}
