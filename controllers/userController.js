const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Update user information
exports.updateUser = async (req, res) => {
    try {
      const { userId, phone, name } = req.body;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { phone: phone, name: name },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
