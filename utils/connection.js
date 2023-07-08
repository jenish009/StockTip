const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.CONNECTION_URL,
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

module.exports = { connectDatabase };
