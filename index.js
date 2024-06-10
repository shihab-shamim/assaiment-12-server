const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken')

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Construct the MongoDB URI from environment variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u53e1so.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    const userCollection = client.db("finallShort").collection("users");

    // middle ware 
    const verifyToken= (req,res,next)=>{
        // console.log('inside verify token ',req.headers.authorization)
        if(!req.headers.authorization){
          return res.status(401).send({message:'unauthorized access'})
        }
        const token =req.headers.authorization.split(' ')[1]
        // console.log('Access token',token)
        if(!token){
          return res.status(401).send({message:'unauthorized access'})
        }
       jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:''})
        }
        req.decoded = decoded;
        next()
       })
      }
    //   use verify after verifyToken 
    const verifyAdmin= async(req,res,next)=>{
        const email = req.decoded.email
        const query = {email:email}
        const user = await userCollection.findOne(query)
        const isAdmin = user?.role === 'admin'
        if(!isAdmin){
          return res.status(403).send({message : 'forbidden access'})
        }
        next()
  
      }

  

      // jwt related api 
      app.post('/jwt',async (req,res)=>{
        // console.log(req.headers)
        const user= req.body ;
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'356d'});
        res.send({token})
  
      })
    
        app.post('/users',async (req,res)=>{
            const user =req.body
            //  insert  email if user dosen't exixsts : 
            //  you can do  this many  ways (1. email unique , 2.upsert. 3. simple checking )
            const query = {email: user.email}
            const  existingUser = await userCollection.findOne(query); 
            if(existingUser){
              return res.send({message: 'user already exists', insertedId:null})
            }
            const result = await userCollection.insertOne(user)
            
            res.send(result)
      
          })
          app.get('/users',verifyToken ,async(req,res)=>{
            const result = await userCollection.find().toArray()
            res.send(result)
            
          })
          app.get('/users/:id',async (req,res)=>{
            const id =req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await userCollection.findOne(query)
            res.send(result)
          })
          app.patch('/users/:id',async(req,res)=>{
            const id =req.params.id
            const {role}=req.body 
            console.log(role)
            const filter = {_id: new ObjectId(id)}
            const updatedDoc ={
              $set:{
               role:role
              }
            }
           
            const result = await userCollection.updateOne(filter,updatedDoc)
            res.send(result)

          })
          app.delete('/users/:id',async (req,res) => {
            const id =req.params.id 
            const query ={_id : new ObjectId(id)}
            const result = await userCollection.deleteOne(query)
            res.send(result)
          })

  






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('assignment-12 server is running');
});


app.listen(port, () => {
  console.log('Server is running on port', port);
});
