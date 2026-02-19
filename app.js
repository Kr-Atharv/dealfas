// Core Module
const path = require('path');

// External Module
const express = require('express');

//Local Module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter = require("./routes/authRouter")
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");
const { default: mongoose } = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');

const app = express();

// Environment variables (with fallbacks for local development)
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.MONGODB_URI || "mongodb+srv://root:Om)jha>~9811@atharvcoding.7aon3sd.mongodb.net/DEALFAST?appName=atharvCoding";
const SESSION_SECRET = process.env.SESSION_SECRET || 'dealfast-secret-session';

// File upload configuration for gallery images
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(rootDir, 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/webp'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).array('galleryImages', 5)
);

// Static assets
app.use(express.static(path.join(rootDir, 'public')))

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: DB_PATH,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Make auth info available in all views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.currentUser = req.session.user;
  next();
});

// Protect all non-auth routes: require login for everything except login/signup
app.use((req, res, next) => {
  const publicPaths = ['/login', '/signup'];
  const isPublicPath = publicPaths.includes(req.path);

  if (!req.session.isLoggedIn && !isPublicPath) {
    return res.redirect('/login');
  }
  next();
});

// Routers
app.use(authRouter);
app.use(storeRouter);
app.use("/host", hostRouter);

// 404 handler
app.use(errorsController.pageNotFound);

mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo');
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log('Error while connecting to Mongo: ', err);
});