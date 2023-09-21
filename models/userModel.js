const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { config } = require("../config/secret");


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  profileImage: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
  },
  role: {
    type: String,
    default: "user"
  },
  favs_ar: {
    type: Array,
    default: []
  },
  contacts_ar: {
    type: Array,
    default: []
  },
  isOnline: {
    type: Boolean,
    default: false,
  },

  colors: [
    {
      backgroundColor: {
        type: String,
        default: "white"
      },
      backgroudImage: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
      }
    }
  ]

}, { timestamps: true });

exports.UserModel = mongoose.model("users", userSchema);

// creat token
exports.createToken = (user_id, role = "user") => {
  const token = jwt.sign({ _id: user_id, role }, config.TOKEN_SECRET, { expiresIn: "10080mins" })
  return token;
}

//register
exports.validateUser = (_reqBody) => {
  const joiSchema = Joi.object({
    name: Joi.string().min(2).max(20).required(),
    email: Joi.string().min(2).max(50).email().required(),
    password: Joi.string().min(5).max(50).required()
  })
  return joiSchema.validate(_reqBody);
}

// login
exports.validateLogin = (_reqBody) => {
  const joiSchema = Joi.object({
    email: Joi.string().min(2).max(50).email().required(),
    password: Joi.string().min(5).max(50).required()
  })
  return joiSchema.validate(_reqBody);
}


exports.validateChangePassword = (_reqBody) => {
  const joiSchema = Joi.object({
    password: Joi.string().min(5).max(50).required()
  })
  return joiSchema.validate(_reqBody);
} 