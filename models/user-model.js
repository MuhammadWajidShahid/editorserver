var mongoose = require( 'mongoose' )

const userSchema = mongoose.Schema({
     firstname: 
     {
         type:String,
        required:true
    }
     ,lastname: String
     ,email: {
         type:String,
         require:true
        },
      password: {
          type:String
          ,require:true
        }
     })

module.exports = mongoose.model( 'user', userSchema );
