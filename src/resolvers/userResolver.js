const { userModel } = require('../models/index')
const signup = async (_, { email, password, name }) => {
    try {
        if (!email) throw new Error("Please Enter Email Id")
        if (!password) throw new Error("Please Enter Password")
        if (password.length < 8) throw new Error("Passwords Must Contain 8 Characters")
        if (!name) throw new Error("Please Enter Name")

        let userExist = await userModel.findOne({ email })
        if (userExist) throw new Error("Email Id Is Already Registered")

        let data = await userModel.create({ email, password, name })


        return { data: { data, message: "Sign Up successfully" }, statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

const login = async (_, { email, password }) => {
    try {
        let data = await userModel.findOne({ email, password })
        console.log('data', data)
        if (!data) throw new Error("User mot found")
        return { data: data, statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

module.exports = {
    Query:
    {
        login,
        signup
    }
}