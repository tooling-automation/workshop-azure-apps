const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/funfact', (req, res) => {
  res.json({
    funfact: "Did you know that the first car was invented in 1885?",
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('App listening on port ' + port);
});
