const { userModel, otpModel } = require('../models/index');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongoose').Types;
const { sendEmail } = require('../../utils/sendEmail')
const fs = require("fs");
const { otpGenerate } = require('../../utils/common')



const signup = async (_, { email, name }) => {
  try {
    if (!email) throw new Error('Please Enter Email Id');
    if (!name) throw new Error('Please Enter Name');
    let data;

    let userExist = await userModel.findOne({ email });
    if (userExist.isVerified == true) throw new Error('Email Already Registered');

    if (!userExist) {
      data = await userModel.create({
        email,
        name,
      });
    }
    let otp = otpGenerate()

    await otpModel.findOneAndUpdate({ email }, { otp }, { upsert: true, new: true, setDefaultsOnInsert: true })

    let emailTemplate = fs
      .readFileSync("utils/emailTemplate.html", "utf8")
      .toString();
    emailTemplate = emailTemplate.replace(/\|USERNAME\|/g, name)
    emailTemplate = emailTemplate.replace(/\|OTP\|/g, otp)

    let emailSent = await sendEmail(email, emailTemplate)

    return { data, message: 'OTP Has Been Sent To Your Email ', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const login = async (_, { phoneNo, password }) => {
  try {
    if (!phoneNo) throw new Error('Please Enter Valid Email');
    if (!password) throw new Error('Please Enter Password');

    let data = await userModel.findOne({ phoneNo }).lean();

    if (!data) throw new Error('User Not Found');

    const isPasswordCorrect = bcrypt.compareSync(password, data.password);
    if (!isPasswordCorrect) throw new Error('Invilid Password');
    pubsub.publish('USER_LOGGED_IN', {
      onLogin: { data, message: 'Login Successfully', statusCode: 200 },
    });

    return { data: { ...data, applink: process.env.APPLICATION_LINK }, message: 'Login Successfully', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const getUserById = async (_, { id }) => {
  try {
    if (!id) throw new Error('User Not Found');

    let data = await userModel.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
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
          _id: 1,
          email: 1,
          name: 1,
          role: { $arrayElemAt: ['$role.name', 0] },
          expireDate: {
            $arrayElemAt: ['$usersubscriptionplans.expireDate', 0],
          },
          subscriptionPlanId: {
            $arrayElemAt: ['$usersubscriptionplans.subscriptionPlanId', 0],
          },
          subscriptionPlanName: { $arrayElemAt: ['$subscriptionPlan.name', 0] },
        },
      },
    ]);

    return { data, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const onLogin = {
  subscribe: () => pubsub.asyncIterator(['USER_LOGGED_IN']),
};

module.exports = {
  Query: {
    getUserById,
  },
  Mutation: {
    login,
    signup,
  },
  Subscription: {
    onLogin,
  },
};
