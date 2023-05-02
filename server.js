const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/userModel');
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();

// MIDDLEWARES
const app = express();
app.use(express.urlencoded({extended:false}));
app.use(express.json({extended:false}));




// DATABASE CONNECTION
const connectDb = async () => {
  try {
    const connect = await mongoose.connect("mongodb://localhost:27017/mydb",{
      useNewUrlParser:true,
      useUnifiedTopology:true
    });
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
connectDb();




// CONNECTING FRONTEND AND BACKEND
const corsOptions = {
  origin: '*', // specify the origin domain
};
app.use(cors(corsOptions));




// ROUTES
app.post('/register',async (req, res) => {

  try{
    const hashedPassword = await bcrypt.hash(req.body.userPassword,10);
    await User.create({
      name: req.body.userName,
      email: req.body.userEmail,
      password: hashedPassword,
      confirmPassword: hashedPassword
    });
    res.json({
      message: "User Registered Successfully"
    })

  }catch(err){
    res.json({
      message: "Email already Registred"  // in model we have menctioned email as unique
    })
  }
})

app.post('/login',async (req, res) => {

  try{
    const loginDetails = req.body;
    const user = await User.findOne({
      email: loginDetails.userEmail
    })
    if(user){
      if(await bcrypt.compare(loginDetails.userPassword,user.password)){
          let payload = {
            user:{
                id : user.id
                }
          }
          jwt.sign(payload,'jwtSecret',{expiresIn:3600000},
            (err,token) =>{
                if (err) throw err;
                return res.json({token,message:"User Logged In Successfully"})
            }  
            )
      }else{
            res.json({
              message: "Incorrect Password"
            })
      }
    }else{
          res.json({
            message: "User Not Registred"
          })
    }

  }catch(err){
    res.json({
      message: "User Not Registred"
    })
  }
})


app.get('/myprofile',middleware,async(req, res)=>{
  try{
      let user = await User.findById(req.user.id);
      if(!user){
          return res.status(400).send('User not found');
      }
      res.json(user);
  }
  catch(err){
    res.json({
      message: "Server Error"
    })
  }
})






// SERVER START
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("server running on http://localhost:5000")
})
