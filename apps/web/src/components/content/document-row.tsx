import React from "react";

interface DocumentFile {
  id: string; 
  title: string; 
  fileUrl: string; 
  type: "pdf" | "docx" | "pptx" | "xls" | "zip"; 
  sizeKb?: number;
}

interface DocumentRowProps {
  doc: DocumentFile;
}

export default function DocumentRow({ doc }: DocumentRowProps) {
  // Get file extension icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      case "docx":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 14h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      case "pptx":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 7.5v8c0 .82-.67 1.5-1.5 1.5H3.5c-.83 0-1.5-.68-1.5-1.5v-8c0-.83.67-1.5 1.5-1.5h15c.82 0 1.5.67 1.5 1.5zM19 10h-4V8h4v2zm0 2h-4v2h4v-2zM9 14H5v-2h4v2zm7 0h-4v-2h4v2zm-7-4H5v-2h4v2zm7 0h-4v-2h4v2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 14h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
    }
  };

  // Format file size
  const formatFileSize = (sizeKb?: number) => {
    if (!sizeKb) return "";
    if (sizeKb < 1024) return `${sizeKb} KB`;
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  };

  return (
    <a 
      href={doc.fileUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-shrink-0">
        {getFileIcon(doc.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{doc.title}</h3>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span className="uppercase">{doc.type}</span>
          {doc.sizeKb && <span>•</span>}
          <span>{formatFileSize(doc.sizeKb)}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
      </div>
    </a>
  );
}