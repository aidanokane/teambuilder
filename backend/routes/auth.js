const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
}));

router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: 'http://localhost:3000',
        failureRedirect: 'http://localhost:3000',
    })
);

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://localhost:3000');
    });
});

router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
