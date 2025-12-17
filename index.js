const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 3000;

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
//middleware
app.use(express.json());
app.use(cors());

const verifyFbToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  try {
    const idToken = token.split(" ")[1];
    if (!idToken) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    req.authorizedEmail = decoded.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
};

//mongodb client setup

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
    const bloodRequests = database.collection("Blood-request");

    //user api
    app.post("/newUser", async (req, res) => {
      const newUser = req.body;
      newUser.role = "donor";
      newUser.status = "active";
      const result = await Users.insertOne(newUser);
      res.send(result);
    });

    app.post("/viewSearchedDonors", async (req, res) => {
      const query = req.body;
      const cursor = Users.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/getRole/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email };
      const result = await Users.findOne(query);
      res.send(result);
    });

    // Update user profile
    app.patch("/updateProfile/:email", async (req, res) => {
      const { email } = req.params;
      const updateData = req.body;

      const result = await Users.updateOne({ email }, { $set: updateData });

      res.send(result);
    });
    // Get user profile by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await Users.findOne({ email });
      res.send(result);
    });

    //blood req api
    app.post("/add-blood-request", verifyFbToken, async (req, res) => {
      const newReq = req.body;
      console.log(req.authorizedEmail);
      const result = await bloodRequests.insertOne(newReq);
      res.send(result);
    });

    app.get("/my-blood-request", verifyFbToken, async (req, res) => {
      const query = { requesterEmail: req.authorizedEmail };
      console.log(req.authorizedEmail);
      const cursor = bloodRequests.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/pendingRequest", async (req, res) => {
      const query = { status: "pending" };
      const cursor = bloodRequests.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/pendingDetails/:id", verifyFbToken, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };

      const result = await bloodRequests.findOne(query);
      res.send(result);
    });

    app.patch("/pendingRequestUpdate/:id", async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const update = {
        $set: {
          status: "inprogress",
        },
      };
      const options = {};
      const result = await bloodRequests.updateOne(query, update, options);

      res.send(result);
    });
    // Update donation status
    app.patch("/update-donation-status/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      const result = await bloodRequests.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      res.send(result);
    });
    // Delete donation request
    app.delete("/delete-donation-request/:id", async (req, res) => {
      const { id } = req.params;

      const result = await bloodRequests.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

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
