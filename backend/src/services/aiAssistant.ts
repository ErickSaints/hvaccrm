import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';

interface ToolResult {
  tool_call_id: string;
  output: string;
}

interface AiConfig {
  apiKey: string;
  model: string;
  baseURL: string;
}

const CONFIG_PATH = path.join(__dirname, '..', '..', 'ai_config.json');

function loadConfig(): AiConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {}
  return { apiKey: '', model: '', baseURL: '' };
}

function saveConfig(c: AiConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2), 'utf-8');
}

function getApiKey(): string {
  const fileCfg = loadConfig();
  return process.env.AI_API_KEY || fileCfg.apiKey || 'sk-placeholder';
}

function getModel(): string {
  const fileCfg = loadConfig();
  return process.env.AI_MODEL || fileCfg.model || 'kimi-k2-instruct';
}

function getBaseURL(): string {
  const fileCfg = loadConfig();
  return process.env.AI_BASE_URL || fileCfg.baseURL || 'https://api.groq.com/openai/v1';
}

let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

function detectProvider(): 'openai' | 'anthropic' {
  const model = getModel();
  if (model.startsWith('claude-')) return 'anthropic';
  return 'openai';
}

function getClient(): OpenAI {
  if (openai) return openai;
  const apiKey = getApiKey();
  const baseURL = getBaseURL();
  openai = new OpenAI({ apiKey, baseURL });
  return openai;
}

function getAnthropicClient(): Anthropic {
  if (anthropic) return anthropic;
  anthropic = new Anthropic({ apiKey: getApiKey() });
  return anthropic;
}

const SYSTEM_PROMPT = `Eres un asistente de IA integrado en un CRM para empresas de climatización y refrigeración (HVAC-R) en México.
Tienes acceso a herramientas para ejecutar código Node.js, leer/escribir archivos, buscar en el catálogo de precios, y consultar la base de datos.

Reglas:
- SIEMPRE responde en español mexicano.
- Tus respuestas pueden incluir formato Markdown.
- Cuando ejecutes scripts, muestra el output completo.
- Para operaciones que modifican datos (DB writes, file edits), pide confirmación explícita al usuario antes de ejecutar.
- Eres una IA de propósito general con capacidades de agente autónomo.
- El directorio raíz del proyecto es: C:\\Users\\mante\\hvaccrm`;

const TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'execute_command',
      description: 'Ejecuta un comando de terminal (Node.js, npm, git, PowerShell, etc.) en el directorio del proyecto.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Comando a ejecutar' },
          cwd: { type: 'string', description: 'Directorio de trabajo (default: raíz del proyecto)' },
          timeout: { type: 'number', description: 'Timeout en ms (default: 30000)' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lee el contenido de un archivo del proyecto.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Ruta absoluta o relativa al archivo' },
        },
        required: ['filePath'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'ESCRIBE o SOBRESCRIBE un archivo en el proyecto. Pide confirmación si el archivo existe.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Ruta absoluta o relativa al archivo' },
          content: { type: 'string', description: 'Contenido a escribir' },
          force: { type: 'boolean', description: 'Si es true, no pide confirmación' },
        },
        required: ['filePath', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'Lista los archivos y directorios en una ruta.',
      parameters: {
        type: 'object',
        properties: {
          dirPath: { type: 'string', description: 'Ruta del directorio' },
        },
        required: ['dirPath'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_catalog',
      description: 'Busca items en el catálogo de precios unitarios por nombre, categoría, o palabra clave.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Texto a buscar' },
          category: { type: 'string', description: 'Filtrar por categoría (opcional)' },
          limit: { type: 'number', description: 'Máx resultados (default: 20)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_catalog_stats',
      description: 'Obtiene estadísticas del catálogo de precios (total items, por categoría, rangos de precio).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_database',
      description: 'Ejecuta una consulta de LECTURA en la base de datos usando Prisma. NO permite writes.',
      parameters: {
        type: 'object',
        properties: {
          model: { type: 'string', description: 'Modelo Prisma (User, Customer, Ticket, Quotation, etc.)' },
          action: { type: 'string', enum: ['findMany', 'findUnique', 'count', 'groupBy'], description: 'Acción a ejecutar' },
          args: { type: 'string', description: 'Argumentos JSON para la consulta (where, include, orderBy, etc.)' },
        },
        required: ['model', 'action', 'args'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_info',
      description: 'Obtiene información general del proyecto: estructura, dependencias, configuraciones.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

function toolsForAnthropic(): Anthropic.Messages.Tool[] {
  return (TOOLS as OpenAI.ChatCompletionFunctionTool[]).map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Anthropic.Messages.Tool.InputSchema,
  }));
}

function toolsForOpenAI(): OpenAI.ChatCompletionTool[] {
  return TOOLS;
}

const PROJECT_ROOT = 'C:\\Users\\mante\\hvaccrm';

function resolvePath(p: string): string {
  if (path.isAbsolute(p)) return p;
  return path.join(PROJECT_ROOT, p);
}

async function executeTool(name: string, args: any): Promise<string> {
  switch (name) {
    case 'execute_command': {
      const { command, cwd, timeout } = args;
      try {
        const output = execSync(command, {
          cwd: cwd ? resolvePath(cwd) : PROJECT_ROOT,
          timeout: timeout || 30000,
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024,
          shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/sh',
        });
        return output || '(comando ejecutado sin output)';
      } catch (err: any) {
        return `Error: ${err.message}\n${err.stdout || ''}\n${err.stderr || ''}`;
      }
    }

    case 'read_file': {
      const filePath = resolvePath(args.filePath);
      if (!fs.existsSync(filePath)) return `Error: El archivo "${args.filePath}" no existe.`;
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.length > 50000) {
        return content.slice(0, 50000) + '\n\n... (archivo truncado, muy grande)';
      }
      return content;
    }

    case 'write_file': {
      const filePath = resolvePath(args.filePath);
      const exists = fs.existsSync(filePath);
      if (exists && !args.force) {
        return `CONFIRMACIÓN REQUERIDA: El archivo "${args.filePath}" ya existe. Usa force:true para sobrescribir.`;
      }
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, args.content, 'utf-8');
      return `Archivo "${args.filePath}" escrito exitosamente (${args.content.length} caracteres).`;
    }

    case 'list_directory': {
      const dirPath = resolvePath(args.dirPath);
      if (!fs.existsSync(dirPath)) return `Error: El directorio "${args.dirPath}" no existe.`;
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const dirs = items.filter(i => i.isDirectory()).map(i => i.name + '/');
      const files = items.filter(i => i.isFile()).map(i => i.name);
      return [...dirs.sort(), ...files.sort()].join('\n');
    }

    case 'search_catalog': {
      const { query, category, limit = 20 } = args;
      const catalogPaths = [
        path.join(PROJECT_ROOT, 'backend', 'scripts', 'catalog_import.json'),
        path.join(PROJECT_ROOT, 'scripts', 'catalog_import.json'),
        path.join(PROJECT_ROOT, 'backend', 'public', 'catalog_import.json'),
      ];
      let catalog: any[] = [];
      for (const cp of catalogPaths) {
        if (fs.existsSync(cp)) {
          try {
            catalog = JSON.parse(fs.readFileSync(cp, 'utf-8'));
            if (Array.isArray(catalog)) break;
          } catch {}
        }
      }
      if (!Array.isArray(catalog) || catalog.length === 0) {
        return 'No se encontró el catálogo de precios.';
      }
      const lowerQuery = query.toLowerCase();
      let results = catalog.filter((item: any) => {
        const name = (item.name || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        if (category && cat !== category.toLowerCase()) return false;
        return name.includes(lowerQuery);
      });
      results = results.slice(0, limit);
      if (results.length === 0) return `No se encontraron items para "${query}".`;
      return JSON.stringify(results.map((r: any) => ({
        name: r.name,
        category: r.category,
        unit: r.unit,
        basePrice: r.basePrice,
      })), null, 2);
    }

    case 'get_catalog_stats': {
      const catalogPaths = [
        path.join(PROJECT_ROOT, 'backend', 'scripts', 'catalog_import.json'),
        path.join(PROJECT_ROOT, 'scripts', 'catalog_import.json'),
        path.join(PROJECT_ROOT, 'backend', 'public', 'catalog_import.json'),
      ];
      let catalog: any[] = [];
      for (const cp of catalogPaths) {
        if (fs.existsSync(cp)) {
          try {
            catalog = JSON.parse(fs.readFileSync(cp, 'utf-8'));
            if (Array.isArray(catalog)) break;
          } catch {}
        }
      }
      if (!Array.isArray(catalog) || catalog.length === 0) {
        return 'No se encontró el catálogo de precios.';
      }
      const byCategory: Record<string, number> = {};
      let withPrice = 0;
      let withoutPrice = 0;
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      for (const item of catalog) {
        const cat = item.category || 'Sin categoría';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
        if (item.basePrice != null) {
          withPrice++;
          minPrice = Math.min(minPrice, item.basePrice);
          maxPrice = Math.max(maxPrice, item.basePrice);
        } else {
          withoutPrice++;
        }
      }
      return JSON.stringify({
        total: catalog.length,
        withPrice,
        withoutPrice,
        priceRange: withPrice > 0 ? { min: minPrice, max: maxPrice } : null,
        byCategory,
      }, null, 2);
    }

    case 'query_database': {
      const { model, action, args: queryArgs } = args;
      const validModels = ['User', 'Customer', 'Equipment', 'Ticket', 'Quotation', 'QuotationItem',
        'ServiceOrder', 'ServiceReport', 'MaintenancePolicy', 'MaintenanceLog', 'Invoice',
        'Survey', 'Asset', 'Notification', 'CatalogMaterial', 'PricebookItem', 'PricebookCategory',
        'InventoryItem', 'InventoryMovement', 'Campaign', 'Booking', 'Review', 'Warranty',
        'CommissionPlan', 'CommissionEarning', 'PurchaseOrder', 'Vendor', 'RolePermission',
        'UserSubscription', 'SubscriptionPlan'];
      if (!validModels.includes(model)) {
        return `Error: Modelo "${model}" no válido. Válidos: ${validModels.join(', ')}`;
      }
      const readActions = ['findMany', 'findUnique', 'count', 'groupBy'];
      if (!readActions.includes(action)) {
        return `Error: Acción "${action}" no permitida. Solo lecturas: ${readActions.join(', ')}`;
      }
      try {
        const parsedArgs = JSON.parse(queryArgs);
        const result = await (prisma as any)[model][action](parsedArgs);
        return JSON.stringify(result, null, 2);
      } catch (err: any) {
        return `Error en consulta: ${err.message}`;
      }
    }

    case 'get_project_info': {
      const info: any = {};
      const pkg = path.join(PROJECT_ROOT, 'package.json');
      if (fs.existsSync(pkg)) {
        const p = JSON.parse(fs.readFileSync(pkg, 'utf-8'));
        info.rootScripts = p.scripts;
      }
      const bePkg = path.join(PROJECT_ROOT, 'backend', 'package.json');
      if (fs.existsSync(bePkg)) {
        const p = JSON.parse(fs.readFileSync(bePkg, 'utf-8'));
        info.backendDeps = Object.keys(p.dependencies || {});
      }
      const fePkg = path.join(PROJECT_ROOT, 'frontend', 'package.json');
      if (fs.existsSync(fePkg)) {
        const p = JSON.parse(fs.readFileSync(fePkg, 'utf-8'));
        info.frontendDeps = Object.keys(p.dependencies || {});
      }
      const scriptsDir = path.join(PROJECT_ROOT, 'scripts');
      if (fs.existsSync(scriptsDir)) {
        info.scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
      }
      return JSON.stringify(info, null, 2);
    }

    default:
      return `Error: Herramienta "${name}" no reconocida.`;
  }
}

async function processMessageOpenAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  onStream: (chunk: string) => void
): Promise<string> {
  const client = getClient();
  const model = getModel();

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role as any, content: m.content })),
  ];

  let fullResponse = '';

  while (true) {
    const stream = await client.chat.completions.create({
      model,
      messages: apiMessages,
      tools: TOOLS,
      stream: true,
      stream_options: { include_usage: false },
    });

    let deltaContent = '';
    const deltaToolCalls: Map<number, { id?: string; type?: string; function?: { name?: string; arguments?: string } }> = new Map();

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        deltaContent += delta.content;
        onStream(delta.content);
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!deltaToolCalls.has(idx)) deltaToolCalls.set(idx, {});
          const existing = deltaToolCalls.get(idx)!;
          if (tc.id) existing.id = tc.id;
          if (tc.type) existing.type = tc.type;
          if (tc.function) {
            if (!existing.function) existing.function = {};
            if (tc.function.name) existing.function.name = tc.function.name;
            if (tc.function.arguments) existing.function.arguments = (existing.function.arguments || '') + tc.function.arguments;
          }
        }
      }
    }

    fullResponse += deltaContent;

    const toolCalls = Array.from(deltaToolCalls.entries())
      .filter(([_, tc]) => tc.id && tc.function?.name)
      .map(([_, tc]) => ({
        id: tc.id!,
        type: 'function' as const,
        function: {
          name: tc.function!.name!,
          arguments: tc.function!.arguments || '{}',
        },
      }));

    if (toolCalls.length === 0) break;

    const toolResults: ToolResult[] = [];
    for (const tc of toolCalls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }
      onStream(`\n\n**🔧 Ejecutando: \`${tc.function.name}\`...**\n\n`);
      const result = await executeTool(tc.function.name, args);
      toolResults.push({ tool_call_id: tc.id, output: result });
      onStream(`\`\`\`\n${result.slice(0, 2000)}\n\`\`\`\n\n`);
    }

    apiMessages.push({
      role: 'assistant',
      content: deltaContent || null,
      tool_calls: toolCalls,
    } as any);

    for (const tr of toolResults) {
      apiMessages.push({
        role: 'tool',
        tool_call_id: tr.tool_call_id,
        content: tr.output,
      } as any);
    }
  }

  return fullResponse;
}

