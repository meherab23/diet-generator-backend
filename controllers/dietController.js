const Diet = require("../models/Diet.js");

// Update user information
exports.creatDiet = async (req, res) => {
    try {
        const { userid, age, gender, height, weight, targetWeight, diabetics, routine } = req.body;

        const newDiet = new Diet({
            userid,
            age,
            gender,
            height,
            weight,
            targetWeight,
            diabetics,
            routine
        });

        await newDiet.save();

        res.status(201).json(newDiet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all diet information
exports.getAllDiets = async (req, res) => {
    try {
        const diets = await Diet.find();

        res.status(200).json(diets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
