const express = require("express");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();

//routes
const userRoute = require('./routes/userRoute');


// Middleware setup
dotenv.config(); // Load environment variables from .env file
console.log('PORT:', process.env.PORT); // Debugging output
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); 

/* API Calls */
app.use('/api/user', userRoute);
app.use('/api/trainer' , userRoute);
app.use('/api/trainer/sessions', userRoute);
app.use('/api/sessions', userRoute)

/* Mongoose SETUP */
const PORT = process.env.PORT;
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Database connection error: ${error}`);
  });
/* Mongoose setup complete */



