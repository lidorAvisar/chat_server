const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middleWares/auth");
const {
  UserModel,
  validateUser,
  validateLogin,
  createToken,
  validateChangePassword,
} = require("../models/userModel");

// GET

router.get("/checkToken", auth, async (req, res) => {
  res.json(req.tokenData);
});

router.get("/usersList", auth, async (req, res) => {
  try {
    const dada = await UserModel.find({}, { password: 0, email: 0 });
    res.json(dada);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.get("/userInfo", auth, async (req, res) => {
  try {
    const user = await UserModel.findOne(
      { _id: req.tokenData._id },
      { password: 0 }
    );
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// POST

// register
router.post("/", async (req, res) => {
  const validBody = validateUser(req.body);

  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }

  try {
    const user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "*****";
    res.status(201).json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res
        .status(401)
        .json({ err: "Email already in system", code: 11000 });
    }
    console.log(err);
    res.status(502).json({ err });
  }
});

//login
router.post("/login", async (req, res) => {
  const validBody = validateLogin(req.body);

  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }

  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ msg: "Email or password wrong!" });
    }
    const passwordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordValid) {
      return res.status(401).json({ msg: "Email or password wrong!" });
    }
    const token = createToken(user._id, user.role);
    if (token) {
      user.isOnline = true;
      user.save();
    }
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.post("/contactsIds", auth, async (req, res) => {
  try {
    if (!Array.isArray(req.body.contacts_ar)) {
      return res
        .status(400)
        .json({ msg: "You need to send contacts_ar as array" });
    }
    const ids = req.body.contacts_ar.map((item) => item.id);
    const data = await UserModel.find({ _id: { $in: ids } });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// check password
router.post("/checkPassword", auth, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.tokenData._id });
    if (!user) {
      return res.status(400).json({ error: "Password data missing" });
    }
    const passwordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    res.status(200).json(passwordValid);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// PATCH

// change role
router.patch("/changeRole/:id/:role", authAdmin, async (req, res) => {
  try {
    const { id, role } = req.params;

    if (role != "user" && role != "admin") {
      return res
        .status(401)
        .json({ err: "you can send only admin or user role" });
    }

    if (id == req.tokenData._id) {
      return res.status(401).json({ err: "you can't change yourself" });
    }

    const data = await UserModel.updateOne({ _id: id }, { role });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

router.patch("/logout", auth, async (req, res) => {
  try {
    const id = req.body._id;
    const user = await UserModel.updateOne({ _id: id }, { isOnline: false });
    res.json(user);
  } 
  catch (error) {
    console.log(error);
    res.status(502).json({ error });
  }
});


// PUT

// Editing by the user himself
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id == req.tokenData._id) {
      return res.status(502).json({ msg: "You can only change yourself" });
    }
    const data = await UserModel.updateOne(
      { _id: id },
      {
        name: req.body.name,
        profileImage: req.body.profileImage,
        colors: {
          backgroudImage: req.body.backgroudImage,
          backgroundColor: req.body.backgroundColor,
        },
      }
    );
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// change password
router.put("/changePassword/:id", auth, async (req, res) => {
  const validBody = validateChangePassword(req.body);

  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }

  try {
    const { id } = req.params;
    if (!id == req.tokenData._id) {
      return res.status(502).json({ msg: "You can only change yourself" });
    }
    const data = await UserModel.updateOne({ _id: id },{ password: await bcrypt.hash(req.body.password, 10) }
    );
    res.json({ data, msg: "password updated" });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// DELETE

// delete by the user himself
router.delete("/deleteUser/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id == req.tokenData._id) {
      return res.status(502).json({ msg: "You can only change your name." });
    }
    const data = await UserModel.deleteOne({ _id: id });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// delete users by admin
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id == req.tokenData._id) {
      return res.status(401).json({ err: "you can't delete yourself" });
    }

    const data = await UserModel.deleteOne({ _id: id });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

module.exports = router;
