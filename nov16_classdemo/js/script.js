let database;
let dbRef;
let color = {};

function setup() {
  createCanvas(500, 400);
  background(50);

  color.r = float(random(255).toFixed(2));
  color.g = float(random(255).toFixed(2));
  color.b = float(random(255).toFixed(2));

  setupDB();

  dbRef = getDBReference("users");
}

function draw() {
  //
}

function mouseDragged() {
  let data = {
    x: mouseX,
    y: mouseY,
    c: color
  }
  dbRef.push(data);
}

function keyPressed() {
  if (key == " ") {
    clearDB("users");
    background(50);
  }
}

function setupDB() {
  const firebaseConfig = {
    apiKey: "AIzaSyDt3vvgCZlnWR7NJnmOU9o1oZoCfLAvYcE",
    authDomain: "wp2ws-demo-b9a4c.firebaseapp.com",
    projectId: "wp2ws-demo-b9a4c",
    storageBucket: "wp2ws-demo-b9a4c.appspot.com",
    messagingSenderId: "55201975154",
    appId: "1:55201975154:web:e25ddf1f4bab9f0cc3abeb",
    measurementId: "G-15BELQ1TWE",
    databaseURL: "https://wp2ws-demo-b9a4c-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

  firebase.initializeApp(firebaseConfig);
  database = firebase.database();
}

function getDBReference(refName) {
  let ref = database.ref(refName);

  ref.on("child_added", function (data, childKey) {
    console.log("! DATA ADDED");
    console.log(data.key); //Generated ID
    console.log(data.val()); //data {x: 1, y: 3}
    // example
    let x = data.val().x;
    let y = data.val().y;
    let clr = data.val().c;
    fill(clr.r, clr.g, clr.b);
    circle(x, y, 10);
  });

  ref.on("child_removed", function (data) {
    console.log("! DATA REMOVED");
    console.log(data.key);
    console.log(data.val());
  });

  ref.on("child_changed", function (data, childKey) {
    console.log("! DATA CHANGED");
    console.log(data.key);
    console.log(data.val());
  });

  return ref;
}

function clearDB(refName) {
  let ref = database.ref(refName);
  ref
    .remove()
    .then(function () {
      console.log("! DB Cleared");
    })
    .catch(function (error) {
      console.log("! DB Clear-failed: " + error.message);
    });
}