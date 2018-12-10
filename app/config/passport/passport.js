// requiring bcrypyt, which is used to hash passwords
const bCrypt = require('bcrypt');
// const keys = require('./keys');

// instantiating the passport functionality and passing the function 
// a user to process
module.exports = (passport, user) => {
    const User = user;
    const LocalStrategy = require('passport-local').Strategy;
    const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    const TwitterStrategy = require('passport-twitter').Strategy;

    const generateHash = (password) => {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
    };

    // passport needs to save a user ID which it uses 
    // to retrieve user details when needed
    passport.serializeUser( (user, done) => {
        done(null, user.id);
    });

    //deserializes the user's session 
    passport.deserializeUser( (id, done) => {
        User.findById(id).then( user => {
            if (user) {
                done(null, user.get());
            }
            else {
                done(user.errors, null);
            }
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'email', //defaults to email -- could potentially validate on either email or username
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the cb
        },
        (req, email, password, done) => {
            // function that generates a hash for the password before it goes into the db
            generateHash(password);
            // performs a search for the user
            User.findOne({
                where: {
                    email: email
                }
            }).then( user => {
                if (user) {
                    return done(null, false, {
                        message: 'Sorry, that email is already taken'
                    });
                } else {
                    let userPassword = generateHash(password);
                    // the data that will be used to create a new user in the DB
                    let data = {
                        username: req.body.username,
                        email: email,
                        password: userPassword,
                        gender: req.body.gender,
                        user_image: req.body.user_image
                    };
                    // a method that actually creates a new record in the DB for a new user
                    User.create(data).then( (newUser, created) => {
                        if (!newUser) {
                            return done(null, false);
                        }
                        if (newUser) {
                            return done(null, newUser);
                        }
                    });
                }
            });
        }
    ));

    passport.use('local-signin', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: false
        }, 
        (email, password, done) => {
            // production env password validator
            User.findOne({
                where: {
                    email: email
                }
            }).then( user => {
                bCrypt.compare(password, user.password).then(res => {
                    if (!user) {
                        return done(null, false, {
                            message: 'Incorrect email'
                        });
                    }
                    else if(res == true) {
                        const userinfo = user.get();
                        return done(null, userinfo);
                    }
                    else if(res == false) {
                        return done(null, false, {
                            message: 'Incorrect password'
                        });
                    }
                })
            })
        })
    );
}