//listener for authentication change. If user is logged in, run the app if not redirect to index.html
firebase.auth().onAuthStateChanged((user)=>{
    if (user) {
      // User is signed in.
      let displayName = user.displayName;
      let email = user.email;
      let emailVerified = user.emailVerified;
      let photoURL = user.photoURL;
      let uid = user.uid;
      let phoneNumber = user.phoneNumber;
      let providerData = user.providerData;
      user.getIdToken().then((accessToken)=> {
        document.getElementById('sign-in-status').textContent = 'Signed in';
        document.getElementById('sign-in').textContent = 'Sign out';
        document.getElementById('account-details').textContent = JSON.stringify({
          displayName: displayName,
          email: email,
          emailVerified: emailVerified,
          phoneNumber: phoneNumber,
          photoURL: photoURL,
          uid: uid,
          accessToken: accessToken,
          providerData: providerData
        }, null, '  ');
      });

      console.log("User "+displayName+" logged in");

      //run app if user is logged in
      runApp(user)

    } else {
      //redirect to login
      window.location.replace("login.html")
      // User is signed out.
      document.getElementById('sign-in-status').textContent = 'Signed out';
      document.getElementById('sign-in').textContent = 'Sign in';
      document.getElementById('account-details').textContent = 'null';
    }
  }, (error)=>{
    console.log(error);
  })

function runApp(appUser){

  //New way of calling firebase.
  var database = firebase.database();
  var contactReference = database.ref('/Contacts')

  //Object to add songs to the database
  function Song(name){
    this.name = name,
    this.vote = 0
  }
  //Create a song
  $('#contactForm').submit(function (event) {
    // by default a form submit reloads the DOM which will subsequently reload all our JS
    // to avoid this we preventDefault()
    event.preventDefault()
    // grab contact information
    let first = $('#firstName').val()
    let last = $('#lastName').val()
    let email = $('#email').val()
    let country = $('#country').val()
    // clear input (for UX purposes)
    $('#firstName').text("")
    $('#lastName').text("")
    $('#email').text("")
    $('#country').text("")
    //push to database
    contactReference.push(
      {
        firstName: first,
        lastName: last,
        email: email,
        country: country
      }
    )

  })

  //Signout button
  $('#sign-in').on('click',()=>{
    firebase.auth().signOut().then(function() {
  // Sign-out successful. Redirect to index.html will happen automatically, as the app is listening for changes.
    console.log("Logged out")

    }, function(error) {
    console.log(error)
    });
  })
}
