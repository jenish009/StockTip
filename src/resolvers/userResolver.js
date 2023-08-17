const { userModel, otpModel } = require('../models/index');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongoose').Types;
const { sendEmail } = require('../../utils/sendEmail')
const fs = require("fs");
const { otpGenerate } = require('../../utils/common')

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const signup = async (_, { email, name }) => {
  try {
    if (!email) {
      throw new Error('Please Enter Email Id');
    }
    if (!name) {
      throw new Error('Please Enter Name');
    }

    let userExist = await userModel.findOne({ email });

    if (userExist && userExist.isVerified) {
      throw new Error('Email Already Registered');
    }

    let data;

    if (!userExist) {
      data = await userModel.create({
        email,
        name,
      });
    } else {
      data = userExist;
    }

    const otp = otpGenerate();

    await otpModel.findOneAndUpdate({ email }, { otp }, { upsert: true, new: true, setDefaultsOnInsert: true });

    const emailTemplate = fs.readFileSync("utils/emailTemplates/emailTemplate.html", "utf8")
      .replace(/\|USERNAME\|/g, name)
      .replace(/\|OTP\|/g, otp);

    const emailSent = await sendEmail(email, emailTemplate, 'OTP to login');

    return { data, message: 'OTP Has Been Sent To Your Email', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const verifyOtp = async (_, { otp, email }) => {
  try {
    if (!otp) {
      throw new Error('Please Enter Valid OTP');
    }
    if (!email) {
      throw new Error('Email Not Found');
    }

    const otpVerified = await otpModel.findOne({ email, otp });

    if (!otpVerified) {
      throw new Error("Invalid OTP");
    }

    const verifyUser = await userModel.findOne({ email });

    if (!verifyUser) {
      throw new Error("User Not Found");
    }

    const userData = verifyUser.toObject();

    return { data: { verify: true, ...userData }, statusCode: 200 };

  } catch (error) {
    return { data: { verify: false }, error: error.message, statusCode: 400 };
  }
};

const updateProfile = async (_, { id, phoneNo, password }) => {
  try {
    if (!id) {
      throw new Error("User Not Found");
    }
    if (!phoneNo) {
      throw new Error("Please Enter Valid Phone Number");
    }
    if (!password) {
      throw new Error("Please Enter Password");
    }
    if (password.length < 8) {
      throw new Error('Passwords Must Contain at Least 8 Characters');
    }

    const hashedPassword = bcrypt.hashSync(password, salt);

    const profileUpdated = await userModel.findOneAndUpdate(
      { _id: id },
      { phoneNo, password: hashedPassword, isVerified: true },
      { new: true }
    );

    return { data: profileUpdated, statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const forgotPasswordSendOtp = async (_, { phoneOrEmail }) => {
  try {
    if (!phoneOrEmail) {
      throw new Error("Please Enter Email Or Phone Number");
    }

    const isPhone = /^[0-9]+$/.test(phoneOrEmail);
    const filter = isPhone ? { phoneNo: phoneOrEmail } : { email: phoneOrEmail };

    const userData = await userModel.findOne({ ...filter, isVerified: true });

    if (!userData) {
      throw new Error("User Not Found");
    }

    const otp = otpGenerate();

    await otpModel.findOneAndUpdate({ email: userData.email }, { otp }, { upsert: true, new: true, setDefaultsOnInsert: true });

    const emailTemplate = fs.readFileSync("utils/emailTemplates/forgotPasswordTemplate.html", "utf8")
      .replace(/\|USERNAME\|/g, userData.name)
      .replace(/\|OTP\|/g, otp);

    const emailSent = await sendEmail(userData.email, emailTemplate, 'Password Reset OTP - Valid for 2 Minutes');

    return { data: userData, message: 'The OTP has been sent to the registered email address', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};
const forgotPassword = async (_, { email, password }) => {
  try {
    if (!email) {
      throw new Error('Please Enter Valid Email');
    }
    if (!password) {
      throw new Error("Please Enter Password");
    }
    if (password.length < 8) {
      throw new Error('Passwords Must Contain at Least 8 Characters');
    }

    const hashedPassword = bcrypt.hashSync(password, salt);

    const profileUpdated = await userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    return { data: profileUpdated, message: "The password has been successfully updated", statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const login = async (_, { phoneNo, password }) => {
  try {
    if (!phoneNo) {
      throw new Error('Please provide a valid phone number.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const data = await userModel.findOne({ phoneNo }).lean();

    if (!data) {
      throw new Error('User not found. Please check your phone number or sign up.');
    }

    const isPasswordCorrect = bcrypt.compareSync(password, data.password);

    if (!isPasswordCorrect) {
      throw new Error('Invalid password. Please make sure you entered the correct password.');
    }

    pubsub.publish('USER_LOGGED_IN', {
      onLogin: { data, message: 'Login successful', statusCode: 200 },
    });

    const responseData = {
      ...data,
      applink: process.env.APPLICATION_LINK,
    };

    return { data: responseData, message: 'Login successful', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const getUserById = async (_, { id }) => {
  try {
    if (!id) {
      throw new Error('User Not Found');
    }

    const data = await userModel.aggregate([
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
          password: 1,
          phoneNo: 1,
          role: { $arrayElemAt: ['$role.name', 0] },
          expireDate: { $arrayElemAt: ['$usersubscriptionplans.expireDate', 0] },
          subscriptionPlanId: { $arrayElemAt: ['$usersubscriptionplans.subscriptionPlanId', 0] },
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
    forgotPasswordSendOtp
  },
  Mutation: {
    login,
    signup,
    verifyOtp,
    updateProfile,
    forgotPassword
  },
  Subscription: {
    onLogin,
  },
};
