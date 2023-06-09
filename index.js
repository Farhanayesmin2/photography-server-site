const express = require("express");
const app = express();
const port = process.env.PORT || 5000;



// Set running data or not
app.get("/", (req, res) => {
  res.send("api running in port 5000");
});

// Thats the main port for run data
app.listen(port, () => {
  console.log("The port is runing on:", port);
});
