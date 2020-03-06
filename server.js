const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

dotenv.config({path: './config.env'});

const PORT = process.env.PORT;

app.listen(PORT, ()=>{
    console.log("App running on port: ", PORT);
});

mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then((con) => {
    console.log("DB connected succesfully.");
});