
const signOutBtn = document.querySelector('.sign-out-btn');
const googleAuthBtn = document.querySelector('.google-auth-btn')
let emailAddress = '';
let client;

function handleAuthCodeResponse(response) {
    // Handle the response here (usually send the code to your backend)
    console.log('Authorization Code:', response.code);
    // Now send the code to your backend for token exchange
    // Send the authorization code to your backend
    fetch('/exchange-code', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: response.code }),
    })
    .then((res) => res.json())
    .then((data) => {
        console.log('Tokens from backend:', data);
    })
    .catch((error) => {
        console.error('Error exchanging code:', error);
    });
}

function initializeOAuthClient() {
    client = google.accounts.oauth2.initCodeClient({
        client_id: '1083036317446-kqccm8s0uslc70ebkkh75a130t2joi2d.apps.googleusercontent.com', // Replace with your client ID
        scope: 'email profile', // Scopes for your application
        ux_mode: 'popup', // 'popup' or 'redirect'
        callback: (response) => handleAuthCodeResponse(response),
        });
}



function onSignIn(responsePayload) {
    let cred = {id: responsePayload.sub, token: responsePayload.credential};

    // Store the credential using Google Identity Services
    google.accounts.id.storeCredential(cred);
    
    // Redirect to the welcome page
    window.location.href = '/welcome.html';

  }

window.handleCredentialResponse = (response) => {

        console.log("The response is >>>", response);
    // decodeJwtResponse() is a custom function defined by you
    // to decode the credential response.
    function decodeJWTResponse(){
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {

            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);

        }).join(''));

            return JSON.parse(jsonPayload);
    }

    const responsePayload = decodeJWTResponse(response.credential);

    console.log("ID: " + responsePayload.sub);
    console.log('Full Name: ' + responsePayload.name);
    console.log('Given Name: ' + responsePayload.given_name);
    console.log('Family Name: ' + responsePayload.family_name);
    console.log("Image URL: " + responsePayload.picture);
    console.log("Email: " + responsePayload.email);

    emailAddress = responsePayload.email;

    onSignIn(responsePayload);

}

const signOut = () => {
    console.log("Sign out button clicked");
    // If you want to completely revoke the token:
    google.accounts.id.revoke(emailAddress, () => {
        console.log("The email address>>>", emailAddress);
        console.log('User signed out.');
        // Clear your application's session or token storage.
    });
    // Reset the Google Sign-In button to prompt account selection
    google.accounts.id.prompt();
    // Redirect to Google's sign-out URL
    //const googleLogoutUrl = "https://accounts.google.com/Logout";
    window.location.href = '/signOut.html';
}

signOutBtn.addEventListener('click',signOut);
googleAuthBtn.addEventListener('click', () => {
    client.requestCode()
})