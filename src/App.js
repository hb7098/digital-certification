import React, { useState, useEffect } from 'react';
import Header from './Header';
import certImage from './foundrylogo.PNG';
import './App.css'
import { Web3Storage } from 'web3.storage';
import { Web3 } from 'web3'; // Import web3 library
import { MyTokenABI } from './MyTokenABI'; // ABI
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { NFTStorage, File } from 'nft.storage';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';
const pdfjsLib = require ("pdfjs-dist");
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const ethers = require("ethers");
const NFT_STORAGE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDMyYTQzZDkxQTlhZDNFMTg2N2EwMzM1NUEwQzIwYTUwNTgyYjVFMkMiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5MDc2NjQ0NjQxOSwibmFtZSI6IktleTEifQ.LVhaSrgeiumXeTjI7JzhMRjjLOW7P1xU36KPdgTz2HY";
const fontSize = 20;

const customerArray = [
  {
    name : "Kirsty Gallegos",
    cert : ["RIT Bachelor's in Computer Engineering", "RIT Master's in Computer Engineering"],
    addr : "0x234f5811e02C85f1cB28D5088d6Ff0D29E72323B"
  },
  {
    name : "Miranda Salazar",
    cert : ["RIT Bachelor's in Computer Science", "RIT Master's in Computer Science"],
    addr : "0x39D28E1A30c8C2b0C208D0714ae6a09Fc97261Ce"
  },
  {
    name : "Fahad Mora",
    cert : ["RIT Bachelor's in Cyber Security"],
    addr : "0x39D28E1A30c8C2b0C208D0714ae6a09Fc97261Ce"
  },
  {
    name : "Evie Fitzpatrick",
    cert : ["RIT Bachelor's in Electrical Engineering", "RIT Master's in Electrical Engineering"],
    addr : "0x39D28E1A30c8C2b0C208D0714ae6a09Fc97261Ce"
  },
  {
    name : "Dewi Obrien",
    cert : ["RIT Bachelor's in Mechanical Engineering", "RIT Master's in Mechanical Engineering"],
    addr : "0x39D28E1A30c8C2b0C208D0714ae6a09Fc97261Ce"
  }
]
var selectedCustomer;

function dataURItoBlob(dataURI) {
  // const byteString = atob(dataURI.split(',')[1]);
  // const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const base64Index = dataURI.indexOf(';base64,');
  if (base64Index === -1) {
    throw new Error('Invalid data URI: Missing ";base64,"');
  }
  const base64 = dataURI.substring(base64Index + 8);
  const byteString = atob(base64);
  const mimeString = dataURI.substring(5, base64Index);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mimeString });
}