async function processMessageAnthropic(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  onStream: (chunk: string) => void
): Promise<string> {
  const client = getAnthropicClient();
  const model = getModel();

  const apiMessages: Anthropic.Messages.MessageParam[] = messages.map(m => ({
    role: m.role === 'system' ? 'user' : m.role as 'user' | 'assistant',
    content: m.content,
  }));

  let fullResponse = '';

  while (true) {
    const stream = await client.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
      tools: toolsForAnthropic(),
      stream: true,
    });

    let textContent = '';
    const blocks: { type: string; id?: string; name?: string; input?: any }[] = [];

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        blocks.push(event.content_block);
      }
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        textContent += event.delta.text;
        onStream(event.delta.text);
      }
    }

    fullResponse += textContent;

    const toolUseBlocks = blocks.filter(b => b.type === 'tool_use' && b.id && b.name);

    if (toolUseBlocks.length === 0) break;

    const toolResults: ToolResult[] = [];
    for (const tb of toolUseBlocks) {
      onStream(`\n\n**🔧 Ejecutando: \`${tb.name}\`...**\n\n`);
      const result = await executeTool(tb.name!, tb.input || {});
      toolResults.push({ tool_call_id: tb.id!, output: result });
      onStream(`\`\`\`\n${result.slice(0, 2000)}\n\`\`\`\n\n`);
    }

    // Build assistant response with content blocks
    const assistantContent: Anthropic.Messages.ContentBlockParam[] = [];
    if (textContent) assistantContent.push({ type: 'text', text: textContent });
    for (const tb of toolUseBlocks) {
      assistantContent.push({
        type: 'tool_use',
        id: tb.id!,
        name: tb.name!,
        input: tb.input || {},
      });
    }

    apiMessages.push({ role: 'assistant', content: assistantContent });

    // Build tool result content block
    const toolResultContent: Anthropic.Messages.ContentBlockParam[] = toolResults.map(tr => ({
      type: 'tool_result',
      tool_use_id: tr.tool_call_id,
      content: tr.output,
    }));

    apiMessages.push({ role: 'user', content: toolResultContent });
  }

  return fullResponse;
}

