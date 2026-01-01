'use client'

import { useState, useEffect } from 'react'
import { Copy, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import './OutputBox.css'

export interface ReadmeVersion {
  id: number
  content: string
  timestamp: Date
  input: string
  repoName?: string | null
}

interface OutputBoxProps {
  history: ReadmeVersion[]
  isLoading: boolean
  
  onClearHistory: () => void
}

export default function OutputBox({ 
  history, 
  isLoading, 
  
  onClearHistory 
}: OutputBoxProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }


  const sortedHistory = [...history].reverse()

  return (
    <div className="output-box">
      
      {history.length > 0 && (
        <div className="clear-history-wrapper">
          <Button
            onClick={onClearHistory}
            variant="ghost"
            size="sm"
            className="clear-history-btn"
          >
            <X className="clear-icon" />
            Clear History
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

      {sortedHistory.map((version, index) => {
        const isLatest = index === 0
        const isExpanded = isLatest || expandedIds.has(version.id)
        const isCopied = copiedId === version.id

        return (
          <Card 
            key={version.id} 
            className={`readme-card ${isLatest ? 'latest-card' : 'old-card'}`}
          >
            <div className="readme-header" onClick={() => !isLatest && toggleExpand(version.id)}>
              <div className="readme-info">
                <span className="readme-label">
                  {isLatest ? ' ' : `📄 Previous`}
                </span>
                {version.repoName && (
                  <span className="repo-name">{version.repoName}</span>
                )}
              </div>
              
              <div className="readme-actions">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy(version.content, version.id)
                  }}
                  variant="ghost"
                  size="sm"
                  className="copy-btn"
                >
                  <Copy className="action-icon" />
                  {isCopied && <span className="copied-label">Copied!</span>}
                </Button>

                {!isLatest && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(version.id)
                    }}
                    variant="ghost"
                    size="sm"
                    className="expand-btn"
                  >
                    {isExpanded ? (
                      <ChevronUp className="action-icon" />
                    ) : (
                      <ChevronDown className="action-icon" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="readme-content">
                <pre className="readme-text">{version.content}</pre>
              </div>
            )}

            {!isExpanded && !isLatest && (
              <div className="readme-preview">
                {version.content.split('\n').slice(0, 2).join('\n')}...
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

