"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Search, Info, Trash2, FileText, Loader2 } from "lucide-react";
import { colpaliService } from "@/lib/colpali";
import type { CollectionInfoResponse, SearchResult } from "@/app/clientService";

interface ColPaliManagerProps {
  className?: string;
}

export function ColPaliManager({ className }: ColPaliManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfoResponse | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length !== selectedFiles.length) {
      setMessage("Only PDF files are supported. Non-PDF files were filtered out.");
    }
    
    setFiles(pdfFiles);
  };

  const handleIndexDocuments = async () => {
    if (files.length === 0) {
      setMessage("Please select PDF files to index");
      return;
    }

    setIndexing(true);
    setMessage("");

    try {
      const result = await colpaliService.indexDocuments(files);
      if (result.status === "success") {
        setMessage(`Successfully indexed ${result.indexed_pages} pages from ${files.length} documents`);
        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh collection info
        await refreshCollectionInfo();
      } else {
        setMessage(result.message || "Failed to index documents");
      }
    } catch (error) {
      setMessage(`Error indexing documents: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIndexing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage("Please enter a search query");
      return;
    }

    setSearching(true);
    setMessage("");
    setSearchResults([]);
    setAiResponse("");

    try {
      const result = await colpaliService.searchDocuments(searchQuery, 5);
      if (result.status === "success") {
        setSearchResults(result.results || []);
        setAiResponse(result.ai_response || "");
        setMessage(result.total_results ? `Found ${result.total_results} results` : "Search completed");
      } else {
        setMessage(result.message || "Search failed");
      }
    } catch (error) {
      setMessage(`Error searching documents: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSearching(false);
    }
  };

  const refreshCollectionInfo = async () => {
    setLoading(true);
    try {
      const info = await colpaliService.getCollectionInfo();
      setCollectionInfo(info);
    } catch (error) {
      setMessage(`Error getting collection info: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCollection = async () => {
    if (!confirm("Are you sure you want to clear all indexed documents? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await colpaliService.clearCollection();
      if (result.status === "success") {
        setMessage("Collection cleared successfully");
        setCollectionInfo(null);
        setSearchResults([]);
        setAiResponse("");
        await refreshCollectionInfo();
      } else {
        setMessage(result.message || "Failed to clear collection");
      }
    } catch (error) {
      setMessage(`Error clearing collection: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshCollectionInfo();
  }, []);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ColPali Document Manager
          </CardTitle>
          <CardDescription>
            Index and search PDF documents using vision-language models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="index" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="index">Index Documents</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>

            <TabsContent value="index" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-input">Select PDF Files</Label>
                  <Input
                    id="file-input"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                </div>
                
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({files.length}):</Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleIndexDocuments}
                  disabled={indexing || files.length === 0}
                  className="w-full"
                >
                  {indexing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Index Documents
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-query">Search Query</Label>
                  <Input
                    id="search-query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter your search query..."
                    className="mt-1"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <Button 
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="w-full"
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Documents
                    </>
                  )}
                </Button>

                {aiResponse && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">AI Response:</h4>
                    <p className="text-blue-800">{aiResponse}</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium">Search Results:</h4>
                    {searchResults.map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">Rank #{result.rank}</span>
                          {result.image_size && (
                            <span className="text-sm text-gray-500">
                              Size: {Array.isArray(result.image_size) ? result.image_size.join('x') : result.image_size}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{result.page_info}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <div className="space-y-4">
                <Button 
                  onClick={refreshCollectionInfo}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Info className="mr-2 h-4 w-4" />
                      Refresh Collection Info
                    </>
                  )}
                </Button>

                {collectionInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Collection Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Status:</strong> {collectionInfo.status}</div>
                      {collectionInfo.storage_type && (
                        <div><strong>Storage Type:</strong> {collectionInfo.storage_type}</div>
                      )}
                      {collectionInfo.indexed_documents !== undefined && (
                        <div><strong>Indexed Documents:</strong> {collectionInfo.indexed_documents}</div>
                      )}
                      {collectionInfo.indexed_images !== undefined && (
                        <div><strong>Indexed Images:</strong> {collectionInfo.indexed_images}</div>
                      )}
                      {collectionInfo.message && (
                        <div><strong>Message:</strong> {collectionInfo.message}</div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={handleClearCollection}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Collection
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes("Error") || message.includes("Failed") 
                ? "bg-red-50 text-red-800 border border-red-200" 
                : "bg-green-50 text-green-800 border border-green-200"
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
