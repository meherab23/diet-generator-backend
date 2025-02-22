const Diet = require("../models/Diet.js");

// Create Diet information
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

// Update Diet information
exports.updateDiet = async (req, res) => {
    try {
        const { dietid, userid, age, gender, height, weight, targetWeight, diabetics, routine } = req.body;

        const updatedDiet = await Diet.findByIdAndUpdate(
            dietid,
            {
                userid,
                age,
                gender,
                height,
                weight,
                targetWeight,
                diabetics,
                routine
            },
            { new: true }
        );

        if (!updatedDiet) {
            return res.status(404).json({ message: "Diet not found" });
        }

        res.status(200).json(updatedDiet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update weight only
exports.weightupdateDiet = async (req, res) => {
    try {
        const { dietid, weight } = req.body;

        const updatedDiet = await Diet.findByIdAndUpdate(
            dietid,
            { weight, status: false },
            { new: true }
        );

        if (!updatedDiet) {
            return res.status(404).json({ message: "Diet not found" });
        }

        res.status(200).json(updatedDiet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Delete Diet information
exports.deleteDiet = async (req, res) => {
    try {
        const { dietid } = req.body;

        const deletedDiet = await Diet.findByIdAndDelete(dietid);

        if (!deletedDiet) {
            return res.status(404).json({ message: "Diet not found" });
        }

        res.status(200).json({ message: "Diet deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Update status of a specific day in Diet information
exports.updatestatusDiet = async (req, res) => {
    try {
        const { dietid, day } = req.body;

        const diet = await Diet.findById(dietid);

        if (!diet) {
            return res.status(404).json({ message: "Diet not found" });
        }

        const routineDay = diet.routine.find(r => r.day === day);

        if (!routineDay) {
            return res.status(404).json({ message: "Day not found in routine" });
        }

        routineDay.status = true;

        await diet.save();

        res.status(200).json(diet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
