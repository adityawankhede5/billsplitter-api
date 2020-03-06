const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    bills: {
        type: [ObjectId]
    },
    existingMembers: [{
        type: String,
    }],
    existingBillNames: [{
        type: String,
    }]
})

const User = mongoose.model('User', userSchema);
module.exports = User;