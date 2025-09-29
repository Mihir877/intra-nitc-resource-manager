import { User } from "../models/user.model.js";

// cookie options
const cookieOptions = {
  httpOnly: true,
  // secure: process.env.NODE_ENV === "production",
  // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  secure: false, // ❌ set false for local Postman testing
  sameSite: "lax", // avoid strict cross-site cookie rules
};

const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existedUser = await User.findOne({ email });
    if (existedUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const user = await User.create({ name, email, password, role });
    const { accessToken, refreshToken } = await generateTokens(user._id);

    const safeUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({ user: safeUser, message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await user.isPasswordCorrect(password);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = await generateTokens(user._id);
    const safeUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        user: safeUser,
        accessToken,
        refreshToken,
        message: "Login successful",
      });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Logout
export const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });

    res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Current user
export const getCurrentUser = async (req, res) => {
  res.status(200).json({ user: req.user });
};
