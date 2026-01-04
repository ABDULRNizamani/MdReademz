import { NextRequest } from 'next/server'

// Environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// Session storage duration: 30 minutes
const SESSION_DURATION = 30 * 60 * 1000

// Separate storage for each mode
const sessionStore = new Map<string, { previousReadme: string; timestamp: number }>()

export async function POST(request: NextRequest) {
  try {
    console.log('=== STAGE 1: INPUT HANDLING ===')
    
    // Get user input
    const body = await request.json()
    const { message, sessionId, mode } = body
    
    console.log('Raw input:', message)
    console.log('Session ID:', sessionId)
    console.log('Mode:', mode)
    
    // Validate mode
    if (!mode || !['readme', 'template'].includes(mode)) {
      return Response.json({
        error: "Invalid mode. Must be 'readme' or 'template'",
        type: "invalid_mode"
      }, { status: 400 })
    }
    
    // Validate input
    const validation = validateInput(message)
    if (!validation.valid) {
      
      return Response.json({
        error: validation.reason,
        type: "invalid_input"
      }, { status: 400 })
    }
    
    // Extract GitHub URLs from input
    const urls = extractGitHubUrls(message)
    console.log('URLs found:', urls.length, urls)
    
    // Mode-specific validation
    if (mode === 'readme') {
      // README mode: needs URL OR previous README
      const sessionKey = `${sessionId}-readme`
      const previousReadme = getSession(sessionKey)?.previousReadme || null
      
      if (urls.length === 0 && !previousReadme) {
        return Response.json({
          error: "Please provide a GitHub URL for README generation",
          type: "url_required"
        }, { status: 400 })
      }
    }
    
    if (mode === 'template') {
      // Template mode: must NOT have URL
      if (urls.length > 0) {
        return Response.json({
          error: "Template mode doesn't use URLs. Switch to README tab or remove the URL",
          type: "url_not_allowed"
        }, { status: 400 })
      }
    }
    
    // Check for multiple URLs (both modes)
    if (urls.length > 1) {
      
      return Response.json({
        error: "Please provide only one GitHub URL at a time",
        type: "multiple_urls"
      }, { status: 400 })
    }
    
    // Parse URL if found
    let parsedUrl: { owner: string; repo: string } | null = null
    let userText = message
    
    if (urls.length === 1) {
      parsedUrl = parseGitHubUrl(urls[0])
      console.log('Parsed URL:', parsedUrl)
      
      if (!parsedUrl) {
        
        return Response.json({
          error: "Invalid GitHub URL format",
          suggestion: "Use format: https://github.com/owner/repo",
          type: "invalid_url"
        }, { status: 400 })
      }
      
      userText = message.replace(urls[0], '').trim()
      console.log('User text (without URL):', userText)
    }
    
    // Get mode-specific session
    const sessionKey = `${sessionId}-${mode}`
    const session = getSession(sessionKey)
    const previousReadme = session?.previousReadme || null
    console.log(`Has previous ${mode} README:`, !!previousReadme)
    
    // Determine generation mode
    let generationMode: 'new_with_url' | 'new_template' | 'iteration'
    
    if (mode === 'readme') {
      generationMode = parsedUrl ? 'new_with_url' : 'iteration'
    } else {
      generationMode = previousReadme ? 'iteration' : 'new_template'
    }
    
    
    let repoData = null
    
    if (parsedUrl) {
      console.log(`Fetching: ${parsedUrl.owner}/${parsedUrl.repo}`)
      
      try {
        repoData = await fetchGitHubRepo(parsedUrl.owner, parsedUrl.repo)
        
      } catch (error: any) {
        console.log('❌ GitHub fetch failed:', error.message)
        
        if (error.message === 'NOT_FOUND') {
          return Response.json({
            error: "Repository not found. Check URL and ensure repo is public",
            type: "repo_not_found"
          }, { status: 404 })
        }
        if (error.message === 'FORBIDDEN') {
          return Response.json({
            error: "Cannot access private repository or rate limit exceeded",
            type: "forbidden"
          }, { status: 403 })
        }
        return Response.json({
          error: "GitHub API error. Please try again",
          type: "github_error"
        }, { status: 500 })
      }
    } else {
      console.log(' No URL provided, skipping GitHub API')
    }
    
    
   
    let formattedData = null
    
    if (repoData) {
      formattedData = formatRepoData(repoData, userText)
      console.log(' Data formatted:', formattedData.repoName)
    } else {
      console.log('No repo data to format')
    }
    
    
    // STAGE 4: PROMPT ENGINEERING
    console.log('\n=== STAGE 4: PROMPT BUILDING ===')
    
    const prompt = buildPrompt({
      mode: generationMode,
      repoData: formattedData,
      userText,
      previousReadme
    })
    
    console.log(' Prompt built, length:', prompt.length)
    
    
   
    console.log('\n=== STAGE 5: GROQ API ===')
    
    let generatedReadme: string
    
    try {
      generatedReadme = await callGroq(prompt)
     
    } catch (error: any) {
      console.log('Groq API failed:', error.message)
      return Response.json({
        error: "AI service unavailable. Please try again",
        type: "ai_error"
      }, { status: 500 })
    }
    
    
    saveSession(sessionKey, generatedReadme)
    console.log('✅ Session updated for mode:', mode)
    
    return Response.json({
      success: true,
      readme: generatedReadme,
      metadata: {
        mode: generationMode,
        hasRepoData: !!repoData,
        repoName: repoData?.name || null
      }
    })
    
  } catch (error: any) {
    console.error('Unexpected Error:', error)
    return Response.json({
      error: "Something went wrong",
      type: "server_error",
      details: error.message
    }, { status: 500 })
  }
}




