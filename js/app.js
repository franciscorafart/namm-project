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

  //Connect to firebase Before running app
  let database = firebase.database();


  function runApp(appUser){

    //references
    //TODO: modify reference from user ID
    let trackReference = database.ref("/Users/"+appUser.uid+"/Playlist/").orderByChild('vote');
    let messageReference = database.ref("/Users/"+appUser.uid+"/Messages/")
    let encoreReference = database.ref('/Users')

    //Define class Song class before using it
    var songClass = function () {
      function getSongs() {

        // retrieve songs data when .on() initially executes
        // and when its data updates
        trackReference.on('value', function(results){

          var $setListBoard = $('#setlist')
          var songArray = []

          //With forEach method instead of Leon's simple for loop the elements are ordered in the way speciied on the reference
          //specified in trackReference definition. Firebase never hands ordered data, you order it with forEach
          results.forEach(function(child){

            //Store the song name, votes and key of each object
            var songName = child.val().name
            var votes = child.val().vote //Has to be let, if var it's a mess with scope. var scopes to the neares function
            let songKey = child.key

            // create message element
            var $songListElement = $('<li></li>')

            // create delete element
            var $deleteElement = $('<i class="fa fa-trash pull-right delete"></i>')

            $deleteElement.on('click', function (e) {
              var id = $(e.target.parentNode).data('id')
              console.log("clicked");
              deleteSong(id)
            })
            //By adding the event listener directly to the specific li, you avoid event listener propagation.

            // create up vote element
            var $upVoteElement = $('<i class="fa fa-thumbs-up pull-right"></i>')

            $upVoteElement.on('click', function (e) {
              var id = $(e.target.parentNode).data('id')
              console.log("Id modified = "+id+"with "+votes)
              updateSongVote(id, ++votes)
            })

            // create down vote element
            var $downVoteElement = $('<i class="fa fa-thumbs-down pull-right"></i>')

            $downVoteElement.on('click', function (e) {
              var id = $(e.target.parentNode).data('id')
              console.log("Id modified = "+id+"with "+votes)
              updateSongVote(id, --votes)
            })

            // add id as data attribute so we can refer to later for updating
            $songListElement.attr('data-id', songKey)

            //Try out new
            $songListElement.attr('vote-count',votes);

            // add message to li
            $songListElement.html(songName)

            // add delete element
            $songListElement.append($deleteElement)

            // add voting elements
            $songListElement.append($upVoteElement)
            $songListElement.append($downVoteElement)

            // show votes
            $songListElement.append('<div class="pull-right">' + votes + '</div>')

            // push element to array of messages
            songArray.push($songListElement)

          });


          // remove lis to avoid dupes
          $setListBoard.empty()

          //Add new li in reversed order (higher scores at the top)
          for (var i in songArray) {
            var l = songArray.length;
            //Invert order of appending. Load the last first so they go to the bottom
            $setListBoard.append(songArray[l-i-1])
          }

        })
      }



      function updateSongVote(id, vot) {
        // find message whose objectId is equal to the id we're searching with

        let songReference = encoreReference.child("/"+appUser.uid+'/Playlist/'+id)

        // update votes property
        songReference.update({
          vote: vot
        })
      }

      function deleteSong(id) {
        // find message whose objectId is equal to the id we're searching with
        let songReference = encoreReference.child("/"+appUser.uid+'/Playlist/'+id)

        songReference.remove();

        $("li").attr("data-id",id).remove();

          songClass.getSongs();
      }

      //returns the class
      return {
        getSongs: getSongs
      }

    }(); //End of songClass

    let messageClass = function(){
      function getMessages(){
        let $messageUl = $('#fanMessages')
        let messageArr = []

        //capture data change from database
        messageReference.on('value', function (results){

          results.forEach((child)=>{

            let message = child.val().message

            //Append to ul
            let $messageListElement = $('<li>'+message+'</li>')
            messageArr.push($messageListElement)

          })

          //Erase previous one
          $messageUl.empty()

          messageArr.forEach((el)=>{
            $messageUl.append(el);
          })
            messageArr = []
        })


      }
      return{
        getMessages: getMessages
      }
    }()

    //Object to add songs to the database
    function Song(name){
      this.name = name,
      this.vote = 0
    }
    //Declare variable before assigning timer value
    var clock;

    // on initialization of app (when document is ready) get fan messages
    songClass.getSongs();
    messageClass.getMessages()

  // Event handlers
    $('#message-form').submit(function(event){
      event.preventDefault()
      var message = $('#message').val();

      console.log("Post message")

      $('#message').text('');

      //TODO: post to messages list
      postMessage(message)

    });

    //Search for artist
    $('#searchArtist').on('keyup',function(){
      let thisArtist = $('#searchArtist').val()
      encoreReference.once('value',function(result){
        let storeChild;

        result.forEach(function(child){
          let nameArtistTemp = child.val().profile.artist
          if(nameArtistTemp.toLowerCase()==thisArtist.toLowerCase()){
            //Display the search result in the html
            $("#artistSearched").text(thisArtist)

            //Whole object for user so we can reference it outside
            storeChild = child
          } else{
            //erase content of search in html
            $("#artistSearched").text("")
          }
        })

        if(storeChild != null){
          //Extract the
          console.log(storeChild.key)
          let allSongs = storeChild.val().Playlist

          for (let el in allSongs){
            console.log(allSongs[el].name)

            //Change track and messages reference to new user and add to the ul list
            trackReference = database.ref("/Users/"+storeChild.key+"/Playlist/").orderByChild('vote');
            messageReference = database.ref("/Users/"+storeChild.key+"/Messages/")

            songClass.getSongs()
            messageClass.getMessages()

          }
        }
      })
    })
    //Back end functions

    $('#deleteLame').on('click',function(){
      console.log("Delete lame");
      deleteLameTracks();
    });

    //Function to post messages
    function postMessage(m){
      let timeNow = Date.now()/1000
      console.log(timeNow)

      messageReference.push(
        {
          timestamp: timeNow,
          message: m
        }
    )

    }


    function deleteLameTracks(){

      var limit = 3;
      var keyArray = []; //This will store the ids of elements we are going to remove

      //Delete
      trackReference.once('value',function(results){

        //Define number of elements in the object
        var count =0;
        results.forEach(function(child,i){
          count++;
        });

        //Add lower score elements id's to an array
        var index = 0;
        results.forEach(function(child){
          //if the element is not contained in the last elements of the list (the ones we want to keep), then add their key to array
          if(index<(count-limit)){
            let id = child.key;
            keyArray.push(id);
          }
          index++;

        });

        //for loop that eliminates from database all elements with the keys in the array
        keyArray.forEach(function(el,i){
          let songToDeleteReference = encoreReference.child("/"+appUser.uid+'/Playlist/'+el)
          // var songToDeleteReference = new Firebase('https://encore-610ad.firebaseio.com/Playlist/' + el);
          songToDeleteReference.remove();
        });

      });
    }

    //Button to take time and date elements from DOM
    $("#getDateTime").on("click", function() {

      var dateLimit = $('.date').val();
      var timeLimit = $('.time').val();
      console.log(timeLimit)
      const dateTime = new Date(dateLimit+"T"+timeLimit).getTime();

      console.log(dateTime)

      var timestamp = Math.floor(dateTime / 1000);

      console.log(timestamp);

      //Start countdown with setInterval method. We pass an anonymous functions as a parameter that will be
      //comparing the time entered with the current time. It stops the setInterval when the time is reached

      clock = setInterval(function(){
        var dateNow = Date.now();
        var stampNow = Math.floor(dateNow / 1000);

        if (stampNow>=timestamp){
          console.log("Delete");
          deleteLameTracks();

         //cancel the timer
          clearInterval(clock);
          //Display message to users
          alert("The Audience has chosen the Playlist!");

        } else{
           console.log("Not Yet");
        }

      },1000);

    });

    //Signout button
    $('#sign-in').on('click',()=>{
      firebase.auth().signOut().then(function() {
    // Sign-out successful. Redirect to index.html will happen automatically, as the app is listening for changes.
      console.log("Logged out")

      }, function(error) {
      console.log(error)
      });
    })
  // } //Run app close

// );


}
