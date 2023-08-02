import React, { useState, useEffect } from 'react';
import Header from './Header';
import certImage from './foundrylogo.PNG';
import './App.css'
import { Web3Storage } from 'web3.storage';
import Web3 from 'web3'; // Import web3 library
import { MyTokenABI } from './MyTokenABI'; // ABI
import { PDFDocument, StandardFonts } from 'pdf-lib';

const fontSize = 20;
const customerArray = [
  {
    name : "Kirsty Gallegos",
    cert : ["RIT Bachelor's in Computer Engineering", "RIT Master's in Computer Engineering"],
    addr : "0xd2e0b2B169dA724B5FBE871Cb9a620e2Ad4f3FdB"
  },
  {
    name : "Miranda Salazar",
    cert : ["RIT Bachelor's in Computer Science", "RIT Master's in Computer Science"],
    addr : "0x0Bc4681A4AA63D48CBaf023390Bf29b0913cd693"
  },
  {
    name : "Fahad Mora",
    cert : ["RIT Bachelor's in Cyber Security"],
    addr : "0xec8D531aCb10b257da230A0c5B31Dd433aA43cC6"
  },
  {
    name : "Evie Fitzpatrick",
    cert : ["RIT Bachelor's in Electrical Engineering", "RIT Master's in Electrical Engineering"],
    addr : "0x1D504096f8d25821E9e52d894b6fdefCAB63EA95"
  },
  {
    name : "Dewi Obrien",
    cert : ["RIT Bachelor's in Mechanical Engineering", "RIT Master's in Mechanical Engineering"],
    addr : "0xFFcf980D81B285B8013B5A6629b20192B64F02Ff"
  }
]
var selectedCustomer;