function validateInput(input: string): { valid: boolean; reason?: string } {
  const trimmed = input.trim()
  
  if (trimmed.length < 5) {
    return { valid: false, reason: "Input is too short (minimum 5 characters)" }
  }
  
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, reason: "Input must contain letters" }
  }
  
  if (/(.)\1{15,}/.test(trimmed)) {
    return { valid: false, reason: "Invalid input pattern detected" }
  }
  
  return { valid: true }
}

function extractGitHubUrls(text: string): string[] {
  const regex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/[\w.-]+(?:\.git)?/gi
  return text.match(regex) || []
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/i)
  
  if (!match) return null
  
  const owner = match[1]
  const repo = match[2]
  
  const validPattern = /^[\w-]+$/
  
  if (!validPattern.test(owner) || !validPattern.test(repo)) {
    return null
  }
  
  return { owner, repo }
}




async function fetchGitHubRepo(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`
  
  const headers: any = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'README-Generator'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  const res = await fetch(url, { headers })
  
  if (res.status === 404) {
    throw new Error('NOT_FOUND')
  } else if (res.status === 403) {
    throw new Error('FORBIDDEN')
  } else if (!res.ok) {
    throw new Error('GITHUB_ERROR')
  }
  
  let repoData = await res.json()
  
  return {
    name: repoData.name,
    full_name: repoData.full_name,
    description: repoData.description || 'No description provided',
    language: repoData.language || "Not specified",
    stargazers_count: repoData.stargazers_count,
    forks_count: repoData.forks_count,
    topics: repoData.topics,
    license: repoData.license?.name,
    homepage: repoData.homepage || null,
    default_branch: repoData.default_branch
  }
}




function formatRepoData(repoData: any, userText: string) {
  return {
    repoName: repoData.name,
    fullName: repoData.full_name,
    description: repoData.description || "No description provided",
    language: repoData.language || "Language not detected",
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    topics: repoData.topics || [],
    license: repoData.license || "No license specified",
    homepage: repoData.homepage || null,
    defaultBranch: repoData.default_branch || "main",
    userText: userText
  }
}

function getSession(sessionKey: string): { previousReadme: string; timestamp: number } | null {
  if (!sessionKey) return null
  
  const session = sessionStore.get(sessionKey)
  if (!session) return null
  
  const isExpired = Date.now() - session.timestamp > SESSION_DURATION
  
  if (isExpired) {
    sessionStore.delete(sessionKey)
    return null
  }
  
  return session
}

function saveSession(sessionKey: string, readme: string) {
  if (!sessionKey) return
  
  sessionStore.set(sessionKey, {
    previousReadme: readme,
    timestamp: Date.now()
  })
}



function buildPrompt(params: {
  mode: 'new_with_url' | 'new_template' | 'iteration'
  repoData: any
  userText: string
  previousReadme: string | null
}): string {
  
  const { mode, repoData, userText, previousReadme } = params
  
  if (mode === 'iteration' && previousReadme) {
    return `You are a professional README editor.

Current README:
${previousReadme}

User's modification request: "${userText}"

Instructions:
- Apply only the changes requested by the user
- Do NOT invent any new information
- Keep all other sections unchanged
- Return the COMPLETE updated README (not just modified parts)
- Output only markdown content, do not include markdown code fences`
  }
  
    if (mode === 'new_with_url' && repoData) {
     return `
     You are a professional README generator. Create comprehensive, well-organized READMEs.
     
     Repository Information:
     - Name: ${repoData.repoName}
     - Description: ${repoData.description}
     - Language: ${repoData.language}
     - Stars: ${repoData.stars}
     - Forks: ${repoData.forks}
     - Topics: ${repoData.topics.join(', ') || 'None'}
     - License: ${repoData.license || 'No license specified'}
     - Homepage: ${repoData.homepage || 'None'}
     - Default Branch: ${repoData.defaultBranch}
     
     ${userText ? `Additional requirements from user: "${userText}"` : ''}
     
     CRITICAL RULES:
     - Do NOT invent contact information (emails, social media, author names)
     - Do NOT invent specific features not mentioned in description
     - Do NOT invent external URLs or resources not provided
     - For installation: use appropriate generic commands for ${repoData.language}
     - Write professional, complete sections even when specific details are limited
     - If description is missing, create one based on the language and available context
     - Provide helpful generic examples for usage sections
     - Do NOT add "Contact" or "Authors" sections
     - Output only markdown, no code fences
     
     Generate a complete, professional README with these sections:
     1. Title (# ${repoData.repoName})
     2. Description - comprehensive explanation of what the project does
     3. Installation - language-appropriate generic instructions
     4. Usage - helpful generic examples
     5. Contributing - standard contribution guidelines
     6. License - state: ${repoData.license || 'No license specified'}
     ${repoData.topics.length > 0 ? `7. Topics/Tags: ${repoData.topics.join(', ')}` : ''}
     ${repoData.homepage ? `8. Homepage: ${repoData.homepage}` : ''}
     `
    }
  if (mode === 'new_template') {
    return `You are a professional README Template generator. Create clean, well-organized README templates.
    
CRITICAL RULES:
- Use ONLY the information from the user's project description
- Do NOT invent contact information (emails, phone numbers, social media handles)
- Do NOT invent specific installation commands beyond generic placeholders
- Do NOT invent project features not mentioned in the description
- Do NOT invent URLs, links, or external resources not provided
- For Installation section: use generic placeholders like "[Install command here]"
- If critical information is missing, use "[To be added]" as placeholder
- Do NOT add "Contact" or "Authors" sections
- Output only markdown content, no code fences

Project description: ${userText}

Generate a professional README template. Use generic placeholders for sections where specific information is not provided.

Required/Core Sections:
- Title - Project name 
- Description - What the project does 
- Installation - How to install 
- Usage - How to use it 
- Contributing - How to contribute (generic)
- License - License info 
`
  }
  
  return ""
}




async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured')
  }
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a README generator. Output only markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  })
  
  if (!response.ok) {
    throw new Error(`GROQ_ERROR: ${response.status}`)
  }
  
  const data = await response.json()
  let readme = data.choices[0].message.content
  readme = readme.replace(/^```markdown\n?/i, '').replace(/\n?```$/, '')
  
  return readme.trim()
}


// ============= CLEANUP =============

setInterval(() => {
  const now = Date.now()
  for (const [sessionKey, session] of sessionStore.entries()) {
    if (now - session.timestamp > SESSION_DURATION) {
      sessionStore.delete(sessionKey)
      console.log('🧹 Cleaned expired session:', sessionKey)
    }
  }
}, 30 * 60 * 1000)