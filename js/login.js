/* =========================================================
   CAMPUS MARKETPLACE
   LOGIN / SIGN UP

   Accounts are checked by the server (see ../auth.js and
   ../api). Only registered students can log in.
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

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const signupName =
    document.getElementById("signupName");

const signupEmail =
    document.getElementById("signupEmail");

const signupStudentId =
    document.getElementById("signupStudentId");

const signupPassword =
    document.getElementById("signupPassword");

const signupConfirmPassword =
    document.getElementById("signupConfirmPassword");

const signupTerms =
    document.getElementById("signupTerms");

const forgotPassword =
    document.getElementById("forgotPassword");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");


/* Messages for pages that sent the visitor here (?reason=…). */
const LOGIN_REASONS = {
    favorites: "Log in to save your favorites.",
    cart: "Log in to use your cart.",
    post: "Log in to post an item.",
    profile: "Log in to view your profile.",
    messages: "Log in to message sellers.",
    signedout: "You have been signed out."
};


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message, duration = 2500) {

    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, duration);

}


/* =========================================================
   FORM HELPERS
========================================================= */

function setBusy(form, busy, label) {

    const button =
        form.querySelector(".primary-button");

    if (!button.dataset.label) {
        button.dataset.label = button.textContent.trim();
    }

    button.disabled = busy;

    button.textContent = busy ? label : button.dataset.label;

}


function markInvalid(input) {

    const group =
        input.closest(".input-group, .terms-agree");

    group.classList.add("invalid");

    input.setAttribute("aria-invalid", "true");

    input.focus();

}


/* Show the server's message and highlight the field it names. */
function showError(error, fields) {

    showToast(error.message, 4000);

    if (fields[error.field]) {
        markInvalid(fields[error.field]);
    }

}


document
    .querySelectorAll(".auth-form input")
    .forEach(input => {

        input.addEventListener(
            "input",
            () => {

                input.closest(".input-group, .terms-agree").classList.remove("invalid");

                input.removeAttribute("aria-invalid");

            }
        );

    });


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

    signupTab.classList.add("active");

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

        const show =
            loginPassword.type === "password";

        loginPassword.type = show ? "text" : "password";

        passwordToggle.setAttribute(
            "aria-label",
            show ? "Hide password" : "Show password"
        );

    }
);


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const identifier =
            loginEmail.value.trim();

        const password =
            loginPassword.value;


        if (!identifier || !password) {

            showToast(
                "Please enter your login details."
            );

            return;

        }


        setBusy(loginForm, true, "Logging in…");


        try {

            const data =
                await CampusAuth.login(identifier, password);

            showToast(
                data.message || "Login successful!"
            );

            setTimeout(() => {

                window.location.href =
                    CampusAuth.nextUrl();

            }, 800);

        } catch (error) {

            setBusy(loginForm, false);

            showError(error, {
                identifier: loginEmail,
                password: loginPassword
            });


            /* No account yet: carry what they typed over to Sign Up. */
            if (error.code === "no_account") {

                if (identifier.includes("@")) {
                    signupEmail.value = identifier;
                } else {
                    signupStudentId.value = identifier;
                }

            }

        }

    }
);


/* =========================================================
   SIGN UP
========================================================= */

signupForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            signupName.value.trim();

        const email =
            signupEmail.value.trim();

        const studentId =
            signupStudentId.value.trim();

        const password =
            signupPassword.value;

        const confirmPassword =
            signupConfirmPassword.value;


        if (
            !name ||
            !email ||
            !studentId ||
            !password ||
            !confirmPassword
        ) {

            showToast(
                "Please complete all fields."
            );

            return;

        }


        if (
            password.length < 8 ||
            !/[A-Za-z]/.test(password) ||
            !/\d/.test(password)
        ) {

            showToast(
                "Password must be at least 8 characters and include a letter and a number.",
                4000
            );

            markInvalid(signupPassword);

            return;

        }


        if (
            password !== confirmPassword
        ) {

            showToast(
                "Passwords do not match."
            );

            markInvalid(signupConfirmPassword);

            return;

        }


        if (!signupTerms.checked) {

            showToast(
                "Please agree to the Terms and Conditions to create an account.",
                4000
            );

            markInvalid(signupTerms);

            return;

        }


        setBusy(signupForm, true, "Creating account…");


        try {

            const data =
                await CampusAuth.register({
                    name,
                    email,
                    studentId,
                    password,
                    confirmPassword,
                    acceptTerms: true
                });

            showToast(
                data.message || "Account created successfully!"
            );

            setTimeout(() => {

                window.location.href =
                    CampusAuth.nextUrl();

            }, 900);

        } catch (error) {

            setBusy(signupForm, false);

            showError(error, {
                name: signupName,
                email: signupEmail,
                studentId: signupStudentId,
                password: signupPassword,
                confirmPassword: signupConfirmPassword,
                acceptTerms: signupTerms
            });

        }

    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPassword.addEventListener(
    "click",
    () => {

        if (!loginEmail.value.trim()) {

            showToast(
                "Enter your email or Student ID first."
            );

            loginEmail.focus();

            return;

        }


        showToast(
            "Password reset by email isn't set up yet.",
            3500
        );

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

const loginParams =
    new URLSearchParams(window.location.search);


if (
    loginParams.get("tab") === "signup" ||
    window.location.hash === "#signup"
) {

    showSignup();

} else {

    showLogin();

}


if (LOGIN_REASONS[loginParams.get("reason")]) {

    showToast(
        LOGIN_REASONS[loginParams.get("reason")]
    );

}
