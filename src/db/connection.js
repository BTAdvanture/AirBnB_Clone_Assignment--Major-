const mongoose = require('mongoose');
mongoose.connect(process.env.SECRET_KEY,{
   useNewUrlParser: true,
   useUnifiedTopology: true
});
module.exports = mongoose;

