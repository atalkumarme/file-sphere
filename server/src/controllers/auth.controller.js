// src/controllers/auth.controller.js
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const authController = {
    async register(req, res) {
        try {
            const user = new User(req.body);
            await user.save();

            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({ user, token });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async login(req, res) {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) throw new Error('Invalid credentials');

            const isMatch = await user.comparePassword(req.body.password);
            if (!isMatch) throw new Error('Invalid credentials');

            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ user, token });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId).select('-password');
            res.json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateProfile(req, res) {
        const updates = req.body;
        const allowedUpdates = ['name', 'email'];

        try {
            const user = await User.findById(req.user.userId);
            allowedUpdates.forEach(update => {
                if (updates[update]) user[update] = updates[update];
            });
            await user.save();
            res.json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = authController;