<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Headroom Context Compression Rules
To maximize context window length and minimize token usage (saving up to 60-95% of tokens):
- **Tool Output Compression**: Whenever you are about to print or transmit a tool output, file content, or search result that exceeds 500 tokens, always run it through the `headroom_compress` MCP tool first.
- **Reference Resolution**: If you need to read the exact details of a previously compressed section, invoke the `headroom_retrieve` MCP tool using the returned reference.
- **LLM Proxy Routing**: All your outbound LLM API requests should route through the local Headroom proxy at `http://127.0.0.1:8787`.

