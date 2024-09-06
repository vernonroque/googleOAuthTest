const express = require('express');

const cors = require('cors');

// Instantiate the app here
const app = express(); 
app.use(cors());

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });


app.get('/', (req,res) => {
    console.log("Hello World");
    res.status(200).send({"message":"hello world"});
})