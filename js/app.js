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

  //global user id variable
  let globalId;


  function runApp(appUser){

    globalId = appUser.uid
    console.log(globalId)
    //references
    //TODO: modify reference from user ID
    let trackReference = database.ref("/Users/"+globalId+"/Playlist/").orderByChild('vote');
    let messageReference = database.ref("/Users/"+globalId+"/Messages/")

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
            // var $deleteElement = $('<i class="fa fa-trash pull-right delete"></i>')
            //
            // $deleteElement.on('click', function (e) {
            //   var id = $(e.target.parentNode).data('id')
            //   console.log("clicked");
            //   deleteSong(id)
            // })
            //By adding the event listener directly to the specific li, you avoid event listener propagation.

            var $songTitleElement = $('<span>'+songName+'</span>')

            $songTitleElement.on('click', (e)=>{
              console.log(e.target.innerHTML)
              $('#whichSong').text(e.target.innerHTML)

              //add value change listener that will update every time
              // displayTempo(songKey)
              //Display votes
              let tempoReference = database.ref("/Users/"+globalId+"/Playlist/"+songKey+"/tempo")


              $tempoUl = $("#tempoUl")


              //Every time tempo changes in database
              tempoReference.on("value",()=>{

                //populate ul
                tempoReference.once('value',(e)=>{

                  //empty ul every time a value changes
                  $tempoUl.empty()

                  let $tempoli1 = "<li><span class='tempo'>Fast</span><span class='tempoSpan'>"+e.val().fast+"</span></li>"
                  let $tempoli2 = "<li><span class='tempo'>Slow</span><span class='tempoSpan'>"+e.val().slow+"</span></li>"
                  let $tempoli3 = "<li><span class='tempo'>Really Fast</span><span class='tempoSpan'>"+e.val().reallyFast+"</span></li>"
                  let $tempoli4 = "<li><span class='tempo'>Really slow</span><span class='tempoSpan'>"+e.val().reallySlow+"</span></li>"
                  let $tempoli5 = "<li><span class='tempo'>Medium</span><span class='tempoSpan'>"+e.val().medium+"</span></li>"

                  $tempoUl.append($tempoli1)
                  $tempoUl.append($tempoli2)
                  $tempoUl.append($tempoli3)
                  $tempoUl.append($tempoli4)
                  $tempoUl.append($tempoli5)
                })
                  //add ids to tempo elements so that they can reference to the database
                  let $tempo = $('.tempo')

                  $tempo.attr('data-id', songKey)

                  //TODO: Fix hover for tempo
                  $tempo.hover((el)=>{
                    el.target.toggleClass('hover')
                  })
                  //add listener to .tempo spans
                  $tempo.on('click',(e)=>{
                    e.preventDefault()
                    e.stopPropagation()
                    console.log(e.target.innerHTML)

                    let id = $(e.target).data('id')
                    console.log(id)
                    //Look for song in database and update tempo
                    let tempoReference = encoreReference.child("/"+globalId+'/Playlist/'+id+"/tempo")

                    //temporal tempo variables
                    let fast
                    let slow
                    let reallyFast
                    let reallySlow
                    let medium
                    let totalVotes


                    //extract current values from tempo node in database
                    tempoReference.once('value',(e)=>{
                      fast = e.val().fast
                      slow = e.val().slow
                      reallyFast = e.val().reallyFast
                      reallySlow = e.val().reallySlow
                      medium = e.val().medium
                      totalVotes = e.val().totalVotes
                    })

                    //calculations
                    switch(e.target.innerHTML){
                      case "Fast":
                        fast += 1; break;
                      case "Slow":
                        slow +=1; break;
                      case "Really Fast":
                        reallyFast += 1; break;
                      case "Really slow":
                      reallySlow += 1; break;
                      case "Medium":
                      medium +=1; break;
                      default: console.log("Switch error")
                    }
                    totalVotes += 1

                    //TODO: Display which one is winning
                    let winner = [fast,slow,reallyFast,reallySlow,medium]
                    let largest = winner.reduce((e,n)=>{
                      if (e>n){
                        return e
                      } else{
                        return n
                      }
                    })
                    console.log("Largest  = "+winner.indexOf(largest))
                    // update votes property
                    tempoReference.update({
                      fast: fast,
                      slow: slow,
                      reallyFast: reallyFast,
                      reallySlow: reallySlow,
                      medium: medium,
                      totalVotes: totalVotes
                    })

                  })
              })


            })

            //hover to element
            $songTitleElement.hover(()=>{
              $songTitleElement.toggleClass('hover')
            })
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
            $songListElement.html($songTitleElement)

            // add delete element
            // $songListElement.append($deleteElement)

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

        let songReference = encoreReference.child("/"+globalId+'/Playlist/'+id)

        // update votes property
        songReference.update({
          vote: vot
        })
      }

      // function deleteSong(id) {
      //   // find message whose objectId is equal to the id we're searching with
      //   let songReference = encoreReference.child("/"+appUser.uid+'/Playlist/'+id)
      //
      //   songReference.remove();
      //
      //   $("li").attr("data-id",id).remove();
      //
      //     songClass.getSongs();
      // }

      function displayTempo(k){
        // //Display votes
        // let tempoReference = database.ref("/Users/"+globalId+"/Playlist/"+k+"/tempo")
        // $tempoUl = $("#tempoUl")
        // $tempoUl.empty()
        //
        // tempoReference.once('value',(e)=>{
        //   let $tempoli1 = "<li><span class='tempo'>Fast</span><span class='tempoSpan'>"+e.val().fast+"</span></li>"
        //   let $tempoli2 = "<li><span class='tempo'>Slow</span><span class='tempoSpan'>"+e.val().slow+"</span></li>"
        //   let $tempoli3 = "<li><span class='tempo'>Really Fast</span><span class='tempoSpan'>"+e.val().reallyFast+"</span></li>"
        //   let $tempoli4 = "<li><span class='tempo'>Really slow</span><span class='tempoSpan'>"+e.val().reallySlow+"</span></li>"
        //   let $tempoli5 = "<li><span class='tempo'>Medium</span><span class='tempoSpan'>"+e.val().medium+"</span></li>"
        //
        //   $tempoUl.append($tempoli1)
        //   $tempoUl.append($tempoli2)
        //   $tempoUl.append($tempoli3)
        //   $tempoUl.append($tempoli4)
        //   $tempoUl.append($tempoli5)
        // })
        //   //add ids to tempo elements so that they can reference to the database
        //   $('.tempo').attr('data-id', k)
      }

      //returns the class
      return {
        getSongs: getSongs
      }

    }(); //End of songClass

    let messageClass = function(){
      function getMessages(){
        let $messageUl = $('#fanMessages')
        let messageArr = ['<li class="clearfix titleRow"><span>Message</span><span class="whoPost">Fan</span></li>']

        //capture data change from database
        messageReference.on('value', function (results){

          results.forEach((child)=>{

            let message = child.val().message
            let user = child.val().user

            //Append to ul
            let $messageListElement = $('<li class="clearfix"><span>'+message+'</span><span class="whoPost">'+user+'</span></li>')
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
      postMessage(message,appUser.displayName)

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

            //Change track and messages gobal reference to new user and add to the ul list
            // trackReference = database.ref("/Users/"+storeChild.key+"/Playlist/").orderByChild('vote');
            trackReference = database.ref("/Users/"+storeChild.key+"/Playlist/")
            messageReference = database.ref("/Users/"+storeChild.key+"/Messages/")

            //reassign value of user being queried for other references
            globalId = storeChild.key

            songClass.getSongs()
            messageClass.getMessages()

          }
        }
      })
    })
    //Back end functions
    //
    // $('#deleteLame').on('click',function(){
    //   console.log("Delete lame");
    //   deleteLameTracks();
    // });

    //Function to post messages
    function postMessage(m,userName){
      let timeNow = Date.now()/1000
      console.log(timeNow)

      messageReference.push(
        {
          timestamp: timeNow,
          user: userName,
          message: m
        }
    )

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
