import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/*', cors());

// Types
interface StatusPayload {
    user_id: string;
    status_key: string;
    custom_text?: string;
    color_hex: string;
}

// POST /api/status - Set User Status
app.post('/api/status', async (c) => {
    try {
        const body = await c.req.json<StatusPayload>();
        const { user_id, status_key, custom_text, color_hex } = body;

        if (!user_id || !status_key || !color_hex) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        const now = Date.now();
        const expires_at = now + 24 * 60 * 60 * 1000; // 24 hours from now

        // Transaction to enforce "One active status"
        // We delete any existing status for this user before inserting detailed history isn't required for this feature level
        // Or we could verify latest, but deleting old clarifies the "current" state logic.
        await c.env.DB.batch([
            c.env.DB.prepare('DELETE FROM user_statuses WHERE user_id = ?').bind(user_id),
            c.env.DB.prepare(
                'INSERT INTO user_statuses (user_id, status_key, custom_text, color_hex, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(user_id, status_key, custom_text || null, color_hex, now, expires_at)
        ]);

        return c.json({ success: true, expires_at });
    } catch (e) {
        return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
    }
});

// GET /api/status/:userId - Get Valid Status
app.get('/api/status/:userId', async (c) => {
    const userId = c.req.param('userId');
    const now = Date.now();

    try {
        // Fetch latest status that hasn't expired
        const status = await c.env.DB.prepare(
            'SELECT * FROM user_statuses WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1'
        )
            .bind(userId, now)
            .first();

        return c.json(status || null);
    } catch (e) {
        return c.json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
    }
});

export default app;
