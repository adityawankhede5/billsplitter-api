const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    billName: {
        type: String,
        required: true
    },
    belongsTo: {
        type: String,
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now()
    },
    members: [{
        type: String
    }],
    receipt: [{
        name: {
            type: String,
            required: true,
        },
        isDue: {
            type: Boolean,
            default: true
        },
        paidByMeTotal: {
            type: Number,
            required: true,
        },
        paidForMeTotal: {
            type: Number,
            required: true,
        },
        paidByMe: [{
            name: String,
            amount: Number,
            _id: false
        }],
        paidForMe: [{
            name: String,
            amount: Number,
            _id: false
        }]
    }]
})

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;