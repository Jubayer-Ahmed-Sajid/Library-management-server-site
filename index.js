const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
app.use(express.json());
app.use(cors())
const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vqva6ft.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        const database = client.db("Categories");
        const CategoriesCollection = database.collection("categories");
        const BooksDB = client.db("BooksDB");
        const BooksCollection = BooksDB.collection("Books");

        // get function
        app.get('/', async (req, res) => {
            res.send('Book library Server is running')
        })
        app.get('/categories', async(req,res)=>{
            const result = await CategoriesCollection.find().toArray()
            res.send(result)
             

        })
        app.get('/allBooks', async(req,res)=>{
            const result = await BooksCollection.find().toArray()
            res.send(result)
        })

        app.get('/allBooks/:category', async(req,res)=>{
            const category = req.params.category
            const query = {category_name: category}
            console.log(query)
            const result = await BooksCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/allBooks/:category/:id', async(req,res)=>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            console.log(query)
            const result = await BooksCollection.findOne(query)
            res.send(result)
        })
        // post function
        app.post('/allBooks', async(req,res)=>{
            const book = req.body;
            console.log(book)
            const result = await BooksCollection.insertOne(book)
            res.send (result)
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, console.log('server is running'))