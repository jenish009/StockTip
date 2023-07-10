const { userModel } = require('../models/index');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const { ObjectId } = require('mongoose').Types;

const signup = async (_, { email, password, name, phoneNo }) => {
  try {
    if (!email) throw new Error('Please Enter Email Id');
    if (!password) throw new Error('Please Enter Password');
    if (password.length < 8)
      throw new Error('Passwords Must Contain 8 Characters');
    if (!name) throw new Error('Please Enter Name');
    if (!phoneNo || phoneNo.length < 10)
      throw new Error('Please Enter Valid Phone Number');

    let userExist = await userModel.findOne({ $or: [{ email }, { phoneNo }] });

    if (userExist) throw new Error('Email Or Phone Number Already Registered');
    const hashedPassword = bcrypt.hashSync(password, salt);

    let data = await userModel.create({
      email,
      password: hashedPassword,
      name,
      phoneNo,
    });

    return { data, message: 'Sign Up successfully', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const login = async (_, { phoneNo, password }) => {
  try {
    if (!phoneNo) throw new Error('Please Enter Valid Email');
    if (!password) throw new Error('Please Enter Password');

    let data = await userModel.findOne({ phoneNo });

    if (!data) throw new Error('User Not Found');

    const isPasswordCorrect = bcrypt.compareSync(password, data.password);
    if (!isPasswordCorrect) throw new Error('Invilid Password');
    pubsub.publish('USER_LOGGED_IN', {
      onLogin: { data, message: 'Login Successfully', statusCode: 200 },
    });

    return { data: { ...data, applink: process.env.APPLICATION_LINK }, message: 'Login Successfully', , statusCode: 200 };
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
