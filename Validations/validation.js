const mongoose = require("mongoose");

const isValidString = function (value) {
    //function to check entered data is valid or not
    if (typeof value == "undefined" || value == null) return false;
    if (typeof value == "string" && value.trim().length === 0) return false;
    return true;
};

const isValidObjectId = function (value) {
    return mongoose.Types.ObjectId.isValid(value);
};

const isValidName = function (value) {
    return /^[A-Z a-z]+$/.test(value);
};

const isValidEmail = function (value) {
    return /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/.test(
        value
    );
};

const isValidpassword = function (value) {
    return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(value);
};

const isValidMobileNumber = function (value) {
    return /^((\+91)?|91)?[6789][0-9]{9}$/g.test(value);
};

const isValidCity = function (value) {
    return /^[A-Z a-z]+$/.test(value);
};

const isValidPin = function (value) {
    return /^[1-9][0-9]{5}$/.test(value);
};

const isValidImage = function (value) {
    return /\.(gif|jpe?g|tiff?|png|webp|bmp)$/.test(value);
};

const isValidProductName = function (value) {
    return /^[A-Za-z]+|[A-Za-z]+\[0-9]+$/.test(value);
};

const isValidPrice = function (value) {
    return /^(?:0|[1-9]\d*)(?:\.(?!.*000)\d+)?$/.test(value);
};

module.exports = {
    isValidObjectId,
    isValidString,
    isValidName,
    isValidMobileNumber,
    isValidEmail,
    isValidpassword,
    isValidCity,
    isValidPin,
    isValidProductName,
    isValidPrice,
    isValidImage,
};
