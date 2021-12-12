const express = require('express');
const router = express.Router();
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const mongoose = require('mongoose');

//http://localhost:3000/api/v1/orders
router.get(`/`, async (req, res) => {
    const orderList = await Order
        .find().populate('user', 'name email isAdmin')
        .sort({'dateOrdered': -1}); //order desc
    if(!orderList) {
        res.status(500).json({success:false});
    }
    res.send(orderList);
}) 

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
    .populate('user', 'name email isAdmin')
    .populate({
        path: 'orderItems', 
        populate: {
            path: 'product',
            populate: 'category'
        }
    })
    if(!order) {
        res.status(500).json({success:false});
    }
    res.send(order);
}) 

router.post(`/`, async (req, res) => {
    const orderItemIds = Promise.all(req.body.orderItems.map(async orderitem => {
        let newOrderItem = new OrderItem({
            quantity: orderitem.quantity,
            product: orderitem.product
        });
        newOrderItem = await newOrderItem.save();
        return newOrderItem.id;
    }));
    const orderItemsIdsResolved = await orderItemIds; //because of await, we need to wait for the ids to be resolved

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async orderItemId => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))

    const totalPrice = totalPrices.reduce((a,b) => a+b, 0); //sum all items from the array, initial value = 0

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,

    });
    order = await order.save();
    if(!order){
        return res.status(400).send('The order cannot be created');
    }

    res.send(order);
})

router.put('/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).send('Invalid order id');
    }

    let order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        {new : true} // we will return the new updated data
    )

    order = await order.save();

    if(!order){
        return res.status(404).send('the order cannot be updated!');
    }
    res.send(order);
})

router.delete('/:id', async (req, res) => {
    let result = Order.findByIdAndRemove(req.params.id).then(async order => {
        if(order) {
            await order.orderItems.map(async orderItem => { //orderItem is the ID
                await OrderItem.findByIdAndRemove(orderItem);
            });
            return res.status(200).json({success:true, message: 'The Order was deleted'});
        }
        else {
            return res.status(404).json({success: false, message: 'Order not found'});
        }
    })

    
    //return res.status(200).json({success:true, message: 'The Order was deleted'});
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales : { $sum : '$totalPrice'}}} //mongoose cannot return any object without an id
    ]);
    if(!totalSales) {
        return res.status(400).send('The order sales cannot be generated');
    }

    res.send({totalSales: totalSales.pop().totalsales});
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments();
    if(!orderCount) {
        res.status(404).json({success:false});
    }
    res.send({orderCount : orderCount});
}) 

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order
        .find({user:req.params.userid})
        .populate({
            path: 'orderItems', 
            populate: {
                path: 'product',
                populate: 'category'
            }
        })
        .sort({'dateOrdered': -1}); //order desc
    if(!userOrderList) {
        res.status(500).json({success:false});
    }
    res.send(userOrderList);
}) 

module.exports = router;