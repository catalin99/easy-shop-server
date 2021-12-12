const express = require('express');
const router = express.Router();
const { Category } = require('../models/category');
const mongoose = require('mongoose');

//http://localhost:3000/api/v1/categories
router.get(`/`, async (req, res) => {
    const categorytList = await Category.find();
    if(!categorytList) {
        res.status(500).json({success:false});
    }
    res.status(200).send(categorytList);
}) 

router.get(`/:id`, async (req, res) => {
    const category = await Category.findById(req.params.id);
    if(!category) {
        res.status(500).json({message: 'The category with the given ID was not found'});
    }
    res.status(200).send(category);
})

router.post(`/`, async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
    });
    category = await category.save();

    if(!category){
        return res.status(404).send('the category cannot be created!');
    }
    res.send(category);
})

router.put('/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid category id');
    }
    const categ = await Category.findById(req.params.id);
    if(!categ){
        return res.status(400).send('The category does not exits');
    }

    let category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color,
        },
        {new : true} // we will return the new updated data
    )

    category = await category.save();

    if(!category){
        return res.status(404).send('the category cannot be updated!');
    }
    res.send(category);
})

//http://localhost:3000/api/v1/categories/categoryID
router.delete('/:categoryID', async (req, res) => {
    let result = Category.findByIdAndRemove(req.params.categoryID).catch(err => {
        return res.status(400).json({
            success:false,
            error: err,
        })
    });
    if(!result || Object.keys(result).length == 0 ){
        return res.status(404).json({success: false, message: 'Category not found'});
    }
    
    return res.status(200).json({success:true, message: 'The category was deleted'});
})

router.delete('/withoutasync/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id).then(category=>{
        if(category) {
            return res.status(200).json({success: true, message: 'The category was deleted'});
        }
        else {
            return res.status(404).json({success: false, message: 'Category not found'});
        }
    }).catch(err => {
        return res.status(400).json({success: false, error:err});
    })
})

module.exports = router;