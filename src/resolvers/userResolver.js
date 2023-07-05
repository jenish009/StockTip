const { userModel } = require('../models/index')
const login = async (_, { email, password }) => {
    try {
        let data = await userModel.findOne({ email, password })
        console.log('data', data)
        if (!data) throw new Error("User mot found")
        return { body: data, statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

module.exports = {
    Query:
        { login: login }
}