const { tipFeedModel, userModel, moduleModel } = require('../models/index');
const { ObjectId } = require('mongoose').Types;
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const createTipFeed = async (
  _,
  {
    symbol,
    currentValue,
    targets,
    stopLoss,
    direction,
    trading_date,
    next_trading_date,
    position,
    entry_price,
    entry_date,
    type,
    subscriptionId,
    isEntryMissed,
    entryMissedInstruction,
    isStopLossMissed,
    stopLossMissedInstruction,
    isFutureOrEnquity,
    currentDate,
    quantity,
    note,
    moduleId
  },
) => {
  try {
    let body = {
      symbol,
      currentValue,
      targets,
      stopLoss,
      direction,
      trading_date,
      next_trading_date,
      position,
      entry_price,
      entry_date,
      type,
      subscriptionId,
      isEntryMissed,
      entryMissedInstruction,
      isStopLossMissed,
      stopLossMissedInstruction,
      isFutureOrEnquity,
      currentDate,
      quantity,
      note,
      moduleId
    }
    if (!symbol) throw new Error('Please Enter Symbol');
    if (!currentValue) throw new Error('Please Enter Current Value of Symbol');

    let createTipFeed = await tipFeedModel.create(body);

    if (!createTipFeed) throw new Error('Something Went Wrong');
    pubsub.publish('TIP_ADD', {
      onTipAdd: { data: createTipFeed, statusCode: 200 },
    });
    return { message: 'Tip Added', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const getTipFeed = async (_, { typeFilter, userId, moduleId }) => {
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

    if (typeFilter) {
      filter.type = typeFilter;
    }
    if (moduleId) {
      filter.moduleId = moduleId;
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
    let TipFeedData = await tipFeedModel
      .find(filter)
      .sort({ _id: -1 });

    if (!TipFeedData) throw new Error('Tip Not Found');

    return { data: TipFeedData, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const addUpdateTipModule = async (_, { id, name, imageLink, index }) => {
  try {
    let data
    let updateData = {}
    if (!id) {
      data = await moduleModel.create({ name, imageLink, index })
    } else {
      name ? updateData["name"] = name : "";
      imageLink ? updateData["imageLink"] = imageLink : "";
      index ? updateData["index"] = index : "";

      data = await moduleModel.findOneAndUpdate({ _id: id }, updateData)
    }

    return { data: data, statusCode: 200 };
  } catch (error) {
    console.log('error', error)
    return { error: error.message, statusCode: 400 };
  }
};

const getTipModule = async () => {
  try {
    data = await moduleModel.find().sort({ index: 1 })

    return { data, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};
const onTipAdd = {
  subscribe: () => pubsub.asyncIterator(['TIP_ADD']),
};
module.exports = {
  Query: {
    getTipFeed,
    getTipModule
  },
  Mutation: {
    createTipFeed,
    addUpdateTipModule
  },
  Subscription: {
    onTipAdd
  }
};
