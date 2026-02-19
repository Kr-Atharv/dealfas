const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    currentPage: 'login',
    errorMessage: null,
  });
};

exports.getSignup = (req, res) => {
  res.render('auth/signup', {
    pageTitle: 'Sign Up',
    currentPage: 'signup',
    errorMessage: null,
  });
};

exports.postSignup = async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!email || !password || password !== confirmPassword) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up',
      currentPage: 'signup',
      errorMessage: 'Invalid input or passwords do not match.',
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(422).render('auth/signup', {
        pageTitle: 'Sign Up',
        currentPage: 'signup',
        errorMessage: 'Email already registered. Please login instead.',
      });
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      name,
      email,
      phone,
      password: hashedPw,
    });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.log('Error during signup: ', err);
    res.status(500).render('auth/signup', {
      pageTitle: 'Sign Up',
      currentPage: 'signup',
      errorMessage: 'Something went wrong. Please try again.',
    });
  }
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render('auth/login', {
        pageTitle: 'Login',
        currentPage: 'login',
        errorMessage: 'Invalid email or password.',
      });
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      return res.status(401).render('auth/login', {
        pageTitle: 'Login',
        currentPage: 'login',
        errorMessage: 'Invalid email or password.',
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    };
    req.session.save((err) => {
      if (err) {
        console.log('Error saving session after login: ', err);
      }
      res.redirect('/');
    });
  } catch (err) {
    console.log('Error during login: ', err);
    res.status(500).render('auth/login', {
      pageTitle: 'Login',
      currentPage: 'login',
      errorMessage: 'Something went wrong. Please try again.',
    });
  }
};

exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Error destroying session on logout: ', err);
    }
    res.redirect('/');
  });
};

