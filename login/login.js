/* =========================================================
   CAMPUS MARKETPLACE
   LOGIN / SIGN UP
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const loginForm =
    document.getElementById("loginForm");

const signupForm =
    document.getElementById("signupForm");

const backButton =
    document.getElementById("backButton");

const passwordToggle =
    document.getElementById("passwordToggle");

const loginPassword =
    document.getElementById("loginPassword");

const forgotPassword =
    document.getElementById("forgotPassword");

const googleButton =
    document.getElementById("googleButton");

const facebookButton =
    document.getElementById("facebookButton");

const schoolButton =
    document.getElementById("schoolButton");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =========================================================
   TAB SWITCHING
========================================================= */

function showLogin() {

    loginTab.classList.add("active");

    signupTab.classList.remove("active");

    loginForm.classList.add("active");

    signupForm.classList.remove("active");

}


function showSignup() {

    signupTab.classList.remove("active");

    loginTab.classList.remove("active");

    signupForm.classList.add("active");

    loginForm.classList.remove("active");

}


loginTab.addEventListener(
    "click",
    showLogin
);


signupTab.addEventListener(
    "click",
    showSignup
);


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

passwordToggle.addEventListener(
    "click",
    () => {

        if (
            loginPassword.type === "password"
        ) {

            loginPassword.type = "text";

        } else {

            loginPassword.type = "password";

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!email || !password) {

            showToast(
                "Please enter your login details."
            );

            return;

        }


        /*
         * Prototype authentication
         *
         * This is NOT a real backend.
         *
         * It simply stores the login state
         * so the pages can communicate.
         */

        localStorage.setItem(
            "campusMarketplaceLoggedIn",
            "true"
        );


        localStorage.setItem(
            "campusMarketplaceUser",
            email
        );


        showToast(
            "Login successful!"
        );


        setTimeout(() => {

            window.location.href =
                "../index.html";

        }, 800);

    }
);


/* =========================================================
   SIGN UP
========================================================= */

signupForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const name =
            document
                .getElementById("signupName")
                .value
                .trim();


        const email =
            document
                .getElementById("signupEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("signupPassword")
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "signupConfirmPassword"
                )
                .value;


        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            showToast(
                "Please complete all fields."
            );

            return;

        }


        if (
            password.length < 6
        ) {

            showToast(
                "Password must be at least 6 characters."
            );

            return;

        }


        if (
            password !== confirmPassword
        ) {

            showToast(
                "Passwords do not match."
            );

            return;

        }


        /*
         * Prototype account creation
         */

        localStorage.setItem(
            "campusMarketplaceLoggedIn",
            "true"
        );


        localStorage.setItem(
            "campusMarketplaceUser",
            email
        );


        localStorage.setItem(
            "campusMarketplaceName",
            name
        );


        showToast(
            "Account created successfully!"
        );


        setTimeout(() => {

            window.location.href =
                "../index.html";

        }, 800);

    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPassword.addEventListener(
    "click",
    () => {

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        if (!email) {

            showToast(
                "Enter your email or Student ID first."
            );

            document
                .getElementById("loginEmail")
                .focus();

            return;

        }


        showToast(
            "Password reset link would be sent here."
        );

    }
);


/* =========================================================
   GOOGLE
========================================================= */

googleButton.addEventListener(
    "click",
    () => {

        /*
         * Prototype only.
         *
         * Later this will use Google OAuth.
         */

        localStorage.setItem(
            "campusMarketplaceLoggedIn",
            "true"
        );


        showToast(
            "Google login selected."
        );


        setTimeout(() => {

            window.location.href =
                "../index.html";

        }, 800);

    }
);


/* =========================================================
   FACEBOOK
========================================================= */

facebookButton.addEventListener(
    "click",
    () => {

        localStorage.setItem(
            "campusMarketplaceLoggedIn",
            "true"
        );


        showToast(
            "Facebook login selected."
        );


        setTimeout(() => {

            window.location.href =
                "../index.html";

        }, 800);

    }
);


/* =========================================================
   SCHOOL ACCOUNT
========================================================= */

schoolButton.addEventListener(
    "click",
    () => {

        localStorage.setItem(
            "campusMarketplaceLoggedIn",
            "true"
        );


        showToast(
            "School account login selected."
        );


        setTimeout(() => {

            window.location.href =
                "../index.html";

        }, 800);

    }
);


/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        if (
            document.referrer &&
            document.referrer.includes(
                window.location.hostname
            )
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../index.html";

        }

    }
);


/* =========================================================
   INITIAL STATE
========================================================= */

showLogin();