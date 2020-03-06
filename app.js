const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Bill = require('./Model/billModel');
const User = require('./Model/userModel');

app.get('/api/v1/test', (req, res)=>{
    res.json({
        isSuccessful: true,
        name: "test-end-point",
        message: "Working perfectly"
    })
})


// NEW BILL 
app.get('/api/v1/createbill',async (req, res)=>{
    // console.log(req.headers);
    const email = req.headers.email;
    const billName = req.headers.billname;
    const members= JSON.parse(req.headers.members);
    const newMembers = JSON.parse(req.headers.newmembers);
    // console.log(email, billName, members, newMembers);
    
    const receipt = members.map(m=>{
        return {
            name: m,
            paidByMeTotal: 0,
            paidForMeTotal: 0,
            paidByMe: [],
            paidForMe: [] 
        }
    })
    const bill = await Bill.create({
        belongsTo: email,
        billName: billName,
        members: members,
        receipt: receipt
    });
    
    await User.findOneAndUpdate(
        {"email": email}, 
        { 
            "$push": {"existingMembers": {
                "$each": newMembers
            },
            "bills": bill._id,
            "existingBillNames": bill.billName
        } 
        }
        );

    res.status(200).json({
        isSuccessful: true,
        bill
    })
})


getEmptyReceipt = (name) => {
    return {
        name,
        paidByMeTotal: 0,
        paidForMeTotal: 0,
        paidByMe: [],
        paidForMe: []
    }
}

// ADD MEMBER TO BILL
app.get('/api/v1/addmembertobill', async (req, res)=> {
    const email = req.headers.email;
    const billName = req.headers.billname;
    // console.log(email, billName)
    const members= JSON.parse(req.headers.members);
    const newMembers = JSON.parse(req.headers.newmembers);
    // console.log("Members: ", members);
    // console.log("New Members: ", newMembers);
    const bill = await Bill.findOne({"belongsTo": email, "billName": billName});
    const allReceipts = members.map((m,i)=>{
        if(bill.members.includes(m)) return bill.receipt[i];
        return getEmptyReceipt(m);
    })
    bill.members = members;
    bill.receipt = allReceipts;
    await bill.save();
    
    await User.findOneAndUpdate(
        {"email": email}, 
        { 
            "$push": {"existingMembers": {
                "$each": newMembers
                }
           } 
        }
    );

    res.status(200).json({
        isSuccessful: true,
        bill
    })

});

// GET BILL MEMBERS
app.get('/api/v1/getbillmembers', async (req,res)=>{
    const email = req.headers.email;
    const billName = req.headers.billname;

    // console.log(billName);
    const bill = await Bill.findOne({"belongsTo": email, "billName": billName});
    if(bill===null){
        res.status(404).json({
            isSuccessful: true,
            message: `No bill with the name ${billName} was found.`
        })
        return;
    }
    // console.log("Bill members:", bill.members);
    res.status(200).json({
        isSuccessful: true,
        members: bill.members
    })
})

// GET ALL BILLS
app.get('/api/v1/getallbills', async (req, res)=>{
    const email = req.headers.email;
        let allBills = await Bill.find({"belongsTo": email});
        // console.log(allBills);
        res.status(200).json({
            isSuccessful: true,
            allBills    
        })    
})


// GET EXISTING MEMBERS AND BILL NAMES
app.get('/api/v1/getexisitingassets', async (req, res)=>{
    const email = req.headers.email;
    const asset = await User.find({"email": email}, "existingBillNames existingMembers");
    res.status(200).json({
        asset: asset[0]
    })
})



findOrCreateUser = async (email, name) => {
    let user = await User.find({"email": email});
    const isUser = user.length;
    if(isUser){
        // console.log("Found: ", user[0]);
        return user[0];
    }
    const existingMembers = ["me"]
    user = await User.create({
        name,
        email,
        existingMembers
    })
    // console.log("Created: ",user);
    return user;

}

//GET USER
app.get('/api/v1/getuser', async (req, res)=>{
    // console.log('creating user');
    const user = await findOrCreateUser(req.headers.email, req.headers.name)
    const existingMembers = user.existingMembers;
    const existingBillNames = user.existingBillNames;
    res.status(200).json({
        isSuccessful: true,
        existingMembers,
        existingBillNames
    })
})

// GET BILL
app.get('/api/v1/getbill', async (req, res)=>{
    const billName = req.headers.billname;
    const email = req.headers.email;
    // console.log(billName);
    const bill = await Bill.find({"belongsTo": email,"billName": billName});
    // console.log(bill);
    res.status(200).json({
        isSuccessful: true,
        bill: bill[0]
    })
})

// UPDATE RECEIPT
app.get('/api/v1/updatereceipt', async (req, res)=>{
    // console.log(req.headers);
    const email = req.headers.email;
    const billName = req.headers.billname;
    // console.log(billid);
    const receipt = JSON.parse(req.headers.receipt);
    const updatedBill = await Bill.findOneAndUpdate({"belongsTo": email, "billName": billName}, {"receipt": receipt});
    // console.log(updatedBill);
    res.status(200).json({
        isSuccessful: true,
        receipt: updatedBill.receipt
    })
});

// DELTE BILL
app.get('/api/v1/deletebill', async (req,res)=>{
    const email = req.headers.email;
    const billName = req.headers.billname;

    const deletedBill = await Bill.findOneAndDelete({"belongsTo": email, "billName": billName});
    const deletedBillId = deletedBill._id;
    // console.log(deletedBillId);
    let user = await User.findOne({"email": email});
    const updatedBillNames = [];
    const updatedBillIds = [];
    user.existingBillNames.forEach(name=>{
        if(name!==billName){
            updatedBillNames.push(name);
        }
    })
    user.bills.forEach(id=>{
        if(!deletedBillId.equals(id)){
            updatedBillIds.push(id);
        }
    })
    user.existingBillNames = updatedBillNames;
    user.bills = updatedBillIds;
    user.save();
    res.status(200).json({
        existingBillNames: user.existingBillNames
    })
})

module.exports=app;

