import { error } from 'console'
import { NextRequest } from 'next/server'

// ============= ENVIRONMENT VARIABLES =============
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// ============= CONSTANTS =============
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes

// In-memory session storage (temporary - will be replaced with proper storage)
const sessionStore = new Map<string, { previousReadme: string; timestamp: number }>()

// ============= MAIN HANDLER =============
export async function POST(request: NextRequest) {
  try {
    
    // ========================================
    // STAGE 1: INPUT HANDLING & PARSING
    // ========================================
    console.log('=== STAGE 1: INPUT HANDLING ===')
    
    // Get user input from request
    const body = await request.json()
    const { message, sessionId } = body // sessionId to track user's session
    console.log('Raw input:', message)
    console.log('Session ID:', sessionId)
    
    // Validate input
    const validation = validateInput(message)
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.reason)
      // TODO: Return error response with validation.reason, status 400
      return Response.json({
      error: validation.reason,
      type: "Failed validation"
     }, {status: 400})
    }
    
    // Extract GitHub URLs from input
    const urls = extractGitHubUrls(message)
    console.log('URLs found:', urls.length, urls)
    
    // Check for multiple URLs
    if (urls.length > 1) {
      console.log('❌ Multiple URLs detected')
      // TODO: Return error "Please provide only one GitHub URL at a time", status 400
     return Response.json({
      error: "please provide one url at a time",
      type: "multiple urls"
     }, {status: 400})
    }
    
    // Parse URL if found
    let parsedUrl: { owner: string; repo: string } | null = null
    let userText = message
    
    if (urls.length === 1) {
      parsedUrl = parseGitHubUrl(urls[0])
      console.log('Parsed URL:', parsedUrl)
      
      if (!parsedUrl) {
        console.log('❌ Invalid URL format')
        // TODO: Return error "Invalid GitHub URL format", status 400
        return Response.json({
          error: "Invalid Github Url",
          type: "invalid url"

        }, {status: 400})
      }
      
      // Remove URL from text
      userText = message.replace(urls[0], '').trim()
      console.log('User text (without URL):', userText)
    }
    
    // Get previous README from session
    const session = getSession(sessionId)
    const previousReadme = session?.previousReadme || null
    console.log('Has previous README:', !!previousReadme)
    
    // Determine generation mode
    let mode: 'new_with_url' | 'new_template' | 'iteration'
    
    if (parsedUrl) {
      // Has URL: always generate new (replace old if exists)
      mode = 'new_with_url'
    } else {
      // No URL: template or iteration
      mode = previousReadme ? 'iteration' : 'new_template'
    }
    
    console.log('✅ Mode determined:', mode)
    
    
    // ========================================
    // STAGE 2: GITHUB API DATA EXTRACTION
    // ========================================
    console.log('\n=== STAGE 2: GITHUB API ===')
    
    let repoData = null
    
    if (parsedUrl) {
      console.log(`Fetching: ${parsedUrl.owner}/${parsedUrl.repo}`)
      
      try {
        // TODO: Call fetchGitHubRepo() to get repository data
        repoData = await fetchGitHubRepo(parsedUrl.owner, parsedUrl.repo)
        console.log('✅ Repo data fetched:')
      } catch (error: any) {
        console.log('❌ GitHub fetch failed:', error.message)
        
        // Handle specific errors
        if (error.message === 'NOT_FOUND') {
          // TODO: Return error "Repository not found", status 404
          return Response.json({
            error: "Repository not found please check the url",
            type: "repositoy not found"
          }, {status: 404})
        }
        if (error.message === 'FORBIDDEN') {
          // TODO: Return error "Cannot access private repository", status 403
          return Response.json({
            error: "your repository is private we can't access it",
            type: "private repo"
          }, {status: 403})
        }
        // TODO: Return generic error "GitHub API error", status 500
          return Response.json({
            error: "api error try again later",
            type: "github error"
          }, {status: 500})
          
      }
    } else {
      console.log('⏭️  No URL provided, skipping GitHub API')
    }
    
    
    // ========================================
    // STAGE 3: DATA FORMATTING & CACHING
    // ========================================
    console.log('\n=== STAGE 3: DATA FORMATTING ===')
    
    let formattedData = null
    
    if (repoData) {
      // TODO: Call formatRepoData() to clean and structure the data
      formattedData = formatRepoData(repoData, userText)
      console.log('✅ Data formatted:', formattedData.repoName)
    } else {
      console.log('⏭️  No repo data to format')
    }
    
    
    // ========================================
    // STAGE 4: PROMPT ENGINEERING
    // ========================================
    console.log('\n=== STAGE 4: PROMPT BUILDING ===')
    
    // Build the prompt based on mode
    const prompt = buildPrompt({
      mode,
      repoData: formattedData,
      userText,
      previousReadme
    })
    
    console.log('✅ Prompt built, length:', prompt.length)
    console.log('Prompt preview:', prompt.substring(0, 200) + '...')
    
    
    // ========================================
    // STAGE 5: GROQ API CALL
    // ========================================
    console.log('\n=== STAGE 5: GROQ API ===')
    
    let generatedReadme: string
    
    try {
      // TODO: Call callGroq() to generate README
      generatedReadme = await callGroq(prompt)
      console.log('✅ README generated, length:', generatedReadme.length)
    } catch (error: any) {
      console.log('❌ Groq API failed:', error.message)
      // TODO: Return error "AI service unavailable", status 500
    }
    
    
    // ========================================
    // STAGE 6: SESSION UPDATE & RETURN
    // ========================================
    console.log('\n=== STAGE 6: SAVE & RETURN ===')
    
    // Save to session
    saveSession(sessionId, generatedReadme)
    console.log('✅ Session updated')
    
    // Return success response
    return Response.json({
      success: true,
      readme: generatedReadme,
      metadata: {
        mode,
        hasRepoData: !!repoData,
        repoName: repoData?.name || null
      }
    })
    
  } catch (error: any) {
    console.error('💥 Unexpected Error:', error)
    return Response.json({
      error: "Something went wrong",
      type: "server_error",
      details: error.message
    }, { status: 500 })
  }
}


