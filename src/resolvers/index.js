const userResolver = require('./userResolver')
const tipFeedResolver = require('./tipFeedResolver')


module.exports = {
    ...userResolver,
    ...tipFeedResolver
}