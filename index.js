const express = require("express");
const MongoClient = require("mongodb").MongoClient;

const dbName = "klausurenplaner";
const mongoUri = `mongodb+srv://user:password123456@cluster0.pn9b9.mongodb.net/test`;
const collectionName = "klausur";

async function main() {
const app = express();
app.use(express.json()); // parsing the request body
let client;

try {
    client = await MongoClient.connect(mongoUri, { useUnifiedTopology: true });
    console.log("Connected to database");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    app.get("/klasur", async (req, res) => {
        try {
            const result = await collection.find().toArray();
            console.log(result);
            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
            }
    });

    app.get("/klasuur/:klausurId", async (req, res) => {
        try {
            const id = req.params.klausurId;
            console.log(`Received request for klausur ${id}`);
            // TODO
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });

    app.post("/items", async (req, res) => {
        try {
            const data = req.body;
            const result = await collection.insertOne(data);
            const id = result.insertedId; // unique Id from MongoDB

            console.log(`Inserted document ${id}`);
            res.set("Location", `/items/${id}`);
            res.status(201).end();
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    });

    app.put("/items/:itemId", (req, res) => {
    // TODO
    });

    app.delete("/items/:itemId", (req, res) => {
    // TODO
    });

    app.listen(3000, () => {
    console.log("Listening on http://localhost:3000");
    });

} catch (err) {
console.error(err);
}
}
main().catch((err) => console.err(err));
