const userResolver = require('./userResolver')
const tipFeedResolver = require('./tipFeedResolver')


module.exports = {
    Query: {
        ...userResolver.Query,
        ...tipFeedResolver.Query
    }
}