const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const { Product } = require('../models/product');
const mongoose = require('mongoose');
const multer = require('multer');

//MIME type
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if(isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}` );
    }
});

const uploadOptions = multer({storage: storage});

//http://localhost:3000/api/v1/products
//query parameter
//localhost:3000/api/v1/products?categories=2312312,3312
router.get(`/`, async (req, res) => {
    let filter = {};
    if(req.query.categories)
    {
        filter = {category: req.query.categories.split(',')};
    }

    const products = await Product.find(filter);
    if(!products) {
        res.status(404).json({success:false});
    }
    res.send(products);
}) 

router.get(`/names-descriptions`, async (req, res) => {
    //list of objects with only name and description, without the _id (- will exclude the prop)
    const productList = await Product.find().select('name description -_id');  
    if(!productList) {
        res.status(404).json({success:false});
    }
    res.send(productList);
}) 

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id);
    if(!product) {
        res.status(404).json({success:false});
    }
    res.send(product);
}) 

router.get(`/full/:id`, async (req, res) => {
    //add the category object in the request (not only the id)
    const product = await Product.findById(req.params.id).populate('category');
    //const product = await Product.findById(req.params.id).populate('category', 'name -_id'); - populate only the name in the category object
    if(!product) {
        res.status(404).json({success:false});
    }
    res.send(product);
}) 

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if(!category) {
        return res.status(400).send('Invalid category');
    }
    const file = req.file;
    if(!file)
        return res.status(400).send('No image in request');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    product = await product.save();
    if(!product){
        return res.status(400).send('The product cannot be created');
    }
    res.send(product);
})

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid product id');
    }
    const prod = await Product.findById(req.params.id);
    if(!prod){
        return res.status(400).send('The product does not exits');
    }

    const category = await Category.findById(req.body.category);
    if(!category) {
        return res.status(400).send('Invalid category');
    }

    const file = req.file;
    let imagepath;

    if(file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`
    } else {
        imagepath = product.image;
    }

    let updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        {new : true} // we will return the new updated data
    )
    
    updatedProduct = await updatedProduct.save();
    if(!updatedProduct){
        return res.status(400).send('the product cannot be updated');
    }

    res.send(updatedProduct);
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid product id');
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    
    if(files) {
        files.map(file => {
            imagesPaths.push(`${basePath}${file.filename}`);
        })
    }
    let updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths,
            
        },
        {new : true} // we will return the new updated data
    )

    //need to save before??
    if(!updatedProduct){
        return res.status(400).send('the product cannot be updated');
    }

    res.send(updatedProduct);
    
})

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product=>{
        if(product) {
            return res.status(200).json({success: true, message: 'The product was deleted'});
        }
        else {
            return res.status(404).json({success: false, message: 'product not found'});
        }
    }).catch(err => {
        return res.status(500).json({success: false, error:err});
    })
})

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments();
    if(!productCount) {
        res.status(404).json({success:false});
    }
    res.send({productCount : productCount});
}) 

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const productsFeatured = await Product.find({isFeatured: true}).limit(+count); //count from string to number
    if(!productsFeatured) {
        res.status(404).json({success:false});
    }
    res.send(productsFeatured);
}) 

module.exports = router;