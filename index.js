const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");

//This is very very important to connect database for secure pass and user
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_CREATE_INTENT_KEY);
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send("unauthorized access");
	}

	const token = authHeader.split(" ")[1];

	jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
		if (err) {
			return res.status(403).send({ message: "forbidden access" });
		}
		req.decoded = decoded;
		next();
	});
}

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
		const instructorsCollection = client
			.db("schoolPhotography")
			.collection("instructorCollection");
		const usersData = client.db("schoolPhotography").collection("users");
		const classData = client
			.db("schoolPhotography")
			.collection("classCollection");
		const paymentsCollection = client
			.db("schoolPhotography")
			.collection("payments");
		const instructorData = client
			.db("schoolPhotography")
			.collection("instructorData");

		app.post("/jwt", (req, res) => {
			const user = req.body;
			//  console.log(user);
			const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: "1h" });
			//console.log(token);
			res.send({ token });
		});

		// Warning: use verifyJWT before using verifyAdmin
		const verifyAdmin = async (req, res, next) => {
			const email = req.decoded.email;
			// console.log(email);
			const query = { email: email };
			const user = await usersData.findOne(query);
			if (user?.role !== "admin") {
				return res
					.status(403)
					.send({ error: true, message: "forbidden message" });
			}
			next();
		};

		// Get all user accounts
		app.get("/users", async (req, res) => {
			const query = {};
			const cursor = usersData.find(query);
			const usersAccount = await cursor.toArray();
			res.send(usersAccount);
		});

		// Admin-only users related APIs
		// app.get('/users/admin',  async (req, res) => {
		//   const result = await usersData.find().toArray();
		//   res.send(result);
		// });

		// Admin-only users related APIs
		app.get("/users/admin/:email", async (req, res) => {
			const email = req.params.email;
			console.log(email);
			const query = { email };
			const user = await usersData.findOne(query);
			const adminresult = { admin: user?.role === "admin" };
			console.log(adminresult);
			res.send(adminresult);
		});
		//Instructor-only users related APIs
		app.get("/users/instructor/:email", async (req, res) => {
			const email = req.params.email;
			//  console.log(email);
			const query = { email };
			const user = await usersData.findOne(query);
			res.send(user);
		});

		// Create user account  and check user

		app.post("/users", async (req, res) => {
			const user = req.body;
			const query = { email: user.email };
			const existingUser = await usersData.findOne(query);

			if (existingUser) {
				return res.send({ message: "user already exists" });
			}

			const result = await usersData.insertOne(user);
			res.send(result);
		});

		// Get all instructorsCollection data
		app.get("/instructors", async (req, res) => {
			const query = {};
			const cursor = instructorsCollection.find(query);
			const instructor = await cursor.toArray();
			res.send(instructor);
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

			//  const decodedEmail = req.decoded.email;
			//     if (email !== decodedEmail) {
			//       return res.status(403).send({ error: true, message: 'forbidden access' })
			//     }

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

		app.get("/myclass/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const select = await classData.findOne(query);
			res.send(select);
		});

		// Update from admin manage users pages
		app.patch("/users/instructor/:id", async (req, res) => {
			const id = req.params.id;
			console.log(id);
			const filter = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					role: "instructor",
				},
			};

			const result = await usersData.updateOne(filter, updateDoc);
			res.send(result);
		});

		// Update from manage users pages
		app.patch("/users/admin/:id", async (req, res) => {
			const id = req.params.id;
			console.log(id);
			const filter = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					role: "admin",
				},
			};

			const result = await usersData.updateOne(filter, updateDoc);
			res.send(result);
		});

		//users data delete, Delete from manage users pages
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			console.log("please delete from database", id);
			const query = { _id: new ObjectId(id) };
			const result = await usersData.deleteOne(query);
			res.send(result);
		});

		// Manage users page

		app.get("/allclasses", async (req, res) => {
			const query = {};
			const result = await instructorData.find(query).toArray();
			res.send(result);
		});
		//allclasses/feedback
		//  feedback from manages users
		app.patch("/allclasses/feedback/:id", async (req, res) => {
			const id = req.params.id;
			const feedback = req.query.feedback;
			const filter = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					feedback: feedback,
				},
			};
			const result = await instructorData.updateOne(filter, updateDoc);
			res.send(result);
		});
		// Approve from manage users
		app.patch("/allclasses/approved/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					status: "approved",
				},
			};
			const result = await instructorData.updateOne(filter, updateDoc);
			res.send(result);
		});
		// Add instructor from instructor dashboard
		app.post("/addInstructor", async (req, res) => {
			const addInstructor = req.body;
			const email = req.query.email;
			const query = { email: email };
			const existingIns = await instructorData.findOne(query);
			if (existingIns) {
				return res.send("Instructor is already existing");
			}
			const result = await instructorData.insertOne(addInstructor);
			res.send(result);
		});
		// instructor class from instructor dashboard
		app.get("/instructor-class", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			const result = await instructorData.find(query).toArray();
			res.send(result);
		});
		// instructor class delete from instructor dashboard
		app.delete("/instructor-class/:id", async (req, res) => {
			const id = req.params.id;
			console.log("please delete from database", id);
			const query = { _id: new ObjectId(id) };
			const result = await instructorData.deleteOne(query);
			res.send(result);
		});

		// instructor update
		app.patch("/update/:id", async (req, res) => {
			const updateItems = req.body;
			const { class_name, picture, available_seats, price } = updateItems;
			const id = req.params.id;

			const option = { upsert: true };
			const filter = { _id: new ObjectId(id) };

			const updatedDoc = {
				$set: {
					class_name: class_name,
					picture: picture,
					available_seats: available_seats,
					price: price,
				},
			};

			const result = await instructorData.updateOne(filter, updatedDoc, option);
			res.send(result);
		});
		// create payment intent
		app.post("/create-payment-intent", async (req, res) => {
			const { price } = req.body;
			const amount = parseInt(price * 100);
			const paymentIntent = await stripe.paymentIntents.create({
				amount: amount,
				currency: "usd",
				payment_method_types: ["card"],
			});

			res.send({
				clientSecret: paymentIntent.client_secret,
			});
		});

		// payment related api
		// Post payments classes
		//  app.post("/payments", async (req, res) => {
		//   try {
		//     const payment = req.body;
		//     console.log(payment);
		//     const insertResult = await paymentsCollection.insertOne(payment);
		//     const insertedId = insertResult.insertedId;
		//     res.json({ insertedId });
		//   } catch (error) {
		//     console.error("Error inserting payment:", error);
		//     res.status(500).json({ error: "Failed to insert payment" });
		//   }
		// });

		// Post payments classes
		app.post("/payments", async (req, res) => {
			const payment = req.body;
			console.log(payment);
			const insertResult = await paymentsCollection.insertOne(payment);
			const insertedId = insertResult.insertedId;
      const class_id = req.query.class_id;
      console.log(class_id);
			const id = payment.id;
			const query = { _id: new ObjectId(id) };

			const instructorEmail = payment.instructorEmail;
      const filter = { class_id: class_id };
      console.log(filter);
			// const filter = { _id: new ObjectId(class_id) };
			const filterInstructor = { email: instructorEmail };

			const updateDoc = {
				$inc: {
					totalEnrolled: 1,
					availableSeats: -1,
				},
			};
			const updateNumberOfStudent = {
				$inc: {
					totalStudent: 1,
				},
			};
			const result = await instructorsCollection.updateOne(filter, updateDoc);
			const updateStudentNumber = await instructorsCollection.updateOne(
				filterInstructor,
				updateNumberOfStudent
			);
			// const insertResult = await paymentsCollection.insertOne(payment);

			const deleteResult = await classData.deleteOne(filter);

			res.send({ insertedId, deleteResult, result, updateStudentNumber });
		});

		// Get the all payment data

		app.get("/payments", async (req, res) => {
			const userEmail = req.query.email;
			const query = { email: userEmail };
			const cursor = paymentsCollection.find(query);
			const payment = await cursor.toArray();
			res.send(payment);
		});

		// for payment history
		app.get("/paymentHistory", async (req, res) => {
			const userEmail = req.query.useremail;
			const query = { email: userEmail };
			const result = await paymentsCollection
				.find(query)
				.sort({ date: -1 })
				.toArray();
			res.send(result);
		});

		//  app.get('/jwt', async (req, res) => {
		//             const email = req.query.email;
		//             const query = { email: email };
		//             const user = await usersData.findOne(query);
		//             if (user) {
		//                 const token = jwt.sign({ email }, process.env.JWT_TOKEN, { expiresIn: '1h' })
		//                 return res.send({ accessToken: token });
		//             }
		//             res.status(403).send({ accessToken: '' })
		//         });

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
