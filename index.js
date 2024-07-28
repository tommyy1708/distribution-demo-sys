const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Express on Vercel'));



app.listen(PORT, () => console.log(`Server ready on port ${PORT}.`));


module.exports = app;
