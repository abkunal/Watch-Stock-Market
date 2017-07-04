// Validate poll options
$("#newpoll").submit(function(event) {
  var options = $("#options").val().split(";");
  
  if (options.length < 2 || options[0] == "" || options[1] == "") {
    alert("You must specify two or more options");
    event.preventDefault();
  }
});