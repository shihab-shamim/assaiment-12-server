const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Construct the MongoDB URI from environment variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u53e1so.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log('MongoDB URI:', uri.replace(process.env.DB_PASS, '*****'));  // Print URI (without password) for debugging

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
