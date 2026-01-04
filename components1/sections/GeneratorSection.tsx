'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OutputBox from './OutputBox'
import FeaturesSection from './FeaturesSection'
import './GeneratorSection.css'

type Mode = 'readme' | 'template'

export default function GeneratorSection() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [currentReadme, setCurrentReadme] = useState<string | null>(null)
  const [repoName, setRepoName] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('readme')

  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`)

  const placeholders = {
    readme: 'Paste GitHub URL or add modifications...',
    template: "Describe your project (e.g., 'Python CLI todo app')..."
  }

  const handleModeChange = (newMode: string) => {
    setMode(newMode as Mode)
    setInput('') // Clear input when switching modes
    setError('')

    setCurrentReadme(null)
    setRepoName(null)
    setHasSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!input.trim()) return
    
    setHasSubmitted(true)
    setError('')
    setIsLoading(true)
    
    const userInput = input
    setInput('')

    try {
      const response = await fetch('/api/generate-readme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userInput,
          sessionId: sessionId,
          mode: mode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        setIsLoading(false)
        return
      }

      // Store current README
      setCurrentReadme(data.readme)
      setRepoName(data.metadata?.repoName || null)
      setIsLoading(false)

    } catch (err) {
      console.error('Error:', err)
      setError('Failed to generate README. Please try again.')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setCurrentReadme(null)
    setRepoName(null)
    setHasSubmitted(false)
    setError('')
  }

  const hasOutput = isLoading || currentReadme !== null

  return (
    <>
      <section className="generator-section" id="generator">
        <div className="generator-container">
          
          <div className="generator-header">
            <h2 className="generator-title">Generate Your README</h2>
            <p className="generator-subtitle">
              Choose your mode and let our AI handle the rest.
            </p>
            <div className="title-underline"></div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="mode-selector">
            <Tabs value={mode} onValueChange={handleModeChange}>
              <TabsList className="tabs-list">
                <TabsTrigger value="readme" className="tab-trigger">
                  README
                </TabsTrigger>
                <TabsTrigger value="template" className="tab-trigger">
                  Template
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className={`input-wrapper ${hasSubmitted ? 'input-minimized' : ''}`}>
            <div className="input-group">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholders[mode]}
                className="generator-input"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="send-button"
                size="icon"
              >
                <Send className="send-icon" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {hasSubmitted && (
            <OutputBox
              readme={currentReadme}
              repoName={repoName}
              isLoading={isLoading}
              onClear={handleClear}
            />
          )}
          
        </div>
      </section>

      <div id="features">
        <FeaturesSection hasOutput={hasOutput} />
      </div>
    </>
  )
}