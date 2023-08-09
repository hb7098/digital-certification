import React, { useState, useEffect } from 'react';
import Header from './Header';
import certImage from './foundrylogo.PNG';
import './App.css'
import { Web3 } from 'web3'; // Import web3 library
import { MyTokenABI } from './MyTokenABI'; // ABI
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { NFTStorage, File } from 'nft.storage';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';
import { upload } from '@testing-library/user-event/dist/upload';
const pdfjsLib = require ("pdfjs-dist");
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const ethers = require("ethers");
const NFT_STORAGE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDMyYTQzZDkxQTlhZDNFMTg2N2EwMzM1NUEwQzIwYTUwNTgyYjVFMkMiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5MDc2NjQ0NjQxOSwibmFtZSI6IktleTEifQ.LVhaSrgeiumXeTjI7JzhMRjjLOW7P1xU36KPdgTz2HY";
const fontSize = 20;

const customerArray = [
  {
    name : "Kirsty Gallegos",
    cert : ["RIT Bachelor's in Computer Engineering", "RIT Master's in Computer Engineering"],
    addr : "0x39D28E1A30c8C2b0C208D0714ae6a09Fc97261Ce"
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

  // PDF Creation & Uploading to web3.storage
  const uploadFile = async () => {
    try {
      console.log("UploadFile");

      //PDF Creation 
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([1000, 500]);
      const imageFetch = await fetch("https://i.imgur.com/8L3QLdz.png");  // foundry logo on imgur

      const imageData = await imageFetch.arrayBuffer();
      const image = await pdfDoc.embedPng(imageData);
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontCert = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      var {width, height} = image.size(); // var 'heigh' is not used
      var centerX = (page.getWidth() - width) / 2;
      page.drawImage(image, {
        x: centerX,
        y: 350
      });

      width = font.widthOfTextAtSize("Certificate of Completion", fontSize + 3);
      centerX = (page.getWidth() - width) / 2;
      page.drawText("Certificate of Completion", {
        x: centerX,
        y: 280,
        size: fontSize + 3,
        fontCert
      });

      width = font.widthOfTextAtSize(selectedCustomer.toString(), fontSize + 2);
      centerX = (page.getWidth() - width) / 2;
      page.drawText(selectedCustomer.toString(), {
        x: centerX,
        y: 220,
        size: fontSize + 2,
        font
      });
      
      const customer = customerArray.find((customer) => customer.name === selectedCustomer);
      for (let i = 0; i < customer.cert.length; i++) {
        width = font.widthOfTextAtSize(customer.cert[i].toString(), fontSize);
        centerX = (page.getWidth() - width) / 2;
        page.drawText(customer.cert[i].toString(), {
          x: centerX,
          y: 180 - i * 20,
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
        
        const returnedData = await nftstorage.store({
          name: 'Certificate for ' + selectedCustomer,
          description: 'Description',
          image: pdfUpload,
        });

        console.log(returnedData);
        console.log('IPFS URL for the metadata:', returnedData.url)
        console.log('metadata.json contents:\n', returnedData.data)
        setCID(returnedData.url);
        const customer = customerArray.find((customer) => customer.name === selectedCustomer);
        const recipient = customer.addr;
  
        console.log("Recipient:", recipient);
        console.log("CID:", returnedData.url);
        // Mint the token to the recipient's address
        console.log("Contract:", contract);
        const txParam = {
          to: "0x12068e7a7e2755b46AcffcB9933Ae0Ca519B2036",
          from: window.ethereum.selectedAddress,
          'data': contract.methods.mintToken(customer.addr, returnedData.url).encodeABI(),
        };
    
        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParam],
        });
        
        console.log(txHash);
        retrieveTokenId(txHash);
      })

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

  //deprecated
  const handleMintToWallet = async () => {
    console.log("Handle");
    await uploadFile();
    try {
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
    catch(error) {
      console.error('Error minting token to wallet:', error);
    };
 };

  const connectAccount = async() => {
    if (window.ethereum) {
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
    }
  }
  const initWeb3 = async () => {
    const web3Instance = new Web3('https://rpc.sepolia.dev'); // Connect to Ganache RPC endpoint
    setWeb3(web3Instance);
  };

  const initContract = async () => {
    if (web3) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
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
      <div className="body">
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
        
        <button className="button"onClick={uploadFile}>
          Upload
        </button>
        {/* <button className="button"onClick={handleMintToWallet} disabled={!cid}>
          Mint to Wallet
        </button>
        <button className="button"onClick={connectAccount}>Connect!</button> */}
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
    </div>
  );
};

export default FileUploader;