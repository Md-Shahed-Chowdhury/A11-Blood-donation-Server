const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.port || 3000;

//middleware
app.use(express.json());
app.use(cors());
//mongodb client setup

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://Md-Shahed-Chowdhury:${process.env.DB_PASS}@cluster0.9y5oe7g.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("Blood-donation");
    const Users = database.collection("Users");

    //user api
    app.post("/newUser",async(req,res)=>{
        const newUser = req.body;
        newUser.role = "donor";
        newUser.status = "active";
      const result = await Users.insertOne(newUser);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("server is running");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