// ============= STAGE 1 HELPERS =============

/**
 * Validates user input
 */
function validateInput(input: string): { valid: boolean; reason?: string } {
  const trimmed = input.trim()
  
  // Check 1: Minimum length
  if (trimmed.length < 5) {
    // TODO: Return { valid: false, reason: "Input too short" }
    return { valid: false, reason: "Input too short" }
  }
  
  // Check 2: Must contain letters
  if (!/[a-zA-Z]/.test(trimmed)) {
    // TODO: Return { valid: false, reason: "Must contain letters" }
     return { valid: false, reason: "Must contain letters" }
  }
  
  // Check 3: No spam patterns
  if (/(.)\1{15,}/.test(trimmed)) {
    // TODO: Return { valid: false, reason: "Invalid pattern" }
    return { valid: false, reason: "Invalid pattern" }
  }
  
  return { valid: true }
}

/**
 * Extracts all GitHub URLs from text
 * Returns array of URLs (empty if none found)
 */
function extractGitHubUrls(text: string): string[] {
  // Regex to match GitHub URLs
  // Matches: github.com/owner/repo with optional http(s), www, /, .git
  const regex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/[\w.-]+(?:\.git)?/gi
  
  // TODO: Use text.match(regex) to find all URLs
  // Remember: match() returns null if no matches found
  
  return text.match(regex) || []
}

/**
 * Parses GitHub URL to extract owner and repo
 * Returns { owner, repo } or null if invalid
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Regex with capture groups to extract owner and repo
  const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/i)
  
  if (!match) return null
  
  const owner = match[1]
  const repo = match[2]
  
  // Validate format: only letters, numbers, hyphens, underscores
  const validPattern = /^[\w-]+$/
  
  // TODO: Check if owner and repo match validPattern
  // If not, return null

  const check1 = validPattern.test(owner)
  const check2 = validPattern.test(repo) 

  if (!check1 || !check2){
    return null
  }
  
  return { owner, repo }
}


// ============= STAGE 2 HELPERS =============

/**
 * Fetches repository data from GitHub API
 * Throws errors for: NOT_FOUND, FORBIDDEN, GITHUB_ERROR
 */
