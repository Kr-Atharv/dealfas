
const Home = require("../models/home");
const Order = require("../models/order");

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    editing: false,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";
  const user = req.session.user;

  Home.findOne({ _id: homeId, owner: user?._id }).then((home) => {
    if (!home) {
      console.log("Home not found for editing or not authorized.");
      return res.redirect("/host/host-home-list");
    }

    console.log(homeId, editing, home);
    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
    });
  });
};

exports.getHostHomes = (req, res, next) => {
  const user = req.session.user;
  Home.find({ owner: user?._id }).then((registeredHomes) => {
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
    });
  });
};

exports.getHostOrders = (req, res, next) => {
  const user = req.session.user;
  const sellerEmail = user?.email;

  Home.find({ ownerEmail: sellerEmail })
    .select("_id")
    .then((homes) => {
      const homeIds = homes.map((h) => h._id);
      return Order.find({ home: { $in: homeIds } })
        .populate("home")
        .populate("buyer")
        .sort({ createdAt: -1 });
    })
    .then((orders) => {
      res.render("host/orders", {
        orders: orders,
        pageTitle: "Buyer Requests",
        currentPage: "host-orders",
      });
    })
    .catch((err) => {
      console.log("Error while fetching host orders: ", err);
      res.render("host/orders", {
        orders: [],
        pageTitle: "Buyer Requests",
        currentPage: "host-orders",
      });
    });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, photoUrl, description } = req.body;
  const user = req.session.user;
  const uploadedGallery = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  const home = new Home({
    houseName,
    price,
    location,
    rating,
    photoUrl,
    description,
    galleryImages: uploadedGallery,
    owner: user?._id,
    ownerEmail: user?.email,
  });

  home
    .save()
    .then(() => {
      console.log("Home Saved successfully");
      res.redirect("/host/host-home-list");
    })
    .catch((err) => {
      console.log("Error while saving home ", err);
      res.redirect("/host/host-home-list");
    });
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, rating, photoUrl, description } = req.body;
  const user = req.session.user;
  const newGallery = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  Home.findOne({ _id: id, owner: user?._id })
    .then((home) => {
      if (!home) {
        console.log("Home not found for updating or not authorized");
        return res.redirect("/host/host-home-list");
      }
      home.houseName = houseName;
      home.price = price;
      home.location = location;
      home.rating = rating;
      home.photoUrl = photoUrl;
      home.description = description;
      if (newGallery.length > 0) {
        home.galleryImages = newGallery;
      }
      return home.save();
    })
    .then((result) => {
      if (result) {
        console.log("Home updated ", result);
      }
      res.redirect("/host/host-home-list");
    })
    .catch((err) => {
      console.log("Error while updating ", err);
      res.redirect("/host/host-home-list");
    });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const user = req.session.user;
  console.log("Came to delete ", homeId);
  Home.findOneAndDelete({ _id: homeId, owner: user?._id })
    .then((deleted) => {
      if (!deleted) {
        console.log("Not authorized to delete or not found");
      }
      res.redirect("/host/host-home-list");
    })
    .catch((error) => {
      console.log("Error while deleting ", error);
      res.redirect("/host/host-home-list");
    });
};
