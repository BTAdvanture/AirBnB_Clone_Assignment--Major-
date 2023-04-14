const mongoose = require("mongoose");

let hostHome = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  Price: {
    type: String,
    required: true,
  },
  summery: {
    type: String,
    required: true,
  },
  bedrooms: {
    type: Number,
    default: 1,
  },
  bed: {
    type: Number,
    default: 1,
  },
  bathroom: {
    type: Number,
    default: 1,
  },
  images: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  rating: {
    type: String,
   
  },
  cancellation_policy: {
    type: String,
    default: "Strint 14 with grace period",
  },
  amentities: {
    info: [],
  },
});

module.exports = mongoose.model("airbnbapi", hostHome);