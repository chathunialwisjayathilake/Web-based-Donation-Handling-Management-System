const { User } = require("../../models/User");
const Donor = require("../../models/Donor");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            username,
            email,
            phone,
            password: hashedPassword,
            role: "DONOR",
        });

        // Create donor profile
        await Donor.create({
            userId: user._id,
            name: username, // Using username as name for now
            phone: phone,
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "your_jwt_secret",
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const searchId = identifier.toLowerCase();
        // Find user by email or username (case-insensitive)
        const user = await User.findOne({
            $or: [
                { email: searchId },
                { username: searchId }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "your_jwt_secret",
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    register,
    login,
};
