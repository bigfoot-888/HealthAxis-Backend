const express = require('express');
const app = express();
const path = require('path');
const pool = require('./config/pool.js');
const connectPgSimple = require('connect-pg-simple');
const session = require('express-session');
const PgSession = connectPgSimple(session);

const cors = require('cors');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
}

const allowedOrigins = [
  'http://localhost:5173', // local dev
  'https://health-axis-frontend-neon.vercel.app/', // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(
    session({
        store: new PgSession({
            pool, // Connection pool
            createTableIfMissing: true,
        }),
        secret: process.env.SESSION_SECRET,
        resave: false, // don't save session if unmodified
        saveUninitialized: false, // don't create empty sessions
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    }),
);

const userRouter = require('./api/routes/user-routes');
const patientRouter = require('./api/routes/patient-routes.js');
const authRouter = require('./api/routes/auth-routes');
const agendaRouter = require('./api/routes/agenda-routes.js'); 
const errorMiddleware = require('./middlewares/error-middleware');
const error404Middleware = require('./middlewares/error-404-middleware.js');

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/patients', patientRouter);
app.use('/api/agendas', agendaRouter); 

app.use(errorMiddleware);
app.use(error404Middleware);

module.exports = app;
