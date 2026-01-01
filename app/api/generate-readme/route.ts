import { NextRequest } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY 

const repoCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionContext } = body

    const validation = validateInput(message)
    if (!validation.valid) {
      return Response.json({
        error: validation.reason,
        suggestion: "Please provide a GitHub URL or describe your project",
        type: "invalid_input"
      }, { status: 400 })
    }

    const githubUrlMatch = message.match(/github\.com\/([\w-]+)\/([\w.-]+)/)
    let repoData = null
    let loadingType: 'analyzing' | 'updating' | 'template' = 'template'

    if (githubUrlMatch) {
      const owner = githubUrlMatch[1]
      const repo = githubUrlMatch[2].replace(/\.git$/, '')
      const repoKey = `${owner}/${repo}`

      const cached = repoCache.get(repoKey)
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        repoData = cached.data
      } else {
        try {
          repoData = await fetchGitHubRepo(owner, repo)
          repoCache.set(repoKey, { data: repoData, timestamp: Date.now() })
        } catch (error: any) {
          if (error.message === 'NOT_FOUND') {
            return Response.json({
              error: "Repository not found or is private",
              suggestion: "Check the URL or make sure the repository is public",
              type: "repo_not_found"
            }, { status: 404 })
          }
          
          return Response.json({
            error: "Failed to fetch repository",
            suggestion: "GitHub might be temporarily unavailable",
            type: "github_error"
          }, { status: 500 })
        }
      }

      loadingType = sessionContext?.isIteration ? 'updating' : 'analyzing'
    } else {
      loadingType = sessionContext?.isIteration ? 'updating' : 'template'
    }

    const instructions = githubUrlMatch 
      ? message.replace(githubUrlMatch[0], '').trim()
      : message

    const prompt = buildPrompt(
      repoData, 
      instructions, 
      sessionContext?.isIteration || false, 
      sessionContext?.currentReadme
    )

    let readme: string
    try {
      readme = await callGroq(prompt)
    } catch (error) {
      return Response.json({
        error: "AI service temporarily unavailable",
        suggestion: "Please try again in a moment",
        type: "ai_error"
      }, { status: 500 })
    }

    return Response.json({
      readme,
      loadingType,
      hasRepoData: !!repoData,
      repoName: repoData?.name || null
    })

  } catch (error: any) {
    return Response.json({
      error: "Something went wrong",
      suggestion: "Please try again",
      type: "server_error"
    }, { status: 500 })
  }
}

function validateInput(input: string): { valid: boolean; reason?: string } {
  const trimmed = input.trim()
  if (trimmed.length < 5) return { valid: false, reason: "Input is too short" }
  if (!/[a-zA-Z]/.test(trimmed)) return { valid: false, reason: "Invalid input" }
  if (/(.)\1{15,}/.test(trimmed)) return { valid: false, reason: "Invalid input" }
  return { valid: true }
}

async function fetchGitHubRepo(owner: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'README-Generator'
    }
  })

  if (response.status === 404) throw new Error('NOT_FOUND')
  if (!response.ok) throw new Error('GITHUB_ERROR')

  const repoInfo = await response.json()
  let dependencies: string[] = []

  try {
    const pkgResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'README-Generator' }}
    )
    if (pkgResponse.ok) {
      const pkgData = await pkgResponse.json()
      const pkgContent = JSON.parse(Buffer.from(pkgData.content, 'base64').toString())
      dependencies = Object.keys(pkgContent.dependencies || {})
    }
  } catch {}

  return {
    name: repoInfo.name,
    fullName: repoInfo.full_name,
    description: repoInfo.description || 'No description provided',
    language: repoInfo.language || 'Not specified',
    stars: repoInfo.stargazers_count || 0,
    forks: repoInfo.forks_count || 0,
    topics: repoInfo.topics || [],
    license: repoInfo.license?.name || null,
    homepage: repoInfo.homepage || null,
    dependencies
  }
}

function buildPrompt(repoData: any, instructions: string, isIteration: boolean, currentReadme?: string): string {
  // If it's an iteration and we have current README, update it
  if (isIteration && currentReadme && currentReadme.length > 0) {
    return `You are a professional README editor.

Current README:
\`\`\`markdown
${currentReadme}
\`\`\`

User's update request: "${instructions}"

Apply the requested changes to the README above.
Return the COMPLETE updated README with all changes applied, not just the modified parts.
Do not include markdown code fences in your response, just the raw README content.`
  }

  // Generate new README
  if (repoData) {
    if (instructions) {
      return `You are a professional README generator.

Repository Information:
- Name: ${repoData.name}
- Description: ${repoData.description}
- Language: ${repoData.language}
- Stars: ${repoData.stars}
${repoData.dependencies.length > 0 ? `- Dependencies: ${repoData.dependencies.join(', ')}` : ''}

User's Requirements: "${instructions}"

Generate a complete, professional README.md that follows the user's requirements.`
    } else {
      return `You are a professional README generator.

Repository Information:
- Name: ${repoData.name}
- Description: ${repoData.description}
- Language: ${repoData.language}
- Stars: ${repoData.stars}
${repoData.dependencies.length > 0 ? `- Dependencies: ${repoData.dependencies.join(', ')}` : ''}

Generate a comprehensive README.md with:
1. Project title and description
2. Key features
3. Installation instructions
4. Usage examples
5. Contributing guidelines

Make it clear, well-structured, and developer-friendly.`
    }
  } else {
    return `You are a professional README generator.

The user described their project: "${instructions}"

Generate a README.md template based on this description. Include:
1. Project title
2. Description
3. Installation instructions
4. Usage examples
5. Features

Make it professional and ready to use.`
  }
}

async function callGroq(prompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a professional README generator. Generate clean markdown without code fences.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  if (!response.ok) throw new Error('GROQ_ERROR')
  const data = await response.json()
  let readme = data.choices[0].message.content
  readme = readme.replace(/^```markdown\n?/i, '').replace(/\n?```$/, '')
  return readme.trim()
}

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of repoCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      repoCache.delete(key)
    }
  }
}, 30 * 60 * 1000)

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY
  
  return Response.json({ 
    message: 'API Route Test',
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET',
    envVars: Object.keys(process.env).filter(k => k.includes('GROQ'))
  })
}