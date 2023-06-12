const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PAYMENT_CREATE_INTENT_KEY);
const port = process.env.PORT || 4000;




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


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
  try {

   const instructorsCollection = client.db("schoolPhotography").collection("instructorCollection");
   const usersData = client.db("schoolPhotography").collection("users");
   const classData = client.db("schoolPhotography").collection("classCollection");
   const paymentsCollection = client.db('schoolPhotography').collection('payments');
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
    app.get("/dashboard/myclass", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = classData.find(query);
      const classSelect = await cursor.toArray();
      res.send(classSelect);
    });

     // my class data delete 
    app.delete("/dashboard/myclass/:id", async (req, res) => {
      const id = req.params.id;
      console.log("please delete from database", id);
      const query = { _id: new ObjectId(id) };
      const result = await classData.deleteOne(query);
      res.send(result);
    });
    
     app.get('/dashboard/myclass/:id', async (req,res)=>{
            const id = req.params.id;
            const query = { _id: new  ObjectId(id)};
            const select = await classData.findOne(query);
            res.send(select)
        })

  
    
      app.post('/create-payment-intent', async (req, res) => {
  const select = req.body;
  const price = select.price;
  const amount = price * 100;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'usd',
      amount: amount,
      payment_method_types: ['card'],
    });
    
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send('Error creating payment intent');
  }
});

     app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            // const id = payment.selectId
            // const collectionId = payment.collectionId
            // const filter2 = {collectionId: collectionId}
            // const filter3 = {_id: ObjectId(collectionId)}
            // const filter4 = {_id: ObjectId(collectionId)}
            // const filter = {_id: ObjectId(id)}
            // const updatedDoc = {
            //     $set: {
            //         paid: true,
            //         transactionId: payment.transactionId
            //     }
            // }
            // const deleteResult = await phoneCollections.deleteOne(filter3)
            // const updatedResult2 = await bookingCollections.updateMany(filter2, updatedDoc)
            // const updatedResult = await bookingCollections.updateOne(filter, updatedDoc)
            // const updatedResult3 = await myProductCollections.updateOne(filter4, updatedDoc)
            res.send(result);
        })


  
    
    
    
    







// const crypto = require('crypto');

// const generateRandomSecretKey = () => {
//   const byteLength = 32;
//   return crypto.randomBytes(byteLength).toString('hex');
// };

// const secretKey = generateRandomSecretKey();
// console.log(secretKey);



 app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersData.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.JWT_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });



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
