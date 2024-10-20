'use client'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Share2, Folder, Share, Menu, BarChart, LineChart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import axios from "axios"

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum: any;
  }
}
// Mock data for demonstration purposes
const mockUserFiles = [
  { id: 1, name: 'document.pdf', size: '2.5 MB' },
  { id: 2, name: 'image.jpg', size: '1.8 MB' },
]

const mockSharedFiles = [
  { id: 3, name: 'shared_doc.docx', size: '1.2 MB', sharedBy: '0x1234...5678' },
  { id: 4, name: 'shared_image.png', size: '3.7 MB', sharedBy: '0x8765...4321' },
]

const mockFileCountData = [
  { month: 'Jan', count: 10 },
  { month: 'Feb', count: 15 },
  { month: 'Mar', count: 20 },
  { month: 'Apr', count: 25 },
  { month: 'May', count: 30 },
  { month: 'Jun', count: 35 },
]

const mockFileSizeData = [
  { month: 'Jan', size: 50 },
  { month: 'Feb', size: 80 },
  { month: 'Mar', size: 120 },
  { month: 'Apr', size: 160 },
  { month: 'May', size: 200 },
  { month: 'Jun', size: 250 },
]

export function FileSharing() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('0xYourAddress...1234')
  const [userFiles, setUserFiles] = useState(mockUserFiles)
  const [sharedFiles, setSharedFiles] = useState(mockSharedFiles)
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";  
 
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setAddress(accounts[0]);
        
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          } else {
            setIsConnected(false);
          }
        });
        
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        alert("Failed to connect MetaMask. Please try again.");
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask and try again.");
    }
  };
  

  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      const aesKeyResponse = await axios.post(`${backendUrl}/request-aes-key`);
      const aesKey = aesKeyResponse.data.aesKey;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("aesKey", aesKey);
  
      const uploadResponse = await axios.post(`${backendUrl}/process`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      alert(`File processed and uploaded successfully. Data ID: ${uploadResponse.data.fileId}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file, please try again.");
    }
  };

  const shareFile = (fileId: any, recipientAddress: any) => {
    alert(`Sharing file ${fileId} with ${recipientAddress}`)
  }

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
              <Button onClick={connectMetaMask} variant="secondary">Connect MetaMask</Button>
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
                <Input type="file" onChange={handleFileUpload} className="border-blue-200 focus:ring-blue-500" />
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
                        <span>{file.name} <span className="text-sm text-gray-500">({file.size})</span></span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Recipient address"
                          className="w-48 border-blue-200 focus:ring-blue-500"
                          onChange={(e) => file.name = e.target.value}
                        />
                        <Button onClick={() => shareFile(file.id, file.name)} size="sm" className="bg-blue-500 hover:bg-blue-600">
                          <Share2 className="mr-1 h-4 w-4" /> Share
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <Share className="mr-2" />
                  Shared Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {sharedFiles.map((file) => (
                    <li key={file.id} className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Share className="mr-2 text-green-500" />
                        <span>{file.name} <span className="text-sm text-gray-500">({file.size})</span></span>
                      </span>
                      <span className="text-sm text-gray-500">Shared by: {file.sharedBy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
                    <RechartsBarChart data={mockFileCountData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    <RechartsLineChart data={mockFileSizeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="size" stroke="var(--color-size)" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}