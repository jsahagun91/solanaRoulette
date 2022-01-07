const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const { Keypair } = require("@solana/web3.js");

const { getWalletBalance, transferSOL, airDropSol } = require ("./solana");
const { getReturnAmount, totalAmtToBePaid, randomNumber } = require('./helper');

const init = () => {
    console.log(
        chalk.green(
            figlet.textSync("SOL Stake", {
                font: "Standard",
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        )
    );
    console.log(chalk.yellow`the max bidding amount is 2.5 SOL here`);
};

// Ask for Ratio
// Ask for SOL to be staked 
// Check the amount to be available in Wallet
// Ask Public Key
// Generate a random number
// Ask for the generated number
// If true return the SOL as per ratio


// const userWallet = web3.Keypair.generate();

// const userPublicKey = [
//     168,  39,  58,  28, 111,  11,  34, 105,
//     102,  90,  28, 163, 213, 138, 119,  90,
//     130, 144, 134,  37, 189, 250,   1, 216,
//     178, 234,  30,  89, 216, 172, 109, 152
//   ]

const userSecretKey = [
    128, 186, 246,  24, 171,  46, 116, 222, 192, 100,  35,
     91, 182,  28, 122, 131, 108, 182, 205,  65,  44,  18,
     40,  38, 135,  98, 201, 231, 127, 102, 255, 151, 168,
     39,  58,  28, 111,  11,  34, 105, 102,  90,  28, 163,
    213, 138, 119,  90, 130, 144, 134,  37, 189, 250,   1,
    216, 178, 234,  30,  89, 216, 172, 109, 152
  ]  

const userWallet = Keypair.fromSecretKey(Uint8Array.from(userSecretKey));

// Treasury
const secretKey = [
    180, 159,  97, 183,  29, 134, 237, 127,  78, 171, 234,
     17, 250, 148,  62,  15, 251,  24, 149, 252,  72,  25,
    250,  50,  57,  42, 219, 236, 162, 229, 117, 237, 193,
     27, 174,  75, 103, 212, 249, 218,   1,  75,  80,   0,
    223,  95, 188,   9,  89,  88, 198,  50, 137, 200,  16,
     84, 196, 199, 176,  48,   7,  92,  93, 202
  ]
const treasuryWallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

const askQuestions = () => {
    const questions = [
        {
            name: "SOL",
            type: "number",
            message: "What is the amount of SOL you want to stake?",
        },
        {
            type: "rawlist",
            name: "RATIO",
            message: "What is the ratio of your staking?",
            choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
            filter: function(val) {
                const stakeFactor = val.split(":")[1];
                return stakeFactor;
            },
        },
        {
            type: "number",
            name: "RANDOM",
            message: "Guess a random number from 1 to 5 (both 1,5 included)",
            when: async (val) => {
                if(parseFloat(totalAmtToBePaid(val.SOL)) > 5 ) {
                    console.log(chalk.red `You have violated the max stake limit. Stake with smaller amount.`)
                    return false;
                } else {
                    console.log(chalk.green`You will get ${getReturnAmount(val.SOL, parseFloat(val.RATIO))} if you guess the number correctly`)
                    return true;
                }
            }
        },

    ];
    return inquirer.prompt(questions);
};

const gameExecution = async () => {
    init();
    const generateRandomNumber = randomNumber(1,5);
    // console.log("Generated number", generateRandomNumber);
    const answers = await askQuestions();
    if(answers.RANDOM) {
        const paymentSignature = await transferSOL(userWallet, treasuryWallet, totalAmtToBePaid(answers.SOL))
        console.log(`Signature of payment for playing the game`, chalk.green `${paymentSignature}`);
        if(answers.RANDOM === generateRandomNumber) {
            // Airdrop winning amount
            await airDropSol(treasuryWallet, getReturnAmount(answers.SOL, parseFloat(answers.RATIO)));
            // Guess is successful
            const prizeSignature = await transferSOL(treasuryWallet, userWallet, getReturnAmount(answers.SOL, parseFloat(answers.RATIO)))
            console.log(chalk.green `Your guess is absolutely correct`);
            console.log(`Here is the prize signature `, chalk.green `${prizeSignature}`);
        } else {
            // better luck next time!
            console.log(chalk.yellow.yellowBright `Better luck next time!`)
        }
    }
}


gameExecution()

