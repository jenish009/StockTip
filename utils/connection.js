const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://kavathiyajenish008:stocktip@cluster0.pqbybij.mongodb.net/stocktip',
      { useNewUrlParser: true, useUnifiedTopology: true },
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

module.exports = { connectDatabase };
