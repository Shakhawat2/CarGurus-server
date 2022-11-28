const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

//middleWare 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nm2ezgo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//verify jwt 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}
async function run() {
    try {
        const usersCollection = client.db("assignment-12").collection("user");
        const categoryCollection = client.db("assignment-12").collection("category");
        const category_Product_Collection = client.db("assignment-12").collection("category_product");
        const bookingCollection = client.db("assignment-12").collection("bookings");

        // get all category 
        app.get('/category', async (req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        })
        // get category product 
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const product = await category_Product_Collection.find(query).toArray();
            res.send(product);
        })
        // post category product
        app.post('/category/product', async (req, res) => {
            const product = req.body;
            const result = await category_Product_Collection.insertOne(product);
            res.send(result);
        })
        // find own category product 
        app.get('/category/product/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await category_Product_Collection.find(query).toArray();
            res.send(result);
        })

        //GET TOKEN
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' });
        })
        // check what type of account is user
        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            if (user?.account_type === "Admin") {
                return res.send({ isAdmin: true })
            }
            if (user?.account_type === "Seller") {
                return res.send({ isSeller: true })
            }
            if (user?.account_type === "Buyer") {
                return res.send({ isBuyer: true })
            }
            res.status(403).send({ message: 'Forbidden access' })
        })
        //get all sellers
        app.get('/users/sellers', async (req, res) => {
            const query = { account_type: "Seller" }
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        })
        //get one user 
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await usersCollection.findOne(query);
            res.send(result);
        })
        //get all Buyers
        app.get('/users/buyers', async (req, res) => {
            const query = { account_type: "Buyer" }
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        })
        // delete user 
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })
        // verified user  
        app.put('/user/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verified: true
                },
            };
            const user1 = await usersCollection.findOne(filter);
            const query = { email: user1.email }
            const result1 = await category_Product_Collection.find(query).toArray();
            if (result1.length === 0) {
                return res.send({ message: 'This Seller have no product. Sorry please Verify next time' })
            }
            if (result1.length === 1) {
                const updateProduct = await category_Product_Collection.updateOne(query, updateDoc, options)
                const result = await usersCollection.updateOne(filter, updateDoc, options);
                console.log(result);
                return res.send(result);
            }
            const updateProducts = await category_Product_Collection.updateMany(query, updateDoc)
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.send(result)
        })
        //Post Booking
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            console.log(result);
            res.send(result);
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