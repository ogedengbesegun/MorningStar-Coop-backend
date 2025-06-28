







import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGO_DB_URI);

// async function startServer() {
//   try {
await client.connect().then(() => {
  console.log('✅ Connected to MongoDB');

  const db = client.db(process.env.DB_MsCoop);
  const userslog = db.collection('userslog');
  // const msc_2024 = db.collection('msc_2024');
  // const msc_2025 = db.collection('msc_2025');
  // const msc_2026 = db.collection('msc_2026');
  // const msc_2027 = db.collection('msc_2027');
  // const msc_2028 = db.collection('msc_2028');
  // const msc_2029 = db.collection('msc_2029');
  // const msc_2030 = db.collection('msc_2030');
  //////////monthly deduction
  const msc_monthly_2025 = db.collection('msc_monthly_2025');
  const msc_monthly_2026 = db.collection('msc_monthly_2026');
  const msc_monthly_2027 = db.collection('msc_monthly_2027');




  /////////////////////////
  app.post('/api/signup', async (req, res) => {
    const { fullname, oracleNum, pword, cpword } = req.body;

    const aMember = await msc_monthly_2025.findOne({ oracle: oracleNum });


    if (fullname === '' || oracleNum === '' || pword === '') {
      return res.status(404).json({ success: false, message: 'Please fill in all fields' });
    }

    if (pword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least Min 6 and Max 15 characters long' })
    };

    if (pword !== cpword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match, Please check and try again' })
    };

    if (!aMember) {
      return res.status(404).json({ success: false, message: "Sorry, You are Not a Member of this Cooperative Society" })
    }


    const checkOracle = await userslog.findOne({ oracle: oracleNum });
    // const findfullname=await userslog.findOne({})
    if (checkOracle) {
      return res.status(400).json({ success: false, message: `A member with this Oracle Number already exist. Please check and try again` })
    }
    //////////
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pword, saltRounds);

    const signup = await userslog.insertOne({
      full_name: fullname,
      oracle: oracleNum,
      password: hashedPassword,
    });

    res.status(201).json({ success: true, message: `${fullname} with Oracle Num ${oracleNum} is Registered Successfully`, id: signup.insertedId });
  });





  ///////
  app.post("/api/login", async (req, res) => {
    const { oracle, pword } = req.body;

    if (!oracle || !pword) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all fields" });
    }

    const krtlogin = await userslog.findOne({ oracle });

    if (!krtlogin || !krtlogin.password) {
      return res
        .status(400)
        .json({ success: false, message: "Oracle Number Not Found" });
    }

    if (krtlogin && !krtlogin.password) {
      return res.status(400).json({ success: false, message: "Please, Create An Account" })
    }

    const match = await bcrypt.compare(pword, krtlogin.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Login password incorrect, check and try again",
      });
    }

    res.status(200).json({
      success: true,
      message: `${krtlogin.full_name.split(" ")[1]} Welcome to Morning Star Cooperative Society`,
      user: {
        id: krtlogin._id,
        full_name: krtlogin.full_name,
        oracle: krtlogin.oracle,
      },
    });
  });



  ///////////////
  app.post('/api/msc_monthly_2025', async (req, res) => {
    const { lastMonth, thisMonth, newOracle } = req.body;

    try {
      const checkOracle = await msc_monthly_2025.findOne({
        oracle: newOracle,
        month: lastMonth,
      });

      const checkOracle2 = await msc_monthly_2025.findOne({
        oracle: newOracle,
        month: thisMonth,
      });

      if (!checkOracle && !checkOracle2) {
        return res.status(400).json({
          success: false,
          message: `No records found for you. Please check back.`,
        });
      }

      return res.status(200).json({
        success: true,
        acct: checkOracle
          ? {
            deduction: checkOracle.deduction,
            savings: checkOracle.savings,
            loan_balance: checkOracle.loan_balance,
            retirement: checkOracle.retirement,
          }
          : null,
        acct2: checkOracle2
          ? {
            deduction: checkOracle2.deduction,
            savings: checkOracle2.savings,
            loan_balance: checkOracle2.loan_balance,
            retirement: checkOracle2.retirement,
          }
          : null,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error, please try again later.",
      });
    }
  });


  ////////
  app.post('/api/change', async (req, res) => {

    const { oraclededuct, pwordn, lastMonth } = req.body;

    // if ( pwordn.length < 6) {
    //   return res.status(400).json({ success: false, message: "Password Must be Min 6 and Max 15 Characters" })
    // }

    if (oraclededuct === "" || pwordn === "" || pwordn.length < 6) {
      return res.status(404).json({
        success: false, message: `Please Enter all required fields Note: Password Must be Min 6 and Max 15 Characters`
      })
    }

    ///look fot oraclededuct

    const findoraclededuct = await msc_monthly_2025.findOne({
      oracle: oraclededuct.split(',')[0],
      month: lastMonth, deduction: oraclededuct.split(',')[1]
    })
    if (!findoraclededuct) {
      return res.status(404).json({ success: false, message: "Please, Check your input and try again" })
    };

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pwordn, saltRounds);


    const updatepword =
      await userslog.updateOne({ oracle: oraclededuct.split(',')[0] },
        { $set: { password: hashedPassword } });

    if (updatepword.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "User password not updated",
      })

    };

    res.status(200).json({
      success: true, message: "Password is Successfully Changed"
    })

  })



  app.listen(PORT, () => {
    console.log(`🚀 Server running at ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Server error:', err);
})


// startServer();
