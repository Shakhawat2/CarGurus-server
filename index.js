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
function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message : 'unauthorized access'})
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message : 'Forbidden Access'})
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

        //GET TOKEN
        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email : email}
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn : '1d'});
                return res.send({accessToken : token})
            }
            res.status(403).send({accessToken : ''});
        })
        // check what type of account is user
        app.get('/user/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            if(user?.account_type === "Admin"){
                return res.send({isAdmin : true})
            }
            if(user?.account_type === "Seller"){
                return res.send({isSeller : true})
            }
            if(user?.account_type === "Buyer"){
                return res.send({isBuyer : true})
            }
            res.status(403).send({message : 'Forbidden access'})
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