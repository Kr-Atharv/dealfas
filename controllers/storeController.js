const Favourite = require("../models/favourite");
const Home = require("../models/home");
const Order = require("../models/order");

exports.getIndex = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/index", {
      registeredHomes: registeredHomes,
      pageTitle: "airbnb Home",
      currentPage: "index",
    });
  });
};

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Homes List",
      currentPage: "Home",
    });
  });
};

exports.getBookings = (req, res, next) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login");
  }

  Order.find({ buyer: user._id })
    .populate("home")
    .then((orders) => {
      res.render("store/bookings", {
        pageTitle: "My Orders",
        currentPage: "bookings",
        orders: orders,
      });
    })
    .catch((err) => {
      console.log("Error while fetching orders: ", err);
      res.render("store/bookings", {
        pageTitle: "My Orders",
        currentPage: "bookings",
        orders: [],
      });
    });
};

exports.getFavouriteList = (req, res, next) => {
  Favourite.find()
  .populate('houseId')
  .then((favourites) => {
    const favouriteHomes = favourites.map((fav) => fav.houseId);
    res.render("store/favourite-list", {
      favouriteHomes: favouriteHomes,
      pageTitle: "My Favourites",
      currentPage: "favourites",
    });
  });
};

exports.postCreateOrder = (req, res, next) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login");
  }

  const { homeId } = req.body;

  Home.findById(homeId)
    .then((home) => {
      if (!home) {
        console.log("Home not found for order");
        return res.redirect("/");
      }

      const order = new Order({
        home: home._id,
        buyer: user._id,
        buyerPhone: user.phone,
      });

      return order.save();
    })
    .then(() => {
      res.redirect("/bookings");
    })
    .catch((err) => {
      console.log("Error while creating order: ", err);
      res.redirect("/");
    });
};

exports.postAddToFavourite = (req, res, next) => {
  const homeId = req.body.id;
  Favourite.findOne({houseId: homeId}).then((fav) => {
    if (fav) {
      console.log("Already marked as favourite");
    } else {
      fav = new Favourite({houseId: homeId});
      fav.save().then((result) => {
        console.log("Fav added: ", result);
      });
    }
    res.redirect("/favourites");
  }).catch(err => {
    console.log("Error while marking favourite: ", err);
  });
};

exports.postRemoveFromFavourite = (req, res, next) => {
  const homeId = req.params.homeId;
  Favourite.findOneAndDelete({houseId: homeId})
    .then((result) => {
      console.log("Fav Removed: ", result);
    })
    .catch((err) => {
      console.log("Error while removing favourite: ", err);
    })
    .finally(() => {
      res.redirect("/favourites");
    });
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found");
      res.redirect("/homes");
    } else {
      res.render("store/home-detail", {
        home: home,
        pageTitle: "Home Detail",
        currentPage: "Home",
      });
    }
  });
};