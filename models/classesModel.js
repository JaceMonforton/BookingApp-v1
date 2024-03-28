const mongoose = require('mongoose');

const classesSchema = new mongoose.Schema({

   date: {
    type: String,
    required: true,
   },
   startTime: {
    type: String,
    required: true,
   },
   endTime: {
    type: String,
    required: true,
   },
   classTitle: {
    type: String,
    required: true,
   },
   gym: {
    type: String,
    required: true,
   },
   focus: {
    type: String,
    required: true,
   },
   registeredUsers: {
    type: Array,
    default: [],
   },
   personLimit: {
    type: Number,
    required: true,
   },
   fee: {
    type: String,
    required: false,
    default: "Not Specified",
   }
   
}, {
    timestamps: true
})
const classesModel = mongoose.model('class', classesSchema)

module.exports = classesModel;


