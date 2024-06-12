const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken')

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));
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
    const propetyCollection =client.db("finallShort").collection("property");
    const verifyPropertyCollection =client.db("finallShort").collection("verifyProperty");

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
      
      // user management api 
    
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
          app.get('/users/:id',verifyToken,async (req,res)=>{
            const id =req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await userCollection.findOne(query)
            res.send(result)
          })
          app.patch('/users/:id',verifyToken,async(req,res)=>{
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
          app.delete('/users/:id',verifyToken,async (req,res) => {
            const id =req.params.id 
            const query ={_id : new ObjectId(id)}
            const result = await userCollection.deleteOne(query)
            res.send(result)
          })
          app.get('/user/:email',verifyToken,async(req,res)=>{
            const email =req.params.email
            const query ={email:email}
            // console.log(email)
            const result = await userCollection.findOne(query)
            res.send(result)
          })

          // agent  related api  

          app.post('/property',verifyToken,async (req,res) =>{
               const propertyInfo = req.body 
               console.log( 'property',propertyInfo)
              //  const info = {
               
              //  }
              //  console.log('info',info)

            const result = await propetyCollection.insertOne(propertyInfo)
            res.send(result)


          })
        

          app.get('/property/:email',verifyToken,async (req,res) => {
            const email = req.params.email 
            const query = {agentEmail:email}
            const result = await propetyCollection.find(query).toArray()
            res.send(result)
          })
         
          
          app.delete('/property/:id',verifyToken,async(req,res)=>{
            const id =req.params.id 
            const query = {_id : new ObjectId(id)}
            const result = await propetyCollection.deleteOne(query)
            res.send(result)
          })

          // TODO: is not work help by support season
        
          app.get('/prop/:id',async (req,res) => {
            const id = req.params.id
            
            const query ={_id: new ObjectId(id)}
            console.log(id)
            const result = await propetyCollection.findOne(query)
            res.send(result)
          })
        
        // admin related api  
        app.get('/property',verifyToken,async(req,res)=>{

          const result =await propetyCollection.find().toArray()
          res.send(result)
        })
        app.patch('/property/:id',async(req,res)=>{
          const status =req.body
          const id =req.params.id
          const filter ={_id:new ObjectId(id)}
          const updateOne={
            $set:status
          }
          const result =await propetyCollection.updateOne(filter,updateOne)
          res.send(result)
          
        })
        
        app.post('/verifyProperty',async(req,res)=>{
          const verifyItems=req.body

          const result =await verifyPropertyCollection.insertOne(verifyItems)
          res.send(result)

        })
          
        //  agent aPI 
      





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
