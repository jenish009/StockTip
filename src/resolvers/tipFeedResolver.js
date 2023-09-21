const { tipFeedModel, userModel, moduleModel } = require('../models/index');
const { ObjectId } = require('mongoose').Types;
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();


const bulkCreate = async (_, args) => {
  try {
    const data = args.data;
    const jsonData = [];
    const newTips = [];

    await Promise.all(data.map(async (row) => {
      const { id } = row;

      const targets = Array.from({ length: 6 }, (_, i) => ({
        value: row[`targets_${i + 1}_value`].toString() || "",
        date: row[`targets_${i + 1}_date`].toString() || "",
        exit: row[`targets_${i + 1}_exit`].toString() || "",
      }));

      const tipFeedDoc = {
        id: id || null,
        ...row,
        targets,
        isEntryMissed: (row.isEntryMissed.toUpperCase() === "TRUE") ? true : false,
        isStopLossMissed: (row.isStopLossMissed.toUpperCase() === "TRUE") ? true : false,
        subscriptionId: [row.subscriptionId_0, row.subscriptionId_1, row.subscriptionId_2].filter(id => id),
        moduleId: row.moduleId || null,
        isPreview: (row.isPreview.toUpperCase() === "TRUE") ? true : false,
      };

      if (id) {
        let updated = await tipFeedModel.findOneAndUpdate(
          { _id: id },
          { $set: tipFeedDoc },
          { new: true }
        );
        pubsub.publish('TIP_ADD', {
          onTipAdd: { data: updated, statusCode: 200 },
        });
      } else {
        delete tipFeedDoc.id;
        newTips.push(tipFeedDoc);
      }
    }));
    if (newTips.length > 0) {
      let newAdded = await tipFeedModel.insertMany(newTips);
      newAdded.map(obj => {
        pubsub.publish('TIP_ADD', {
          onTipAdd: { data: obj, statusCode: 200 },
        });
      })
    }
    return { message: 'Bulk creation successful', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const getTipForExel = async (_, { moduleId }) => {
  try {
    const filter = moduleId ? { moduleId } : {};
    let data = await tipFeedModel.find(filter)
    const output = data.map(item => {
      const {
        position,
        stopLoss,
        entry,
        entry_date,
        status,
        quantity,
        confirmation,
        isEntryMissed,
        entryMissedInstruction,
        isStopLossMissed,
        stopLossMissedInstruction,
        note,
        subscriptionId,
        moduleId,
        symbol,
        targets,
        _id
      } = item;

      const outputTargets = {};
      targets.forEach((target, index) => {
        const targetIndex = index + 1;
        outputTargets[`targets_${targetIndex}_value`] = target.value;
        outputTargets[`targets_${targetIndex}_date`] = target.date;
        outputTargets[`targets_${targetIndex}_exit`] = target.exit;
      });

      return {
        id: _id,
        position,
        stopLoss: parseInt(stopLoss),
        entry: parseInt(entry),
        entry_date,
        status,
        quantity: parseInt(quantity),
        confirmation,
        isEntryMissed: isEntryMissed === "false" ? false : true,
        entryMissedInstruction,
        isStopLossMissed: isStopLossMissed === "false" ? false : true,
        stopLossMissedInstruction,
        note,
        subscriptionId_0: subscriptionId[0],
        subscriptionId_1: subscriptionId[1] || "",
        subscriptionId_2: subscriptionId[2] || "",
        moduleId,
        symbol,
        ...outputTargets
      };
    });
    return { data: output, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const createTipFeed = async (_, args) => {
  try {
    const {
      id,
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
      moduleId,
      isPreview
    } = args;

    if (!symbol) {
      throw new Error('Please Enter Symbol');
    }

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
      moduleId,
      isPreview
    };

    let result;

    if (!id) {
      result = await tipFeedModel.create(tipData);
    } else {
      result = await tipFeedModel.findOneAndUpdate({ _id: id }, tipData, { new: true });
      if (!result) {
        throw new Error('Something Went Wrong');
      }
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
console.log("userData>>",userData)
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

const getPreviewTip = async (_, { moduleId }) => {
  try {
    // if (!userId) {
    //   throw new Error('Please Enter UserId');
    // }

    const filter = { isPreview: true };

    // const userData = await userModel.aggregate([
    //   {
    //     $match: {
    //       _id: new ObjectId(userId),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'roles',
    //       localField: 'roleId',
    //       foreignField: '_id',
    //       as: 'role',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'usersubscriptionplans',
    //       let: { userId: '$_id' },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ['$userId', '$$userId'] },
    //                 { $lte: ['$startDate', new Date()] },
    //                 { $gte: ['$expireDate', new Date()] },
    //               ],
    //             },
    //           },
    //         },
    //       ],
    //       as: 'usersubscriptionplans',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'subscriptionplans',
    //       localField: 'usersubscriptionplans.subscriptionPlanId',
    //       foreignField: '_id',
    //       as: 'subscriptionPlan',
    //     },
    //   },
    //   {
    //     $project: {
    //       role: { $arrayElemAt: ['$role.name', 0] },
    //       subscriptionPlanId: {
    //         $arrayElemAt: ['$usersubscriptionplans.subscriptionPlanId', 0],
    //       },
    //     },
    //   },
    // ]);
    // if (userData.length == 0) {
    //   throw new Error('User Not Found.');
    // }
    if (moduleId) {
      filter.moduleId = moduleId;
    }

    // if (userData[0].role !== 'Admin') {
    //   const subscriptionPlanIds = userData[0]?.subscriptionPlanId || [];
    //   filter.$or = [
    //     { subscriptionId: { $in: subscriptionPlanIds } },
    //     { subscriptionId: null },
    //     { subscriptionId: [] },
    //   ];
    // }

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
    getTipModule,
    getTipForExel,
    getPreviewTip
  },
  Mutation: {
    createTipFeed,
    addUpdateTipModule,
    deleteTipFeed,
    bulkCreate
  },
  Subscription: {
    onTipAdd
  }
};
