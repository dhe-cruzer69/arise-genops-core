import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    let count = (await this.ctx.storage.get<number>("count")) || 0;

    if (path === "/increment") { count++; await this.ctx.storage.put("count", count); return this.json({ action: "increment", count }); }
    if (path === "/decrement") { count--; await this.ctx.storage.put("count", count); return this.json({ action: "decrement", count }); }
    if (path === "/reset") { count = 0; await this.ctx.storage.put("count", count); return this.json({ action: "reset", count }); }

    if (path === "/chat" && request.method === "POST") {
      try {
        const body = await request.json() as { prompt: string };
        const messages = (await this.ctx.storage.get<any[]>("messages")) || [];
        messages.push({ role: "user", content: body.prompt });

        const ai = new Ai(this.env.AI);
        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: "You are Arise GenOps assistant." },
            ...messages.slice(-10)
          ]
        });
        const reply = response.response || "No response";
        messages.push({ role: "assistant", content: reply });
        await this.ctx.storage.put("messages", messages);

        return this.json({ response: reply, history_length: messages.length });
      } catch (e: any) {
        return this.json({ error: e.message }, 500);
      }
    }

    if (path === "/image" && request.method === "POST") {
      try {
        const body = await request.json() as { prompt: string };
        const ai = new Ai(this.env.AI);
        const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
          prompt: body.prompt
        });
        const bytes = response.image as ArrayBuffer;
        return new Response(bytes, {
          headers: { "Content-Type": "image/png", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e: any) {
        return this.json({ error: e.message }, 500);
      }
    }

    return this.json({
      status: "online",
      service: "Arise GenOps Core",
      count,
      endpoints: ["/increment", "/decrement", "/reset", "/chat", "/image"],
      docs: "https://github.com/dhe-cruzer69/arise-genops-core"
    });
  }

  private json(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const name = url.searchParams.get("name") || "default";
    const id = env.MY_DURABLE_OBJECT.idFromName(name);
    return env.MY_DURABLE_OBJECT.get(id).fetch(request);
  },
} satisfies ExportedHandler<Env>;

interface Env {
  MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
  AI: any;
}
