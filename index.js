const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
mongoose.connect(process.env.MONGO_URL);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
  },
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username: username });
  try {
    const user = await newUser.save();
    console.log(user);
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    console.log(err);
  }
  //   newUser.save((err, data) => {
  //   if (err) return console.log(err);
  //   res.json({ username: data.username, _id: data._id });
  // });
});

app.post("/api/users/:id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    res.json({ error: "User not found" });
  } else {
    const newExercise = new Exercise({
      userId: userId,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date() /* date solved*/,
    });
    try {
      const exercise = await newExercise.save();
      res.json({
        _id: userId,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    } catch (err) {
      console.log(err);
      res.json({ error: "Error saving exercise" });
    }
  }
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}).select("_id username");
  if (!users) {
    res.json({ error: "No users found" });
  } else {
    res.json(users);
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  const user = await User.findById(userId);
  if (!user) {
    res.json({ error: "User not found" });
  } else {
    let dateObj = {};
    if (from) {
      dateObj["$gte"] = new Date(from);
    }
    if (to) {
      dateObj["$lte"] = new Date(to);
    }
    if (from || to) {
      dateObj = {
        ...dateObj,
      };
    }
    const exercises = await Exercise.find({ userId: userId }).limit(limit);
    const log = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));
    const count = exercises.length;
    res.json({
      username: user.username,
      _id: userId,
      count,
      log,
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
