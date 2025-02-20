const mongoose = require('mongoose');

const DietSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Array,
        required: true
    },
    targetWeight: {
        type: Number,
        required: true
    },
    diabetics: {
        type: String,
        required: true
    },
    routine: {
        type: [
            {
                day: {
                    type: String,
                    required: true
                },
                breakfast: {
                    type: String,
                    required: true
                },
                lunch: {
                    type: String,
                    required: true
                },
                dinner: {
                    type: String,
                    required: true
                },
                status: {
                    type: Boolean,
                    default: false
                }    
            }
        ],
        required: true
    }
});

const Diet = mongoose.model('Diet', DietSchema);

module.exports = Diet;