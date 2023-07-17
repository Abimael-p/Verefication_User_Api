const catchError = require("../utils/catchError");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const EmailCode = require("../models/EmailCode");

const getAll = catchError(async (req, res) => {
  const results = await User.findAll({ include: [EmailCode] });
  return res.json(results);
});

const create = catchError(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    country,
    image,
    isVeryfied,
    frontBaseUrl,
  } = req.body;
  const encriptedPassword = await bcrypt.hash(password, 10);
  const result = await User.create({
    firstName,
    lastName,
    email,
    password: encriptedPassword,
    country,
    image,
    isVeryfied,
  });

  const code = require("crypto").randomBytes(64).toString("hex");
  const link = `${frontBaseUrl}/users/verify_email/${code}`;

  await EmailCode.create({
    code,
    userId: result.id,
  });
  await sendEmail({
    to: email,
    subject: "Verificate email for user app",
    html: `
            <h1>Hello ${firstName} ${lastName}!</h1>
            <p>Verify your account clicking this link</p>
            <a href="${link}" >${link}</a>
            <hr>
            <b>Thanks for sign up in users App</b>
        `,
  });

  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id);
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const { password, ...rest } = req.body;

  if (password) return res.status(400).json({ error: "Cannot update password through this endpoint" });
  const result = await User.update(rest, {
    where: { id },
    returning: true,
  });
  if (result[0] === 0) return res.sendStatus(404);
  return res.json(result[1][0]);
});

const verifyCode = catchError(async (req, res) => {
  const { code } = req.params;
  const emailCode = await EmailCode.findOne({ where: { code } });
  if (!emailCode) return res.status(401).json({ menssage: "invalid code" });
  const user = await User.findByPk(emailCode.userId);
  user.isVerified = true;
  await user.save();
  await emailCode.destroy();
  return res.json(user);
});

const Login = catchError(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword)
    return res.status(401).json({ error: "invalid credentials" });
  if (!user.isVerified)
    return res.status(401).json({ error: "invalid credentials" });

  const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
    expiresIn: "1d",
  });

  return res.status(201).json({ user, token });
});

const getLoggedUser = catchError(async (req, res) => {
  return res.json(req.user);
});

const resetPasswordRequest = catchError(async (req, res) => {
  const { email, frontBaseUrl } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "User not found" });

  const code = require("crypto").randomBytes(64).toString("hex");
  await EmailCode.create({
    code,
    userId: user.id,
  });

  const resetLink = `${frontBaseUrl}/users/reset_password/${code}`;
  await sendEmail({
    to: user.email,
    subject: "Password Reset",
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <hr>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  });

  return res.sendStatus(200);
});

const resetPassword = catchError(async (req, res) => {
  const { code } = req.params;
  const { newPassword } = req.body;
  const emailCode = await EmailCode.findOne({ where: { code } });
  if (!emailCode) return res.status(401).json({ error: "Invalid code" });

  const user = await User.findByPk(emailCode.userId);
  if (!user) return res.status(401).json({ error: "User not found" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();
  await emailCode.destroy();

  await sendEmail({
    to: user.email,
    subject: "Password Updated",
    html: `
    <h1>Password Updated</h1>
    <p>Your password has been successfully updated.</p>
    `,
  });

  return res.sendStatus(200);
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  Login,
  verifyCode,
  getLoggedUser,
  resetPasswordRequest,
  resetPassword,
};