// main function starts
const FileUploader = () => {

  const [status, setStatus] = useState('');
  const [account, setAccount] = useState('');
  const [cid, setCID] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState('');
  const [jpg, setjpg] = useState('');


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

      const loadingTask = pdfjsLib.getDocument(pdfBytes);
      const canvas = document.createElement("canvas");
      const pdfDocument = await loadingTask.promise;
      const pdfpage = await pdfDocument.getPage(1);
      const viewport = pdfpage.getViewport({ scale : 1.0 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      var task = pdfpage.render({canvasContext : ctx, viewport: viewport});
      task.promise.then(async function(){
        var jpg = canvas.toDataURL('image/jpeg');
        const blob = dataURItoBlob(jpg);
        const pdfUpload = new File([blob], 'example.jpg', { type : 'image/jpg' });
        const nftstorage = new NFTStorage({
          token : NFT_STORAGE_KEY
        });
        
        if (pdfUpload) {
          const returnedData = await nftstorage.store({
            name: 'Certificate for ' + selectedCustomer,
            description: 'Description',
            image: pdfUpload,
          });
          console.log(returnedData);
          console.log('IPFS URL for the metadata:', returnedData.url)
          console.log('metadata.json contents:\n', returnedData.data)
          setCID(returnedData.url);
        }
      })


      // const pdfUpload = new File([pdfBytes], 'example.pdf', { type : 'application/pdf'});
      // const imageUpload = new File([fetchimage], 'fetchedimage.jpg');
      // Upload to web3.storage - deprecated
      // Change apikey as needed
      // const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEU2ODU2MThDRDRkNzg1NTFkMTY5NzU4MzhEMTNGQ0JkMzZlNTlGYWEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODk0NzYxNDkyMTYsIm5hbWUiOiJJRiJ9.qhmsZBWTLWcv1Gp3pVp9evzCm3wVOZ1gbV1uNP4l9uo'; // Replace with your web3.storage API key
      // const client = new Web3Storage({ token: apiKey });
      // const PDFcid = await client.put([pdfUpload]);
      // console.log("PDF uploaded. CID : ", PDFcid);
      // const metaData = {
      //   name : "testing certificate for " + selectedCustomer,
      //   description : "this is a testing certificate",
      //   image : "ipfs://" + PDFcid
      // }
      // console.log(metaData);
      // const jsonString = JSON.stringify(metaData);
      // const metaDataUpload = new Blob([jsonString], { type : 'application/json' });
      // const metaDataCID = await client.put([metaDataUpload], 'metadata.json');
      // console.log("metadata uploaded. CID : ", metaDataCID);
      // setCID(metaDataCID);

      
    } catch (error) {
      console.error('Error uploading file to web3.storage:', error);
    }
  };

  // filtering out transfer event log to grab the tokenId 
  const getTransferEventLogs = async (transactionHash) => {
    try {
      var receipt;
      while (true) {
        console.log("hash: ", transactionHash);
        receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [transactionHash],
        });

        if (receipt) {
          console.log("received receipt:", receipt);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));  // wait 3 seconds
      }

      // const receipt = await web3.eth.getTransactionReceipt(transactionHash);

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
      const logs = await window.ethereum.request({
           method: 'eth_getLogs', 
           params: [filter], 
      });
  
      // Process the logs to get the tokenId
      const tokenId = logs[0]?.topics[3]; // tokenId is the 4th topic in the Transfer event
      //testing
      const txParam = {
        to: "0x12068e7a7e2755b46AcffcB9933Ae0Ca519B2036",
        'data': contract.methods.ownerOf(tokenId).encodeABI(),
      };
  
      const txHash = await window.ethereum.request({
        method: 'eth_call',
        params: [txParam],
      });

      console.log("Testing returned : ", txHash);
      //testing ends

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
      console.log("Retrieved");
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
      if (true) {
        const customer = customerArray.find((customer) => customer.name === selectedCustomer);
        const recipient = customer.addr;
  
        console.log("Recipient:", recipient);
        console.log("CID:", cid);
        // Mint the token to the recipient's address
        console.log("Contract:", contract);
        const txParam = {
          to: "0x12068e7a7e2755b46AcffcB9933Ae0Ca519B2036",
          from: window.ethereum.selectedAddress,
          'data': contract.methods.mintToken(customer.addr, cid).encodeABI(),
        };
    
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParam],
        });
        
        console.log(txHash);
        retrieveTokenId(txHash);
      }

    } catch (error) {
      console.error('Error minting token to wallet:', error);
    }
  };

  const connectAccount = async() => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
    }
  }
  const initWeb3 = async () => {
    const web3Instance = new Web3('https://rpc.sepolia.dev'); // Connect to Ganache RPC endpoint
    // var privateKeyString = '23f2da6da69a9708b0fd8c58a6a9b6f2d3e407d9d9dbde861d7a34a90930cf0a';
    // privateKeyString = web3Instance.utils.sha3(privateKeyString);
    // const account = web3Instance.eth.accounts.wallet.add(privateKeyString);
    // const isValidPrivateKey = validator.isHexStrict(privateKeyString) && privateKeyString.length === 64;
    // console.log('Is Valid Private Key:', isValidPrivateKey);
    // setAccount(account);
    setWeb3(web3Instance);
  };

  const initContract = async () => {
    if (web3) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        console.log("checking signer: ", signer);
        const instance = new web3.eth.Contract(MyTokenABI, "0x12068e7a7e2755b46AcffcB9933Ae0Ca519B2036", signer);
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
        <button className="button"onClick={handleMintToWallet}>
          Mint to Wallet
        </button>
        <button className="button"onClick={connectAccount}>Connect!</button>
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

          <br>
          </br>

          <p id = "status">
            {status}
          </p>
        </div>
    </div>
  );
};

export default FileUploader;