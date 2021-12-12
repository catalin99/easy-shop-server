const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require('dotenv/config');

//Cors
app.use(cors());
app.options('*', cors); //everything


//Middleware
//app.use(bodyParser.json()) -> app.use(express.json())
app.use(express.json()); //instead of body parser
app.use(morgan('tiny')); //use this library to log the APIs
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);


//Routers
const api = process.env.API_URL_V1;

const categoriesRouter = require('./routers/categories');
const ordersRouter = require('./routers/orders');
const productsRouter = require('./routers/products');
const usersRouter = require('./routers/users');

app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);


//Database
mongoose.connect(process.env.CONNECTION_STRING_DEV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop-database',
})
.then(()=>{
    console.log('Database connection is ready...');
})
.catch((err)=>{
    console.log(err);
})


//Start server
//Development
// app.listen(3000, () => {
//     console.log('eShop backend server is running on http://localhost:3000');
// })

//Production
var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("Express is working on port "+port);
})