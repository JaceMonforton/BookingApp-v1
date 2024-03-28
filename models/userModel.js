const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isTrainer: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    seenNotifications: {
        type: Array,
        default: [],
    },
    unseenNotifications: {
        type: Array,
        default: [],
    },
    registeredClasses: {
        type: Array,
        default: [],
    },

    hasSignedWaiver: {
            signedwaiver: {
                type: Boolean,
                default: false,
            },
            emergencyContactInfo: {
                emergencyContactName: {
                    type: String,
                },
                emergencyContactEmailorPhone: {
                    type: String,
                },

            },
            physicalLimits: {
                type: String,
                default: "none",
            },
            signature: {
                type: String,
        },
    }
}, {
    timestamps: true
})
const userModel = mongoose.model('user', userSchema)

module.exports = userModel;


