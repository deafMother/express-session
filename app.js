const express = require("express");
const session = require("express-session");
var bodyParser = require("body-parser");

const {
  PORT = 3000,
  SESSION_NAME = "sid",
  SESSION_LIFETIME = 1000 * 10,
  SESSION_SECRET = "mysecretsessionwawawewe",
} = process.env;

const users = [
  { id: 1, name: "pekka", email: "red1@colours.com", password: "password" },
  { id: 2, name: "knight", email: "red2@colours.com", password: "password" },
  { id: 3, name: "rascal", email: "red3@colours.com", password: "password" },
];

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// as store is not provided so the default which is memory will be used as store
app.use(
  session({
    name: SESSION_NAME,
    resave: false, // do not save the session back to the store if it was never modified
    saveUninitialized: false, // do not save any session thats uninialized i.e has no value
    secret: SESSION_SECRET,
    cookie: {
      sameSite: true,
      httpOnly: true,
      maxAge: SESSION_LIFETIME,
      secure: false,
    },
  })
);

// middleware functions
const redirecLogin = (req, res, next) => {
  if (!req.session.userId) {
    // if the user is not logged in
    res.redirect("/login");
  } else {
    next();
  }
};

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    // if the user is not logged in
    res.redirect("/home");
  } else {
    next();
  }
};

app.get("/", (req, res, next) => {
  const { userId } = req.session;
  res.send(`
  <h1>Welcome</h1>
  ${
    userId
      ? `
        <a href='/home'>Home</a>
        <form method='post' action='/logout'>
            <input type="submit" value="logout"></input>
        </form> `
      : `
          <a href='/login'>Login</a>
          <a href='/register'>Register</a>
            `
  } 
  `);
});

app.get("/home", redirecLogin, (req, res, next) => {
  console.log(req.session.userId);
  res.send(`

  <h1>Home</h1>
  <a href='/'>Main</a>
  <ul>
    <li>Name: </li>
    <li>Email: </li>    
  </ul>
  
  `);
});

app.get("/login", redirectHome, (req, res, next) => {
  res.send(`
    <h1>Login</h1>
    <form method='post' action= '/login'>
        <input type="email" name="email" placeholder="Email" require />
        <input type="password" name="password" placeholder="password" require />
        <input type="submit" value="login"></input>
    </form>
  `);
});

app.get("/register", redirectHome, (req, res, next) => {
  res.send(`
    <h1>Register</h1>
    <form method='post' action= '/resister'>
        <input type="text" name="name" placeholder="Name" require />
        <input type="email" name="email" placeholder="Email" require />
        <input type="password" name="password" placeholder="password" require />
        <input type="submit" value="rigister"></input>
    </form>
  `);
});

app.post("/login", redirectHome, (req, res, next) => {
  const { email, password } = req.body;
  if (email && password) {
    const user = users.find((user) => {
      return user.email === email && user.password === password;
    });

    if (user) {
      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }

  res.redirect("/login");
});

app.post("/register", redirectHome, (req, res, next) => {
  const { name, email, password } = req.body;
  if (email && name && password) {
    const user = users.some((user) => {
      return user.email === email || user.name === name;
    });

    if (user) {
      return res.redirect("/register");
    } else {
      const newUser = { id: users.length + 1, name, password, email };

      users.push(newUser);

      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }

  res.redirect("/register");
});
app.post("/logout", redirecLogin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/home");
    }

    res.clearCookie(SESSION_NAME); // this is optional
    res.redirect("/login");
  });
});

app.listen(PORT, () => {
  console.log("server running on port " + PORT);
});
