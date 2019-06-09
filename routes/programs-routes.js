const express = require('express');
const programsRoute = express.Router();
const programsModel = require("../models/programs-model");
programsRoute.post('/new',(req,res)=>{
   var program=new programsModel(req.body);
   program.save((err,program)=>{
       if(err)
       {
           res.json({success:false});
       }
       else{
           res.json({success:true});
       }
   })
})


programsRoute.post('/all',(req,res)=>{
    programsModel.find({user:req.body.user},(err,programs)=>{
        if(!err&&programs)
        res.json({success:true,programs:programs})
        else
        res.json({success:false});
    })
})
// programsRoute.delete('/delete_all',(req,res)=>{
//     controller.deleteAll(req,(err,result)=>{
//         if(err)
//         {
//             res.json({err:err});
//         }
//         else{
//             if(result.n>0){
//                 res.json({result:"All the bills have been deleted"})
//             }else{
//                 res.json({result:"There were no bills"});
//             }
//         }
//     })
    
    
// })


programsRoute.delete('/delete',(req,res)=>{
   programsModel.findByIdAndDelete({_id:req.body._id},(err,program)=>{
       if(err)
       res.json({success:false})
       else
       res.json({success:true})
   })
})


programsRoute.put('/update',(req,res)=>{
   programsModel.findByIdAndUpdate({_id:req.body._id},req.body,(err,program)=>{
       if(!err&&program)
       res.json({success:true})
       else
       res.json({success:false})
   })
})





module.exports = programsRoute;