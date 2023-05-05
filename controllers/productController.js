const productModel = require("../models/productModel");
const aws = require("aws-sdk");
const { uploadImage } = require("../middlewares/awsConection");
const {
    isValidObjectId,
    isValidString,
    isValidName,
    isValidProductName,
    isValidPrice,
    isValidImage,
} = require("../Validations/validation");

//___________________________________________Product Creation_______________________________________________________________
const createProduct = async (req, res) => {
    try {
        let data = req.body;
        let files = req.files;

        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage,
            ...other
        } = data;

        if (Object.keys(data).length == 0)
            return res.status(400).send({
                status: false,
                message: "Please provide required data",
            });
        if (Object.keys(other).length !== 0) {
            return res.status(400).send({
                status: false,
                message: `Please remove ${Object.keys(other)} key`,
            });
        }

        let info = {};

        if (!isValidString(title)) {
            return res
                .status(400)
                .send({ status: false, message: "title is mandatory" });
        }
        if (!isValidProductName(title)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid Title" });
        }
        info.title = title;

        if (!isValidString(description))
            return res
                .status(400)
                .send({ status: false, message: "description is mandatory" });
        info.description = description;

        if (!isValidString(price))
            return res
                .status(400)
                .send({ status: false, message: "price is mandatory" });
        if (!isValidPrice(price))
            return res
                .status(400)
                .send({ status: false, message: "invalid price" });
        info.price = Number(price).toFixed(2);

        if (currencyId) {
            if (!isValidString(currencyId))
                return res.status(400).send({
                    status: false,
                    message: "currencyId is mandatory",
                });
            if (currencyId != "INR")
                return res.status(400).send({
                    status: false,
                    message: "currencyId  should be INR",
                });
        }

        if (currencyFormat) {
            if (!isValidString(currencyFormat))
                return res.status(400).send({
                    status: false,
                    message: "currencyFormat is mandatory",
                });
            if (currencyFormat != "₹")
                return res.status(400).send({
                    status: false,
                    message: "currencyFormat should ₹",
                });
        }

        if (isFreeShipping) {
            if (!isValidString(isFreeShipping))
                return res.status(400).send({
                    status: false,
                    message: "provide value of Free Shipping!",
                });
            if (isFreeShipping !== "true" && isFreeShipping !== "false")
                return res.status(400).send({
                    status: false,
                    message: "invalid value of Free shipping!",
                });
            info.isFreeShipping = isFreeShipping;
        }

        if (style) {
            if (!isValidString(style))
                return res
                    .status(400)
                    .send({ status: false, message: "give some style!" });
            if (!isValidName(style))
                return res
                    .status(400)
                    .send({ status: false, message: "invalid style!" });
            info.style = style;
        }

        if (!isValidString(availableSizes))
            return res
                .status(400)
                .send({ status: false, message: "Size is mandatory" });
        availableSizes = availableSizes.split(",").map((size) => size.trim());
        for (let i = 0; i < availableSizes.length; i++) {
            if (
                !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(
                    availableSizes[i]
                )
            )
                return res.status(400).send({
                    status: false,
                    message: "size can contain only S, XS,M, X, L, XXL, XL",
                });
        }
        info.availableSizes = availableSizes;

        if (installments) {
            if (!isValidString(installments))
                return res.status(400).send({
                    status: false,
                    message: "provide value of installments!",
                });
            if (!installments.match(/^[0-9]+$/))
                return res.status(400).send({
                    status: false,
                    message: "invalid Installments number",
                });
            info.installments = Number(installments);
        }

        const usedTitle = await productModel.findOne({ title: title });
        if (usedTitle)
            return res
                .status(400)
                .send({ status: false, message: "Title is Already in Use" });

        if (files && files.length > 0) {
            if (files.length > 1)
                return res
                    .status(400)
                    .send({ status: false, message: "only one file required" });
            if (!isValidImage(files[0]["originalname"])) {
                return res
                    .status(400)
                    .send({ status: false, message: "invalid file format" });
            }
            let imageUrl = await uploadImage(files[0]);
            info.productImage = imageUrl;
        } else {
            return res
                .status(400)
                .send({ message: "Product Image is mandatory" });
        }

        let createdProduct = await productModel.create(info);

        return res
            .status(201)
            .send({ status: true, message: "Success", data: createdProduct });
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }
};

