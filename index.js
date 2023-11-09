const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const app = express()
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
const port = process.env.PORT || 5000;

// Middlewares
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Access unauthorized' })
        }
        req.user = decoded;
        next();
    })
}


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
        const BorrowedCollection = client.db('Borrowed').collection('Borrowings')

        // get function
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })
        app.post('/logout', async (req, res) => {
            const user = req.body;

            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })
        app.get('/', async (req, res) => {
            res.send('Book library Server is running')
        })
        app.get('/categories', async (req, res) => {
            const result = await CategoriesCollection.find().toArray()
            res.send(result)


        })
        app.get('/allBooks',verifyToken, async (req, res) => {
            const result = await BooksCollection.find().toArray()
            res.send(result)
        })

        app.get('/allBooks/:category', async (req, res) => {
            const category = req.params.category
            const query = { category_name: category }

            const result = await BooksCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/allBooks/:category/:id', async (req, res) => {
            const id = req.params.id
            const category = req.params.category;
            console.log(id, category)
            const query = { _id: new ObjectId(id) }
            const result = await BooksCollection.findOne(query)
            res.send(result)
        })

        app.get('/borrowings', async (req, res) => {
            if (req.query?.email) {
                const query = { email: req.query?.email }
                const result = await BorrowedCollection.find(query).toArray()
                res.send(result)
            }

        })

        // post function
        app.post('/allBooks',verifyToken, async (req, res) => {
            const book = req.body;

            const result = await BooksCollection.insertOne(book)
            res.send(result)
        })
        app.post('/borrowings', async (req, res) => {
            const borrowed = req.body;
            if (borrowed.book.quantity > 0) {

                const result = await BorrowedCollection.insertOne(borrowed)
                res.send(result)
            }
            else {
                res.send('No Book available')
            }
        })
        // update function
        app.patch('/allBooks/:category/:id', async (req, res) => {
            const id = req.params.id;
            const book = req.body;
            if (book.quantity > 0) {

                const filter = { _id: new ObjectId(id) }
                const options = { upsert: true };
                console.log('quantity', book)
                const updatedDoc = {

                    $set: {
                        quantity: book.quantity - 1
                    }
                }

                const result = await BooksCollection.updateOne(filter, updatedDoc, options)
                res.send(result)
            }
            else {
                console.log('No book available')
            }


        })
       
        // delete operation
        app.delete('/borrowings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            console.log(query)
            const result = await BorrowedCollection.deleteOne(query)
            res.send(result)
        })
        app.get('/borrowings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            console.log(query)
            const result = await BorrowedCollection.findOne(query)
            res.send(result)
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