async function fetchGitHubRepo(owner: string, repo: string) {
  // TODO: Build GitHub API URL
  const url = `https://api.github.com/repos/${owner}/${repo}`
  
  // TODO: Make fetch request with headers
  // Headers needed:
  // - 'Accept': 'application/vnd.github.v3+json'
  // - 'Authorization': `Bearer ${GITHUB_TOKEN}` (if token exists)
  // - 'User-Agent': 'README-Generator'

  const headers: any = {
    'Accept': 'application/vnd.github.v3+json',
   'User-Agent': 'README-Generator'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  const res = await fetch(url, {headers: headers})
  
  // TODO: Handle response status codes:
  // - 404 → throw new Error('NOT_FOUND')
  // - 403 → throw new Error('FORBIDDEN')  
  // - Other errors → throw new Error('GITHUB_ERROR')

    if(res.status === 404){
      throw new Error('NOT_FOUND')
    } else if(res.status === 403){
      throw new Error('FORBIDDEN')
    } else if(!res.ok){
      throw new Error ('GITHUB_ERROR')
    }
  
  // TODO: Parse JSON response

  let repoData = await res.json()
  console.log('GitHub API response:', repoData)
  
  // TODO: Extract and return these fields:
  // - name
  // - full_name
  // - description (or "No description provided" if null)
  // - language (or "Not specified" if null)
  // - stargazers_count
  // - forks_count
  // - topics (array)
  // - license?.name (or null)
  // - homepage (or null)
  // - default_branch

  const Extraction = {
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
  
  return Extraction
}


// ============= STAGE 3 HELPERS =============

/**
 * Formats raw GitHub data for prompt
 * Handles null/empty values
 */
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

/**
 * Get session data (previous README)
 * Returns null if not found or expired
 */
function getSession(sessionId: string): { previousReadme: string; timestamp: number } | null {
  if (!sessionId) return null
  
  const session = sessionStore.get(sessionId)
  if (!session) return null
  
  // Check if expired (30 minutes)
  const isExpired = Date.now() - session.timestamp > SESSION_DURATION
  
  if (isExpired) {
    // TODO: Delete expired session from sessionStore
    sessionStore.delete(sessionId)
    return null
  }
  
  return session
}

/**
 * Save README to session
 */
function saveSession(sessionId: string, readme: string) {
  if (!sessionId) return
  
  // TODO: Save to sessionStore with current timestamp
  // Structure: { previousReadme: readme, timestamp: Date.now() }
  const obj = {
    previousReadme: readme,
    timestamp: Date.now()
  }

  sessionStore.set(sessionId, obj)
  
}


// ============= STAGE 4 HELPERS =============

/**
 * Builds the prompt for Groq based on mode and available data
 * 
 * CRITICAL: Prompt must prevent fake info generation
 */
function buildPrompt(params: {
  mode: 'new_with_url' | 'new_template' | 'iteration'
  repoData: any
  userText: string
  previousReadme: string | null
}): string {
  
  const { mode, repoData, userText, previousReadme } = params
  
  // TODO: Build system prompt with constraints:
  // - "You are a professional README generator"
  // - "Use ONLY the provided data"
  // - "Do NOT invent: contact info, URLs, features, installation commands"
  // - "Use generic placeholders based on language for unknown info"
  // - "Leave sections empty if data not provided"
  
  if (mode === 'iteration' && previousReadme) {
    // TODO: Build iteration prompt
    // Include: previousReadme + userText (modification request)
    // Instruction: "Update the README based on the request"
    return `You are a professional README editor.

      Current README:
     ${previousReadme}

     user's modification request: "${userText}"

     Instructions:
     - Apply only the changes requested by the user
     - Do NOT invent any new information
     - Keep all other sections unchanged
     - Return the COMPLETE updated README (not just modified parts)
     - Output only markdown content, do not include markdown code fences (no \`\`\`markdown)
     `
    }
  
  if (mode === 'new_with_url' && repoData) {
    // TODO: Build new README prompt with repo data
    // Include all formatted repo data
    // Include userText as additional requirements (if exists)
    // Sections to include: Title, Description, Installation, Usage, Contributing, License
    // Conditional sections: Topics (if exists), Homepage (if exists)
    return `
    You are a professional README generator. Create clean, well-organized READMEs using only the provided data.
    
   Repository Information:
   - Name: ${repoData.repoName}
   - Description: ${repoData.description}
   - Language: ${repoData.language}
   - Stars: ${repoData.stars}
   - Forks: ${repoData.forks}
   - Topics: ${repoData.topics.join(', ')}
   - License: ${repoData.license}
   - Homepage: ${repoData.homepage || 'None'}
   - Default Branch: ${repoData.defaultBranch}

   ${userText ? `Additional requirements from user: "${userText}"` : ''}


   CRITICAL RULES - DO NOT VIOLATE:
  
   - Use ONLY the provided repository data
   - Do NOT invent contact information (emails, phone numbers, social media handles)
   - Do NOT invent specific installation commands beyond basic language-specific ones
   - Do NOT invent project features not mentioned in the description
   - Do NOT invent URLs, links, or external resources not provided
   - For Installation section: use ONLY generic commands based on language (e.g., "npm install" for JavaScript, "pip install" for Python)
   - If critical information is missing, use "[To be added]" as placeholder
   - Do NOT add "Contact" or "Authors" sections unless explicitly in data
   - Output only markdown content, no code fences
   
   Required/Core Sections:

   Title - Project name (from repoData.repoName)
   Description - What the project does (from repoData.description)
   Installation - How to install (generic based on language)
   Usage - How to use it (generic placeholder)
   Contributing - How to contribute (generic)
   License - License info (from repoData.license)

   Conditional Sections (only if data exists):

   Topics/Tags - If repoData.topics has items
   Homepage - If repoData.homepage exists
   Features - Only if mentioned in description or userText

   Optional/Nice-to-have:

   Requirements/Prerequisites - Dependencies
   Documentation - Link to docs
   Support - How to get help (generic, no contact info!)
   
   `
  }
  
  if (mode === 'new_template') {
    // TODO: Build template prompt
    // Include: userText (project description)
    // Generate generic template structure
    return `You are a professional README Template generator. Create clean, well-organized README Template - Use ONLY the information from the user's project description
    
    CRITICAL RULES - DO NOT VIOLATE:
  
   - Use ONLY the information from the user's project description
   - Do NOT invent contact information (emails, phone numbers, social media handles)
   - Do NOT invent specific installation commands beyond basic language-specific ones
   - Do NOT invent project features not mentioned in the description
   - Do NOT invent URLs, links, or external resources not provided
   - For Installation section: use generic placeholders like "[Install command here]"
   - If critical information is missing, use "[To be added]" as placeholder
   - Do NOT add "Contact" or "Authors" sections unless explicitly in data
   - Output only markdown content, no code fences

   Project description: ${userText} this is description of project make template keeping rules given above in mind
   Generate a professional README template. Use generic placeholders for sections where specific information is not provided.

   Required/Core Sections:

   Title - Project name 
   Description - What the project does 
   Installation - How to install 
   Usage - How to use it 
   Contributing - How to contribute (generic)
   License - License info 
    ` 
  }
  
  return ""
}


// ============= STAGE 5 HELPERS =============

/**
 * Calls Groq API to generate README
 * Returns generated markdown string
 */
async function callGroq(prompt: string): Promise<string> {
  // Check if API key configured
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured')
  }
  
  // TODO: Make POST request to Groq API
  // URL: 'https://api.groq.com/openai/v1/chat/completions'
  // Headers:
  // - 'Authorization': `Bearer ${GROQ_API_KEY}`
  // - 'Content-Type': 'application/json'
  
  // TODO: Body (JSON.stringify):
  // {
  //   model: 'llama-3.3-70b-versatile',
  //   messages: [
  //     { role: 'system', content: 'You are a README generator. Output only markdown.' },
  //     { role: 'user', content: prompt }
  //   ],
  //   temperature: 0.7,
  //   max_tokens: 2000
  // }
  
  // TODO: Handle response errors (throw Error)
  
  // TODO: Parse JSON and extract: data.choices[0].message.content
  
  // TODO: Clean response:
  // - Remove markdown code fences: ```markdown and ```
  // - Trim whitespace
  
  return ""
}


// ============= CLEANUP =============

// Clean expired sessions every 30 minutes
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.timestamp > SESSION_DURATION) {
      sessionStore.delete(sessionId)
      console.log('🧹 Cleaned expired session:', sessionId)
    }
  }
}, 30 * 60 * 1000)