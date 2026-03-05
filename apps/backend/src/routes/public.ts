import { FastifyInstance } from "fastify";
import { query } from "../db";

function ok(data: any, meta: any = {}) {
  return { data, meta };
}

export default async function publicRoutes(app: FastifyInstance) {
  // GET /api/articles?page=1&limit=10
  app.get("/articles", async (req: any) => {
    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit || 10)));
    const offset = (page - 1) * limit;

    const items = await query(
      `
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_url, a.published_at, a.views,
             c.name AS category_name, c.slug AS category_slug,
             u.name AS author_name, u.slug AS author_slug
      FROM articles a
      JOIN categories c ON c.id = a.category_id
      JOIN users u ON u.id = a.author_id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC, a.id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM articles WHERE status='published'`
    );
    const total = Number(totalRes[0]?.count || 0);

    return ok(items, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  });

  // GET /api/articles/:slug
  app.get("/articles/:slug", async (req: any, reply) => {
    const slug = String(req.params.slug);

    const rows = await query(
      `
      SELECT a.*,
             c.name AS category_name, c.slug AS category_slug,
             u.name AS author_name, u.slug AS author_slug
      FROM articles a
      JOIN categories c ON c.id = a.category_id
      JOIN users u ON u.id = a.author_id
      WHERE a.slug = $1 AND a.status = 'published'
      LIMIT 1
      `,
      [slug]
    );

    const article = rows[0];
    if (!article) return reply.code(404).send({ error: "Not found" });


    // теги
    const tags = await query(
      `
      SELECT t.name, t.slug
      FROM article_tags at
      JOIN tags t ON t.id = at.tag_id
      WHERE at.article_id = $1
      ORDER BY t.name ASC
      `,
      [article.id]
    );

    return ok({ ...article, tags }, {});
  });

  // POST /api/articles/:slug/view
  app.post("/articles/:slug/view", async (req: any, reply) => {
    const slug = String(req.params.slug);

    const rows = await query<{ views: number }>(
      `
      UPDATE articles
      SET views = views + 1
      WHERE slug = $1 AND status = 'published'
      RETURNING views
      `,
      [slug]
    );

    const article = rows[0];
    if (!article) return reply.code(404).send({ error: "Not found" });

    return ok({ views: Number(article.views || 0) }, {});
  });

  // GET /api/categories
  app.get("/categories", async () => {
    const items = await query(
      `SELECT id, name, slug, description FROM categories ORDER BY name ASC`
    );
    return ok(items, {});
  });

  // GET /api/categories/:slug/articles
  app.get("/categories/:slug/articles", async (req: any, reply) => {
    const slug = String(req.params.slug);

    const cats = await query<{ id: number }>(
      `SELECT id FROM categories WHERE slug=$1 LIMIT 1`,
      [slug]
    );
    const cat = cats[0];
    if (!cat) return reply.code(404).send({ error: "Category not found" });

    const items = await query(
      `
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_url, a.published_at, a.views,
             u.name AS author_name, u.slug AS author_slug
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.status='published' AND a.category_id=$1
      ORDER BY a.published_at DESC, a.id DESC
      `,
      [cat.id]
    );

    return ok(items, {});
  });


    // GET /api/tags
  app.get("/tags", async () => {
    const items = await query(`SELECT id, name, slug FROM tags ORDER BY name ASC`);
    return ok(items, {});
  });

  // GET /api/tags/:slug/articles
  app.get("/tags/:slug/articles", async (req: any, reply) => {
    const slug = String(req.params.slug);

    const tags = await query<{ id: number }>(`SELECT id FROM tags WHERE slug=$1 LIMIT 1`, [slug]);
    const tag = tags[0];
    if (!tag) return reply.code(404).send({ error: "Tag not found" });

    const items = await query(
      `
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_url, a.published_at, a.views,
             c.name AS category_name, c.slug AS category_slug,
             u.name AS author_name, u.slug AS author_slug
      FROM article_tags at
      JOIN articles a ON a.id = at.article_id
      JOIN categories c ON c.id = a.category_id
      JOIN users u ON u.id = a.author_id
      WHERE at.tag_id = $1 AND a.status='published'
      ORDER BY a.published_at DESC, a.id DESC
      `,
      [tag.id]
    );

    return ok(items, {});
  });

  // GET /api/authors/:slug
  app.get("/authors/:slug", async (req: any, reply) => {
    const slug = String(req.params.slug);
    const rows = await query(
      `SELECT id, name, slug, bio, avatar_url FROM users WHERE slug=$1 LIMIT 1`,
      [slug]
    );
    const author = rows[0];
    if (!author) return reply.code(404).send({ error: "Author not found" });
    return ok(author, {});
  });

  // GET /api/authors/:slug/articles
  app.get("/authors/:slug/articles", async (req: any, reply) => {
    const slug = String(req.params.slug);

    const authors = await query<{ id: number }>(`SELECT id FROM users WHERE slug=$1 LIMIT 1`, [slug]);
    const author = authors[0];
    if (!author) return reply.code(404).send({ error: "Author not found" });

    const items = await query(
      `
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_url, a.published_at, a.views,
             c.name AS category_name, c.slug AS category_slug
      FROM articles a
      JOIN categories c ON c.id = a.category_id
      WHERE a.status='published' AND a.author_id=$1
      ORDER BY a.published_at DESC, a.id DESC
      `,
      [author.id]
    );

    return ok(items, {});
  });

  // GET /api/search?q=...
  app.get("/search", async (req: any) => {
    const q = String(req.query?.q || "").trim();
    if (!q) return ok([], { query: q });

    const items = await query(
      `
      SELECT a.id, a.title, a.slug, a.excerpt, a.cover_url, a.published_at, a.views,
             c.name AS category_name, c.slug AS category_slug,
             u.name AS author_name, u.slug AS author_slug
      FROM articles a
      JOIN categories c ON c.id = a.category_id
      JOIN users u ON u.id = a.author_id
      WHERE a.status='published'
        AND (
          a.title ILIKE $1 OR
          a.excerpt ILIKE $1 OR
          a.content ILIKE $1
        )
      ORDER BY a.published_at DESC, a.id DESC
      LIMIT 50
      `,
      [`%${q}%`]
    );

    return ok(items, { query: q });
  });

   // GET /api/authors
  app.get("/authors", async () => {
    const items = await query(`SELECT id, name, slug, bio, avatar_url FROM users ORDER BY name ASC`);
    return ok(items, {});
  });
}
