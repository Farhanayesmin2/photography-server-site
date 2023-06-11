const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 4000;
const { ObjectId } = require("mongodb");
//This is very very important to connect database for secure pass and user
require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gojv5gq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});





async function run() {
  try {

   const instructorsCollection = client.db("schoolPhotography").collection("instructorCollection");
   const usersData = client.db("schoolPhotography").collection("users");
   const classData = client.db("schoolPhotography").collection("classCollection");
  
 // Get all instructorsCollection data 
    app.get("/instructors", async (req, res) => {
      const query = {};
      const cursor = instructorsCollection.find(query);
      const instructor = await cursor.toArray();
      res.send(instructor);
    });
 // Create user account 
    app.post("/users", async (req, res) => {
        const saverusers = req.body;
      const results = await usersData.insertOne(saverusers);
      res.send(results);
    });
 // Get the user account 
    app.get("/users", async (req, res) => {
      const query = {}
      const cursor = usersData.find(query);
      const usersAccount = await cursor.toArray();
      res.send( usersAccount);
    });
   
 // Create my class section
    app.post("/myclass", async (req, res) => {
        const addSelectedData = req.body;
      const results = await classData.insertOne(addSelectedData);
      res.send(results);
    });

   // Get  my class data
    app.get("/myclass", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = classData.find(query);
      const classSelect = await cursor.toArray();
      res.send(classSelect);
    });

     // my class data delete 
    app.delete("/myclass/:id", async (req, res) => {
      const id = req.params.id;
      console.log("please delete from database", id);
      const query = { _id: new ObjectId(id) };
      const result = await classData.deleteOne(query);
      res.send(result);
    });
    
     app.get('/myclass/:id', async (req,res)=>{
            const id = req.params.id;
            const query = { _id: new  ObjectId(id)};
            const select = await classData.findOne(query);
            res.send(select)
        })

    
    



  
    
    
    
    














     // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Set running data or not
app.get("/", (req, res) => {
  res.send("api running in port 5000");
});

// this is the main port for run data
app.listen(port, () => {
  console.log("The port is runing on:", port);
});
