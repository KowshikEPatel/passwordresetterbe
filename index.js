require('dotenv').config()
const express  = require("express")
const app = express()
const mongodb = require('mongodb')
const mongoclient = mongodb.MongoClient;
const dbURL = "mongodb+srv://m001-student:m001-student@cluster0.qslea.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"//process.env.DBURL||'mongodb://mongodb0.example.com:27017'process.env.DB_URL
const bcrypt = require('bcrypt')
const cors = require('cors')
const randomstring = require('randomstring')
const nodemailer = require("nodemailer");
const port = process.env.PORT||8000

app.use(express.json())

app.get("/", cors(),async (req,res)=>{
    const client = await mongoclient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})//
    let db = client.db('projectrestapi')
    let user  = await db.collection('passreset').find().toArray()
    res.status(200).json({"message":"port and server working correctly","data":user})
})
//

app.post("/",cors(), async (req,res)=>{
    const client = await mongoclient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})//
    let db = client.db('projectrestapi')
    
    let user  = await db.collection('passreset').findOne({"user_name":req.body["user_name"]})
    
    bcrypt.compare(req.body["password"],user["password"])
    .then(result=>{
        if(result){
            console.log(result)
            res.status(200).json({"user":user["user_name"],"id":user["_id"]})
        }
        else{
            res.status(403).json({"message":"unauthorized"})
        }
    })
    
    client.close()
})

//creating a new  user
app.post("/newuser",cors(),async (req,res)=>{
    
    bcrypt.genSalt(11,(err,salt)=>{
        bcrypt.hash(req.body["password"],salt, async (err,hash)=>{
            const client = await mongoclient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})
            let db = client.db('projectrestapi')
            let data = await db.collection("passreset").insertOne({
                "user_name":req.body["user_name"],
                "password":hash,
                "hasRequestedReset":false,
                "randomString":""
            })
            
            res.status(200).json({data})
            client.close()
        })
    })
    
})

app.post("/forgotpw",cors(),async (req,res)=>{
    const client = await mongoclient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})
    let db = client.db('projectrestapi')
    let data = await db.collection("passreset").findOne(req.body)

    let transporter = nodemailer.createTransport({ 
        host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "felicia24@ethereal.email", // generated ethereal user
      pass: "JYqAD1zNNwhS7Tc82d"      , // generated ethereal password
    },
  });
  let key = randomstring.generate()
  let randomURL = `https://blissful-rosalind-539ba2.netlify.app/resetpassword/`+key// https://kp-passwordresetter.herokuapp.com/resetpassword/
  let stored  = await db.collection('passreset').findOneAndUpdate(req.body,{$set:{"randomString":key}})
  let info = await transporter.sendMail({
    from: '"felicia24@ethereal.email" <felicia24@ethereal.email>', // sender address
    to:  data["email"], // list of receivers "bar@example.com, baz@example.com"
    subject: "Password reset string", // Subject line
    html: `<p>Hi ${data["user_name"]}, you have requested for resetting your password on onlogger.com. Click on the 
    <a href="${randomURL}">link</a> to reset your password </p> `, // html body
  });

    res.status(200).json({info,stored})
})

app.get("/resetpassword/:str",cors(),async(req,res)=>{

    const client = await mongoclient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})
    let db = client.db('projectrestapi')
    let data = await db.collection("passreset").findOne({"randomString":req.params.str})
    console.log(data["randomString"])
    console.log(req.params.str)
    res.status(200).json({"data":data["randomString"],"params":req.params.str})

})
app.listen(port,()=>console.log("app started at "+port))
