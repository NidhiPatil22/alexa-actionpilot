import { Request, Response, Router } from 'express';
import { tools, getToolByName } from '../tools/index.js';

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

const activeSseClients: Set<Response> = new Set();

export function broadcastMCPEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of activeSseClients) {
    try {
      client.write(payload);
    } catch {
      activeSseClients.delete(client);
    }
  }
}

function isAuthorized(req: Request): boolean {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) return true; // Zero-config / local demo mode
  const authHeader = req.headers['authorization'];
  const xApiKey = req.headers['x-api-key'];
  return (authHeader === `Bearer ${apiKey}`) || (xApiKey === apiKey);
}

export function createMCPRouter(): Router {
  const router = Router();

  const handleSseConnection = (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      res.status(401).json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Unauthorized: Invalid or missing MCP API key' }
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const sessionId = (req.headers['mcp-session-id'] as string) || `session-${Date.now()}`;
    res.setHeader('Mcp-Session-Id', sessionId);
    res.flushHeaders?.();

    activeSseClients.add(res);

    // Initial connected event conforming to MCP 2025-11-25
    res.write(`event: endpoint\ndata: ${JSON.stringify({ endpoint: '/mcp', version: '2025-11-25', sessionId })}\n\n`);

    // 15-second heartbeat ping to prevent AWS ALB / gateway timeouts
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
      } catch {
        clearInterval(pingInterval);
        activeSseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      activeSseClients.delete(res);
    });
  };

  // MCP 2025-11-25 standard Streamable HTTP SSE channels
  router.get('/mcp', handleSseConnection);
  router.get('/sse', handleSseConnection);

  // Streamable HTTP JSON-RPC 2.0 endpoint conforming to MCP 2025-11-25
  router.post('/mcp', async (req: Request, res: Response): Promise<any> => {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Unauthorized: Invalid or missing MCP API key' }
      });
    }

    const body: MCPRequest = req.body;

    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: body?.id || null,
        error: { code: -32600, message: 'Invalid JSON-RPC 2.0 Request' }
      });
    }

    const { id, method, params } = body;
    const sessionId = req.headers['mcp-session-id'] || 'session-default';

    // Broadcast tool execution attempt for real-time monitoring
    broadcastMCPEvent('mcp_request', { method, params, sessionId, timestamp: new Date().toISOString() });

    try {
      switch (method) {
        case 'initialize': {
          const result = {
            protocolVersion: '2025-11-25',
            capabilities: {
              tools: { listChanged: true },
              logging: {}
            },
            serverInfo: {
              name: 'actionpilot-mcp-server',
              version: '1.0.0',
              description: 'Next-Best-Action Engine for Alexa+'
            }
          };
          return res.json({ jsonrpc: '2.0', id, result });
        }

        case 'notifications/initialized': {
          return res.status(200).send();
        }

        case 'ping': {
          return res.json({ jsonrpc: '2.0', id, result: {} });
        }

        case 'tools/list': {
          const list = tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
          }));
          return res.json({ jsonrpc: '2.0', id, result: { tools: list } });
        }

        case 'tools/call': {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};

          const tool = getToolByName(toolName);
          if (!tool) {
            return res.json({
              jsonrpc: '2.0',
              id,
              error: { code: -32601, message: `Tool "${toolName}" not found.` }
            });
          }

          try {
            const executionResult = await tool.handler(toolArgs);
            const isError = Boolean(executionResult && executionResult.error);

            // Broadcast tool completed event
            broadcastMCPEvent('mcp_tool_executed', {
              tool: toolName,
              args: toolArgs,
              result: executionResult,
              timestamp: new Date().toISOString()
            });

            return res.json({
              jsonrpc: '2.0',
              id,
              result: {
                isError,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(executionResult, null, 2)
                  }
                ]
              }
            });
          } catch (toolErr: any) {
            const structured = {
              error: true,
              code: 'TOOL_EXECUTION_FAILED',
              message: toolErr?.message || `Tool "${toolName}" failed.`
            };
            broadcastMCPEvent('mcp_tool_error', {
              tool: toolName,
              args: toolArgs,
              error: structured,
              timestamp: new Date().toISOString()
            });
            return res.json({
              jsonrpc: '2.0',
              id,
              result: {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(structured, null, 2)
                  }
                ]
              }
            });
          }
        }

        default:
          return res.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method "${method}" not supported.` }
          });
      }
    } catch (err: any) {
      console.error(`[MCP Error] Method: ${method}`, err);
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message || 'Internal server error' }
      });
    }
  });

  return router;
}
