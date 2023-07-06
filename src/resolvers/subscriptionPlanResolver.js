const { subscriptionPlanModel } = require("../models/index")
const createsubscriptionPlan = async (_, { name, discription, amount, days }) => {
    try {
        if (!name) throw new Error("Please Enter Name Of subscription")
        if (!amount) throw new Error("Please Enter Amount Of subscription")

        let createsubscription = await subscriptionPlanModel.create({
            name, discription, amount, days
        })

        if (!createsubscription) throw new Error("Something Went Wrong")

        return { message: "Subscription Plan Added", statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

const getsubscriptionPlan = async (_, { id }) => {
    try {
        let filter = {}
        if (id) {
            filter = { _id: id }
        }

        let data = await subscriptionPlanModel.find(filter).sort({ amount: 1 })

        if (data.length == 0) throw new Error("Subscription Plan Not Found")

        return { data, statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};
module.exports = {
    Query: {
        getsubscriptionPlan
    },
    Mutation: {
        createsubscriptionPlan
    }
}