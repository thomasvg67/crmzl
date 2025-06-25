const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  uId: { type: String, unique: true }, // 6-digit unique user ID

  uname: { type: String, required: true, unique: true },  // username
  name: { type: String, required: true },                 // full name
  email: { type: String, required: true, unique: true },
  ph: { type: String },
  role: {
  type: String,
  enum: ['emplyT1', 'emplyT2', 'emplyT3', 'offAdm', 'adm'],
  default: 'emplyT1'
},
  pwd: { type: String, required: true },                  // hashed password
  avtr: { type: String},
  biodata: { type: String },
    job: { type: String }, // e.g., Web Developer
  dob: { type: Date }, // Date of birth
  loc: { type: String }, // e.g., New York, USA
  bio: { type: String },
    country: { type: String },
  address: { type: String },
  website: { type: String },

  socials: [{
  facebook: String ,
  twitter: String ,
  linkedin:  String ,
  instagram:  String ,
  github:  String 
}
  ],

  skills: [
  {
    name: String,
    level: Number // percentage (0–100)
  }
],

  education: [
  {
    college: String,
    startMonth: String,
    startYear: String,
    endMonth: String,
    endYear: String,
    description: String
  }
],
workExp: [
  {
    company: String,
    title: String,
    location: String,
    startMonth: String,
    startYear: String,
    endMonth: String,
    endYear: String,
    description: String
  }
],

  // Audit fields
  crtdOn: { type: Date, default: Date.now },
  crtdBy: { type: String },
  crtdIp: { type: String },
  updtOn: { type: Date },
  updtBy: { type: String },
  updtIp: { type: String },
  dltOn: { type: Date },
  dltBy: { type: String },
  dltIp: { type: String },
  dltSts: { type: String, default: '0' },
  sts: { type: String, default: '0' }  // active/inactive
});

module.exports = mongoose.model('User', userSchema);