// main function starts
const FileUploader = () => {

  const [cid, setCID] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState('');

  // uploadFileToWeb3Storage
  // PDF Creation & Uploading to web3.storage
  const uploadFileToWeb3Storage = async () => {
    try {

      //PDF Creation 
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([1000, 500]);
      const imageFetch = await fetch("https://i.imgur.com/UsXM1ph.png");  // foundry logo on imgur

      const imageData = await imageFetch.arrayBuffer();
      const image = await pdfDoc.embedPng(imageData);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      var {width, height} = image.size();
      var centerX = (page.getWidth() - width) / 2;
      page.drawImage(image, {
        x: centerX,
        y: 400
      });

      width = font.widthOfTextAtSize("Certificate of Completion", fontSize);
      centerX = (page.getWidth() - width) / 2;
      page.drawText("Certificate of Completion", {
        x: centerX,
        y: 330,
        size: fontSize,
        font
      });

      width = font.widthOfTextAtSize(selectedCustomer.toString(), fontSize);
      centerX = (page.getWidth() - width) / 2;
      page.drawText(selectedCustomer.toString(), {
        x: centerX,
        y: 310,
        size: fontSize,
        font
      });

      const customer = customerArray.find((customer) => customer.name === selectedCustomer);
      for (let i = 0; i < customer.cert.length; i++) {
        width = font.widthOfTextAtSize(customer.cert[i].toString(), fontSize);
        centerX = (page.getWidth() - width) / 2;
        page.drawText(customer.cert[i].toString(), {
          x: centerX,
          y: 290 - i * 20,
          size: fontSize,
          font
        });
      }

      const pdfBytes = await pdfDoc.save();
      const fileToUpload = new File([pdfBytes], 'example.pdf');

      // Upload to web3.storage
      // Change apikey as needed
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEU2ODU2MThDRDRkNzg1NTFkMTY5NzU4MzhEMTNGQ0JkMzZlNTlGYWEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODk0NzYxNDkyMTYsIm5hbWUiOiJJRiJ9.qhmsZBWTLWcv1Gp3pVp9evzCm3wVOZ1gbV1uNP4l9uo'; // Replace with your web3.storage API key
      const client = new Web3Storage({ token: apiKey });
      const cid = await client.put([fileToUpload]);
      setCID(cid);
    } catch (error) {
      console.error('Error uploading file to web3.storage:', error);
    }
  };

  // filtering out transfer event log to grab the tokenId 
  const getTransferEventLogs = async (transactionHash) => {
    try {
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
  
      // Get the contract address from the receipt
      const contractAddress = receipt.to;
  
      // Define the filter for Transfer events
      const filter = {
        address: contractAddress,
        topics: [web3.utils.sha3('Transfer(address,address,uint256)')],
        fromBlock: receipt.blockNumber, // Starting block number of the receipt
        toBlock: receipt.blockNumber, // Ending block number of the receipt
      };
  
      // Fetch the logs using the filter
      const logs = await web3.eth.getPastLogs(filter);
  
      // Process the logs to get the tokenId
      const tokenId = logs[0]?.topics[3]; // tokenId is the 4th topic in the Transfer event
  
      return tokenId;
    } catch (error) {
      console.error('Error retrieving Transfer event logs:', error);
      return null;
    }
  };

  const retrieveTokenId = async (transactionHash) => {
    try {
      const tokenId = await getTransferEventLogs(transactionHash);
      setTokenId(tokenId);
    } catch (error) {
      console.error('Error retrieving tokenId:', error);
    }
  };
   
  // Dropdown management
  const createDropdownList = async() => {
    const dropdownContainer = document.getElementById("dropdownContainer");
  
    const selectElement = document.createElement("select");
  
    selectElement.addEventListener("change", handleSelectionChange);
    selectedCustomer = customerArray[0];  //initial selectedCustomer should be the first one on the array
  
    customerArray.forEach((customer) => {
      const option = document.createElement("option");
      option.text = customer.name;
      selectElement.appendChild(option);
    });
  
    // Append the select element to the container
    dropdownContainer.appendChild(selectElement);
  }
  
  // Event handler for selection change
  function handleSelectionChange(event) {
    selectedCustomer = event.target.value;
    console.log("Selected customer:", selectedCustomer);
  }

  const handleMintToWallet = async () => {
    try {
      if (contract && cid && web3) {
        const customer = customerArray.find((customer) => customer.name === selectedCustomer);
        const recipient = customer.addr;
  
        console.log("Recipient:", recipient);
        console.log("CID:", cid);
  
        // Mint the token to the recipient's address
        const transaction = await contract.methods.mintToken(recipient, cid).send({ from: recipient, gas : 999999});
        retrieveTokenId(transaction.transactionHash);
      }

    } catch (error) {
      console.error('Error minting token to wallet:', error);
    }
  };

  const initWeb3 = async () => {
    const web3Instance = new Web3('http://localhost:7545'); // Connect to Ganache RPC endpoint
    setWeb3(web3Instance);
  };

  const initContract = async () => {
    if (web3) {
      try {
        const instance = new web3.eth.Contract(MyTokenABI, "0x356b8120103b5cA6B5e7d615E5b684924569c431");
        setContract(instance);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    }
  };

  useEffect(() => {
    createDropdownList();
    initWeb3();
  }, []);

  useEffect(() => {
    initContract();
  }, [web3]);

  
  return (
    <div>
      <Header />
      <div className="flex-image-container">
        <div className="certificate-image-container">
        <img className="certificate-image" src={certImage} alt="Foundry" width="500"/>
          <div className="image-description">
          <h1 className="image-caption">Acquire Your Certificate</h1>
          <p className="image-elaboration">Download your certificates and mint them to your crypto wallet.</p>
          </div>
          
        </div>
      </div>

      <br>
      </br>

      <div className="button-container">
        <div id = "dropdownContainer">
        </div>
        
        <button className="button"onClick={uploadFileToWeb3Storage}>
          Upload
        </button>
        <button className="mint-button"onClick={handleMintToWallet} disabled={!contract || !cid || !web3}>
          Mint to Wallet
        </button>
      </div>

      <div className="response-container">
          {cid && (
            <p className="response">
              File uploaded successfully! CID: {cid}
            </p>
          )}
          {tokenId && (
            <p className="response">
              Token minted successfully! Token ID: {web3.utils.hexToNumberString(tokenId)}
            </p>
          )}
        </div>
    </div>
  );
};

export default FileUploader;