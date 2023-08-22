const { tipFeedModel, userModel, moduleModel } = require('../models/index');
const { ObjectId } = require('mongoose').Types;
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const createTipFeed = async (
  _,
  {
    position,
    symbol,
    stopLoss,
    entry,
    entry_date,
    status,
    quantity,
    confirmation,
    targets,
    isEntryMissed,
    entryMissedInstruction,
    isStopLossMissed,
    stopLossMissedInstruction,
    note,
    id,
    subscriptionId,
    moduleId
  },
) => {
  try {
    if (!symbol) {
      throw new Error('Please Enter Symbol');
    }
    // if (!currentValue) {
    //   throw new Error('Please Enter Current Value of Symbol');
    // }

    const tipData = {
      position,
      symbol,
      stopLoss,
      entry,
      entry_date,
      status,
      quantity,
      confirmation,
      targets,
      isEntryMissed,
      entryMissedInstruction,
      isStopLossMissed,
      stopLossMissedInstruction,
      note,
      subscriptionId,
      moduleId
    };

    let result;
    if (!id) {
      result = await tipFeedModel.create(tipData);
    } else {
      result = await tipFeedModel.findOneAndUpdate({ _id: id }, tipData);
    }

    if (!result) {
      throw new Error('Something Went Wrong');
    }

    const operationType = id ? 'Updated' : 'Added';
    pubsub.publish('TIP_ADD', {
      onTipAdd: { data: result, statusCode: 200 },
    });

    return { data: result, message: `Tip ${operationType}`, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const getTipFeed = async (_, { userId, moduleId }) => {
  try {
    if (!userId) {
      throw new Error('Please Enter UserId');
    }

    const filter = {};

    const userData = await userModel.aggregate([
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
    if (userData.length == 0) {
      throw new Error('User Not Found.');
    }
    if (moduleId) {
      filter.moduleId = moduleId;
    }

    if (userData[0].role !== 'Admin') {
      const subscriptionPlanIds = userData[0]?.subscriptionPlanId || [];
      filter.$or = [
        { subscriptionId: { $in: subscriptionPlanIds } },
        { subscriptionId: null },
        { subscriptionId: [] },
      ];
    }

    const tipFeedData = await tipFeedModel
      .find(filter)
      .sort({ _id: -1 });

    if (!tipFeedData) {
      throw new Error('No data available');
    }

    return { data: tipFeedData, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const addUpdateTipModule = async (_, { id, name, imageLink, index }) => {
  try {
    let data;

    if (!id) {
      data = await moduleModel.create({ name, imageLink, index });
    } else {
      const updateData = {};

      if (name) {
        updateData.name = name;
      }
      if (imageLink) {
        updateData.imageLink = imageLink;
      }
      if (index) {
        updateData.index = index;
      }

      data = await moduleModel.findOneAndUpdate({ _id: id }, updateData, { new: true });
    }

    return { data, statusCode: 200 };
  } catch (error) {
    console.log('error', error);
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

const deleteTipFeed = async (_, { id }) => {
  try {
    if (!id) {
      throw new Error("Tip ID not provided");
    }

    const deleteResult = await tipFeedModel.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      throw new Error("Tip not found or already deleted");
    }
    pubsub.publish('TIP_ADD', {
      onTipAdd: { data: deleteResult, statusCode: 200 },
    });
    return { message: "Tip deleted successfully", statusCode: 200 };
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
    addUpdateTipModule,
    deleteTipFeed
  },
  Subscription: {
    onTipAdd
  }
};
