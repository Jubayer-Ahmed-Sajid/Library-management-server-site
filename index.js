const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

// Middlewares
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

        app.get('/', async (req, res) => {
            res.send('Book library Server is running')
        })

        // Categories

        app.get('/categories', async (req, res) => {
            const result = await CategoriesCollection.find().toArray()
            res.send(result)


        })

        // All books

        app.get('/allBooks', async (req, res) => {
            const result = await BooksCollection.find().toArray()
            res.send(result)
        })
        
        // book search
        app.get('/books/search', async (req, res) => {
            const { name } = req.query
            console.log(name)
            const result = await BooksCollection.find({ name }).toArray()
            res.send(result)

        })

        // books based on category
        app.get('/allBooks/:category', async (req, res) => {
            const category = req.params.category
            const query = { category_name: category }

            const result = await BooksCollection.find(query).toArray()
            res.send(result)
        })

        // single book
        app.get('/allBooks/:category/:id', async (req, res) => {
            const id = req.params.id
            const category = req.params.category;
            console.log(id, category)
            const query = { _id: new ObjectId(id) }
            const result = await BooksCollection.findOne(query)
            res.send(result)
        })

        // borrowed books collection
        app.get('/borrowings', async (req, res) => {
            if (req.query?.email) {
                const query = { email: req.query?.email }
                const result = await BorrowedCollection.find(query).toArray()
                res.send(result)
            }

        })
        // Recently added books

        app.get('/books/recent', async (req, res) => {
            
                const recentBooks = await BooksCollection.find().sort({ addedDate: -1 }).limit(5).toArray();
                res.send(recentBooks)
            
        });

        // post function
        app.post('/allBooks', async (req, res) => {
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
        app.patch('/allBooks/:category/:id/:action', async (req, res) => {
            try {
                const id = req.params.id;
                const book = req.body;
                const action = req.params.action;
                const filter = { _id: new ObjectId(id) };
                let updatedDoc;



                if (action === 'borrow') {
                    console.log(action,"borrow time quantity",book,id);
                    if (book.quantity > 0) {
                        updatedDoc = {
                            $set: {
                                quantity: book.quantity - 1
                            }
                        };
                        const result = await BooksCollection.updateOne(filter, updatedDoc);
                        res.send(result);
                    } else {
                        throw new Error('Book quantity is not sufficient for borrowing.');
                    }
                } 
                
                
                else if (action === 'update') {
                    console.log(action);

                    updatedDoc = {
                        $set: {
                            name: book.name,
                            category_name: book.category_name,
                            author: book.author,
                            rating: book.rating,
                            quantity: book.quantity,
                            description: book.description
                        }
                    };
                    const result = await BooksCollection.updateOne(filter, updatedDoc);
                    res.send(result);
                }



                else if (action === 'return') {
                    console.log(action,"return time book quantity is:",book,id);


                    updatedDoc = {
                        $set: {
                            quantity: book.bookQuantity + 1

                        }
                    }
                    const result = await BooksCollection.updateOne(filter, updatedDoc)
                    console.log(updatedDoc,id)
                    res.send(result)
                } else {
                    throw new Error('Invalid action specified.');
                }


            } catch (error) {
                console.error('Error updating book:', error.message);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

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