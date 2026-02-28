-- =========================
-- USERS (authors)
-- =========================
INSERT INTO users (name, slug, email, password, bio, avatar_url, is_admin)
VALUES
('John Doe', 'john-doe', 'john@example.com', 'hashed_password', 'Senior JS developer', NULL, true),
('Alice Smith', 'alice-smith', 'alice@example.com', 'hashed_password', 'Frontend engineer', NULL, false),
('Bob Johnson', 'bob-johnson', 'bob@example.com', 'hashed_password', 'DevOps specialist', NULL, false)
ON CONFLICT (email) DO NOTHING;

-- =========================
-- CATEGORIES
-- =========================
INSERT INTO categories (name, slug, description)
VALUES
('JavaScript', 'javascript', 'JS ecosystem news'),
('React', 'react', 'React and Next.js articles'),
('DevOps', 'devops', 'CI/CD and infrastructure'),
('AI', 'ai', 'Artificial Intelligence'),
('Backend', 'backend', 'Server-side development')
ON CONFLICT (slug) DO NOTHING;

-- =========================
-- TAGS
-- =========================
INSERT INTO tags (name, slug)
VALUES
('nextjs', 'nextjs'),
('react', 'react'),
('nodejs', 'nodejs'),
('docker', 'docker'),
('postgresql', 'postgresql'),
('seo', 'seo'),
('typescript', 'typescript'),
('fastify', 'fastify'),
('jwt', 'jwt'),
('performance', 'performance')
ON CONFLICT (slug) DO NOTHING;

-- =========================
-- ARTICLES (15+)
-- =========================
INSERT INTO articles
(title, slug, excerpt, content, cover_url, category_id, author_id, status, published_at, views)
VALUES
(
'Getting Started with Next.js App Router',
'getting-started-nextjs-app-router',
'Learn how to build modern apps with Next.js App Router.',
'Full article content about Next.js App Router...',
NULL,
(SELECT id FROM categories WHERE slug='react'),
(SELECT id FROM users WHERE slug='john-doe'),
'published',
NOW() - INTERVAL '10 days',
120
),
(
'Fastify vs Express: Performance Comparison',
'fastify-vs-express-performance',
'We compare Fastify and Express performance.',
'Detailed comparison of Fastify and Express...',
NULL,
(SELECT id FROM categories WHERE slug='backend'),
(SELECT id FROM users WHERE slug='alice-smith'),
'published',
NOW() - INTERVAL '9 days',
98
),
(
'Docker for Beginners',
'docker-for-beginners',
'Introduction to Docker containers.',
'Full Docker tutorial...',
NULL,
(SELECT id FROM categories WHERE slug='devops'),
(SELECT id FROM users WHERE slug='bob-johnson'),
'published',
NOW() - INTERVAL '8 days',
76
);

-- ===== generate extra articles (to reach 15) =====
DO $$
DECLARE
    i INT := 1;
    cat_ids INT[];
    auth_ids INT[];
BEGIN
    SELECT ARRAY(SELECT id FROM categories) INTO cat_ids;
    SELECT ARRAY(SELECT id FROM users) INTO auth_ids;

    WHILE i <= 12 LOOP
        INSERT INTO articles
        (title, slug, excerpt, content, cover_url, category_id, author_id, status, published_at, views)
        VALUES
        (
            'IT Blog Article #' || i,
            'it-blog-article-' || i,
            'Short excerpt for article #' || i,
            'Full content for article #' || i || '. This is demo SEO text.',
            NULL,
            cat_ids[(i % array_length(cat_ids,1)) + 1],
            auth_ids[(i % array_length(auth_ids,1)) + 1],
            'published',
            NOW() - (i || ' days')::interval,
            (random()*200)::int
        );
        i := i + 1;
    END LOOP;
END $$;

-- =========================
-- ARTICLE_TAGS
-- =========================
INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM articles a
JOIN tags t ON t.slug IN ('nextjs','seo','performance')
ON CONFLICT DO NOTHING;