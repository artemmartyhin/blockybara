'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ethers } from 'ethers';
import HubABI from '@/abi/Hub.json';  // Path to Hub contract ABI
import ContainerABI from '@/abi/Container.json';  // Path to Container contract ABI
import { Folder, Share2, Share, BarChart, LineChart } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Download } from 'lucide-react';
import axios from "axios" // Adjust the import path as necessary
// Extend the Window interface to include ethereum property
declare global {
  interface Window {
    ethereum: any;
  }
}

const mockSharedFiles = [
  { id: 3, name: 'shared_doc.docx', size: '1.2 MB', sharedBy: '0x1234...5678' },
  { id: 4, name: 'shared_image.png', size: '3.7 MB', sharedBy: '0x8765...4321' },
];

const mockFileCountData = [
  { month: 'Jan', count: 10 },
  { month: 'Feb', count: 15 },
  { month: 'Mar', count: 20 },
  { month: 'Apr', count: 25 },
  { month: 'May', count: 30 },
  { month: 'Jun', count: 35 },
];

const mockFileSizeData = [
  { month: 'Jan', size: 50 },
  { month: 'Feb', size: 80 },
  { month: 'Mar', size: 120 },
  { month: 'Apr', size: 160 },
  { month: 'May', size: 200 },
  { month: 'Jun', size: 250 },
];


export function FileSharing() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [containerAddress, setContainerAddress] = useState('');
  const [provider, setProvider] = useState<any>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const [userFiles, setUserFiles] = useState<{ id: string }[]>([]);
  const HUB_CONTRACT_ADDRESS = "0xf0837F870dBcB63c8A4488288A16a909c315b457";  // Example address
  const [sharedFiles, setSharedFiles] = useState(mockSharedFiles);

  // MetaMask connection and address handling
 // Updated connectMetaMask function to call checkOrCreateContainer after connection
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await newProvider.send('eth_requestAccounts', []);
        setProvider(newProvider); // Set the provider
        setAddress(accounts[0]); // Set the address
        setIsConnected(true); // Mark as connected
        console.log("MetaMask connected, calling checkOrCreateContainer...");
        await checkOrCreateContainer(newProvider, accounts[0]); // Pass the provider and address to the container checker

        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          } else {
            setIsConnected(false);
          }
        });
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        alert('Failed to connect MetaMask. Please try again.');
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask and try again.');
    }
};

// Move checkOrCreateContainer to take provider and address as arguments
const checkOrCreateContainer = async (newProvider: ethers.BrowserProvider, userAddress: string) => {
  if (newProvider) {
    const signer = await newProvider.getSigner();
    const hubContract = new ethers.Contract(HUB_CONTRACT_ADDRESS, HubABI, signer);
    const userContainer = await hubContract.users(userAddress);

    if (userContainer === ethers.ZeroAddress) {
      console.log("No container found, creating new container...");
      const tx = await hubContract.create2();
      await tx.wait();
      const newContainer = await hubContract.users(userAddress);
      setContainerAddress(newContainer); // Set the container address
    } else {
      console.log("Container found:", userContainer);
      setContainerAddress(userContainer); // Set the container address
    }
  } else {
    console.log("Provider is missing, cannot check or create container");
  }
};

