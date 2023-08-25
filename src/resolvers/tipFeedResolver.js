const { tipFeedModel, userModel, moduleModel } = require('../models/index');
const { ObjectId } = require('mongoose').Types;
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const multer = require('multer');
const fs = require('fs');
const fastcsv = require('fast-csv');

const bulkCreate = async (parent, args, context) => {
  try {
    if (!args.args.filePath) {
      throw new Error('File path not provided');
    }
    const fileData = fs.readFileSync(args.args.filePath, 'utf8');

    let jsonData = [];

    await new Promise((resolve, reject) => {
      fastcsv
        .parseString(fileData, { headers: true })
        .on('data', (row) => {
          // Extract targets data from the columns and create the targets array
          const targets = [];
          for (let i = 1; i <= 5; i++) {
            if (row[`targets_${i}_value`] && row[`targets_${i}_date`]) {
              targets.push({
                value: row[`targets_${i}_value`],
                date: row[`targets_${i}_date`]
              });
            }
          }

          // Create the document for tipFeedModel
          const tipFeedDoc = {
            id: row.id,
            position: row.position,
            stopLoss: row.stopLoss,
            entry: row.entry,
            entry_date: row.entry_date,
            status: row.status,
            quantity: row.quantity,
            confirmation: row.confirmation,
            targets: targets,
            isEntryMissed: row.isEntryMissed,
            entryMissedInstruction: row.entryMissedInstruction,
            isStopLossMissed: row.isStopLossMissed,
            stopLossMissedInstruction: row.stopLossMissedInstruction,
            note: row.note,
            subscriptionId: [row.subscriptionId_0, row.subscriptionId_1].filter(id => id), // Filter out null/undefined values
            moduleId: row.moduleId,
            symbol: row.symbol
          };

          jsonData.push(tipFeedDoc);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    jsonData.shift()
    for (let i = 0; i < jsonData.length; i++) {
      jsonData[i].moduleId = null;
      pubsub.publish('TIP_ADD', {
        onTipAdd: { data: jsonData[i], statusCode: 200 },
      });

      if (jsonData[i].id) {
        await tipFeedModel.findOneAndUpdate(
          { _id: jsonData[i].id }, // Match using the provided id field
          { $set: jsonData[i] },   // Update fields with the document
          { upsert: true }         // Perform an upsert
        );
      }
    }

    jsonData = jsonData.filter(obj => !obj.id); // Remove objects with id
    jsonData = jsonData.map(obj => { delete obj.id; return obj })
    await tipFeedModel.insertMany(jsonData);

    return { data: jsonData, message: 'Bulk creation successful', statusCode: 200 };

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
      moduleId
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
      moduleId
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
    deleteTipFeed,
    bulkCreate
  },
  Subscription: {
    onTipAdd
  }
};
