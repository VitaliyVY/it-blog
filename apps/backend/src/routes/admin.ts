import { FastifyInstance } from "fastify";
import { query } from "../db";

function ok(data: any, meta: any = {}) {
  return { data, meta };
}

export default async function adminRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post("/auth/login", async (req: any, reply) => {
    const { email, password } = req.body || {};

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = app.jwt.sign({ email, role: "admin" }, { expiresIn: "7d" });
      return ok({ token }, {});
    }

    return reply.code(401).send({ error: "Invalid credentials" });
  });

  // hook: require jwt for /api/admin/*
  app.addHook("preHandler", async (req, reply) => {
    if (!req.url.startsWith("/api/admin")) return;
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // GET /api/admin/articles
  app.get("/admin/articles", async () => {
    const items = await query(
      `
      SELECT a.id, a.title, a.slug, a.status, a.published_at,
             c.slug AS category_slug,
             u.slug AS author_slug
      FROM articles a
      JOIN categories c ON c.id = a.category_id
      JOIN users u ON u.id = a.author_id
      ORDER BY a.created_at DESC
      `
    );
    return ok(items, {});
  });

  // POST /api/admin/articles
  app.post("/admin/articles", async (req: any, reply) => {
    const body = req.body || {};

    const {
      title,
      slug,
      excerpt,
      content,
      cover_url = null,
      status = "draft",
      category_id,
      author_id,
      published_at = null,
    } = body;

    if (!title || !slug || !category_id || !author_id) {
      return reply.code(400).send({ error: "title, slug, category_id, author_id required" });
    }

    const rows = await query(
      `
      INSERT INTO articles (title, slug, excerpt, content, cover_url, status, category_id, author_id, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [title, slug, excerpt || null, content || "", cover_url, status, category_id, author_id, published_at]
    );

    return ok(rows[0], {});
  });

  // PUT /api/admin/articles/:id
  app.put("/admin/articles/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const fields = ["title","slug","excerpt","content","cover_url","status","category_id","author_id","published_at"];
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of fields) {
      if (body[f] !== undefined) {
        sets.push(`${f}=$${idx++}`);
        values.push(body[f]);
      }
    }

    if (sets.length === 0) return reply.code(400).send({ error: "No fields to update" });

    values.push(id);

    const rows = await query(
      `UPDATE articles SET ${sets.join(", ")} WHERE id=$${idx} RETURNING *`,
      values
    );

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok(rows[0], {});
  });

  // DELETE /api/admin/articles/:id
  app.delete("/admin/articles/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const rows = await query(`DELETE FROM articles WHERE id=$1 RETURNING id`, [id]);
    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok({ deleted: true, id }, {});
  });
}