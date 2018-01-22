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
  var encoreReference = database.ref('/Users')

  //Object to add songs to the database
  function Song(name){
    this.name = name,
    this.vote = 0,
    this.tempo = {
      slow: 0,
      fast: 0,
      reallyFast: 0,
      reallySlow: 0,
      medium: 0,
      totalVotes: 0
    }
  }
  //Create a song
  $('#setList-form').submit(function (event) {
    // by default a form submit reloads the DOM which will subsequently reload all our JS
    // to avoid this we preventDefault()
    event.preventDefault()

    // grab user message input
    var songName = $('#setListElement').val()

    // clear message input (for UX purposes)
    $('#setListElement').val('')

    // create a section for messages data in your db
    //TODO: Insert users id to create reference
    var songReference = encoreReference.child("/"+appUser.uid+'/Playlist');
    var thisSong = new Song(songName);
    // use the set method to save data to the messages
    songReference.push(thisSong);

  })

  $('#deleteLame').on('click',function(){
    console.log("Delete lame");
    deleteLameTracks();
  });
  //TODO: Form to allow user to set up their artist name

  //Signout button
  $('#sign-in').on('click',()=>{
    firebase.auth().signOut().then(function() {
  // Sign-out successful. Redirect to index.html will happen automatically, as the app is listening for changes.
    console.log("Logged out")

    }, function(error) {
    console.log(error)
    });
  })

  $('#editArtist').on('click',()=>{
    let newName = $('#artistName').val()
    let genre = $('#musicGenre').val()
    let artistReference = encoreReference.child("/"+appUser.uid+'/profile');

    let profileObject = {
      artist: newName,
      genre: genre
    }
    //Update unique artist profile for user
    artistReference.set(profileObject)
  })


}
