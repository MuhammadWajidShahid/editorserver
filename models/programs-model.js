var mongoose = require( 'mongoose' )

const programsSchema = mongoose.Schema({
     type: 
     {
         type:String,
        required:true
    }
     ,name: {
         type:String,
         require:true
        },
      program: {
          type:String
          ,require:true
        },
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref:'user',
        }
     })

module.exports = mongoose.model( 'programs', programsSchema );
