const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleWare 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nm2ezgo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db("assignment-12").collection("user");
        const categoryCollection = client.db("assignment-12").collection("category");
        const category_Product_Collection = client.db("assignment-12").collection("category_product");

        // get all category 
        app.get('/category', async (req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        })
        // get category product 
        app.get('/category/:id', async (req, res) => {
            const id = parseInt(req.params.id);
            const query = { category_id : id};
            const product = await category_Product_Collection.find(query).toArray();
            console.log(product);
            res.send(product);
        })

        // Post user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send('server is running')
});

app.listen(port, () => {
    console.log(`port running on ${port}`);
})