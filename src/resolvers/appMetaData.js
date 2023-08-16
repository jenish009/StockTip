const {
    appMetaDataModel
} = require('../models/index');

const getAppMetaData = async (
) => {
    try {
        let data = await appMetaDataModel.findOne().sort({ _id: -1 })
        return {
            data,
            statusCode: 200,
        };

    } catch (error) {
        return { error: error.message, statusCode: 400 };
    }
};


const addAppMetaData = async (_, { body }) => {
    try {
        let data = await appMetaDataModel.create(body)
        return {
            data,
            statusCode: 200,
        };

    } catch (error) {
        return { error: error.message, statusCode: 400 };
    }
};
module.exports = {
    Query: {
        getAppMetaData,
    },
    Mutation: {
        addAppMetaData
    }
};
