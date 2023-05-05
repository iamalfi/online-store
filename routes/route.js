const router = require("express").Router();
const {
    createUser,
    userLogin,
    getUser,
    updateUser,
} = require("../controllers/userContoller");
const {
    createCart,
    getCart,
    deleteCart,
    updateCart,
} = require("../controllers/cartController");
const {
    createProduct,
    getProduct,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");
const { Authentication } = require("../middlewares/middleware");
const { createOrder, updateOrder } = require("../controllers/orderController");

//........................USER API's.............................................
router.post("/register", createUser);
router.post("/login", userLogin);
router.get("/user/:userId/profile", Authentication, getUser);
router.put("/user/:userId/profile", Authentication, updateUser);

//......................................PRODUCT API's...............................
router.post("/products", createProduct);
router.get("/products", getProduct);
router.get("/products/:productId", getProductById);
router.put("/products/:productId", updateProduct);
router.delete("/products/:productId", deleteProduct);

//......................................CART API's...............................
router.post("/users/:userId/cart", Authentication, createCart);
router.get("/users/:userId/cart", Authentication, getCart);
router.put("/users/:userId/cart", Authentication, updateCart);
router.delete("/users/:userId/cart", Authentication, deleteCart);

//......................................ORDER API's...............................
router.post("/users/:userId/orders", Authentication, createOrder);
router.put("/users/:userId/orders", Authentication, updateOrder);

router.all("/*", (req, res) =>
    res.status(400).send({ status: false, message: "invalid request" })
);

module.exports = router;
