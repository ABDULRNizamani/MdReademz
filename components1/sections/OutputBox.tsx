'use client'

import { useState } from 'react'
import { Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import './OutputBox.css'

interface OutputBoxProps {
  readme: string | null
  repoName: string | null
  isLoading: boolean
  onClear: () => void
}

export default function OutputBox({ 
  readme, 
  repoName,
  isLoading, 
  onClear 
}: OutputBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="output-box">
      
      {readme && (
        <div className="clear-history-wrapper">
          <Button
            onClick={onClear}
            variant="ghost"
            size="sm"
            className="clear-history-btn"
          >
            <X className="clear-icon" />
            Clear
          </Button>
        </div>
      )}

      {isLoading && (
        <Card className="readme-card loading-card">
          <div className="skeleton-container">
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line" />
          </div>
        </Card>
      )}

      {readme && !isLoading && (
        <Card className="readme-card latest-card">
          <div className="readme-header">
            <div className="readme-info">
              {repoName && (
                <span className="repo-name">{repoName}</span>
              )}
            </div>
            
            <div className="readme-actions">
              <Button
                onClick={() => handleCopy(readme)}
                variant="ghost"
                size="sm"
                className="copy-btn"
              >
                <Copy className="action-icon" />
                {copied && <span className="copied-label">Copied!</span>}
              </Button>
            </div>
          </div>

          <div className="readme-content">
            <pre className="readme-text">{readme}</pre>
          </div>
        </Card>
      )}
    </div>
  )
}