




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

  const ddate = new Date();
  const c_year = ddate.getFullYear();
  const month = ddate.getMonth()
  const monthArray = [
    "january", "february", "march", "april",
    "may", "june", "july", "august",
    "september", "october", "november", "december"
  ];

  let c_month;

  // match numeric month to month name
  for (let i = 0; i < monthArray.length; i++) {
    if (i + 1 === month) { 
      c_month = monthArray[i - 1]; ///this will show a month less 1
      break;
    }
  }

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
      full_name: capitalized(fullname.trim()),
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



    const match = await bcrypt.compare(pword, krtlogin.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Login password incorrect, check and try again",
      });
    }

    res.status(200).json({
      success: true,
      message: `${krtlogin.full_name.split(" ")[1]
        ?? krtlogin.full_name.split(" ")[0]
        } Welcome to Morning Star Cooperative Society`,
      user: {
        id: krtlogin._id,
        full_name: krtlogin.full_name,
        oracle: krtlogin.oracle,
      },
    });
  });





  app.post('/api/msc_monthly_2025', async (req, res) => {
    const { lastMonth, thisMonth, yr, newOracle } = req.body;

    try {
      const checkOracle = await msc_monthly_2025.findOne({
        oracle: newOracle,
        month: lastMonth,
        yr: yr,
      });

      const checkOracle2 = await msc_monthly_2025.findOne({
        oracle: newOracle,
        month: thisMonth,
        yr: yr,
      });

      // If both are missing
      if (!checkOracle && !checkOracle2) {
        return res.status(404).json({
          success: false,
          message: `No records found for you. Please check back.`,
          acct: null,
          acct2: '0', // default for thisMonth
        });
      }

      // If current month only is missing
      if (!checkOracle2) {

        return res.status(200).json({
          success: true,
          message: 'Current month record not available. Returning previous month only.',
          acct: checkOracle
            ? {
              deduction: checkOracle.deduction ?? "0",
              savings: checkOracle.savings ?? "0",
              loan_balance: checkOracle.loan_balance ?? "0",
              retirement: checkOracle.retirement ?? "0",
              soft_loanBal: checkOracle.soft_loanBal ?? "0",
              interest_bal: checkOracle.interest_bal ?? "0",
              bank: checkOracle.bank ?? "0"
            }
            : null,
          acct2: '0',
        });
      }

      // If both exist
      return res.status(200).json({
        success: true,
        acct: checkOracle
          ? {
            deduction: checkOracle.deduction ?? "0",
            savings: checkOracle.savings ?? "0",
            loan_balance: checkOracle.loan_balance ?? "0",
            retirement: checkOracle.retirement ?? "0",
            soft_loanBal: checkOracle.soft_loanBal ?? "0",
            interest_bal: checkOracle.interest_bal ?? "0",
            bank: checkOracle.bank ?? "0",
          }
          : null,
        acct2: {
          deduction: checkOracle2.deduction ?? "0",
          savings: checkOracle2.savings ?? "0",
          loan_balance: checkOracle2.loan_balance ?? "0",
          retirement: checkOracle2.retirement ?? "0",
          soft_loanBal: checkOracle2.soft_loanBal ?? "0",
          interest_bal: checkOracle2.interest_bal ?? "0",
          bank: checkOracle2.bank ?? "0",
        },
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
    // const  dataquery= {
    //   oracle: oracle,
    //   month:month,
    //   yr:yr,
    // }
    // oracle 
    // month
    // year

    res.status(200).json({
      success: true, message: "Password is Successfully Changed"
    })

  })
  ////////////////////
  app.post('/api/monthly', async (req, res) => {
    const { year, month, kiporacle } = req.body;
    const showMonthly = await msc_monthly_2025.findOne({ oracle: kiporacle, month: month, yr: year });
    if (!year || !month || !kiporacle) {
      return res.status(404).json({ success: false, message: "Please Select Year and Click Month" })
    }

    if (!showMonthly) {
      return res.status(404).json({ success: false, message: "No record found for this month" })
    }

    // const showMonthly2 = await msc_monthly_2026.findOne({ oracle: kiporacle, month: month, yr: year });
    // const showMonthly3 = await msc_monthly_2027.findOne({ oracle: kiporacle, month: month, yr: year });

    res.status(200).json({
      success: true,
      message: `Records fetched Successfully for ${month} ${year}`,
      data: {
        savings: showMonthly.savings ?? '0',
        deduction: showMonthly.deduction ?? '0',
        bank: showMonthly.bank ?? '0',
        loan_balance: showMonthly.loan_balance ?? '0',
        retirement: showMonthly.retirement ?? '0',
        soft_loanBal: showMonthly.soft_loanBal ?? '0',
        interest_bal: showMonthly.interest_bal ?? '0',
      }
    })
  }
  )

  app.post('/api/uploadcsv', async (req, res) => {
    try {
      const { data, monthly, yearly } = req.body;

      // check if record exists
      const lookup = await msc_monthly_2025.findOne({ yr: yearly, month: monthly });
      if (lookup) {
        return res.status(400).json({
          success: false,
          message: `Records for ${lookup.yr} ${lookup.month} already exist`
        });
      } else {
        // bulk insert at once (not in a loop)

        await msc_monthly_2025.insertMany(data, { ordered: false });
        return res.status(200).json({
          success: true,
          message: `Records for ${yearly} ${monthly} uploaded successfully`
        });
      }

    }
    catch (error) {
      console.error("Error during CSV upload:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during CSV upload, please try again later."
      });
    }
  });
  /////

  ///////////
  app.post('/api/submitjoinus', async (req, res) => {
    const { name, oracle, phone, dob, amount, picture } = req.body
    if (!name || !oracle || !phone || !dob || !amount || !picture) {
      return res.status(400).json({ success: false, message: "Please fill in all fields" });
    }
    const joinus = await db.collection('joinus').insertOne({
      name: capitalized(name.trim()),
      oracle: oracle.trim(),
      phone: phone.trim(),
      dob: dob.trim(),
      amount: amount.trim(),
      picture: picture.trim(),
      status: 'pending',
      createdAt: new Date(),
    });
    res.json({
      success: true,
      message: `Thank you ${name?.split(' ')[0]}, Your request is being processed. We will get back to you soon.`,
      id: joinus.insertedId
    })
  });
  ////////
  app.post('/api/savingLoanBal', async (req, res) => {
    const { oracle } = req.body;
    // if(!oracle || oracle.length<5){
    //   return res.status(400).json({success:false,message:"Valid Oracle Number is required"})
    // }
    const findOracle = await msc_monthly_2025.findOne({ oracle: oracle, month: c_month, yr: c_year.toString() })
    if (!findOracle) {
      return res.status(404).json({ success: false, message: `record for ${c_month - 1}, ${c_year} found for this Oracle Number ` })
    }
    res.status(200).json({
      success: true,
      message: `Record fetched Successfully for Oracle Number ${oracle}`,
      data: {
        total_savings: findOracle.savings ?? '0',
        total_loan_balance: findOracle.loan_balance ?? '0',
        total_soft_loanBal: findOracle.soft_loanBal ?? '0',
        total_interest_bal: findOracle.interest_bal ?? '0',
      }
    })
  })

  app.listen(PORT, () => {
    console.log(`🚀 Server running at ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Server error:', err);
})


// startServer();



////////////////
////capitalize every word and trim()
function capitalized(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}