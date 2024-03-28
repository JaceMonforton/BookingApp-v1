const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },

    userId: {
        type: String,
        required: true,
    },

    gym: {
        type: String,
        required: true,
    },
    specialization: {
        type: String,
        required: false,
    },
    experience: {
        type: String,
        required: false,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    resume: {
        type: Buffer,
        required: false,
    },
    status: {
        type: String,
        required: false,
        default: 'Pending',
    },

   
}, {
    timestamps: true
})
const trainerModel = mongoose.model('trainer', trainerSchema)

module.exports = trainerModel;


