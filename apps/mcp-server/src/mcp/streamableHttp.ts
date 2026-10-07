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

export function createMCPRouter(): Router {
  const router = Router();

  // SSE stream endpoint (Streamable HTTP / SSE transport)
  router.get('/sse', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    activeSseClients.add(res);

    // Initial connected event
    res.write(`event: endpoint\ndata: ${JSON.stringify({ endpoint: '/mcp', version: '2025-11-25' })}\n\n`);

    req.on('close', () => {
      activeSseClients.delete(res);
    });
  });

  // Streamable HTTP JSON-RPC 2.0 endpoint conforming to MCP 2025-11-25
  router.post('/mcp', async (req: Request, res: Response): Promise<any> => {
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
