const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db/connection');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser( async (id, done) => {
    const { rows: [obj] } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
        const { rows: [user] } = await pool.query(
            `INSERT INTO users (google_id, email, name)
            VALUES ($1, $2, $3)
            ON CONFLICT (google_id) DO UPDATE
            SET email = EXCLUDED.email,
                name  = EXCLUDED.name
            RETURNING *`,
            [profile.id, profile.emails, profile.displayName]
        );
    return done(null, user);
}));
