const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;

app.get('/', async(req,res)=>{
    res.send('Book library Server is running')
})
app.listen(port,console.log('server is running'))