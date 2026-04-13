const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.connect().catch(console.error);

function sessionMiddleware() {
    return session({
        store: new RedisStore({ client: redisClient }),
        name: 'sessionId',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
        },
    });
}

module.exports = sessionMiddleware;
