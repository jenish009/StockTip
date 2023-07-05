const { tipFeedModel } = require('../models/index')

const createTipFeed = async (_, { symbol, targets, stopLoss, direction, date, currentValue, type }) => {
    try {
        if (!symbol) throw new Error("Please Enter Symbol")
        if (!currentValue) throw new Error("Please Enter Current Value of Symbol")
        if (!date) throw new Error("Please Enter Valid Date")

        let createTipFeed = await tipFeedModel.create({
            symbol, targets, stopLoss, direction, date, currentValue, type
        })

        if (!createTipFeed) throw new Error("Something Went Wrong")

        return { message: "Tip Added", statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};


const getTipFeed = async (_, { typeFilter }) => {
    try {
        let filter = {};
        if (typeFilter) {
            filter = { ...filter, type: typeFilter }
        }
        let TipFeedData = await tipFeedModel.find(filter).select("symbol currentValue targets stopLoss direction date type").sort({ _id: -1 })

        if (!TipFeedData) throw new Error("Tip Not Found")

        return { data: TipFeedData, statusCode: 200 }
    } catch (error) {
        return { error: error.message, statusCode: 400 }
    }
};

module.exports = {
    Query:
    {
        createTipFeed,
        getTipFeed
    },
}