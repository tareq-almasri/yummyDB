const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./Models/user.model");
require("dotenv").config();

const secret = process.env.SECRET;

// CONNECT TO MONGODB
mongoose.connect(
  process.env.MONGO_DB,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  },
  (err) => {
    if (!err) {
      console.log("MongoDB Connection Succeeded.");
    } else {
      console.log("Error in DB connection: " + err);
    }
  }
);

let port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("start listening on port 5000");
});

app.use((req, res, next) => {
  res.set("ACCESS-CONTROL-ALLOW-ORIGIN", "*");
  res.set("ACCESS-CONTROL-ALLOW-HEADERS", "*");
  res.set("ACCESS-CONTROL-ALLOW-METHODS", "*");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/sign-up", (req, res, next) => {
  let pwd = bcrypt.hashSync(req.body.password, 10);

  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        User.create({
          username: req.body.username,
          email: req.body.email,
          password: pwd,
        }).then((userNew) => {
          return res.send(userNew);
        });
      }
      // user already exists!
      else {
        res.status(400).send({
          error: "you've already signed up with this e-mail",
        });
      }
    })
    .catch((err) => next(err));
});

app.post("/create-account", (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      user.tdee = req.body.tdee;
      user.goalCal = req.body.goal;
      user.protein = req.body.protein;
      user.carbs = req.body.carbs;
      user.fat = req.body.fat;
      user.sugar = req.body.sugar;
      user.height = req.body.height;
      user.weight = req.body.weight;
      user.age = req.body.age;
      user.male = req.body.male;
      user.female = req.body.female;
      user.daysOfWorkout = req.body.daysOfWorkout;
      user.durationOfWorkout = req.body.durationOfWorkout;
      user.ecto = req.body.ecto;
      user.meso = req.body.meso;
      user.endo = req.body.endo;
      user.lose = req.body.lose;
      user.gain = req.body.gain;
      user.maintain = req.body.maintain;
      user.lowCarbs = req.body.lowCarbs;
      user.moderateCarbs = req.body.moderateCarbs;
      user.highCarbs = req.body.highCarbs;
      user.save();
      res.json("info saved");
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

app.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.send({err: "incorrect email or password"});
    }
    let match = bcrypt.compareSync(req.body.password, user.password);
    if (match) {
      let token = jwt.sign({ userId: user._id, email: user.email }, secret, {
        expiresIn: "1h",
      }); // the lifetime (=expiration time) for the token after which it is getting invalid
      return res.send({ token: token });
      //return res.send(user)
    } else {
      res.send({err: "incorrect email or password"});
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.json('expired');
    req.user = user;
    
  });
  next();
};

app.get("/profile", authenticateToken, (req, res) => {
  User.findOne({ email: req.user.email }).then((user) => res.send(user));
});

app.post("/edit-account", authenticateToken, (req, res) => {
  User.findOne({ email: req.user.email })
    .then((user) => {
      user.tdee = req.body.tdee;
      user.goalCal = req.body.goal;
      user.protein = req.body.protein;
      user.carbs = req.body.carbs;
      user.fat = req.body.fat;
      user.sugar = req.body.sugar;
      user.height = req.body.height;
      user.weight = req.body.weight;
      user.age = req.body.age;
      user.male = req.body.male;
      user.female = req.body.female;
      user.daysOfWorkout = req.body.daysOfWorkout;
      user.durationOfWorkout = req.body.durationOfWorkout;
      user.ecto = req.body.ecto;
      user.meso = req.body.meso;
      user.endo = req.body.endo;
      user.lose = req.body.lose;
      user.gain = req.body.gain;
      user.maintain = req.body.maintain;
      user.lowCarbs = req.body.lowCarbs;
      user.moderateCarbs = req.body.moderateCarbs;
      user.highCarbs = req.body.highCarbs;
      user.save();
      res.json("info saved");
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

app.get("/check-fav/:id", authenticateToken, (req, res) => {
  User.findOne({ email: req.user.email }).then((user) =>
    res.send(user.fav.some((x) => x.id == req.params.id))
  );
});

app.post("/add-fav", authenticateToken, (req, res) => {
  User.findOne({ email: req.user.email }).then((user) => {
    user.fav = [...user.fav, req.body.recipe];
    user.save();
    res.json("added to fav");
  });
});

app.delete("/remove-fav/:id", authenticateToken, (req, res) => {
  User.findOne({ email: req.user.email }).then((user) => {
    user.fav = user.fav.filter((x) => x.id != req.params.id);
    user.save();
    res.json("removed from fav");
  });
});

app.get("/get-fav", authenticateToken, (req, res) => {
  User.findOne({ email: req.user.email }).then((user) => res.send(user.fav));
});

app.get('/check-token',authenticateToken, (req,res)=>{
   res.json('token is valid');
})

if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.resolve(__dirname,"build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "react", "build", "index.html"));
  });
}