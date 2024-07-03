require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { default: mongoose, Schema } = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// connect to database
mongoose.connect(process.env.MONGO_URL);

// url schema
const urlSchema = new Schema({
  original_url: {type:String, unique: true},
  short_url: {type:Number, unique: true}
})

// create model
const Url = mongoose.model('Url',urlSchema);

// check valid url function
const isValidUrl = urlString=> {
  let url;
		try { 
	      	url = new URL(urlString); 
	    }
	    catch(e){ 
	      return false; 
	    }
	    return url.protocol === "http:" || url.protocol === "https:";
}

app.use(cors());
app.use(bodyParser.urlencoded());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Post function find a shorturl in database
app.post('/api/shorturl', async (req,res)=>{
  const input_url = req.body.url;
  // check is valid url or not
  if(!isValidUrl(input_url)){
    // is not valid
    res.json({ error: 'invalid url' });
  }else{
    // is valid url
    // search a url in database
    const url = await Url.findOne({original_url: input_url}).select('original_url short_url -_id');
    // count data in database
    const current_data = await Url.estimatedDocumentCount();
  
    if(!url){
      // not found insert new data
      const newurl = new Url({
        original_url: input_url,
        short_url: current_data + 1
      })
      await newurl.save();
    }
    // query new data
    const find_url = await Url.findOne({original_url: input_url}).select('original_url short_url -_id');

    res.json(find_url);
  }
})

// redirect with shorturl
app.get('/api/shorturl/:x',async (req,res)=>{
  // get x number
  const number = req.params.x

  // query url with x number
  const exits_url = await Url.findOne({short_url: number});
  res.redirect(exits_url.original_url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
