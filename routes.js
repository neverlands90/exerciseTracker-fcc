const mongoose = require('mongoose')


var exerciseSchema = new mongoose.Schema({
  userId: String, 
  description: String, 
  duration: String,
  date: Date
});
var Exercise = mongoose.model("Exercise", exerciseSchema);

var userSchema = new mongoose.Schema({
  username: String
});
var User = mongoose.model("User", userSchema);

module.exports = function (app) {

  //mongoose
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' , { useNewUrlParser: true });

  //routes
app.post('/api/exercise/new-user/', (req, res) => {
  let newUser = new User({ username:req.body.username });
  newUser.save()
  .then(user => res.json({
    username: user.username,
    _id: user.id
  }));
});

app.get('/api/exercise/users/', (req, res) => {
  User.find({}, (err, users) => {
    res.json(users);
  })
});
  
app.post('/api/exercise/add/', (req, res) => {
  User.findById(req.body.userId, (err, user) => {
    if (err) {
      res.send('id error');
      return;
    }
    let exercise = {
      username: user.username,
      _id: user.id, 
      description: req.body.description, 
      duration: req.body.duration,
      date: new Date((isNaN(Date.parse(req.body.date)) ? Date.now() : Date.parse(req.body.date)))
    }
    let newExercise= new Exercise({
      userId: user.id, 
      description: exercise.description, 
      duration: exercise.duration,
      date: Date.parse(exercise.date)
    });
    newExercise.save().then(() => res.json(exercise));
  })
});
  
app.get('/api/exercise/log/', (req, res) => {
  User.findById(req.query.userId, (err, user) => {
    if (err) return res.send(err);
    //limit
    let findOpt = {};
    if (req.query.limit) findOpt.limit = parseInt(req.query.limit);
    //from & to
    let findFL = (item) => {
      if (req.query.from) {
        let dateFrom = new Date(Date.parse(req.query.from));
        if (item.date < dateFrom) return false;
      }
      if (req.query.to) {
        let dateTo = new Date(Date.parse(req.query.to));
        if (item.date > dateTo) return false;
      }
      return true;
    }
    //log
    Exercise.find({userId: user.id},'description duration date', findOpt, (err, exercises) => {
      if (err) return res.send(err);
      let exercisesFL = exercises.filter(findFL);
      let logs = {
        _id: user.id,
        username: user.username,
        count: exercisesFL.length,
        log: exercisesFL
      }
      res.json(logs);
    })
  })
});

}