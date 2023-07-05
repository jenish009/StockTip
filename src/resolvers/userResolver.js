const { userModel } = require('../models/index')
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const { ObjectId } = require("mongoose").Types;


const signup = async (_, { email, password, name }) => {
    try {
        if (!email) throw new Error("Please Enter Email Id")
        if (!password) throw new Error("Please Enter Password")
        if (password.length < 8) throw new Error("Passwords Must Contain 8 Characters")
        if (!name) throw new Error("Please Enter Name")

        let userExist = await userModel.findOne({ email })
        if (userExist) throw new Error("Email Id Is Already Registered")
        const hashedPassword = bcrypt.hashSync(password, salt);

        let data = await userModel.create({ email, password: hashedPassword, name })


        return { data, message: "Sign Up successfully", statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

const login = async (_, { email, password }) => {
    try {
        if (!email) throw new Error("Please Enter Valid Email")
        if (!password) throw new Error("Please Enter Password")

        let data = await userModel.findOne({ email })
        if (!data) throw new Error("User Not Found")

        const isPasswordCorrect = bcrypt.compareSync(password, data.password);
        if (!isPasswordCorrect) throw new Error("Invilid Password")

        return { data, message: "Login Successfully", tatusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

const getUserById = async (_, { id }) => {
    try {
        if (!id) throw new Error("User Not Found")

        let data = await userModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(id)
                },
            },
            {
                $lookup: {
                    from: "roles",
                    localField: "roleId",
                    foreignField: "_id",
                    as: "role",
                },
            },
            {
                $project: {
                    "_id": 0,
                    "email": 1,
                    "name": 1,
                    "role": {
                        "$arrayElemAt": ["$role", 0],
                    },
                },
            },
        ]);

        return { data, statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

module.exports = {
    Query:
    {
        login,
        signup,
        getUserById
    }
}