//___________________________________________Fetching Product_______________________________________________________________
const getProduct = async (req, res) => {
    try {
        let filter = { isDeleted: false };
        let priceSorting = {};

        let {
            name,
            price,
            priceGreaterThan,
            priceLessThan,
            size,
            priceSort,
            ...a
        } = req.query;
        if (Object.keys(a).length != 0)
            return res.status(400).send({
                status: false,
                message: "only name price or size can be used for filter",
            });

        if (req.query.size) {
            availableSizes = req.query.size
                .split(",")
                .map((size) => size.trim().toUpperCase());
            for (let i = 0; i < availableSizes.length; i++) {
                if (
                    !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(
                        availableSizes[i]
                    )
                )
                    return res.status(400).send({
                        status: false,
                        message: "size can contain only S, XS,M, X, L, XXL, XL",
                    });
            }
            filter.availableSizes = { $all: availableSizes };
        }

        if (req.query.name) {
            if (!isValidString(req.query.name)) {
                return res
                    .status(400)
                    .send({ status: false, message: "name is mandatory" });
            }
            if (!isValidProductName(req.query.name)) {
                return res
                    .status(400)
                    .send({ status: false, message: "invalid name" });
            }
            filter.title = { $regex: req.query.name, $options: "i" };
        }

        if (req.query.priceGreaterThan && req.query.priceLessThan) {
            filter.price = {
                $gt: req.query.priceGreaterThan,
                $lt: req.query.priceLessThan,
            };
        } else if (req.query.priceGreaterThan || req.query.priceLessThan) {
            if (req.query.priceGreaterThan) {
                filter.price = { $gt: req.query.priceGreaterThan };
            }
            if (req.query.priceLessThan) {
                filter.price = { $lt: req.query.priceLessThan };
            }
        }
        priceSort = parseInt(req.query.priceSort);
        if (priceSort) {
            if (priceSort != -1 && priceSort != 1)
                return res.status(400).send({
                    status: false,
                    message: "priceSort should be only 1 or -1",
                });
            priceSorting = { price: priceSort };
        }

        const product = await productModel
            .find(filter)
            .sort(priceSorting)
            .select({ createdAt: 0, updatedAt: 0, deletedAt: 0, __v: 0 });

        if (product.length == 0) {
            return res.status(404).json({
                status: false,
                message: "No product found with that query",
            });
        }
        res.status(200).json({ status: true, data: product });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

//___________________________________________Fetching Product By Id_______________________________________________________________
const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        if (!isValidObjectId(productId))
            return res
                .status(400)
                .send({ status: false, message: "ProductId not valid" });

        let productData = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!productData)
            return res
                .status(404)
                .send({ status: false, message: "Product not exist" });

        return res
            .status(200)
            .send({ status: true, message: "Successfull", data: productData });
    } catch (err) {
        return res.status(500).send({ satus: false, err: err.message });
    }
};

//___________________________________________Product Updation_______________________________________________________________
const updateProduct = async (req, res) => {
    let productId = req.params.productId;

    if (!isValidObjectId(productId))
        return res
            .status(400)
            .send({ status: false, message: "Please give correct productId" });

    let productData = await productModel.findOne({
        _id: productId,
        isDeleted: false,
    });
    if (!productData)
        return res
            .status(404)
            .send({ status: false, message: "No Product Found" });

    let {
        title,
        description,
        price,
        isFreeShipping,
        productImage,
        style,
        availableSizes,
        installments,
        ...a
    } = req.body;
    if (Object.keys(req.body).length == 0)
        return res
            .status(400)
            .send({ status: false, message: "Please enter some data" });

    if (Object.keys(a).length != 0)
        return res.status(400).send({
            status: false,
            message: `${Object.keys(a)} cannot be updated`,
        });

    let final = {};

    if (title) {
        if (!isValidString(title))
            return res
                .status(400)
                .send({ status: false, message: "Invalid title details" });

        let findTitle = await productModel.findOne({ title: title });
        if (findTitle)
            return res
                .status(400)
                .send({ status: false, message: "Title already exist" });
        final.title = title;
    }

    if (description) {
        if (!isValidString(description))
            return res
                .status(400)
                .send({ status: false, message: "invalid description" });
        final.description = description;
    }

    if (price) {
        if (isNaN(price)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid price" });
        }
        final.price = price;
    }

    if (style) {
        if (!isValidString(style))
            return res
                .status(400)
                .send({ status: false, message: "Invalid style details" });
        final.style = style;
    }

    if (availableSizes) {
        if (!isValidString(availableSizes))
            return res
                .status(400)
                .send({ status: false, message: "Size is mandatory" });
        availableSizes = availableSizes
            .split(",")
            .map((size) => size.trim().toUpperCase());
        for (let i = 0; i < availableSizes.length; i++) {
            if (
                !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(
                    availableSizes[i]
                )
            )
                return res.status(400).send({
                    status: false,
                    message: "size can contain only S, XS,M, X, L, XXL, XL",
                });
        }
        final.availablesizes = availableSizes;
    }

    if (isFreeShipping) {
        isFreeShipping = isFreeShipping.trim().toLowerCase();
        if (isFreeShipping !== "true" && isFreeShipping !== "false")
            return res.status(400).send({
                status: false,
                message: "FreeShipping must have value of either True or False",
            });
        final.isFreeShipping = isFreeShipping;
    }

    if (installments) {
        if (isNaN(installments))
            return res.status(400).send({
                status: false,
                message: "Invalid installments details",
            });
        final.installments = installments;
    }

    if (productImage) {
        let productImg = req.files.productImage;
        if (productImg && productImage.length > 0) {
            const productImageLink = await aws.uploadFile(productImage[0]);
            final.productImage = productImageLink;
        }
    }

    let updatedproduct = await productModel.findByIdAndUpdate(
        productId,
        final,
        { new: true }
    );

    return res.status(200).send({
        status: true,
        message: "Successfully Updated",
        data: updatedproduct,
    });
};

//___________________________________________Product Deletion_______________________________________________________________
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!isValidObjectId(productId))
            return res
                .status(400)
                .send({ status: false, message: "ProductId not valid" });

        let productData = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!productData)
            return res
                .status(404)
                .send({ status: false, message: "Product not exist" });

        await productModel.updateOne(
            { _id: productId },
            { isDeleted: true, deletedAt: Date.now() }
        );

        return res
            .status(200)
            .send({ status: true, message: "Product Successfully Deleted" });
    } catch (err) {
        return res.status(500).send({ satus: false, err: err.message });
    }
};

module.exports = {
    createProduct,
    getProduct,
    updateProduct,
    getProductById,
    deleteProduct,
};
