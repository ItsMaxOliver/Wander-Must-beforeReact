var express = require("express");

// passport is necessary for auth and is thus passed in this function
module.exports = function (app, passport) {

    // destroys a user's session when they log out and redirects them to home page
    app.get("/logout", function (req, res) {
        req.session.destroy(function (err) {
            res.redirect("/");
        });
    });

    app.get("/profile", isLoggedIn, function (req, res) {
        res.render("profile");
    });

    // redirects after successful signup
    app.get("/authSuccess", function (req, res) {
        res.redirect("/profile/" + req.user.id);
    });

    // posts a new user's information to our database when they sign up through our site
    app.post("/api/users/",
        passport.authenticate("local-signup", 
        { failureRedirect: "/", 
        successRedirect: "/authSuccess" }
        )
    );

    app.post("/api/signin", function (req, res, next) {
        passport.authenticate("local-signin", function (err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect("/")
            }
            req.logIn(user, function (err) {
                if (err) { 
                    return next(err); 
                }
                return res.redirect("/profile/" + user.id);
            });
        })(req, res, next);
    });

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        res.redirect("/");
    }
};