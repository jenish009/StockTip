const { tipFeedModel, userModel } = require('../models/index');
const { ObjectId } = require('mongoose').Types;

const createTipFeed = async (
  _,
  {
    symbol,
    targets,
    stopLoss,
    direction,
    date,
    currentValue,
    type,
    subscriptionId,
  },
) => {
  try {
    if (!symbol) throw new Error('Please Enter Symbol');
    if (!currentValue) throw new Error('Please Enter Current Value of Symbol');
    if (!date) throw new Error('Please Enter Valid Date');

    let createTipFeed = await tipFeedModel.create({
      symbol,
      targets,
      stopLoss,
      direction,
      date,
      currentValue,
      type,
      subscriptionId,
    });

    if (!createTipFeed) throw new Error('Something Went Wrong');

    return { message: 'Tip Added', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const getTipFeed = async (_, { typeFilter, userId }) => {
  try {
    if (!userId) throw new Error('Please Enter UserId');
    let filter = {};
    let userData = await userModel.aggregate([
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'roleId',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $lookup: {
          from: 'usersubscriptionplans',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $lte: ['$startDate', new Date()] },
                    { $gte: ['$expireDate', new Date()] },
                  ],
                },
              },
            },
          ],
          as: 'usersubscriptionplans',
        },
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'usersubscriptionplans.subscriptionPlanId',
          foreignField: '_id',
          as: 'subscriptionPlan',
        },
      },
      {
        $project: {
          role: { $arrayElemAt: ['$role.name', 0] },
          subscriptionPlanId: {
            $arrayElemAt: ['$usersubscriptionplans.subscriptionPlanId', 0],
          },
        },
      },
    ]);
    console.log('userData', userData);
    if (typeFilter) {
      filter = { ...filter, type: typeFilter };
    }
    if (userData[0].role != 'Admin') {
      filter = {
        ...filter,
        $or: [
          { subscriptionId: { $in: userData[0]?.subscriptionPlanId || [] } },
          { subscriptionId: null },
        ],
      };
    }
    console.log('filter>', filter);
    let TipFeedData = await tipFeedModel
      .find(filter)
      .select('symbol currentValue targets stopLoss direction date type')
      .sort({ _id: -1 });

    if (!TipFeedData) throw new Error('Tip Not Found');

    return { data: TipFeedData, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

module.exports = {
  Query: {
    getTipFeed,
  },
  Mutation: {
    createTipFeed,
  },
};