export async function processMessage(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  onStream: (chunk: string) => void
): Promise<string> {
  const provider = detectProvider();
  if (provider === 'anthropic') {
    return processMessageAnthropic(messages, onStream);
  }
  return processMessageOpenAI(messages, onStream);
}

export function validateConfig(): { valid: boolean; message: string } {
  const key = getApiKey();
  const model = getModel();
  if (!key || key === 'sk-placeholder') {
    return { valid: false, message: 'AI_API_KEY no configurada. Configúrala en backend/.env o en el panel de administración.' };
  }
  return { valid: true, message: `Configurado: ${model}` };
}

export function getConfig() {
  const fileCfg = loadConfig();
  return {
    provider: process.env.AI_PROVIDER || 'openai',
    model: getModel(),
    baseURL: getBaseURL(),
    configured: validateConfig().valid,
    hasFileConfig: !!fileCfg.apiKey,
  };
}

export function updateConfig(c: { apiKey?: string; model?: string; baseURL?: string }): AiConfig {
  const current = loadConfig();
  const merged: AiConfig = {
    apiKey: c.apiKey !== undefined ? c.apiKey : current.apiKey,
    model: c.model !== undefined ? c.model : current.model,
    baseURL: c.baseURL !== undefined ? c.baseURL : current.baseURL,
  };
  saveConfig(merged);
  // Reset client so it picks up new config
  openai = null;
  return merged;
}
