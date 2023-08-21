const { userModel, otpModel } = require('../models/index');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');

const { ObjectId } = require('mongoose').Types;
const { sendEmail } = require('../../utils/sendEmail')
const fs = require("fs");
const { otpGenerate } = require('../../utils/common')

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const signup = async (_, { email, name }) => {
  try {
    if (!email) {
      throw new Error('Please provide a valid email address.');
    }
    if (!name) {
      throw new Error('This email is already registered.');
    }

    let userExist = await userModel.findOne({ email });

    if (userExist && userExist.isVerified) {
      throw new Error('This email is already registered.');
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

    return { data, message: 'An OTP has been sent to your email address. Please check your inbox.', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const verifyOtp = async (_, { otp, email }) => {
  try {
    if (!otp) {
      throw new Error('Please provide a valid OTP.');
    }
    if (!email) {
      throw new Error('Email address not found.');
    }

    const otpVerified = await otpModel.findOne({ email, otp });

    if (!otpVerified) {
      throw new Error("Invalid OTP. Please check the OTP you've entered.");
    }

    const verifyUser = await userModel.findOne({ email });

    if (!verifyUser) {
      throw new Error("User not found. Please sign up before verifying.");
    }

    const userData = verifyUser.toObject();

    return { data: { verify: true, ...userData }, statusCode: 200 };

  } catch (error) {
    return { data: { verify: false }, error: error.message, statusCode: 400 };
  }
};

const updateProfile = async (_, { id, phoneNo, password, name, email }) => {
  try {
    if (!id) {
      throw new Error("User not found. Please provide a valid user ID.");
    }

    const updateFilter = { isVerified: true };
    const existingUser = await userModel.findOne({ _id: id });

    if (!existingUser) {
      throw new Error("User not found.");
    }

    if (phoneNo) {
      if (!/^\d{10}$/.test(phoneNo)) {
        throw new Error("Please provide a valid 10-digit phone number.");
      }
      updateFilter.phoneNo = phoneNo;
    }

    if (password && password.length >= 8) {
      const hashedPassword = CryptoJS.SHA256(password).toString();
      updateFilter.password = hashedPassword;
    }

    if (name) {
      updateFilter.name = name;
    }

    if (email) {
      const duplicateUser = await userModel.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: [{ email }, { phoneNo }] }
        ]
      });
      if (duplicateUser) {
        if (duplicateUser.email == email) {
          throw new Error("Email address is already in use.");
        } else if (duplicateUser.phoneNo == phoneNo) {
          throw new Error("Phone number is already registered.");
        }
      }

      updateFilter.email = email;
    }

    const profileUpdated = await userModel.findOneAndUpdate(
      { _id: id },
      updateFilter,
      { new: true }
    );

    return { data: profileUpdated, statusCode: 200 };
  } catch (error) {
    console.log("error", error);
    return { error: error.message, statusCode: 400 };
  }
};


const forgotPasswordSendOtp = async (_, { phoneOrEmail }) => {
  try {
    if (!phoneOrEmail) {
      throw new Error("Please provide a valid email or phone number.");
    }

    const isPhone = /^[0-9]+$/.test(phoneOrEmail);
    const filter = isPhone ? { phoneNo: phoneOrEmail } : { email: phoneOrEmail };

    const userData = await userModel.findOne({ ...filter, isVerified: true });

    if (!userData) {
      throw new Error("User not found or not verified. Please check your information.");
    }

    const otp = otpGenerate();

    await otpModel.findOneAndUpdate({ email: userData.email }, { otp }, { upsert: true, new: true, setDefaultsOnInsert: true });

    const emailTemplate = fs.readFileSync("utils/emailTemplates/forgotPasswordTemplate.html", "utf8")
      .replace(/\|USERNAME\|/g, userData.name)
      .replace(/\|OTP\|/g, otp);

    const emailSent = await sendEmail(userData.email, emailTemplate, 'Password Reset OTP - Valid for 2 Minutes');

    return { data: userData, message: 'An OTP has been sent to your registered email address. Please check your inbox.', statusCode: 200 };
  } catch (error) {
    return { error: error.message, statusCode: 400 };
  }
};

const forgotPassword = async (_, { email, password }) => {
  try {
    if (!email) {
      throw new Error('Please provide a valid email address.');
    }
    if (!password) {
      throw new Error("Please provide a password.");
    }
    if (password.length < 8) {
      throw new Error('Passwords must be at least 8 characters long.');
    }

    const hashedPassword = CryptoJS.SHA256(password).toString();

    const profileUpdated = await userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    return { data: profileUpdated, message: "Your password has been successfully updated.", statusCode: 200 };
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

    const isPasswordCorrect = data.password === CryptoJS.SHA256(password).toString();

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
      throw new Error('Please provide a valid user ID.');
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

    if (!data || data.length === 0) {
      throw new Error('User not found with the provided ID.');
    }

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
