const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const formidable = require('formidable');
 

 

const app = express();

// Middleware

// app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// // Mongo URI //using MLabs
const url='mongodb+srv://sujith4488:sujith1234@@cluster0-b4qca.mongodb.net/Hostel';
const tempUrl='mongodb://localhost:27017/Hostel';

mongoose.connect(url,{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
  }));
app.use(passport.initialize());
app.use(passport.session());



const HostelSchema=new mongoose.Schema({
	blockName:String,
	roomNo:Number,
	roll:{
		type:String,
		unique:true
	},
	name:String,
	gender:String,
	guardian:String

});


const AttdSchema=new mongoose.Schema({
	date:{
		type:String,
		unique:true
	},
	present:[] 
});


const IssueSchema=new mongoose.Schema({
	roll:String,
	blockName:String,
	room:Number,
	issue:String
});

const Hostel=mongoose.model("Hostel",HostelSchema);

const Attd=mongoose.model("Attd",AttdSchema);

const Issue=mongoose.model("issue",IssueSchema);

const UserSchema = new mongoose.Schema({
	username:String,
	password:String
});

UserSchema.plugin(passportLocalMongoose);




const User = mongoose.model("User",UserSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
	done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
	  done(err, user);
	});
  });


//var roll="";

app.post("/id-card",function(req,res){
	Hostel.find({roll:req.user.username},function(err,user){
		if(err){
			console.log(err);
		} else{
			console.log(user);
			res.render("displayID",{id:user});
		}
	})
});

app.post("/addissue",function(req,res){

	//console.log(roll);
	Hostel.find({roll:req.user.username},function(err,data){

		if(err){
			console.log(err);
			res.render("result",{success:false,msg:"Server error please try after some time"});
		} else{

		const issue=new Issue({
			roll: data[0].roll,
			blockName:data[0].blockName,
			room:data[0].roomNo,
			issue:req.body.issue
		});		

		issue.save(function(err){
			if(err){
				res.render("result",{success:false,msg:"Coudnt file the issue"});
			} else{
				res.render("result",{success:true,msg:"Successfully submitted the issue"});
			}
		});


	  }
	});

});

app.get("/addissue",function(req,res){
	res.render("addissue");
});

app.get("/profile",function(req,res){
	User.findOne({username:req.user.username}, function(err,found){
		if(err){
		   
			res.redirect("/");
		} else{
			Hostel.find({roll:req.user.username},function(err,data){
				if(err){
					console.log(err);
				} else{
					console.log(data);
					res.render("profile",{data:data});
				}
			});
			
		}
});
});



app.get("/logout",function(req,res){
	req.logout();
    res.redirect("/");

});


app.post("/login",function(req,res){
	const user= new User({
        username: req.body.username,
        password: req.body.password
	});
	console.log(user);
	req.login(user, function(err){
		
        if(err){
        console.log(err);
        } else {
			passport.authenticate("local")(req,res,function(){
            res.redirect("/profile");
        });
        }
    });


});

app.post("/register",function(req,res){


	Hostel.countDocuments({roll:req.body.username},function(err,data){
		if(err){
			console.log(err);
		} else{
			if(data===0){
				res.render("register",{error:true,msg:"You Doesnt belong to this hostel"});
			} else{

					User.find({roll:req.body.username},function(err,info){
						if(err){
							console.log(err);
						} else{
							if(info.length===1){
								res.render("register",{error:true,msg:"You already registered"});
							} else{

										if(req.body.password1!=req.body.password2){
											res.render("register",{error:true,msg:"Passwords Doesnt match"});
										} else{
											console.log(req.body.username,req.body.password1);
										 	User.register({username: req.body.username},req.body.password1,function(err,user){
											if(err){
												console.log(err);
												res.redirect("/");
											} else {
												// //console.log("kkkkkkkk");
												// passport.authenticate("local")(req,res,function(err){
												// 	if(err){
												// 		console.log(err);
												// 	}
												// 	res.redirect("/login");
												// });
													res.redirect("/");
											}
										});
									 }
							}
						}
					});
			}
		}
	});



});

app.get("/register",function(req,res){
	res.render("register",{error:false});
});

app.get("/",function(req,res){

	roll="";
	res.render("login");
});


let port=process.env.PORT;
if(port==null || port==""){
  port=5000;
}

app.listen(port, () => console.log(`Server started on port ${port}`));