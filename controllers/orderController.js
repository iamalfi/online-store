const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const { isValidString, isValidObjectId } = require("../Validations/validation");

//___________________________________________Order Creation_______________________________________________________________
const createOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (Object.keys(req.body).length == 0)
            return res.status(400).send({
                status: false,
                message: "provide cartId and cancellable in body",
            });

        let info = {};

        let { cartId, cancellable, status, ...a } = req.body;
        if (Object.keys(a).length != 0)
            return res.status(400).send({
                status: false,
                message: "only cartId and cancellable is required",
            });

        if (!cartId)
            return res
                .status(400)
                .send({ status: false, message: "cartId is required" });
        cartId = String(cartId);
        if (!isValidObjectId(cartId))
            return res
                .status(400)
                .send({ status: false, message: "invalid cartId" });

        if (cancellable || cancellable == "") {
            if (typeof cancellable != "boolean")
                return res.status(400).send({
                    status: false,
                    message: "please provide true or false in cancellable",
                });
            info.cancellable = cancellable;
        }
        if (status || status == "") {
            if (!isValidString(status))
                return res
                    .status(400)
                    .send({ status: false, message: "please provide status" });
            if (status != "pending")
                return res.status(400).send({
                    status: false,
                    message: "status can hold only pending",
                });
            info.status = status;
        }

        // Authorization
        if (userId != req.decodedToken)
            return res.status(403).send({
                status: false,
                message: "you are not authrised for this action",
            });
        // Authorization

        const userExist = await userModel.findOne({ _id: userId });
        if (!userExist)
            return res
                .status(400)
                .send({ status: false, message: "user does not exist" });

        let cart = await cartModel.findOne({ userId: userId, _id: cartId });
        if (!cart)
            return res
                .status(404)
                .send({ status: false, message: "cart Does not exist" });
        if (cart.items.length == 0)
            return res.status(400).send({
                status: false,
                message: "add something to cart first",
            });

        let { items, totalPrice, totalItems } = cart;

        info.userId = userId;
        info.items = items;
        info.totalPrice = totalPrice;
        info.totalItems = totalItems;

        let totalQuantity = 0;

        items.forEach((x) => (totalQuantity += x.quantity));

        info.totalQuantity = totalQuantity;

        let createdOrder = await orderModel.create(info);
        let { __v, ...orderData } = createdOrder._doc;

        await cartModel.findOneAndUpdate(
            { userId: userId, _id: cartId },
            { items: [], totalPrice: 0, totalItems: 0 }
        );

        return res.status(201).send({
            status: true,
            message: "order generated successfully",
            data: orderData,
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};
//___________________________________________Order Updation_______________________________________________________________
const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!isValidObjectId(userId))
            return res
                .status(400)
                .send({ status: false, message: "invalid userId" });
        const data = req.body;
        let { orderId, status, ...a } = data;

        if (Object.keys(data).length == 0)
            return res.status(400).send({
                status: false,
                message: "Please enter valid request Body",
            });
        if (Object.keys(a).length != 0)
            return res.status(400).send({
                status: false,
                message: "only cartId and cancellable is required",
            });

        // Authorization
        if (userId != req.decodedToken)
            return res.status(403).send({
                status: false,
                message: "you are not authrised for this action",
            });
        // Authorization

        if (!isValidString(orderId))
            return res
                .status(400)
                .send({ status: false, message: "Please provide orderId" });
        if (!isValidObjectId(orderId))
            return res.status(400).send({
                status: false,
                message: "Please provide valid orderId.",
            });

        if (!isValidString(status))
            return res
                .status(400)
                .send({ status: false, message: "Status required" });

        status = status.toLowerCase();
        if (!["completed", "cancelled"].includes(status)) {
            return res.status(400).send({
                status: false,
                message: "Status should be only completed or cancelled",
            });
        }

        const userExist = await userModel.findOne({ _id: userId });
        if (!userExist)
            return res
                .status(400)
                .send({ status: false, message: "user does not exist" });

        const cartId = await cartModel.findOne({ userId: userId });
        if (!cartId)
            return res
                .status(404)
                .send({ status: false, message: "Cart does not exist" });

        const userOrder = await orderModel.findOne({
            _id: orderId,
            userId: userId,
        });
        if (!userOrder)
            return res
                .status(404)
                .send({ status: false, message: "Order does not exist" });

        if (
            userOrder.status == "completed" ||
            userOrder.status == "cancelled"
        ) {
            return res.status(200).send({
                status: false,
                message: "The status is already updated.",
            });
        }

        if (status == "cancelled") {
            if (userOrder.cancellable == false)
                return res.status(400).send({
                    status: false,
                    message:
                        "This order can't be cancelled because it is not allowed",
                });
        }

        const updateOrder = await orderModel.findOneAndUpdate(
            { _id: orderId, userId: userId },
            { status },
            { new: true }
        );

        return res
            .status(200)
            .send({ status: true, message: "Successfully", data: updateOrder });
    } catch (error) {
        res.status(500).send({ status: false, Message: error.message });
    }
};

module.exports = { createOrder, updateOrder };