// Use useEffect only for initialization after MetaMask is connected
useEffect(() => {
  if (isConnected && provider) {
    listFiles();
  }
}, [isConnected, provider]);


  // File upload handler
  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    console.log(file);
    if (!file || !containerAddress) return;

    try {
      const aesKeyResponse = await axios.post(`${backendUrl}/request-aes-key`);
      console.log(aesKeyResponse.data);
      const aesKey = aesKeyResponse.data.aesKey;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('aesKey', aesKey);

      const uploadResponse = await axios.post(`${backendUrl}/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileId = uploadResponse.data.fileId;
      const eaesKey = uploadResponse.data.eaesKey;
      const signer =  await provider.getSigner();
      const containerContract = new ethers.Contract(containerAddress, ContainerABI, signer);
      console.log(aesKey);
      const tx = await containerContract.write([fileId], [eaesKey]); 
      await tx.wait();

      alert(`File processed and uploaded successfully. Data ID: ${fileId}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file, please try again.');
    }
  };

  const listFiles = async () => {
    if (!containerAddress || !provider) return;

    try {
      const signer = await provider.getSigner();
      const containerContract = new ethers.Contract(containerAddress, ContainerABI, signer);
      const fileIds = await containerContract.fetchAll();
      const files = fileIds.map((id: number) => ({ id }));
      setUserFiles(files);
    } catch (error) {
      console.error('Error listing files:', error);
      alert('Error listing files, please try again.');
    }
  }

  const downloadFile = async (fileId: string, containerAddress: string) => {
    try {
      const provider = new ethers.JsonRpcProvider('https://api.helium.fhenix.zone');
      const permitResponse = await axios.post(`${backendUrl}/request`, {
        container: containerAddress,
        sender: address
      });
  
      const permit = permitResponse.data.permit;
  
      const containerContract = new ethers.Contract(containerAddress, ContainerABI, provider);
      const aesKey = await containerContract.access(fileId, permit);
  
      const decryptResponse = await axios.post(`${backendUrl}/decrypt`, {
        aesKey,
        blobId: fileId,
      }, {
        responseType: 'blob',
      });
  
      const url = window.URL.createObjectURL(new Blob([decryptResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileId}.decrypted`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };  

  const shareContainer = async (recipientAddress: string) => {
    if (!containerAddress || !provider) return;

    try {
        const signer = await provider.getSigner();
        const containerContract = new ethers.Contract(containerAddress, ContainerABI, signer);
        const tx = await containerContract.permit(recipientAddress, true);  // Grant access to the whole container
        await tx.wait();

        alert(`Container shared successfully with ${recipientAddress}`);
    } catch (error) {
        console.error('Error sharing container:', error);
        alert('Error sharing container, please try again.');
    }
};

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-sky-500 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Menu className="h-6 w-6 text-white" />
            <img src="/Designer.png" alt="Logo" className="h-[80px] w-[80px]" />
            <h1 className="text-2xl font-bold text-white">Blockybara</h1>
          </div>
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <Button onClick={connectMetaMask} variant="secondary">
                Connect MetaMask
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-sm text-white">{address}</span>
              </div>
            )}
          </div>
        </div>
      </header>
  
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <Upload className="mr-2" />
                  Upload File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="border-blue-200 focus:ring-blue-500"
                />
              </CardContent>
            </Card>
  
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <Folder className="mr-2" />
                  Your Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {userFiles.map((file) => (
                    <li key={file.id} className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Folder className="mr-2 text-blue-500" />
                        <span>
                          {file.id} <span className="text-sm text-gray-500">({1})</span>
                        </span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Recipient address"
                          className="w-48 border-blue-200 focus:ring-blue-500"
                          onChange={(e) => (file.id = e.target.value)}
                        />
                        <Button
                          onClick={() => downloadFile(file.id, containerAddress)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <div className="space-y-8">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center text-blue-600">
                            <Folder className="mr-2" />
                            Share Container
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Input
                                type="text"
                                placeholder="Recipient address"
                                className="w-48 border-blue-200 focus:ring-blue-500"
                                onChange={(e) => setRecipientAddress(e.target.value)} // Store recipient address
                            />
                            <Button
                                onClick={() => shareContainer(recipientAddress)}  // Share the container
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                <Share2 className="mr-1 h-4 w-4" />
                                Share Container
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
  
          {/* Right Column */}
          <div className="space-y-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <BarChart className="mr-2" />
                  File Count Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer
                  config={{
                    count: {
                      label: "File Count",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={mockFileCountData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
  
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <LineChart className="mr-2" />
                  Total File Size Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer
                  config={{
                    size: {
                      label: "Total Size (MB)",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={mockFileSizeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="size"
                        stroke="var(--color-size)"
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
  
  }

  