import { FastifyInstance } from "fastify";
import { query } from "../db";

function ok(data: any, meta: any = {}) {
  return { data, meta };
}

function buildUpdate(
  fields: string[],
  body: Record<string, unknown>
): { sets: string[]; values: unknown[]; nextIndex: number } {
  const sets: string[] = [];
  const values: unknown[] = [];
  let nextIndex = 1;

  for (const field of fields) {
    if (body[field] !== undefined) {
      sets.push(`${field}=$${nextIndex++}`);
      values.push(body[field]);
    }
  }

  return { sets, values, nextIndex };
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

  // require jwt for /api/admin/*
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
      SELECT a.id, a.title, a.slug, a.status, a.excerpt, a.cover_url, a.published_at,
             a.category_id, a.author_id,
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

  // GET /api/admin/articles/:id
  app.get("/admin/articles/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const rows = await query(`SELECT * FROM articles WHERE id=$1 LIMIT 1`, [id]);
    const article = rows[0];

    if (!article) return reply.code(404).send({ error: "Not found" });
    return ok(article, {});
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
      return reply
        .code(400)
        .send({ error: "title, slug, category_id, author_id required" });
    }

    const rows = await query(
      `
      INSERT INTO articles (title, slug, excerpt, content, cover_url, status, category_id, author_id, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        title,
        slug,
        excerpt || null,
        content || "",
        cover_url,
        status,
        category_id,
        author_id,
        published_at,
      ]
    );

    return ok(rows[0], {});
  });

  // PUT /api/admin/articles/:id
  app.put("/admin/articles/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const { sets, values, nextIndex } = buildUpdate(
      [
        "title",
        "slug",
        "excerpt",
        "content",
        "cover_url",
        "status",
        "category_id",
        "author_id",
        "published_at",
      ],
      body
    );

    if (!sets.length) {
      return reply.code(400).send({ error: "No fields to update" });
    }

    values.push(id);

    const rows = await query(
      `UPDATE articles SET ${sets.join(", ")} WHERE id=$${nextIndex} RETURNING *`,
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

  // GET /api/admin/categories
  app.get("/admin/categories", async () => {
    const items = await query(
      `SELECT id, name, slug, description FROM categories ORDER BY name ASC`
    );
    return ok(items, {});
  });

  // POST /api/admin/categories
  app.post("/admin/categories", async (req: any, reply) => {
    const { name, slug, description = null } = req.body || {};

    if (!name || !slug) {
      return reply.code(400).send({ error: "name and slug required" });
    }

    const rows = await query(
      `
      INSERT INTO categories (name, slug, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, slug, description
      `,
      [name, slug, description]
    );

    return ok(rows[0], {});
  });

  // PUT /api/admin/categories/:id
  app.put("/admin/categories/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const { sets, values, nextIndex } = buildUpdate(
      ["name", "slug", "description"],
      body
    );

    if (!sets.length) {
      return reply.code(400).send({ error: "No fields to update" });
    }

    values.push(id);

    const rows = await query(
      `
      UPDATE categories
      SET ${sets.join(", ")}
      WHERE id=$${nextIndex}
      RETURNING id, name, slug, description
      `,
      values
    );

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok(rows[0], {});
  });

  // DELETE /api/admin/categories/:id
  app.delete("/admin/categories/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const rows = await query(`DELETE FROM categories WHERE id=$1 RETURNING id`, [id]);

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok({ deleted: true, id }, {});
  });

  // GET /api/admin/tags
  app.get("/admin/tags", async () => {
    const items = await query(`SELECT id, name, slug FROM tags ORDER BY name ASC`);
    return ok(items, {});
  });

  // POST /api/admin/tags
  app.post("/admin/tags", async (req: any, reply) => {
    const { name, slug } = req.body || {};

    if (!name || !slug) {
      return reply.code(400).send({ error: "name and slug required" });
    }

    const rows = await query(
      `
      INSERT INTO tags (name, slug)
      VALUES ($1, $2)
      RETURNING id, name, slug
      `,
      [name, slug]
    );

    return ok(rows[0], {});
  });

  // PUT /api/admin/tags/:id
  app.put("/admin/tags/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const { sets, values, nextIndex } = buildUpdate(["name", "slug"], body);

    if (!sets.length) {
      return reply.code(400).send({ error: "No fields to update" });
    }

    values.push(id);

    const rows = await query(
      `
      UPDATE tags
      SET ${sets.join(", ")}
      WHERE id=$${nextIndex}
      RETURNING id, name, slug
      `,
      values
    );

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok(rows[0], {});
  });

  // DELETE /api/admin/tags/:id
  app.delete("/admin/tags/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const rows = await query(`DELETE FROM tags WHERE id=$1 RETURNING id`, [id]);

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok({ deleted: true, id }, {});
  });

  // GET /api/admin/authors
  app.get("/admin/authors", async () => {
    const items = await query(
      `
      SELECT id, name, slug, email, bio, avatar_url, is_admin
      FROM users
      ORDER BY name ASC
      `
    );
    return ok(items, {});
  });

  // POST /api/admin/authors
  app.post("/admin/authors", async (req: any, reply) => {
    const {
      name,
      slug,
      email,
      password,
      bio = null,
      avatar_url = null,
      is_admin = false,
    } = req.body || {};

    if (!name || !slug || !email || !password) {
      return reply
        .code(400)
        .send({ error: "name, slug, email, password required" });
    }

    const rows = await query(
      `
      INSERT INTO users (name, slug, email, password, bio, avatar_url, is_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, slug, email, bio, avatar_url, is_admin
      `,
      [name, slug, email, password, bio, avatar_url, Boolean(is_admin)]
    );

    return ok(rows[0], {});
  });

  // PUT /api/admin/authors/:id
  app.put("/admin/authors/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const { sets, values, nextIndex } = buildUpdate(
      ["name", "slug", "email", "password", "bio", "avatar_url", "is_admin"],
      body
    );

    if (!sets.length) {
      return reply.code(400).send({ error: "No fields to update" });
    }

    values.push(id);

    const rows = await query(
      `
      UPDATE users
      SET ${sets.join(", ")}
      WHERE id=$${nextIndex}
      RETURNING id, name, slug, email, bio, avatar_url, is_admin
      `,
      values
    );

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok(rows[0], {});
  });

  // DELETE /api/admin/authors/:id
  app.delete("/admin/authors/:id", async (req: any, reply) => {
    const id = Number(req.params.id);

    const articles = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM articles WHERE author_id=$1`,
      [id]
    );
    const count = Number(articles[0]?.count || 0);
    if (count > 0) {
      return reply
        .code(400)
        .send({ error: "Cannot delete author with existing articles" });
    }

    const rows = await query(`DELETE FROM users WHERE id=$1 RETURNING id`, [id]);

    if (!rows[0]) return reply.code(404).send({ error: "Not found" });
    return ok({ deleted: true, id }, {});
  });
}
