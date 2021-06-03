require('dotenv').config()
const express  = require("express")
const app = express()
const mongodb = require('mongodb')
const mongoclient = mongodb.MongoClient;
const dbURL = process.env.DB_URL
const bcrypt = require('bcrypt')
const port = process.env.PORT||8000

app.use(express.json())

app.get("/", async (req,res)=>{
    const client = await mongoclient.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})//
    let db = client.db('projectrestapi')
    let user  = await db.collection('passreset').find().toArray()
    res.status(200).json({"message":"port and server working correctly","data":user})
})
//

app.post("/", async (req,res)=>{
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
app.post("/newuser",async (req,res)=>{
    
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
app.listen(port,()=>console.log("app started at "+port))
