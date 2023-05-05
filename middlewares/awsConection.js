const aws = require("aws-sdk");
aws.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: "ap-south-1",
});

const uploadImage = async (file) => {
    return new Promise(function (resolve, reject) {
        const s3 = new aws.S3({ apiVersion: "2006-03-01" });
        const uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "userProfileImage" + file.originalname,
            Body: file.buffer,
        };
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject(err.message);
            }
            return resolve(data.Location);
        });
    });
};

module.exports.uploadImage = uploadImage;
